/**
 * Google Apps Script Webアプリ
 * 出力先：DRIVE_FOLDER_ID に画像保存、SHEET_ID のスプレッドシート
 * - 登録一覧：仮登録（driver_register / driver_files）
 * - 本登録：本登録（driver_full_register）、公開一覧は status=PUBLIC のみ
 * Script Properties 推奨：LINE_CHANNEL_ACCESS_TOKEN, ADMIN_LINE_USER_ID, ADMIN_EMAIL（任意）
 */

var DRIVE_FOLDER_ID = "ここにDriveフォルダIDを貼る";
var SHEET_ID = "ここにスプレッドシートIDを貼る";
var SHEET_TAB = "登録一覧";
var SHEET_TAB_FULL = "本登録";
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
    } else if (type === "driver_full_register") {
      result = handleDriverFullRegister(body);
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

function doGet(e) {
  var type = (e.parameter && e.parameter.type) || "";
  var callback = (e.parameter && e.parameter.callback) || "";
  var receiptId = (e.parameter && e.parameter.receiptId) || "";

  if (type === "public_drivers") {
    var drivers = getPublicDrivers();
    var json = JSON.stringify({ drivers: drivers });
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + json + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (type === "health") {
    var lineConfigured = false;
    try {
      var token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
      var userId = PropertiesService.getScriptProperties().getProperty("ADMIN_LINE_USER_ID");
      lineConfigured = !!(token && userId);
    } catch (err) {}
    return ContentService.createTextOutput(JSON.stringify({ lineConfigured: lineConfigured }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (type === "line_status" && receiptId && callback) {
    var status = getLineStatusByReceiptId(receiptId);
    var jsonp = callback + "(" + JSON.stringify(status) + ")";
    return ContentService.createTextOutput(jsonp)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  if (type === "set_status") {
    var key = (e.parameter && e.parameter.key) || "";
    var receipt = (e.parameter && e.parameter.receiptId) || "";
    var newStatus = (e.parameter && e.parameter.status) || "";
    var pass = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
    if (!pass || key !== pass || !receipt || !newStatus) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "unauthorized_or_invalid" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var updated = setStatusByReceiptId(receipt, newStatus);
    return ContentService.createTextOutput(JSON.stringify({ ok: updated }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "unknown_type" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setStatusByReceiptId(receiptId, status) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB_FULL);
    if (!sheet) return false;
    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      if (sheet.getRange(r, 1).getValue() === receiptId) {
        sheet.getRange(r, 11).setValue(String(status).trim());
        return true;
      }
    }
  } catch (err) {}
  return false;
}

function getPublicDrivers() {
  var out = [];
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_TAB_FULL);
    if (!sheet) return out;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return out;
    var data = sheet.getRange(2, 1, lastRow, 13).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var status = (row[10] || "").toString().trim().toUpperCase();
      if (status !== "PUBLIC") continue;
      out.push({
        nickname_public: "ドライバー",
        city_public: (row[5] || "").toString().trim(),
        profile: (row[9] || "").toString().trim().slice(0, 500),
        experience: (row[7] || "").toString().trim().slice(0, 300),
        vehicleType: (row[6] || "").toString().trim().slice(0, 100)
      });
    }
  } catch (err) {
    Logger.log("getPublicDrivers: " + err.toString());
  }
  return out;
}

function getLineStatusByReceiptId(receiptId) {
  var out = { linePushed: false, lineError: "" };
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_TAB_FULL);
    if (!sheet) return out;
    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      if (sheet.getRange(r, 1).getValue() === receiptId) {
        var lp = sheet.getRange(r, 12).getValue();
        var le = (sheet.getRange(r, 13).getValue() || "").toString().trim();
        out.linePushed = lp === true || lp === "true" || lp === "TRUE" || lp === 1;
        out.lineError = le;
        break;
      }
    }
  } catch (err) {
    out.lineError = "取得できませんでした";
  }
  return out;
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

function handleDriverFullRegister(body) {
  var receiptId = (body.receiptId || "").toString().trim() || ("DRF-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8));
  var data = body.data || {};
  var publicProfile = data.publicProfile || {};
  var linePushed = false;
  var lineError = "";

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_TAB_FULL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TAB_FULL);
    sheet.getRange(1, 1, 1, 13).setValues([["receiptId", "date", "fullName", "address", "age", "city_public", "vehicle_public", "experience", "tools", "message", "status", "linePushed", "lineError"]]);
  }

  var row = [
    receiptId,
    new Date().toISOString(),
    (data.fullName || "").toString().trim().slice(0, 200),
    (data.address || "").toString().trim().slice(0, 500),
    (data.age || "").toString().trim().slice(0, 20),
    (publicProfile.city || "").toString().trim().slice(0, 100),
    (publicProfile.vehicle || "").toString().trim().slice(0, 100),
    (publicProfile.experience || "").toString().trim().slice(0, 500),
    (publicProfile.tools || "").toString().trim().slice(0, 300),
    (publicProfile.message || "").toString().trim().slice(0, 1000),
    "",
    linePushed,
    lineError
  ];
  sheet.appendRow(row);

  var folder = null;
  try {
    folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (e) {}
  if (folder && body.files) {
    var subFolder = folder.createFolder(receiptId);
    var files = body.files;
    if (files.facePhoto && files.facePhoto.dataUrl) saveDataUrl(subFolder, "顔写真", files.facePhoto);
    if (files.licenseFront && files.licenseFront.dataUrl) saveDataUrl(subFolder, "免許証_表", files.licenseFront);
    if (files.licenseBack && files.licenseBack.dataUrl) saveDataUrl(subFolder, "免許証_裏", files.licenseBack);
    if (files.autoInsurance && files.autoInsurance.dataUrl) saveDataUrl(subFolder, "自賠責証券", files.autoInsurance);
    if (files.cargoInsurance && files.cargoInsurance.dataUrl) saveDataUrl(subFolder, "貨物保険", files.cargoInsurance);
  }

  var lineResult = sendLineNotify(receiptId, (data.fullName || "").toString().trim());
  linePushed = lineResult.pushed;
  lineError = lineResult.error || "";

  var lastRow = sheet.getLastRow();
  if (lastRow >= 1) {
    sheet.getRange(lastRow, 12).setValue(linePushed);
    sheet.getRange(lastRow, 13).setValue(lineError);
  }

  try {
    var adminEmail = PropertiesService.getScriptProperties().getProperty("ADMIN_EMAIL");
    if (adminEmail && (data.fullName || receiptId)) {
      MailApp.sendEmail(adminEmail, "【本登録】" + receiptId, "受付ID: " + receiptId + "\n氏名: " + (data.fullName || "").toString().trim());
    }
  } catch (mailErr) {
    Logger.log("Admin mail: " + mailErr.toString());
  }

  Logger.log("driver_full_register receiptId=" + receiptId + " linePushed=" + linePushed + " lineError=" + lineError);
  return { ok: true, receiptId: receiptId, linePushed: linePushed, lineError: lineError };
}

function saveDataUrl(folder, baseName, fileObj) {
  var dataUrl = (fileObj.dataUrl || "").toString();
  var idx = dataUrl.indexOf(",");
  if (idx < 0) return;
  var base64 = dataUrl.slice(idx + 1);
  if (!base64 || base64.length > MAX_FILE_BYTES * 1.4) return;
  var ext = getExt(fileObj.name || "");
  if (ext === ".pdf") {
    try {
      var blob = Utilities.newBlob(Utilities.base64Decode(base64), "application/pdf", baseName + ext);
      folder.createFile(blob);
    } catch (e) {}
    return;
  }
  saveBase64(folder, baseName + (ext || ".jpg"), base64);
}

function sendLineNotify(receiptId, fullName) {
  var result = { pushed: false, error: "" };
  try {
    var token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
    var userId = PropertiesService.getScriptProperties().getProperty("ADMIN_LINE_USER_ID");
    if (!token || !userId) {
      result.error = "未設定（運営側でLINE_CHANNEL_ACCESS_TOKEN / ADMIN_LINE_USER_ID を設定してください）";
      return result;
    }
    var text = "【本登録】受付ID: " + receiptId + (fullName ? " / " + fullName : "");
    var options = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: userId, messages: [{ type: "text", text: text }] }),
      muteHttpExceptions: true
    };
    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
    var code = resp.getResponseCode();
    Logger.log("LINE push response code: " + code);
    if (code >= 200 && code < 300) {
      result.pushed = true;
    } else {
      result.error = "HTTP " + code;
    }
  } catch (err) {
    result.error = (err.toString() || "送信失敗").slice(0, 80);
    Logger.log("LINE notify error: " + result.error);
  }
  return result;
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
