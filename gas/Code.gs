// path: gas/Code.gs
/**
 * 軽貨物TAKE GAS バックエンド
 * - type=customer: 配送相談（見積依頼 / 正式依頼）→ 「配送依頼」シート
 * - type=driver: 協力ドライバー登録 → 「ドライバー登録」シート
 * - 保存最優先
 * - メール / LINE が失敗しても保存成功なら受付成功
 * - 失敗内容は「ログ」シートに記録
 *
 * Script Properties（必須）
 * - SPREADSHEET_ID
 * - ADMIN_EMAIL
 * - LINE_CHANNEL_ACCESS_TOKEN
 * - LINE_TO_USER_ID または LINE_TO_GROUP_ID
 *
 * Script Properties（任意）
 * - REQUESTS_SHEET_NAME（既定: 配送依頼）
 * - DRIVERS_SHEET_NAME（既定: ドライバー登録）
 * - LOGS_SHEET_NAME（既定: ログ）
 * - CONFIG_SHEET_NAME（既定: 設定）
 * - DRIVE_FOLDER_ID（ドライバー登録ファイル保存先）
 */

var REQUESTS_HEADERS = [
  '受付日時',
  '受付番号',
  '受付種別',
  '名前',
  'メールアドレス',
  '電話番号',
  '郵便番号',
  '住所',
  '集荷先',
  '納品先',
  '距離km',
  '荷物量',
  '荷物内容',
  '希望日時',
  '備考',
  '概算金額',
  '配送スピード',
  '詳細条件',
  '管理者メール送信',
  'LINE通知送信',
  '受付状態',
  'エラー内容',
  '受信JSON'
];

var DRIVERS_HEADERS = [
  '受付日時',
  '受付番号',
  '氏名',
  'ふりがな',
  '電話番号',
  'メールアドレス',
  '郵便番号',
  '住所',
  'メーカー',
  '車種',
  '経験年数',
  '稼働エリア',
  'メモ',
  'Drive保存先',
  '管理者メール送信',
  'LINE通知送信',
  '受付状態',
  'エラー内容',
  '受信JSON'
];

var LOGS_HEADERS = [
  '日時',
  'レベル',
  '処理',
  '受付番号',
  'メッセージ',
  '詳細JSON'
];

var CONFIG_HEADERS = ['キー', '値'];

var SHEET_ID_FALLBACK = '1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8';

function getSpreadsheetId_() {
  var props = PropertiesService.getScriptProperties();
  return (
    props.getProperty('SPREADSHEET_ID') ||
    props.getProperty('SHEET_ID') ||
    props.getProperty('スプレッドシートID') ||
    SHEET_ID_FALLBACK
  );
}

function getSheetName_(key, fallback) {
  return PropertiesService.getScriptProperties().getProperty(key) || fallback;
}

function getRequestsSheetName_() {
  return getSheetName_('REQUESTS_SHEET_NAME', '配送依頼');
}

function getDriversSheetName_() {
  return getSheetName_('DRIVERS_SHEET_NAME', 'ドライバー登録');
}

function getLogsSheetName_() {
  return getSheetName_('LOGS_SHEET_NAME', 'ログ');
}

function getConfigSheetName_() {
  return getSheetName_('CONFIG_SHEET_NAME', '設定');
}

function getAdminEmail_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '';
}

function getLineToken_() {
  var props = PropertiesService.getScriptProperties();
  return (
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN') ||
    props.getProperty('LINE_ACCESS_TOKEN') ||
    ''
  );
}

function getLineToId_() {
  var props = PropertiesService.getScriptProperties();
  return (
    props.getProperty('LINE_TO_USER_ID') ||
    props.getProperty('LINE_TO_GROUP_ID') ||
    props.getProperty('ADMIN_LINE_USER_ID') ||
    ''
  );
}

function getDriveFolderId_() {
  return PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '';
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function safeStr_(value, maxLen) {
  var s = value == null ? '' : String(value);
  s = s.replace(/\r\n/g, '\n').trim();
  if (maxLen && maxLen > 0) {
    return s.slice(0, maxLen);
  }
  return s;
}

function safeJsonString_(value, maxLen) {
  var s = '';
  try {
    s = JSON.stringify(value);
  } catch (e) {
    s = String(value || '');
  }
  if (maxLen && maxLen > 0) {
    return s.slice(0, maxLen);
  }
  return s;
}

function buildReceiptNo_(prefix) {
  return (
    prefix +
    '-' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd') +
    '-' +
    ('00000' + Math.floor(Math.random() * 100000)).slice(-5)
  );
}

function ensureSheet_(ss, sheetName, headers) {
  var sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
  }

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
    return sh;
  }

  if (sh.getLastRow() === 1) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
  }

  return sh;
}

