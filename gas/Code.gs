// path: gas/Code.gs
/**
 * 軽貨物TAKE GAS バックエンド
 * - type=customer: 配送相談（見積依頼 / 正式依頼）→ 「配送依頼」シート
 * - type=driver: 協力ドライバー登録 → 「ドライバー登録」シート
 * - 正本: スプレッドシート。payload → canonical に正規化し、全処理は canonical から生成
 * - 保存最優先。通知失敗でも保存成功なら受付成功。失敗はログへ
 *
 * Script Properties（必須）
 * - SPREADSHEET_ID
 * - ADMIN_EMAIL
 * - LINE_CHANNEL_ACCESS_TOKEN
 * - LINE_TO_USER_ID または LINE_TO_GROUP_ID
 *
 * Script Properties（任意）
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

var DRIVER_DOC_KEYS = [
  '免許証（表）',
  '免許証（裏）',
  '車検証',
  '任意保険',
  '貨物軽自動車運送事業経営届出書',
  '車両前面写真_黒ナンバー入り',
  '貨物保険',
  'その他資料'
];

var DRIVER_DOC_TO_FILENAME = {
  '免許証（表）': '01_免許証_表',
  '免許証（裏）': '02_免許証_裏',
  '車検証': '03_車検証',
  '任意保険': '04_任意保険',
  '貨物軽自動車運送事業経営届出書': '05_貨物軽自動車運送事業経営届出書',
  '車両前面写真_黒ナンバー入り': '06_車両前面写真_黒ナンバー入り',
  '貨物保険': '07_貨物保険',
  'その他資料': '08_その他資料'
};

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
  '免許証表提出',
  '免許証裏提出',
  '車検証提出',
  '任意保険提出',
  '経営届出書提出',
  '車両前面写真提出',
  '貨物保険提出',
  'その他資料提出',
  'Drive保存先',
  '管理者メール送信',
  'LINE通知送信',
  '受付状態',
  'エラー内容',
  '受信JSON'
];

var LOGS_HEADERS = ['日時', 'レベル', '処理', '受付番号', 'メッセージ', '詳細JSON'];

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

/**
 * payload を customer 正本オブジェクトに正規化
 */
function normalizePayloadToCustomerCanonical_(body) {
  var c = body.customer || {};
  var d = body.delivery || {};
  var est = body.estimate || {};
  return {
    receiptNo: safeStr_(body.receiptNo, 100) || buildReceiptNo_('T'),
    receptionType: safeStr_(body.receptionType, 100) || '依頼',
    name: safeStr_(body.name || c.name, 200),
    email: safeStr_(body.email || c.email, 200),
    phone: safeStr_(body.phone || c.phone, 100),
    zipcode: safeStr_(body.zipcode || c.zipcode, 30),
    address: safeStr_(body.address || c.address, 500),
    origin: safeStr_(body.origin || d.origin, 500),
    destination: safeStr_(body.destination || d.destination, 500),
    distance: safeStr_(body.distance || d.distance, 50),
    cargoSize: safeStr_(body.cargoSize || d.cargoSize, 100),
    cargoDetail: safeStr_(body.cargoDetail || d.cargoDetail, 2000),
    preferredDate: safeStr_(body.preferredDate || d.preferredDate, 100),
    memo: safeStr_(body.memo || d.memo, 3000),
    estimatedFare: safeStr_(
      body.estimatedFare != null ? body.estimatedFare : est.price != null ? est.price : '',
      100
    ),
    speedType: safeStr_(body.speedType || est.speedType, 100),
    options: safeStr_(body.options || d.options, 2000)
  };
}

/**
 * payload を driver 正本オブジェクトに正規化
 */
