/**
 * 参考用：Google Apps Script Webアプリ
 * 貼り付け場所：Apps Script エディタの「コード.gs」にそのまま貼る（または新規 .gs ファイルを作成して貼る）
 * 出力先：下記 DRIVE_FOLDER_ID のフォルダに画像保存、SHEET_ID のスプレッドシート・SHEET_TAB のシートに行追加
 * デプロイ手順：
 *   1. script.google.com で新規プロジェクト作成
 *   2. このコードを貼り付け、DRIVE_FOLDER_ID / SHEET_ID / SHEET_TAB を自分のID・シート名に変更
 *   3. デプロイ → 新しいデプロイ → 種類「Web アプリ」→ 実行ユーザー「自分」→ アクセス「全員」
 *   4. デプロイ後表示される Web アプリの URL を config.js の GAS_ENDPOINT / GAS_WEBAPP_URL に貼る
 */

var DRIVE_FOLDER_ID = "ここにDriveフォルダIDを貼る";
var SHEET_ID = "ここにスプレッドシートIDを貼る";
var SHEET_TAB = "登録一覧";
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
var ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];

function doPost(e) {
  var result = { ok: false };
  try {
    var raw = e.postData && e.postData.contents ? e.postData.contents : "";
    var body = JSON.parse(raw);
    var type = body.type;

    if (type === "driver_register") {
      result = handleDriverRegister(body);
    } else if (type === "driver_files") {
      result = handleDriverFiles(body);
    } else {
      result.error = "unknown_type";
    }
  } catch (err) {
    result.error = "parse_or_runtime";
    result.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleDriverRegister(body) {
  var data = body.data || {};
  var receiptId = "R" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8);
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB);
  if (!sheet) return { ok: false, error: "sheet_not_found" };

  var row = [
    receiptId,
    new Date().toISOString(),
    data.nickname || "",
    data.fullName || (data.lastName + " " + data.firstName) || "",
    data.address || "",
    data.city || "",
    data.vehicle || "",
    data.plateNumber || "",
    data.autoInsurance || "",
    data.cargoInsurance || "",
    data.availability ? data.availability.join(" ") : "",
    data.specialties ? data.specialties.join(" ") : "",
    (data.profile || "").slice(0, 500),
    data.contactPhone || "",
    data.contactEmail || "",
    data.contactLineName || ""
  ];
  sheet.appendRow(row);

  var folder = null;
  try {
    folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (e) {}
  if (folder && body.licenseFront && body.licenseFront.data) {
    var subFolder = folder.createFolder(receiptId);
    saveBase64(subFolder, "免許証_表.jpg", body.licenseFront.data);
    if (body.licenseBack && body.licenseBack.data) saveBase64(subFolder, "免許証_裏.jpg", body.licenseBack.data);
    if (body.vehiclePhoto1 && body.vehiclePhoto1.data) saveBase64(subFolder, "車両1.jpg", body.vehiclePhoto1.data);
    if (body.vehiclePhoto2 && body.vehiclePhoto2.data) saveBase64(subFolder, "車両2.jpg", body.vehiclePhoto2.data);
    if (body.autoInsuranceFile && body.autoInsuranceFile.data) saveBase64(subFolder, "自賠責証券." + getExt(body.autoInsuranceFile.name), body.autoInsuranceFile.data);
    if (body.cargoInsuranceFile && body.cargoInsuranceFile.data) saveBase64(subFolder, "貨物保険." + getExt(body.cargoInsuranceFile.name), body.cargoInsuranceFile.data);
  }

  return { ok: true, receiptId: receiptId };
}

function handleDriverFiles(body) {
  var receiptId = body.receiptId;
  if (!receiptId) return { ok: false, error: "no_receipt_id" };

  var folder;
  try {
    var main = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var it = main.getFoldersByName(receiptId);
    folder = it.hasNext() ? it.next() : main.createFolder(receiptId);
  } catch (e) {
    return { ok: false, error: "drive_error" };
  }

  if (body.extraFile1 && body.extraFile1.data) saveBase64(folder, "追加1_" + (body.extraFile1.name || "file"), body.extraFile1.data);
  if (body.extraFile2 && body.extraFile2.data) saveBase64(folder, "追加2_" + (body.extraFile2.name || "file"), body.extraFile2.data);
  if (body.extraFile3 && body.extraFile3.data) saveBase64(folder, "追加3_" + (body.extraFile3.name || "file"), body.extraFile3.data);

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB);
  if (sheet) {
    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      if (sheet.getRange(r, 1).getValue() === receiptId) {
        sheet.getRange(r, 17).setValue("追加書類受付済 " + new Date().toISOString());
        break;
      }
    }
  }

  return { ok: true, receiptId: receiptId };
}

function saveBase64(folder, fileName, base64Data) {
  if (!base64Data || base64Data.length > MAX_FILE_BYTES * 1.4) return;
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/octet-stream", fileName);
  folder.createFile(blob);
}

function getExt(name) {
  if (!name) return "jpg";
  var i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "jpg";
}
