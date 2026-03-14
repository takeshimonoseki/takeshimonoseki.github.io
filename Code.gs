/**
 * 軽貨物TAKE ポータルサイト バックエンド (GAS)
 * フォーム送信正本・保存最優先・見積依頼/正式依頼対応
 */

var SHEET_NAME_CUSTOMER = 'お客様_依頼';
var SHEET_NAME_DRIVER = 'ドライバー_登録';
var SHEET_NAME_CONSULT = '各種相談';

/**
 * スプレッドシート初期セットアップ
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheets = [
    {
      name: SHEET_NAME_CUSTOMER,
      headers: [
        '受付日時', '受付番号', '受付種別', '名前', 'メールアドレス', '電話番号', '郵便番号', '住所',
        '集荷先', '納品先', '荷物内容', '希望日時', '備考', '計算結果', 'LINE連絡希望有無', 'デバイス種別',
        'メール通知結果', 'LINE通知結果', '処理結果'
      ]
    },
    {
      name: SHEET_NAME_DRIVER,
      headers: [
        '受付番号', '登録日時', '氏名', 'ニックネーム', 'メール', '電話番号',
        '車種', '経験年数', '写真(DriveURL)', '承認ステータス', '自己PR'
      ]
    },
    {
      name: SHEET_NAME_CONSULT,
      headers: ['受付番号', '受付日時', '氏名', '電話番号', '相談種別', '詳細内容']
    },
    {
      name: 'システム設定',
      headers: ['設定項目', '値', '説明']
    }
  ];

  sheets.forEach(function(sheetInfo) {
    var sheet = ss.getSheetByName(sheetInfo.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetInfo.name);
    }
    var headerRange = sheet.getRange(1, 1, 1, sheetInfo.headers.length);
    headerRange.setValues([sheetInfo.headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  });

  var configSheet = ss.getSheetByName('システム設定');
  if (configSheet && configSheet.getLastRow() === 1) {
    var initialConfigs = [
      ['基本料金', '3000', '運賃シミュレーターの基本料金'],
      ['高速代単価', '25', '1kmあたりの概算高速料金'],
      ['LINE通知', 'ON', 'ON/OFF']
    ];
    configSheet.getRange(2, 1, 2 + initialConfigs.length - 1, 3).setValues(initialConfigs);
  }
}

/**
 * 受付種別を details から判定（見積依頼 / 正式依頼）
 */
function getReceiptType(details) {
  if (details && (details.indexOf('見積') !== -1 || details.indexOf('見積もり') !== -1)) {
    return '見積依頼';
  }
  return '正式依頼';
}

/**
 * LINE連絡希望有無を payload から判定
 */
function getLineHope(data) {
  var method = data.contactMethod || '';
  var details = data.details || '';
  if (method === 'line' || (details && details.indexOf('LINE') !== -1)) {
    return '希望';
  }
  return '希望しない';
}

/**
 * デバイス種別（front から送られてきた場合のみ）
 */
function getDeviceType(data) {
  var t = (data.deviceType || '').toLowerCase();
  if (t === 'pc' || t === 'smartphone') return t;
  return '';
}

/**
 * 一意の相関IDを生成
 */
function generateCorrelationId() {
  try {
    return Utilities.getUuid();
  } catch (e) {
    return 'cid_' + new Date().getTime() + '_' + Math.random().toString(36).slice(2, 11);
  }
}

/**
 * 受付番号生成（フロントから渡されていれば利用）
 */
function ensureReceiptNo(data, dateStr) {
  if (data.receiptNo && data.receiptNo.toString().length > 0) {
    return data.receiptNo.toString();
  }
  var randomNum = Math.floor(Math.random() * 1000).toString();
  while (randomNum.length < 3) randomNum = '0' + randomNum;
  return 'T-' + dateStr + '-' + randomNum;
}

/**
 * お客様依頼をシートに保存（最優先）
 */
