// path: gas/SETUP.gs
/**
 * 軽貨物TAKE セットアップ
 * - forceResetTakeEnvironment: 環境を強制リセット（4タブのみ残し、他は削除）
 * - メニュー: 環境を強制リセット / スプレッドシートURLを表示
 *
 * 4シート: 配送依頼, ドライバー登録, ログ, 設定
 * Code.gs のヘッダー定義と一致させること
 */

var SPREADSHEET_ID_FALLBACK = '1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8';

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

var KEEP_SHEET_NAMES = ['配送依頼', 'ドライバー登録', 'ログ', '設定'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('軽貨物TAKE')
    .addItem('環境を強制リセット', 'forceResetTakeEnvironment')
    .addItem('スプレッドシートURLを表示', 'showSpreadsheetUrl')
    .addToUi();
}

function writeHeader_(sheet, headers) {
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function forceResetTakeEnvironment() {
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty('SPREADSHEET_ID')) {
    var sid = props.getProperty('SHEET_ID') || props.getProperty('スプレッドシートID') || SPREADSHEET_ID_FALLBACK;
    props.setProperty('SPREADSHEET_ID', sid);
  }

  if (!props.getProperty('LINE_TO_USER_ID') && props.getProperty('ADMIN_LINE_USER_ID')) {
    props.setProperty('LINE_TO_USER_ID', props.getProperty('ADMIN_LINE_USER_ID'));
  }

  props.setProperty('REQUESTS_SHEET_NAME', '配送依頼');
  props.setProperty('DRIVERS_SHEET_NAME', 'ドライバー登録');
  props.setProperty('LOGS_SHEET_NAME', 'ログ');
  props.setProperty('CONFIG_SHEET_NAME', '設定');

  var ssId = props.getProperty('SPREADSHEET_ID') || SPREADSHEET_ID_FALLBACK;
  var ss = SpreadsheetApp.openById(ssId);

  var shRequests = ss.getSheetByName('配送依頼');
  if (!shRequests) shRequests = ss.insertSheet('配送依頼');
  writeHeader_(shRequests, REQUESTS_HEADERS);

  var shDrivers = ss.getSheetByName('ドライバー登録');
  if (!shDrivers) shDrivers = ss.insertSheet('ドライバー登録');
  writeHeader_(shDrivers, DRIVERS_HEADERS);

  var shLogs = ss.getSheetByName('ログ');
  if (!shLogs) shLogs = ss.insertSheet('ログ');
  writeHeader_(shLogs, LOGS_HEADERS);

  var shConfig = ss.getSheetByName('設定');
  if (!shConfig) shConfig = ss.insertSheet('設定');
  writeHeader_(shConfig, CONFIG_HEADERS);

  var configRows = [
    ['SPREADSHEET_ID', ssId],
    ['REQUESTS_SHEET_NAME', '配送依頼'],
    ['DRIVERS_SHEET_NAME', 'ドライバー登録'],
    ['LOGS_SHEET_NAME', 'ログ'],
    ['CONFIG_SHEET_NAME', '設定'],
    ['ADMIN_EMAIL', props.getProperty('ADMIN_EMAIL') ? '設定済み' : '未設定'],
    ['LINE_CHANNEL_ACCESS_TOKEN', props.getProperty('LINE_CHANNEL_ACCESS_TOKEN') ? '設定済み' : '未設定'],
    ['LINE_TO_USER_ID', props.getProperty('LINE_TO_USER_ID') ? '設定済み' : '未設定'],
    ['LINE_TO_GROUP_ID', props.getProperty('LINE_TO_GROUP_ID') ? '設定済み' : '未設定'],
    ['DRIVE_FOLDER_ID', props.getProperty('DRIVE_FOLDER_ID') ? '設定済み' : '未設定'],
    ['SPREADSHEET_URL', 'https://docs.google.com/spreadsheets/d/' + ssId + '/edit']
  ];

  var configDataRows = Math.max(shConfig.getLastRow() - 1, 0);
  if (configDataRows > 0) {
    shConfig.getRange(2, 1, configDataRows, 2).clearContent();
  }
  shConfig.getRange(2, 1, configRows.length, 2).setValues(configRows);

  var allSheets = ss.getSheets();
  for (var i = allSheets.length - 1; i >= 0; i--) {
    var name = allSheets[i].getName();
    if (KEEP_SHEET_NAMES.indexOf(name) === -1) {
      ss.deleteSheet(allSheets[i]);
    }
  }

  shLogs.appendRow([
    new Date().toISOString(),
    'INFO',
    'FORCE_RESET',
    '',
    '環境強制リセット完了',
    '{}'
  ]);

  SpreadsheetApp.flush();

  try {
    SpreadsheetApp.getUi().alert('環境強制リセット完了\n\nタブ: 配送依頼, ドライバー登録, ログ, 設定');
  } catch (e) {
    Logger.log('環境強制リセット完了');
  }
}

function showSpreadsheetUrl() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID') || props.getProperty('SHEET_ID') || SPREADSHEET_ID_FALLBACK;
  var url = 'https://docs.google.com/spreadsheets/d/' + ssId + '/edit';
  try {
    SpreadsheetApp.getUi().alert('スプレッドシートURL\n\n' + url);
  } catch (e) {
    Logger.log(url);
  }
}