function normalizePayloadToDriverCanonical_(body) {
  var files = body.files || {};
  var docStatus = {};
  for (var i = 0; i < DRIVER_DOC_KEYS.length; i++) {
    var key = DRIVER_DOC_KEYS[i];
    docStatus[key] = files[key] ? '提出済み' : '未提出';
  }
  return {
    receiptNo: safeStr_(body.receiptNo, 100) || buildReceiptNo_('D'),
    name: safeStr_(body.name, 200),
    furigana: safeStr_(body.furigana, 200),
    phone: safeStr_(body.phone, 100),
    email: safeStr_(body.email, 200),
    zipcode: safeStr_(body.zipcode, 30),
    address: safeStr_(body.address, 500),
    maker: safeStr_(body.maker, 100),
    model: safeStr_(body.model, 100),
    experience: safeStr_(body.experience, 100),
    workingArea: safeStr_(body.workingArea, 500),
    notes: safeStr_(body.notes, 3000),
    files: files,
    docStatus: docStatus
  };
}

function buildLineMessage_(summaryText, sheetUrl) {
  var text = (summaryText || '').trim();
  if (sheetUrl) {
    text = text + '\n\n確認: ' + sheetUrl;
  }
  return [{ type: 'text', text: text.slice(0, 4500) }];
}

function sendAdminMailForCustomer_(canon, sheetUrl) {
  var adminEmail = getAdminEmail_();
  if (!adminEmail) return false;

  var subject = '【' + canon.receptionType + '】受付番号 ' + canon.receiptNo;
  var bodyText = [
    '受付番号: ' + canon.receiptNo,
    '受付種別: ' + canon.receptionType,
    '',
    '【依頼者】',
    '名前: ' + canon.name,
    'メール: ' + canon.email,
    '電話番号: ' + canon.phone,
    '郵便番号: ' + canon.zipcode,
    '住所: ' + canon.address,
    '',
    '【配送内容】',
    '集荷先: ' + canon.origin,
    '納品先: ' + canon.destination,
    '距離: ' + canon.distance + ' km',
    '荷物量: ' + canon.cargoSize,
    '荷物内容: ' + canon.cargoDetail,
    '希望日時: ' + canon.preferredDate,
    '概算金額: ' + canon.estimatedFare + ' 円',
    '配送スピード: ' + canon.speedType,
    '詳細条件: ' + canon.options,
    '備考: ' + canon.memo,
    '',
    '確認URL: ' + sheetUrl
  ].join('\n');

  MailApp.sendEmail(adminEmail, subject, bodyText);
  return true;
}

function sendUserMailForCustomer_(canon) {
  if (!canon.email) return false;

  var subject = '【軽貨物TAKE】受付完了 - 受付番号 ' + canon.receiptNo;
  var bodyText = [
    '軽貨物TAKEでございます。',
    '',
    '以下の内容で受付いたしました。',
    '',
    '受付種別: ' + canon.receptionType,
    '受付番号: ' + canon.receiptNo,
    '集荷先: ' + canon.origin,
    '納品先: ' + canon.destination,
    '距離: ' + canon.distance + ' km',
    '概算金額: ' + canon.estimatedFare + ' 円',
    '',
    '折り返しご連絡いたします。',
    'しばらくお待ちください。',
    '',
    '軽貨物TAKE'
  ].join('\n');

  MailApp.sendEmail(canon.email, subject, bodyText);
  return true;
}

function sendAdminMailForDriver_(canon, submittedList, missingList, driveUrl, sheetUrl) {
  var adminEmail = getAdminEmail_();
  if (!adminEmail) return false;

  var subject = '【協力ドライバー登録】受付番号 ' + canon.receiptNo;
  var bodyText = [
    '受付番号: ' + canon.receiptNo,
    '氏名: ' + canon.name,
    'ふりがな: ' + canon.furigana,
    '電話番号: ' + canon.phone,
    'メールアドレス: ' + canon.email,
    '郵便番号: ' + canon.zipcode,
    '住所: ' + canon.address,
    'メーカー: ' + canon.maker,
    '車種: ' + canon.model,
    '経験年数: ' + canon.experience,
    '稼働エリア: ' + canon.workingArea,
    'メモ: ' + canon.notes,
    '',
    '【提出済み書類】',
    submittedList,
    '',
    '【未提出書類】',
    missingList,
    '',
    'Drive保存先: ' + (driveUrl || 'なし'),
    '',
    '確認URL: ' + sheetUrl
  ].join('\n');

  MailApp.sendEmail(adminEmail, subject, bodyText);
  return true;
}