function saveCustomerRequest(ss, row) {
  var sheet = ss.getSheetByName(SHEET_NAME_CUSTOMER);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + SHEET_NAME_CUSTOMER);
  }
  sheet.appendRow(row);
  return sheet.getLastRow();
}

/**
 * 指定行のメール/LINE通知結果を更新
 */
function updateNotificationResults(ss, rowIndex, emailResult, lineResult, processResult) {
  var sheet = ss.getSheetByName(SHEET_NAME_CUSTOMER);
  if (!sheet || rowIndex < 2) return;
  sheet.getRange(rowIndex, 17, rowIndex, 19).setValues([[emailResult, lineResult, processResult]]);
}

/**
 * 管理者向けメール送信
 */
function sendAdminEmail(receiptType, receiptNo, data) {
  var adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
  if (!adminEmail) {
    return false;
  }
  var subject = '[' + receiptType + '] 受付番号 ' + receiptNo;
  var body = [
    '受付番号: ' + receiptNo,
    '受付種別: ' + receiptType,
    '',
    '【依頼者情報】',
    '名前: ' + (data.name || ''),
    'メール: ' + (data.email || ''),
    '電話: ' + (data.phone || ''),
    '郵便番号: ' + (data.zipcode || ''),
    '住所: ' + (data.address || ''),
    '',
    '【配送・荷物】',
    '集荷先: ' + (data.origin || ''),
    '納品先: ' + (data.destination || ''),
    '距離: ' + (data.distance || '') + ' km',
    '希望日時・オプション: ' + (data.options || ''),
    '計算結果（概算）: ' + (data.estimatedFare || '') + ' 円',
    '',
    '【備考・詳細】',
    data.details || ''
  ].join('\n');
  try {
    MailApp.sendEmail(adminEmail, subject, body);
    return true;
  } catch (e) {
    console.error('管理者メール送信失敗: ' + e.toString());
    return false;
  }
}

/**
 * ユーザー向け受付確認メール
 */
function sendUserConfirmationEmail(receiptType, receiptNo, data) {
  var to = data.email;
  if (!to) return false;
  var subject = '【軽貨物TAKE】受付完了 - 受付番号 ' + receiptNo;
  var summary = [
    '受付種別: ' + receiptType,
    '受付番号: ' + receiptNo,
    'ルート: ' + (data.origin || '') + ' → ' + (data.destination || '') + ' (' + (data.distance || '') + 'km)',
    '概算: ' + (data.estimatedFare || '') + ' 円',
    '詳細: ' + (data.details || '').replace(/\n/g, ' ')
  ].join('\n');
  var body = [
    '軽貨物TAKEでございます。',
    '',
    '以下の内容で受付いたしました。',
    '',
    '---',
    summary,
    '---',
    '',
    '折り返し、ご連絡いたします。',
    'しばらくお待ちください。',
    '',
    '軽貨物TAKE'
  ].join('\n');
  try {
    MailApp.sendEmail(to, subject, body);
    return true;
  } catch (e) {
    console.error('ユーザー確認メール送信失敗: ' + e.toString());
    return false;
  }
}

/**
 * LINE通知（管理者向け）LINE Messaging API の Push メッセージ
 * Script Properties: LINE_CHANNEL_ACCESS_TOKEN, LINE_TO_USER_ID を参照（コード直書き禁止）
 */
function sendLinePushMessage(message) {
  var token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  var toUserId = PropertiesService.getScriptProperties().getProperty('LINE_TO_USER_ID');
  if (!token || token === '' || !toUserId || toUserId === '') return false;
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      to: toUserId,
      messages: [{ type: 'text', text: message }]
    }),
    muteHttpExceptions: true
  };
  try {
    var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
    return res.getResponseCode() === 200;
  } catch (e) {
    console.error('LINE通知失敗: ' + e.toString());
    return false;
  }
}