function appendLog_(ss, level, action, receiptNo, message, detailJson) {
  try {
    var sh = ensureSheet_(ss, getLogsSheetName_(), LOGS_HEADERS);
    sh.appendRow([
      new Date().toISOString(),
      safeStr_(level, 20),
      safeStr_(action, 100),
      safeStr_(receiptNo, 100),
      safeStr_(message, 1000),
      safeJsonString_(detailJson, 50000)
    ]);
  } catch (e) {
    Logger.log('appendLog_ error: ' + e);
  }
}

function getHeaderIndexMap_(sheet) {
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    map[String(headerRow[i] || '').trim()] = i + 1;
  }
  return map;
}

function updateCellByHeader_(sheet, rowNumber, headerName, value) {
  var map = getHeaderIndexMap_(sheet);
  if (map[headerName]) {
    sheet.getRange(rowNumber, map[headerName]).setValue(value);
  }
}

function buildSheetRowUrl_(sheet, rowNumber) {
  return (
    'https://docs.google.com/spreadsheets/d/' +
    getSpreadsheetId_() +
    '/edit#gid=' +
    sheet.getSheetId() +
    '&range=A' +
    rowNumber
  );
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('POSTデータがありません。doPost を手動実行しないでください。');
  }
  return JSON.parse(e.postData.contents);
}

function buildLineMessage_(summaryText, sheetUrl) {
  var text = (summaryText || '').trim();
  if (sheetUrl) {
    text = text + '\n\n確認: ' + sheetUrl;
  }
  return [{ type: 'text', text: text.slice(0, 4500) }];
}

function sendAdminMailForCustomer_(payload) {
  var adminEmail = getAdminEmail_();
  if (!adminEmail) {
    return false;
  }

  var subject = '【' + payload.receptionType + '】受付番号 ' + payload.receiptNo;
  var bodyText = [
    '受付番号: ' + payload.receiptNo,
    '受付種別: ' + payload.receptionType,
    '',
    '【依頼者】',
    '名前: ' + payload.name,
    'メール: ' + payload.email,
    '電話番号: ' + payload.phone,
    '郵便番号: ' + payload.zipcode,
    '住所: ' + payload.address,
    '',
    '【配送内容】',
    '集荷先: ' + payload.origin,
    '納品先: ' + payload.destination,
    '距離: ' + payload.distance + ' km',
    '荷物量: ' + payload.cargoSize,
    '荷物内容: ' + payload.cargoDetail,
    '希望日時: ' + payload.preferredDate,
    '概算金額: ' + payload.estimatedFare + ' 円',
    '配送スピード: ' + payload.speedType,
    '詳細条件: ' + payload.options,
    '備考: ' + payload.memo,
    '',
    '確認URL: ' + payload.sheetUrl
  ].join('\n');

  MailApp.sendEmail(adminEmail, subject, bodyText);
  return true;
}

function sendUserMailForCustomer_(payload) {
  if (!payload.email) {
    return false;
  }

  var subject = '【軽貨物TAKE】受付完了 - 受付番号 ' + payload.receiptNo;
  var bodyText = [
    '軽貨物TAKEでございます。',
    '',
    '以下の内容で受付いたしました。',
    '',
    '受付種別: ' + payload.receptionType,
    '受付番号: ' + payload.receiptNo,
    '集荷先: ' + payload.origin,
    '納品先: ' + payload.destination,
    '距離: ' + payload.distance + ' km',
    '概算金額: ' + payload.estimatedFare + ' 円',
    '',
    '折り返しご連絡いたします。',
    'しばらくお待ちください。',
    '',
    '軽貨物TAKE'
  ].join('\n');

  MailApp.sendEmail(payload.email, subject, bodyText);
  return true;
}

function sendAdminLine_(summaryText, sheetUrl) {
  var token = getLineToken_();
  var toId = getLineToId_();
  if (!token || !toId) {
    return false;
  }

  var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify({
      to: toId,
      messages: buildLineMessage_(summaryText, sheetUrl)
    }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('LINE push failed: HTTP ' + code + ' ' + response.getContentText());
  }

  return true;
}

