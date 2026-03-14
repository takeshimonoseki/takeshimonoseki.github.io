/**
 * SETUP.gs
 * - 台帳（設定/名簿/公開/Jobs）をコードで必ず作る
 * - ScriptProperties に「スプレッドシートID」を必ず入れる（WebApp安定化）
 */

//const SETUP_DEFAULT_SPREADSHEET_ID = '1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8';

function setupEnvironment() {
  const ss = SpreadsheetApp.openById(SETUP_DEFAULT_SPREADSHEET_ID);

  // 1) シート作成
  const shSettings = ensureSheet__(ss, '設定');
  const shDrivers = ensureSheet__(ss, 'ドライバー名簿');
  const shCustomers = ensureSheet__(ss, 'お客様名簿');
  const shPublic = ensureSheet__(ss, '公開ドライバー一覧');
  const shJobs = ensureSheet__(ss, 'Jobs');

  // 2) 設定シートの形（A=項目キー / B=値 / C=説明 / D=メモ）
  initSettingsSheet__(shSettings);

  // 3) 必須設定行（不足だけ追加、既存値は壊さない）
  upsertSettingRow__(shSettings, 'スプレッドシートID', ss.getId(), 'この台帳のスプレッドシートID（自動）', '触らなくてOK');
  upsertSettingRow__(shSettings, 'シート名_ドライバー', 'ドライバー名簿', 'ドライバー名簿のシート名', '基本はこのまま');
  upsertSettingRow__(shSettings, 'シート名_お客様', 'お客様名簿', 'お客様名簿のシート名', '基本はこのまま');
  upsertSettingRow__(shSettings, 'シート名_公開', '公開ドライバー一覧', '公開ドライバー一覧のシート名', '基本はこのまま');
  upsertSettingRow__(shSettings, 'シート名_設定', '設定', '設定シート名', '基本はこのまま');
  upsertSettingRow__(shSettings, 'シート名_Jobs', 'Jobs', 'debugIdログ（Jobs）のシート名', '基本はこのまま');

  upsertSettingRow__(shSettings, '写真フォルダID', '', '本登録写真の保存先DriveフォルダID（ここに貼る）', '未設定でも名簿は保存OK');

  upsertSettingRow__(shSettings, '管理者メール', 'takeshimonoseki@gmail.com', '通知メール先', '');
  upsertSettingRow__(shSettings, 'LINEアクセストークン', '', 'LINE Messaging API アクセストークン', '空ならLINE通知しない');
  upsertSettingRow__(shSettings, 'LINE通知先UserID', 'U94fa1bd99a801f9d531193705c108b65', 'LINE通知先UserID', '');

  upsertSettingRow__(shSettings, 'WebアプリURL', '', 'GASデプロイ後の /exec URL', 'あとで貼る');
  upsertSettingRow__(shSettings, 'サイトURL_お客様', '', 'お客様ページURL', 'あとで貼る');
  upsertSettingRow__(shSettings, 'サイトURL_ドライバー', '', 'ドライバーページURL', 'あとで貼る');

  // 4) ヘッダー（不足列だけ追加）
  ensureHeaderHas__(shDrivers, [
    'debugId','ドライバーID','登録日時','更新日時','状態','公開状態','公開同意',
    '公開名','公開エリア','公開車両','稼働時間帯','公開ひとこと',
    '電話番号','メール','LINE名',
    '姓','名','氏名',
    '郵便番号','都道府県','市区町村','住所1','住所2',
    '車両種別','メーカー','車両モデル','ナンバー',
    '任意保険','貨物保険',
    '写真URL_免許証','写真URL_車検証','写真URL_黒ナンバー','写真URL_任意保険','写真URL_貨物保険','写真枚数',
    '得意分野','自己紹介',
    '登録元ページ','UserAgent','元データJSON'
  ]);

  ensureHeaderHas__(shCustomers, [
    'debugId','顧客ID','登録日時','更新日時','状態',
    '氏名','電話番号','メール','LINE名','希望連絡手段',
    '郵便番号','都道府県','市区町村','住所1','住所2',
    'メモ','登録元ページ','UserAgent','元データJSON'
  ]);

  ensureHeaderHas__(shPublic, [
    'ドライバーID','更新日時','公開名','公開エリア','公開車両','稼働時間帯','公開ひとこと'
  ]);

  ensureHeaderHas__(shJobs, [
    'timestamp','debugId','kind','step','ok','message','driverName','phone','vehicleMaker','vehicleModel','photoCount'
  ]);

  // 5) WebApp安定化：ScriptPropertiesに必ず入れる（Code.gsがこれを見る）
  PropertiesService.getScriptProperties().setProperty('スプレッドシートID', ss.getId());

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('セットアップ完了（設定/名簿/公開/Jobs + ScriptProperties 更新）');
}

function ensureSheet__(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function initSettingsSheet__(sh) {
  const header = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0];
  const isEmpty = header.every(v => String(v||'').trim() === '');
  if (isEmpty) {
    sh.getRange(1,1,1,4).setValues([['項目キー','値（ここに入力）','説明','メモ']]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,4).setFontWeight('bold');
    sh.getRange(2,2,200,1).setBackground('#fff7cc');
  }
}

function upsertSettingRow__(sh, key, value, desc, memo) {
  const lr = sh.getLastRow();
  const rows = lr >= 2 ? sh.getRange(2,1,lr-1,4).getValues() : [];
  const idx = rows.findIndex(r => String(r[0]||'').trim() === key);
  if (idx === -1) {
    sh.appendRow([key, value, desc, memo]);
  } else {
    const row = idx + 2;
    const curVal = String(sh.getRange(row,2).getValue()||'');
    const curDesc = String(sh.getRange(row,3).getValue()||'');
    const curMemo = String(sh.getRange(row,4).getValue()||'');
    if (curVal === '' && value !== '') sh.getRange(row,2).setValue(value);
    if (curDesc === '' && desc !== '') sh.getRange(row,3).setValue(desc);
    if (curMemo === '' && memo !== '') sh.getRange(row,4).setValue(memo);
  }
}

function ensureHeaderHas__(sh, requiredCols) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1,1,1,lastCol).getValues()[0].map(v => String(v||'').trim());
  const isEmpty = header.every(v => v === '');
  let h = isEmpty ? [] : header.slice();

  let changed = false;
  requiredCols.forEach(c => { if (!h.includes(c)) { h.push(c); changed = true; } });

  if (isEmpty || changed) {
    sh.getRange(1,1,1,h.length).setValues([h]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,h.length).setFontWeight('bold');
  }
}