/**
 * お客様依頼用のLINE通知メッセージ作成
 */
function buildLineMessage(receiptType, receiptNo, data) {
  return [
    '【' + receiptType + '】 受付番号: ' + receiptNo,
    '名前: ' + (data.name || ''),
    '電話: ' + (data.phone || ''),
    '郵便番号: ' + (data.zipcode || ''),
    '住所: ' + (data.address || ''),
    '荷物・オプション: ' + (data.options || ''),
    '希望日時: ' + (data.options || '').split('期間:')[1] || (data.options || ''),
    '計算結果: ' + (data.estimatedFare || '') + ' 円',
    '備考: ' + (data.details || '').replace(/\n/g, ' ')
  ].join('\n');
}

/**
 * 返却用JSONオブジェクトを生成
 */
function createResponse(opt) {
  return {
    result: opt.result || 'OK',
    receipt_id: opt.receipt_id || '',
    request_type: opt.request_type || '',
    message: opt.message || '',
    saved: opt.saved === true,
    email_sent: opt.email_sent === true,
    line_sent: opt.line_sent === true,
    error_code: opt.error_code || '',
    correlation_id: opt.correlation_id || ''
  };
}

/**
 * doPost: フォーム送信を正本として受付。保存最優先。
 */
function doPost(e) {
  var correlationId = generateCorrelationId();
  var output;

  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type;
    var now = new Date();
    var dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd');
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (type === 'customer') {
      // --- お客様依頼（見積依頼 / 正式依頼）---
      var receiptNo = ensureReceiptNo(data, dateStr);
      var receiptType = getReceiptType(data.details);
      var lineHope = getLineHope(data);
      var deviceType = getDeviceType(data);

      var row = [
        now,
        receiptNo,
        receiptType,
        data.name || '',
        data.email || '',
        data.phone || '',
        data.zipcode || '',
        data.address || '',
        data.origin || '',
        data.destination || '',
        data.options || '',
        data.options || '',
        data.details || '',
        data.estimatedFare != null ? data.estimatedFare : '',
        lineHope,
        deviceType,
        '送信予定',
        '送信予定',
        '保存済'
      ];

      var lastRow;
      try {
        lastRow = saveCustomerRequest(ss, row);
      } catch (saveErr) {
        console.error('保存失敗 [' + correlationId + ']: ' + saveErr.toString());
        output = createResponse({
          result: 'NG',
          receipt_id: receiptNo,
          request_type: receiptType,
          message: '保存に失敗しました。しばらくしてから再送してください。',
          saved: false,
          email_sent: false,
          line_sent: false,
          error_code: 'SAVE_FAILED',
          correlation_id: correlationId
        });
        return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
      }

      var adminEmailSent = sendAdminEmail(receiptType, receiptNo, data);
      var userEmailSent = sendUserConfirmationEmail(receiptType, receiptNo, data);
      var lineMsg = buildLineMessage(receiptType, receiptNo, data);
      var lineSent = sendLinePushMessage(lineMsg);

      var emailResult = (adminEmailSent && userEmailSent) ? '成功' : '失敗';
      if (!adminEmailSent) console.error('管理者メール失敗 [' + correlationId + ']');
      if (!userEmailSent) console.error('ユーザーメール失敗 [' + correlationId + ']');
      if (!lineSent) console.error('LINE通知失敗 [' + correlationId + ']');

      updateNotificationResults(ss, lastRow, emailResult, lineSent ? '成功' : '失敗', '受付完了');

      output = createResponse({
        result: 'OK',
        receipt_id: receiptNo,
        request_type: receiptType,
        message: '受付が完了しました。',
        saved: true,
        email_sent: userEmailSent,
        line_sent: lineSent,
        error_code: '',
        correlation_id: correlationId
      });
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === 'driver_register') {
      var r3 = (Math.floor(Math.random() * 1000) + ''); while (r3.length < 3) r3 = '0' + r3;
      var receiptNoDr = data.receiptNo || ('D-' + dateStr + '-' + r3);
      var fileUrl = '';
      if (data.photoBase64) {
        fileUrl = saveImageToDrive(data.photoBase64, receiptNoDr + '_' + (data.name || ''));
      }
      var rowDriver = [
        receiptNoDr,
        now,
        data.name,
        data.nickname,
        data.email,
        data.phone,
        data.vehicle,
        data.experience,
        fileUrl,
        '未承認',
        data.pr
      ];
      ss.getSheetByName(SHEET_NAME_DRIVER).appendRow(rowDriver);
      var notifyMessage = '【新規ドライバー登録】 番号: ' + receiptNoDr + ' 氏名: ' + (data.name || '') + ' 様';
      sendLinePushMessage(notifyMessage);
      output = createResponse({
        result: 'OK',
        receipt_id: receiptNoDr,
        request_type: 'ドライバー登録',
        message: '登録を受け付けました。',
        saved: true,
        email_sent: false,
        line_sent: true,
        error_code: '',
        correlation_id: correlationId
      });
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === 'consult') {
      var r3c = (Math.floor(Math.random() * 1000) + ''); while (r3c.length < 3) r3c = '0' + r3c;
      var receiptNoConsult = data.receiptNo || ('C-' + dateStr + '-' + r3c);
      var rowConsult = [receiptNoConsult, now, data.name, data.phone, data.consultType || '', data.details || ''];
      ss.getSheetByName(SHEET_NAME_CONSULT).appendRow(rowConsult);
      var msgConsult = '【新規相談】 番号: ' + receiptNoConsult + ' 氏名: ' + (data.name || '') + ' 種別: ' + (data.consultType || '');
      sendLinePushMessage(msgConsult);
      output = createResponse({
        result: 'OK',
        receipt_id: receiptNoConsult,
        request_type: '相談',
        message: '相談を受け付けました。',
        saved: true,
        email_sent: false,
        line_sent: true,
        error_code: '',
        correlation_id: correlationId
      });
      return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
    }

    output = createResponse({
      result: 'NG',
      message: '不明なリクエスト種別です。',
      saved: false,
      email_sent: false,
      line_sent: false,
      error_code: 'UNKNOWN_TYPE',
      correlation_id: correlationId
    });
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost error [' + correlationId + ']: ' + error.toString());
    output = createResponse({
      result: 'NG',
      message: error.toString(),
      saved: false,
      email_sent: false,
      line_sent: false,
      error_code: 'SERVER_ERROR',
      correlation_id: correlationId
    });
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  }
}

function generateReceiptNo(dateStr) {
  var randomNum = Math.floor(Math.random() * 1000).toString();
  while (randomNum.length < 3) randomNum = '0' + randomNum;
  return 'T-' + dateStr + '-' + randomNum;
}

function saveImageToDrive(base64Data, fileName) {
  try {
    var folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
    if (!folderId) return 'Folder ID not set';
    var folder = DriveApp.getFolderById(folderId);
    var contentType = base64Data.substring(5, base64Data.indexOf(';'));
    var bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    var file = folder.createFile(blob);
    return file.getUrl();
  } catch (err) {
    return 'Upload Error: ' + err.toString();
  }
}

// ========== Script Properties で設定するキー一覧 ==========
// ADMIN_EMAIL              … 管理者メールアドレス（受付通知の送信先）。未設定時は管理者メール送信をスキップ。
// LINE_CHANNEL_ACCESS_TOKEN … LINE Messaging API のチャネルアクセストークン（管理者へのPush通知用）。コード直書き禁止。
// LINE_TO_USER_ID          … 通知送信先のLINEユーザーID（管理者のLINE UID）。未設定時はLINE通知をスキップ。
// DRIVE_FOLDER_ID          … ドライバー登録時の画像保存先フォルダID（任意）
