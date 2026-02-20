/**
 * Google Apps Script Webアプリ
 * 出力先：Script Properties の DRIVE_FOLDER_ID / SHEET_ID（未設定時は下記定数フォールバック）
 * - 登録一覧：仮登録（driver_register / driver_files）
 * - 本登録：本登録（driver_full_register）、Jobs シートに START→VALIDATE→SHEET_*→PHOTO_*→NOTIFY_*
 * Script Properties：DRIVE_FOLDER_ID, SHEET_ID, LINE_CHANNEL_ACCESS_TOKEN, ADMIN_LINE_USER_ID, ADMIN_EMAIL（任意）
 */

var DRIVE_FOLDER_ID = "ここにDriveフォルダIDを貼る";
var SHEET_ID = "ここにスプレッドシートIDを貼る";
var SHEET_TAB = "登録一覧";
var SHEET_TAB_FULL = "本登録";
var JOBS_SHEET_NAME = "Jobs";
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
var ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];

function getDriveFolderId() {
  return PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID") || DRIVE_FOLDER_ID;
}
function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty("SHEET_ID") || SHEET_ID;
}

function getJobsSheet(ss) {
  if (!ss) return null;
  var sheet = ss.getSheetByName(JOBS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(JOBS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 7).setValues([["timestamp", "stage", "ok", "message", "debugId", "receiptId", "type"]]);
  }
  return sheet;
}

function appendJobLog(ss, stage, ok, message, debugId, receiptId, type) {
  try {
    var sheet = getJobsSheet(ss);
    if (!sheet) return;
    sheet.appendRow([
      new Date().toISOString(),
      String(stage),
      ok === true ? "TRUE" : "FALSE",
      (message || "").toString().slice(0, 500),
      (debugId || "").toString().slice(0, 100),
      (receiptId || "").toString().slice(0, 100),
      (type || "").toString().slice(0, 50)
    ]);
  } catch (err) {
    Logger.log("appendJobLog error: " + err.toString());
  }
}