function saveDriverFiles_(receiptNo, name, files, ss) {
  var folderId = getDriveFolderId_();
  if (!folderId || !files || typeof files !== 'object') {
    return '';
  }

  var rootFolder = DriveApp.getFolderById(folderId);
  var folderName =
    safeStr_(name || receiptNo, 50).replace(/[\\\/:*?"<>|]/g, '_') + '_' + receiptNo;

  var subFolder;
  var it = rootFolder.getFoldersByName(folderName);
  if (it.hasNext()) {
    subFolder = it.next();
  } else {
    subFolder = rootFolder.createFolder(folderName);
  }

  var fileBaseNames = {
    '免許証（表）': '01_免許証_表',
    '免許証（裏）': '02_免許証_裏',
    '車両（前面）': '03_車両_前面',
    '車検証': '04_車検証',
    '自賠責': '05_自賠責',
    '任意保険': '06_任意保険',
    '経営届出書': '07_経営届出書',
    '貨物保険': '08_貨物保険'
  };

  for (var key in files) {
    if (!files.hasOwnProperty(key)) continue;

    var dataUrl = files[key];
    if (!dataUrl || typeof dataUrl !== 'string') continue;

    var match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;

    var mimeType = match[1];
    var base64Data = match[2];
    var bytes = Utilities.base64Decode(base64Data);

    if (bytes.length > 5 * 1024 * 1024) {
      appendLog_(ss, 'WARN', 'DRIVE_SAVE_SKIP', receiptNo, '5MB超のため保存スキップ: ' + key, {});
      continue;
    }

    var extension = mimeType.indexOf('pdf') >= 0 ? '.pdf' : '.jpg';
    var baseName = fileBaseNames[key] || safeStr_(key, 100).replace(/[\\\/:*?"<>|]/g, '_');
    var blob = Utilities.newBlob(bytes, mimeType, baseName + extension);
    subFolder.createFile(blob);
  }

  return subFolder.getUrl();
}

function handleCustomer_(body, debugId, ss) {
  var result = {
    result: 'NG',
    receipt_no: '',
    saved: false,
    mail_sent: false,
    line_sent: false,
    message: '',
    debugId: debugId
  };

  var receiptNo = safeStr_(body.receiptNo, 100) || buildReceiptNo_('T');
  result.receipt_no = receiptNo;

  var receptionType = safeStr_(body.receptionType, 100) || '依頼';
  var name = safeStr_(body.name || (body.customer && body.customer.name), 200);
  var email = safeStr_(body.email || (body.customer && body.customer.email), 200);
  var phone = safeStr_(body.phone || (body.customer && body.customer.phone), 100);
  var zipcode = safeStr_(body.zipcode || (body.customer && body.customer.zipcode), 30);
  var address = safeStr_(body.address || (body.customer && body.customer.address), 500);
  var origin = safeStr_(body.origin || (body.delivery && body.delivery.origin), 500);
  var destination = safeStr_(body.destination || (body.delivery && body.delivery.destination), 500);
  var distance = safeStr_(body.distance || (body.delivery && body.delivery.distance), 50);
  var cargoSize = safeStr_(body.cargoSize || (body.delivery && body.delivery.cargoSize), 100);
  var cargoDetail = safeStr_(body.cargoDetail || (body.delivery && body.delivery.cargoDetail), 2000);
  var preferredDate = safeStr_(body.preferredDate || (body.delivery && body.delivery.preferredDate), 100);
  var memo = safeStr_(body.memo || (body.delivery && body.delivery.memo), 3000);
  var estimatedFare = safeStr_(
    body.estimatedFare != null
      ? body.estimatedFare
      : body.estimate && body.estimate.price != null
      ? body.estimate.price
      : '',
    100
  );
  var speedType = safeStr_(
    body.speedType || (body.estimate && body.estimate.speedType),
    100
  );
  var options = safeStr_(body.options || (body.delivery && body.delivery.options), 2000);

  var rawJson = safeJsonString_(body, 50000);

  var sheet = ensureSheet_(ss, getRequestsSheetName_(), REQUESTS_HEADERS);
  var row = [
    new Date().toISOString(),
    receiptNo,
    receptionType,
    name,
    email,
    phone,
    zipcode,
    address,
    origin,
    destination,
    distance,
    cargoSize,
    cargoDetail,
    preferredDate,
    memo,
    estimatedFare,
    speedType,
    options,
    false,
    false,
    '保存完了',
    '',
    rawJson
  ];

  try {
    sheet.appendRow(row);
    result.saved = true;
    result.result = 'OK';
    result.message = '受付を保存しました';
  } catch (e) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_SAVE', receiptNo, String(e), body);
    result.message = '保存に失敗しました';
    return result;
  }

  var rowNumber = sheet.getLastRow();
  var sheetUrl = buildSheetRowUrl_(sheet, rowNumber);

  var mailOk = false;
  try {
    mailOk = sendAdminMailForCustomer_({
      receiptNo: receiptNo,
      receptionType: receptionType,
      name: name,
      email: email,
      phone: phone,
      zipcode: zipcode,
      address: address,
      origin: origin,
      destination: destination,
      distance: distance,
      cargoSize: cargoSize,
      cargoDetail: cargoDetail,
      preferredDate: preferredDate,
      memo: memo,
      estimatedFare: estimatedFare,
      speedType: speedType,
      options: options,
      sheetUrl: sheetUrl
    });
  } catch (e1) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_ADMIN_MAIL', receiptNo, String(e1), {});
  }

  try {
    sendUserMailForCustomer_({
      receiptNo: receiptNo,
      receptionType: receptionType,
      email: email,
      origin: origin,
      destination: destination,
      distance: distance,
      estimatedFare: estimatedFare
    });
  } catch (e2) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_USER_MAIL', receiptNo, String(e2), {});
  }

  var lineOk = false;
  try {
    var lineSummary = [
      '【' + receptionType + '】',
      '受付番号: ' + receiptNo,
      '名前: ' + name,
      '電話番号: ' + phone,
      '集荷先: ' + origin,
      '納品先: ' + destination,
      '距離: ' + distance + 'km',
      '概算金額: ' + estimatedFare + '円'
    ].join('\n');

    lineOk = sendAdminLine_(lineSummary, sheetUrl);
  } catch (e3) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_LINE', receiptNo, String(e3), {});
  }

  updateCellByHeader_(sheet, rowNumber, '管理者メール送信', mailOk);
  updateCellByHeader_(sheet, rowNumber, 'LINE通知送信', lineOk);

  result.mail_sent = mailOk;
  result.line_sent = lineOk;
  result.message = '受付完了';
  return result;
}

