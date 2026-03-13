/**
 * 軽貨物TAKE ポータルサイト バックエンド (GAS)
 * 150点・収益爆増版
 */

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = [
    {
      name: 'お客様_依頼',
      headers: [
        '受付番号', '受付日時', '氏名', '電話番号', 'メール', '住所', 
        '出発地', '目的地', '距離(km)', 'スピード種別', '不用品買取希望', 
        '見積総額', 'オプション詳細', '依頼内容'
      ]
    },
    {
      name: 'ドライバー_登録',
      headers: [
        '受付番号', '登録日時', '氏名', 'ニックネーム', 'メール', '電話番号', 
        '車種', '経験年数', '写真(DriveURL)', '承認ステータス', '自己PR'
      ]
    },
    {
      name: '各種相談',
      headers: ['受付番号', '受付日時', '氏名', '電話番号', '相談種別', '詳細内容']
    },
    {
      name: 'システム設定',
      headers: ['設定項目', '値', '説明']
    }
  ];

  sheets.forEach(sheetInfo => {
    let sheet = ss.getSheetByName(sheetInfo.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetInfo.name);
    }
    
    // ヘッダーの設定
    const headerRange = sheet.getRange(1, 1, 1, sheetInfo.headers.length);
    headerRange.setValues([sheetInfo.headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f3f3');
    
    // 1行目を固定
    sheet.setFrozenRows(1);
  });

  // システム設定シートの初期データ
  const configSheet = ss.getSheetByName('システム設定');
  if (configSheet && configSheet.getLastRow() === 1) {
    const initialConfigs = [
      ['基本料金', '3000', '運賃シミュレーターの基本料金'],
      ['高速代単価', '25', '1kmあたりの概算高速料金'],
      ['LINE通知', 'ON', 'ON/OFF'],
    ];
    configSheet.getRange(2, 1, initialConfigs.length, 3).setValues(initialConfigs);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type;
    
    // 受付番号の生成 (T-YYYYMMDD-001)
    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 採番ロジック
    const receiptNo = data.receiptNo || generateReceiptNo(dateStr);
    const timestamp = now;

    let sheetName = '';
    let rowData = [];
    let notifyMessage = '';

    if (type === 'customer') {
      sheetName = 'お客様_依頼';
      rowData = [
        receiptNo,
        timestamp,
        data.name,
        data.phone,
        data.email,
        data.address,
        data.origin,
        data.destination,
        data.distance,
        data.speedType,
        data.wasteOption ? '希望する' : 'なし',
        data.estimatedFare,
        data.options,
        data.details
      ];
      notifyMessage = `🚀 【新規配送依頼】\n番号: ${receiptNo}\n氏名: ${data.name} 様\n種別: ${data.speedType}\n不用品買取: ${data.wasteOption ? '★希望あり' : 'なし'}\n概算総額: ${data.estimatedFare}円\n\n詳細はスプレッドシートを確認してください。`;
    } else if (type === 'driver_register') {
      sheetName = 'ドライバー_登録';
      
      // 画像の保存処理
      let fileUrl = '';
      if (data.photoBase64) {
        fileUrl = saveImageToDrive(data.photoBase64, `${receiptNo}_${data.name}`);
      }

      rowData = [
        receiptNo,
        timestamp,
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
      notifyMessage = `🚛 【新規ドライバー登録】\n番号: ${receiptNo}\n氏名: ${data.name} 様\nニックネーム: ${data.nickname}\n経験: ${data.experience}\n\n管理画面で承認作業を行ってください。`;
    } else if (type === 'consult') {
      sheetName = '各種相談';
      rowData = [
        receiptNo,
        timestamp,
        data.name,
        data.phone,
        data.consultType,
        data.details
      ];
      notifyMessage = `💬 【新規相談受付】\n番号: ${receiptNo}\n氏名: ${data.name} 様\n種別: ${data.consultType}\n内容: ${data.details}`;
    }

    const sheet = ss.getSheetByName(sheetName);
    sheet.appendRow(rowData);

    // LINE通知
    sendLineNotify(notifyMessage);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', receiptNo: receiptNo }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function generateReceiptNo(dateStr) {
  // 簡易的な採番（本来はシートの行数などで管理するのが望ましいが、衝突回避のためランダムを付与）
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `T-${dateStr}-${randomNum}`;
}

function saveImageToDrive(base64Data, fileName) {
  try {
    const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
    if (!folderId) return 'Folder ID not set';
    
    const folder = DriveApp.getFolderById(folderId);
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, fileName);
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (err) {
    return 'Upload Error: ' + err.toString();
  }
}

function sendLineNotify(message) {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  if (!token || token === '') return;

  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    payload: { message: message }
  };

  try {
    UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
  } catch (e) {
    console.error('LINE Notify error:', e);
  }
}