function sendUserMailForDriver_(canon) {
  if (!canon.email) return false;

  var subject = '【軽貨物TAKE】協力ドライバー登録受付完了 - 受付番号 ' + canon.receiptNo;
  var bodyText = [
    '軽貨物TAKEでございます。',
    '',
    '協力ドライバー登録を受け付けました。',
    '受付番号: ' + canon.receiptNo,
    '',
    '折り返しご連絡いたします。',
    'しばらくお待ちください。',
    '',
    '軽貨物TAKE'
  ].join('\n');

  MailApp.sendEmail(canon.email, subject, bodyText);
  return true;
}

function sendAdminLine_(summaryText, sheetUrl) {
  var token = getLineToken_();
  var toId = getLineToId_();
  if (!token || !toId) return false;

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

/**
 * ドライバー書類をDriveに保存。フォルダ名: 氏名_受付番号
 */
function saveDriverFiles_(canon, ss) {
  var folderId = getDriveFolderId_();
  if (!folderId || !canon.files || typeof canon.files !== 'object') {
    return '';
  }

  var rootFolder = DriveApp.getFolderById(folderId);
  var folderName =
    safeStr_(canon.name || canon.receiptNo, 50).replace(/[\\\/:*?"<>|]/g, '_') +
    '_' +
    canon.receiptNo;

  var subFolder;
  var it = rootFolder.getFoldersByName(folderName);
  if (it.hasNext()) {
    subFolder = it.next();
  } else {
    subFolder = rootFolder.createFolder(folderName);
  }

  for (var key in canon.files) {
    if (!canon.files.hasOwnProperty(key)) continue;

    var dataUrl = canon.files[key];
    if (!dataUrl || typeof dataUrl !== 'string') continue;

    var match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;

    var mimeType = match[1];
    var base64Data = match[2];
    var bytes = Utilities.base64Decode(base64Data);

    if (bytes.length > 5 * 1024 * 1024) {
      appendLog_(ss, 'WARN', 'DRIVE_SAVE_SKIP', canon.receiptNo, '5MB超のため保存スキップ: ' + key, {});
      continue;
    }

    var baseName = DRIVER_DOC_TO_FILENAME[key] || safeStr_(key, 100).replace(/[\\\/:*?"<>|]/g, '_');
    var extension = mimeType.indexOf('pdf') >= 0 ? '.pdf' : '.jpg';
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

  var canon = normalizePayloadToCustomerCanonical_(body);
  result.receipt_no = canon.receiptNo;

  var rawJson = safeJsonString_(body, 50000);

  var sheet = ensureSheet_(ss, getRequestsSheetName_(), REQUESTS_HEADERS);
  var row = [
    new Date().toISOString(),
    canon.receiptNo,
    canon.receptionType,
    canon.name,
    canon.email,
    canon.phone,
    canon.zipcode,
    canon.address,
    canon.origin,
    canon.destination,
    canon.distance,
    canon.cargoSize,
    canon.cargoDetail,
    canon.preferredDate,
    canon.memo,
    canon.estimatedFare,
    canon.speedType,
    canon.options,
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
    appendLog_(ss, 'ERROR', 'CUSTOMER_SAVE', canon.receiptNo, String(e), body);
    result.message = '保存に失敗しました';
    return result;
  }

  var rowNumber = sheet.getLastRow();
  var sheetUrl = buildSheetRowUrl_(sheet, rowNumber);

  var mailOk = false;
  try {
    mailOk = sendAdminMailForCustomer_(canon, sheetUrl);
  } catch (e1) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_ADMIN_MAIL', canon.receiptNo, String(e1), {});
  }

  try {
    sendUserMailForCustomer_(canon);
  } catch (e2) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_USER_MAIL', canon.receiptNo, String(e2), {});
  }

  var lineOk = false;
  try {
    var lineSummary = [
      '【' + canon.receptionType + '】',
      '受付番号: ' + canon.receiptNo,
      '名前: ' + canon.name,
      '電話番号: ' + canon.phone,
      '集荷先: ' + canon.origin,
      '納品先: ' + canon.destination,
      '距離: ' + canon.distance + 'km',
      '概算金額: ' + canon.estimatedFare + '円'
    ].join('\n');

    lineOk = sendAdminLine_(lineSummary, sheetUrl);
  } catch (e3) {
    appendLog_(ss, 'ERROR', 'CUSTOMER_LINE', canon.receiptNo, String(e3), {});
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

  var canon = normalizePayloadToDriverCanonical_(body);
  result.receipt_no = canon.receiptNo;

  var driveFolderUrl = '';
  try {
    driveFolderUrl = saveDriverFiles_(canon, ss);
  } catch (e0) {
    appendLog_(ss, 'ERROR', 'DRIVER_DRIVE', canon.receiptNo, String(e0), {});
  }

  var docCols = [
    canon.docStatus['免許証（表）'],
    canon.docStatus['免許証（裏）'],
    canon.docStatus['車検証'],
    canon.docStatus['任意保険'],
    canon.docStatus['貨物軽自動車運送事業経営届出書'],
    canon.docStatus['車両前面写真_黒ナンバー入り'],
    canon.docStatus['貨物保険'],
    canon.docStatus['その他資料']
  ];

  var submittedList = [];
  var missingList = [];
  var docLabels = [
    '免許証（表）',
    '免許証（裏）',
    '車検証',
    '任意保険',
    '貨物軽自動車運送事業経営届出書',
    '車両前面写真_黒ナンバー入り',
    '貨物保険',
    'その他資料'
  ];
  for (var i = 0; i < docLabels.length; i++) {
    if (canon.docStatus[docLabels[i]] === '提出済み') {
      submittedList.push(docLabels[i]);
    } else {
      missingList.push(docLabels[i]);
    }
  }

  var rawJson = safeJsonString_(body, 50000);

  var sheet = ensureSheet_(ss, getDriversSheetName_(), DRIVERS_HEADERS);
  var row = [
    new Date().toISOString(),
    canon.receiptNo,
    canon.name,
    canon.furigana,
    canon.phone,
    canon.email,
    canon.zipcode,
    canon.address,
    canon.maker,
    canon.model,
    canon.experience,
    canon.workingArea,
    canon.notes
  ].concat(docCols).concat([
    driveFolderUrl,
    false,
    false,
    '保存完了',
    '',
    rawJson
  ]);

  try {
    sheet.appendRow(row);
    result.saved = true;
    result.result = 'OK';
    result.message = '登録を保存しました';
  } catch (e1) {
    appendLog_(ss, 'ERROR', 'DRIVER_SAVE', canon.receiptNo, String(e1), body);
    result.message = '保存に失敗しました';
    return result;
  }

  var rowNumber = sheet.getLastRow();
  var sheetUrl = buildSheetRowUrl_(sheet, rowNumber);

  var mailOk = false;
  try {
    mailOk = sendAdminMailForDriver_(
      canon,
      submittedList.length ? submittedList.join(', ') : 'なし',
      missingList.length ? missingList.join(', ') : 'なし',
      driveFolderUrl,
      sheetUrl
    );
  } catch (e2) {
    appendLog_(ss, 'ERROR', 'DRIVER_ADMIN_MAIL', canon.receiptNo, String(e2), {});
  }

  try {
    sendUserMailForDriver_(canon);
  } catch (e3) {
    appendLog_(ss, 'ERROR', 'DRIVER_USER_MAIL', canon.receiptNo, String(e3), {});
  }

  var lineOk = false;
  try {
    var lineSummary = [
      '【協力ドライバー登録】',
      '受付番号: ' + canon.receiptNo,
      '氏名: ' + canon.name,
      '電話番号: ' + canon.phone,
      'メーカー: ' + canon.maker,
      '車種: ' + canon.model,
      '経験年数: ' + canon.experience,
      '提出済み: ' + (submittedList.length ? submittedList.slice(0, 5).join(', ') + (submittedList.length > 5 ? '...' : '') : 'なし')
    ].join('\n');

    lineOk = sendAdminLine_(lineSummary, sheetUrl);
  } catch (e4) {
    appendLog_(ss, 'ERROR', 'DRIVER_LINE', canon.receiptNo, String(e4), {});
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