function handleDriver_(body, debugId, ss) {
  var result = {
    result: 'NG',
    receipt_no: '',
    saved: false,
    mail_sent: false,
    line_sent: false,
    message: '',
    debugId: debugId
  };

  var receiptNo = safeStr_(body.receiptNo, 100) || buildReceiptNo_('D');
  result.receipt_no = receiptNo;

  var name = safeStr_(body.name, 200);
  var furigana = safeStr_(body.furigana, 200);
  var phone = safeStr_(body.phone, 100);
  var email = safeStr_(body.email, 200);
  var zipcode = safeStr_(body.zipcode, 30);
  var address = safeStr_(body.address, 500);
  var maker = safeStr_(body.maker, 100);
  var model = safeStr_(body.model, 100);
  var experience = safeStr_(body.experience, 100);
  var workingArea = safeStr_(body.workingArea, 500);
  var notes = safeStr_(body.notes, 3000);
  var rawJson = safeJsonString_(body, 50000);

  var driveFolderUrl = '';
  try {
    driveFolderUrl = saveDriverFiles_(receiptNo, name, body.files || {}, ss);
  } catch (e0) {
    appendLog_(ss, 'ERROR', 'DRIVER_DRIVE', receiptNo, String(e0), {});
  }

  var sheet = ensureSheet_(ss, getDriversSheetName_(), DRIVERS_HEADERS);
  var row = [
    new Date().toISOString(),
    receiptNo,
    name,
    furigana,
    phone,
    email,
    zipcode,
    address,
    maker,
    model,
    experience,
    workingArea,
    notes,
    driveFolderUrl,
    false,
    false,
    '保存完了',
    '',
    rawJson
  ];

  try {
    sheet.appendRow(row);
    result.saved = true;
    result.result = 'OK';
    result.message = '登録を保存しました';
  } catch (e1) {
    appendLog_(ss, 'ERROR', 'DRIVER_SAVE', receiptNo, String(e1), body);
    result.message = '保存に失敗しました';
    return result;
  }

  var rowNumber = sheet.getLastRow();
  var sheetUrl = buildSheetRowUrl_(sheet, rowNumber);

  var mailOk = false;
  try {
    var adminEmail = getAdminEmail_();
    if (adminEmail) {
      var subject = '【協力ドライバー登録】受付番号 ' + receiptNo;
      var bodyText = [
        '受付番号: ' + receiptNo,
        '氏名: ' + name,
        'ふりがな: ' + furigana,
        '電話番号: ' + phone,
        'メールアドレス: ' + email,
        'メーカー: ' + maker,
        '車種: ' + model,
        '経験年数: ' + experience,
        '稼働エリア: ' + workingArea,
        'メモ: ' + notes,
        'Drive保存先: ' + driveFolderUrl,
        '',
        '確認URL: ' + sheetUrl
      ].join('\n');
      MailApp.sendEmail(adminEmail, subject, bodyText);
      mailOk = true;
    }
  } catch (e2) {
    appendLog_(ss, 'ERROR', 'DRIVER_ADMIN_MAIL', receiptNo, String(e2), {});
  }

  try {
    if (email) {
      var userSubject = '【軽貨物TAKE】協力ドライバー登録受付完了 - 受付番号 ' + receiptNo;
      var userBody = [
        '軽貨物TAKEでございます。',
        '',
        '協力ドライバー登録を受け付けました。',
        '受付番号: ' + receiptNo,
        '',
        '折り返しご連絡いたします。',
        'しばらくお待ちください。',
        '',
        '軽貨物TAKE'
      ].join('\n');
      MailApp.sendEmail(email, userSubject, userBody);
    }
  } catch (e3) {
    appendLog_(ss, 'ERROR', 'DRIVER_USER_MAIL', receiptNo, String(e3), {});
  }

  var lineOk = false;
  try {
    var lineSummary = [
      '【協力ドライバー登録】',
      '受付番号: ' + receiptNo,
      '氏名: ' + name,
      '電話番号: ' + phone,
      'メーカー: ' + maker,
      '車種: ' + model,
      '経験年数: ' + experience
    ].join('\n');

    lineOk = sendAdminLine_(lineSummary, sheetUrl);
  } catch (e4) {
    appendLog_(ss, 'ERROR', 'DRIVER_LINE', receiptNo, String(e4), {});
  }

  updateCellByHeader_(sheet, rowNumber, '管理者メール送信', mailOk);
  updateCellByHeader_(sheet, rowNumber, 'LINE通知送信', lineOk);

  result.mail_sent = mailOk;
  result.line_sent = lineOk;
  result.message = '登録完了';
  return result;
}