function doPost(e) {
  var debugId = Utilities.getUuid();
  var result = { ok: false, message: "", debugId: debugId, receiptId: "" };
  var raw = (e.postData && e.postData.contents) ? e.postData.contents : "";
  var body = null;
  try {
    body = JSON.parse(raw);
  } catch (parseErr) {
    result.message = ("parse_error: " + (parseErr.toString() || "")).slice(0, 200);
    Logger.log("[%s] doPost parse error %s", debugId, result.message);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  var type = (body && body.type) ? body.type : "";
  var receiptId = (body && body.receiptId) ? String(body.receiptId).trim() : "";
  if (body && body.debugId) debugId = String(body.debugId).trim() || debugId;

  if (type === "driver_full_register") {
    var ss = null;
    try {
      ss = SpreadsheetApp.openById(getSheetId());
    } catch (ssErr) {
      result.message = "SHEET_ID invalid or not set";
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    appendJobLog(ss, "START", true, "doPost received", debugId, receiptId, type);

    var validateOk = true;
    var validateReason = "";
    if (!body.data) { validateOk = false; validateReason = "missing_data"; }
    else if (!body.files || typeof body.files !== "object") { validateOk = false; validateReason = "missing_files"; }
    appendJobLog(ss, "VALIDATE", validateOk, validateReason || "ok", debugId, receiptId, type);

    if (!validateOk) {
      result.receiptId = receiptId;
      result.message = validateReason || "validation failed";
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    result = handleDriverFullRegister(body, debugId, ss);
    result.receiptId = result.receiptId || receiptId;
    result.debugId = result.debugId || debugId;
    result.message = result.message || (result.ok ? "本登録を受け付けました" : "エラー");
    return ContentService.createTextOutput(JSON.stringify({ ok: result.ok, debugId: result.debugId, receiptId: result.receiptId, message: result.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (type === "driver_register") {
    result = handleDriverRegister(body, debugId);
  } else if (type === "driver_files") {
    result = handleDriverFiles(body, debugId);
  } else {
    result.message = type ? "unknown_type" : "missing_type";
  }
  if (!result.receiptId) result.receiptId = receiptId;
  if (!result.debugId) result.debugId = debugId;
  return ContentService.createTextOutput(JSON.stringify({ ok: result.ok, debugId: result.debugId, receiptId: result.receiptId || "", message: result.message || "" }))
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
    var sheet = SpreadsheetApp.openById(getSheetId()).getSheetByName(SHEET_TAB_FULL);
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
    var ss = SpreadsheetApp.openById(getSheetId());
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
    var ss = SpreadsheetApp.openById(getSheetId());
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

function handleDriverRegister(body, debugId) {
  debugId = debugId || Utilities.getUuid();
  var data = body.data || {};
  var receiptId = "R" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8);
  try {
    var sheet = SpreadsheetApp.openById(getSheetId()).getSheetByName(SHEET_TAB);
    if (!sheet) {
      Logger.log("[%s] driver_register SHEET_WRITE sheet_not_found", debugId);
      return { ok: false, step: "SHEET_WRITE", message: "sheet_not_found", debugId: debugId };
    }
    var vehicleStr = data.vehicle || ((data.vehicleMaker || "") + " " + (data.vehicleModel || "")).trim() || "";
    var row = [
      receiptId,
      new Date().toISOString(),
      data.nickname || "",
      data.fullName || (data.lastName + " " + data.firstName) || "",
      data.address || "",
      data.city || "",
      vehicleStr,
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
    Logger.log("[%s] driver_register SHEET_WRITE ok receiptId=%s", debugId, receiptId);
  } catch (err) {
    Logger.log("[%s] driver_register SHEET_WRITE error %s", debugId, err.toString());
    return { ok: false, step: "SHEET_WRITE", message: err.toString().slice(0, 200), debugId: debugId };
  }
  var folder = null;
  try {
    folder = DriveApp.getFolderById(getDriveFolderId());
  } catch (e) {}
  if (folder && body.licenseFront && body.licenseFront.data) {
    try {
      var subFolder = folder.createFolder(receiptId);
      saveBase64(subFolder, "免許証_表.jpg", body.licenseFront.data);
      if (body.licenseBack && body.licenseBack.data) saveBase64(subFolder, "免許証_裏.jpg", body.licenseBack.data);
      if (body.vehiclePhoto1 && body.vehiclePhoto1.data) saveBase64(subFolder, "車両1.jpg", body.vehiclePhoto1.data);
      if (body.vehiclePhoto2 && body.vehiclePhoto2.data) saveBase64(subFolder, "車両2.jpg", body.vehiclePhoto2.data);
      if (body.autoInsuranceFile && body.autoInsuranceFile.data) saveBase64(subFolder, "自賠責証券." + getExt(body.autoInsuranceFile.name), body.autoInsuranceFile.data);
      if (body.cargoInsuranceFile && body.cargoInsuranceFile.data) saveBase64(subFolder, "貨物保険." + getExt(body.cargoInsuranceFile.name), body.cargoInsuranceFile.data);
    } catch (photoErr) {
      Logger.log("[%s] driver_register PHOTO_SAVE error %s", debugId, photoErr.toString());
      return { ok: true, receiptId: receiptId, step: "PHOTO_SAVE", message: photoErr.toString().slice(0, 200), debugId: debugId };
    }
  }
  return { ok: true, receiptId: receiptId, step: "SHEET_WRITE", message: "登録しました", debugId: debugId };
}

function handleDriverFiles(body, debugId) {
  debugId = debugId || Utilities.getUuid();
  var receiptId = body.receiptId;
  if (!receiptId) return { ok: false, step: "VALIDATE", message: "no_receipt_id", debugId: debugId };

  var folder;
  try {
    var main = DriveApp.getFolderById(getDriveFolderId());
    var it = main.getFoldersByName(receiptId);
    folder = it.hasNext() ? it.next() : main.createFolder(receiptId);
  } catch (e) {
    Logger.log("[%s] driver_files PHOTO_SAVE drive_error %s", debugId, e.toString());
    return { ok: false, step: "PHOTO_SAVE", message: "drive_error: " + e.toString().slice(0, 100), debugId: debugId };
  }

  if (body.extraFile1 && body.extraFile1.data) saveBase64(folder, "追加1_" + (body.extraFile1.name || "file"), body.extraFile1.data);
  if (body.extraFile2 && body.extraFile2.data) saveBase64(folder, "追加2_" + (body.extraFile2.name || "file"), body.extraFile2.data);
  if (body.extraFile3 && body.extraFile3.data) saveBase64(folder, "追加3_" + (body.extraFile3.name || "file"), body.extraFile3.data);

  try {
    var sheet = SpreadsheetApp.openById(getSheetId()).getSheetByName(SHEET_TAB);
    if (sheet) {
      var lastRow = sheet.getLastRow();
      for (var r = 1; r <= lastRow; r++) {
        if (sheet.getRange(r, 1).getValue() === receiptId) {
          sheet.getRange(r, 17).setValue("追加書類受付済 " + new Date().toISOString());
          break;
        }
      }
    }
  } catch (err) {
    Logger.log("[%s] driver_files SHEET_WRITE error %s", debugId, err.toString());
    return { ok: false, step: "SHEET_WRITE", message: err.toString().slice(0, 200), debugId: debugId };
  }
  return { ok: true, receiptId: receiptId, step: "PHOTO_SAVE", message: "受付済", debugId: debugId };
}

var FULL_SHEET_URL_HEADERS = ["driveFolderUrl", "licenseFrontUrl", "licenseBackUrl", "vehicleFrontUrl", "vehicleInspectionUrl", "compulsoryInsuranceUrl", "voluntaryInsuranceUrl", "keiCargoNotificationUrl", "bankAccountProofUrl", "cargoInsuranceUrl"];

function ensureFullSheetUrlColumns(sheet) {
  if (!sheet) return;
  try {
    var header14 = sheet.getRange(1, 14).getValue();
    if (header14 === "" || header14 == null) {
      sheet.getRange(1, 14, 1, 23).setValues([FULL_SHEET_URL_HEADERS]);
    }
  } catch (e) {}
}

var FULL_REGISTER_FILE_KEYS = ["licenseFront", "licenseBack", "vehicleFront", "vehicleInspection", "compulsoryInsurance", "voluntaryInsurance", "keiCargoNotification", "bankAccountProof", "cargoInsurance"];
var FULL_REGISTER_SAVE_NAMES = { licenseFront: "免許証_表", licenseBack: "免許証_裏", vehicleFront: "車両前面", vehicleInspection: "車検証", compulsoryInsurance: "自賠責", voluntaryInsurance: "任意保険", keiCargoNotification: "経営届出書", bankAccountProof: "振込先口座", cargoInsurance: "貨物保険" };

function handleDriverFullRegister(body, debugId, ss) {
  debugId = debugId || Utilities.getUuid();
  var receiptId = (body.receiptId || "").toString().trim() || ("DRF-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8));
  var data = body.data || {};
  var publicProfile = data.publicProfile || {};
  var linePushed = false;
  var lineError = "";
  var driveFolderUrl = "";
  var type = (body.type || "driver_full_register").toString();

  if (!ss) {
    try { ss = SpreadsheetApp.openById(getSheetId()); } catch (e) {}
  }

  var sheet = null;
  try {
    sheet = ss.getSheetByName(SHEET_TAB_FULL);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_TAB_FULL);
      sheet.getRange(1, 1, 1, 13).setValues([["receiptId", "date", "fullName", "address", "age", "city_public", "vehicle_public", "experience", "tools", "message", "status", "linePushed", "lineError"]]);
    }
    ensureFullSheetUrlColumns(sheet);
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
    if (ss) appendJobLog(ss, "SHEET_OK", true, "row appended", debugId, receiptId, type);
  } catch (err) {
    var errMsg = (err.toString() || "").slice(0, 200);
    Logger.log("[%s] SHEET_WRITE error %s", debugId, errMsg);
    if (ss) appendJobLog(ss, "SHEET_NG", false, errMsg, debugId, receiptId, type);
    return { ok: false, debugId: debugId, receiptId: receiptId, message: errMsg };
  }

  var folder = null;
  try {
    folder = DriveApp.getFolderById(getDriveFolderId());
  } catch (e) {
    Logger.log("[%s] DRIVE_FOLDER invalid: %s", debugId, e.toString());
  }

  if (!folder) {
    if (ss) appendJobLog(ss, "PHOTO_NG", false, "DRIVE_FOLDER_ID not set or invalid", debugId, receiptId, type);
    lineError = "写真保存スキップ（フォルダ未設定）";
  } else {
    var subFolder = null;
    try {
      var it = folder.getFoldersByName(receiptId);
      subFolder = it.hasNext() ? it.next() : folder.createFolder(receiptId);
      driveFolderUrl = subFolder.getUrl() || "";
    } catch (e) {
      if (ss) appendJobLog(ss, "PHOTO_NG", false, "subfolder error: " + (e.toString() || "").slice(0, 100), debugId, receiptId, type);
      return { ok: false, debugId: debugId, receiptId: receiptId, message: "Drive subfolder error" };
    }

    var files = body.files || {};
    var saved = 0;
    var failedKeys = [];
    for (var i = 0; i < FULL_REGISTER_FILE_KEYS.length; i++) {
      var key = FULL_REGISTER_FILE_KEYS[i];
      var fileObj = files[key];
      if (!fileObj || !fileObj.dataUrl) continue;
      var baseName = FULL_REGISTER_SAVE_NAMES[key] || key;
      try {
        var f = saveDataUrl(subFolder, baseName, fileObj);
        if (f) saved++;
      } catch (e) {
        failedKeys.push(key);
      }
    }
    var photoMsg = "saved=" + saved + (failedKeys.length ? " failed=" + failedKeys.join(",") : "");
    if (failedKeys.length > 0) {
      if (ss) appendJobLog(ss, "PHOTO_NG", false, photoMsg, debugId, receiptId, type);
      return { ok: false, debugId: debugId, receiptId: receiptId, message: "写真保存に失敗: " + failedKeys.join(",") };
    }
    if (ss) appendJobLog(ss, "PHOTO_OK", true, photoMsg, debugId, receiptId, type);
  }

  var lineResult = sendLineNotify(receiptId, (data.fullName || "").toString().trim());
  linePushed = lineResult.pushed;
  lineError = lineResult.error || "";
  if (ss) appendJobLog(ss, linePushed ? "NOTIFY_OK" : "NOTIFY_NG", linePushed, lineError || "", debugId, receiptId, type);

  var lastRow = sheet.getLastRow();
  if (lastRow >= 1) {
    try {
      sheet.getRange(lastRow, 12).setValue(linePushed);
      sheet.getRange(lastRow, 13).setValue(lineError);
      sheet.getRange(lastRow, 14).setValue(driveFolderUrl);
    } catch (updateErr) {
      Logger.log("[%s] SHEET update URLs error %s", debugId, updateErr.toString());
    }
  }

  try {
    var adminEmail = PropertiesService.getScriptProperties().getProperty("ADMIN_EMAIL");
    if (adminEmail && (data.fullName || receiptId)) {
      MailApp.sendEmail(adminEmail, "【本登録】" + receiptId, "受付ID: " + receiptId + "\n氏名: " + (data.fullName || "").toString().trim());
    }
  } catch (mailErr) {
    Logger.log("[%s] Admin mail: %s", debugId, mailErr.toString());
  }

  var message = linePushed ? "本登録を受け付けました" : "本登録を受け付けました（LINE通知は未送信: " + (lineError || "") + "）";
  return { ok: true, debugId: debugId, receiptId: receiptId, message: message };
}

function saveDataUrl(folder, baseName, fileObj) {
  var dataUrl = (fileObj.dataUrl || "").toString();
  var idx = dataUrl.indexOf(",");
  if (idx < 0) return null;
  var base64 = dataUrl.slice(idx + 1);
  if (!base64 || base64.length > MAX_FILE_BYTES * 1.4) return null;
  var ext = getExt(fileObj.name || "");
  if (ext === ".pdf") {
    try {
      var blob = Utilities.newBlob(Utilities.base64Decode(base64), "application/pdf", baseName + ext);
      return folder.createFile(blob);
    } catch (e) { return null; }
  }
  return saveBase64(folder, baseName + (ext || ".jpg"), base64);
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
  if (!base64Data || base64Data.length > MAX_FILE_BYTES * 1.4) return null;
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/octet-stream", fileName);
  return folder.createFile(blob);
}

function getExt(name) {
  if (!name) return "jpg";
  var i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "jpg";
}