function doPost(e) {
  var debugId = Utilities.getUuid();
  var ss = null;

  try {
    ss = getSpreadsheet_();
  } catch (e0) {
    return ContentService
      .createTextOutput(
        JSON.stringify({
          result: 'NG',
          receipt_no: '',
          saved: false,
          mail_sent: false,
          line_sent: false,
          message: 'スプレッドシートを開けません',
          debugId: debugId
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var body = parseRequestBody_(e);
    var type = safeStr_(body.type, 50).toLowerCase();

    if (type === 'customer') {
      return ContentService
        .createTextOutput(JSON.stringify(handleCustomer_(body, debugId, ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (type === 'driver') {
      return ContentService
        .createTextOutput(JSON.stringify(handleDriver_(body, debugId, ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    appendLog_(ss, 'WARN', 'UNKNOWN_TYPE', safeStr_(body.receiptNo, 100), 'type が不明です', body);

    return ContentService
      .createTextOutput(
        JSON.stringify({
          result: 'NG',
          receipt_no: safeStr_(body.receiptNo, 100),
          saved: false,
          mail_sent: false,
          line_sent: false,
          message: 'type が不明です',
          debugId: debugId
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e1) {
    appendLog_(ss, 'ERROR', 'DO_POST', '', String(e1), {});
    return ContentService
      .createTextOutput(
        JSON.stringify({
          result: 'NG',
          receipt_no: '',
          saved: false,
          mail_sent: false,
          line_sent: false,
          message: String(e1),
          debugId: debugId
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var type = safeStr_(params.type, 50);

  if (type === 'health') {
    var out = {
      ok: true,
      now: new Date().toISOString(),
      spreadsheetId: getSpreadsheetId_(),
      requestsSheetName: getRequestsSheetName_(),
      driversSheetName: getDriversSheetName_(),
      logsSheetName: getLogsSheetName_(),
      configSheetName: getConfigSheetName_(),
      adminEmailSet: !!getAdminEmail_(),
      lineTokenSet: !!getLineToken_(),
      lineToIdSet: !!getLineToId_(),
      driveFolderIdSet: !!getDriveFolderId_()
    };

    return ContentService
      .createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(
      JSON.stringify({
        ok: true,
        message: '軽貨物TAKE GAS',
        spreadsheetId: getSpreadsheetId_()
      })
    )
    .setMimeType(ContentService.MimeType.JSON);
}