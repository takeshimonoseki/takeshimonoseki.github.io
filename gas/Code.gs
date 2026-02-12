/**
 * 協力ドライバー登録フォーム用 GAS Webアプリ
 *
 * 【Script Properties で設定すること】（リポジトリに直書き禁止）
 *   プロジェクトの「プロジェクトの設定」→「スクリプト プロパティ」で以下を追加：
 *
 *   DRIVE_FOLDER_ID   - 画像保存先のGoogle DriveフォルダID（Driveでフォルダを開きURLの末尾がID）
 *   SHEET_ID          - スプレッドシートID（スプレッドシートURLの /d/ と /edit の間）
 *   SHEET_TAB         - 登録一覧のシート名（例: 登録一覧）。無い場合は初回実行時に自動作成
 *   LINE_NOTIFY_TOKEN - LINE Notify のトークン（https://notify-bot.line.me/ で発行し「たけ」に通知）
 *   NOTIFY_EMAIL      - たけのメールアドレス（登録通知の送信先）
 *
 * デプロイ: 種類「Web アプリ」／実行ユーザー「自分」／アクセス「全員」
 * デプロイ後のURLを config.js の GAS_ENDPOINT に貼る。
 */

var MAX_FILE_BYTES = 5 * 1024 * 1024;

// 列順固定（一覧表示用に公開/非公開を分離しやすい構成）
var DRIVER_HEADERS = [
  "driver_id",           // 1
  "created_at",         // 2
  "nickname",            // 3 公開
  "city",                // 4 公開
  "vehicle_type",        // 5 公開
  "availability",        // 6 公開
  "specialties",         // 7 公開
  "profile",             // 8 公開
  "fullName",            // 9 非公開
  "address",             // 10 非公開
  "contactPhone",        // 11 非公開
  "contactEmail",        // 12 非公開
  "contactLineName",     // 13 非公開
  "bankName",            // 14 非公開
  "bankBranch",          // 15 非公開
  "bankAccountType",     // 16 非公開
  "bankAccountNumber",   // 17 非公開
  "bankAccountHolder",   // 18 非公開
  "autoInsurance",       // 19
  "cargoInsurance",      // 20
  "insuranceCompany",    // 21
  "insurancePolicyNumber", // 22
  "license_front_url",   // 23
  "license_back_url",    // 24
  "vehicle_inspection_url", // 25 車検証
  "vehicle_photo1_url",  // 26
  "vehicle_photo2_url",  // 27
  "cargo_insurance_file_url", // 28
  "notification_line_status",  // 29
  "notification_email_status", // 30
  "notification_error_message", // 31
  "extra_files_note",    // 32
  "black_plate_pledge",  // 33
  "terms_agreed"        // 34
];

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
    } else if (type === "vehicle_consult") {
      result = handleVehicleConsult(body);
    } else {
      result.error = "unknown_type";
    }
  } catch (err) {
    result.error = "parse_or_runtime";
    result.message = err.toString();
    Logger.log("doPost error: " + err.toString());
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // 将来のドライバー一覧用：公開項目のみJSONで返す（最小実装）
  var result = { ok: false, drivers: [] };
  try {
    var sheet = getDriverSheet();
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      result.ok = true;
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var headers = data[0];
    var driverIdIdx = headers.indexOf("driver_id");
    var nicknameIdx = headers.indexOf("nickname");
    var cityIdx = headers.indexOf("city");
    var vehicleTypeIdx = headers.indexOf("vehicle_type");
    var availabilityIdx = headers.indexOf("availability");
    var specialtiesIdx = headers.indexOf("specialties");
    var profileIdx = headers.indexOf("profile");
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      result.drivers.push({
        driver_id: driverIdIdx >= 0 ? row[driverIdIdx] : "",
        nickname: nicknameIdx >= 0 ? row[nicknameIdx] : "",
        city: cityIdx >= 0 ? row[cityIdx] : "",
        vehicle_type: vehicleTypeIdx >= 0 ? row[vehicleTypeIdx] : "",
        availability: availabilityIdx >= 0 ? (row[availabilityIdx] ? String(row[availabilityIdx]).split(" ") : []) : [],
        specialties: specialtiesIdx >= 0 ? (row[specialtiesIdx] ? String(row[specialtiesIdx]).split(" ") : []) : [],
        profile: profileIdx >= 0 ? row[profileIdx] : ""
      });
    }
    result.ok = true;
  } catch (err) {
    Logger.log("doGet error: " + err.toString());
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getProps() {
  var p = PropertiesService.getScriptProperties();
  return {
    DRIVE_FOLDER_ID: p.getProperty("DRIVE_FOLDER_ID") || "",
    SHEET_ID: p.getProperty("SHEET_ID") || "",
    SHEET_TAB: p.getProperty("SHEET_TAB") || "登録一覧",
    LINE_NOTIFY_TOKEN: p.getProperty("LINE_NOTIFY_TOKEN") || "",
    NOTIFY_EMAIL: p.getProperty("NOTIFY_EMAIL") || ""
  };
}

function getDriverSheet() {
  var props = getProps();
  if (!props.SHEET_ID) return null;
  try {
    var spreadsheet = SpreadsheetApp.openById(props.SHEET_ID);
    var sheet = spreadsheet.getSheetByName(props.SHEET_TAB);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(props.SHEET_TAB);
      sheet.getRange(1, 1, 1, DRIVER_HEADERS.length).setValues([DRIVER_HEADERS]);
      sheet.getRange(1, 1, 1, DRIVER_HEADERS.length).setFontWeight("bold");
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, DRIVER_HEADERS.length).setValues([DRIVER_HEADERS]);
      sheet.getRange(1, 1, 1, DRIVER_HEADERS.length).setFontWeight("bold");
    }
    return sheet;
  } catch (e) {
    Logger.log("getDriverSheet: " + e.toString());
    return null;
  }
}

function handleDriverRegister(body) {
  var data = body.data || {};
  var props = getProps();
  var sheet = getDriverSheet();
  if (!sheet) return { ok: false, error: "sheet_not_found", message: "スプレッドシートの設定を確認してください。" };

  var driverId = "D" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8);
  var createdAt = new Date().toISOString();

  var licenseFrontUrl = "";
  var licenseBackUrl = "";
  var vehicleInspectionUrl = "";
  var vehiclePhoto1Url = "";
  var vehiclePhoto2Url = "";
  var cargoInsuranceFileUrl = "";

  var folder = null;
  if (props.DRIVE_FOLDER_ID) {
    try {
      folder = DriveApp.getFolderById(props.DRIVE_FOLDER_ID);
    } catch (e) {}
  }

  if (folder && body.licenseFront && body.licenseFront.data) {
    var subFolder;
    try {
      subFolder = folder.createFolder(driverId);
    } catch (e) {
      subFolder = folder;
    }
    if (body.licenseFront && body.licenseFront.data) {
      var f = saveBase64ReturnFile(subFolder, "免許証_表.jpg", body.licenseFront.data);
      if (f) licenseFrontUrl = f.getUrl();
    }
    if (body.licenseBack && body.licenseBack.data) {
      f = saveBase64ReturnFile(subFolder, "免許証_裏.jpg", body.licenseBack.data);
      if (f) licenseBackUrl = f.getUrl();
    }
    if (body.vehicleInspection && body.vehicleInspection.data) {
      f = saveBase64ReturnFile(subFolder, "車検証." + getExt(body.vehicleInspection.name || "jpg"), body.vehicleInspection.data);
      if (f) vehicleInspectionUrl = f.getUrl();
    }
    if (body.vehiclePhoto1 && body.vehiclePhoto1.data) {
      f = saveBase64ReturnFile(subFolder, "車両1.jpg", body.vehiclePhoto1.data);
      if (f) vehiclePhoto1Url = f.getUrl();
    }
    if (body.vehiclePhoto2 && body.vehiclePhoto2.data) {
      f = saveBase64ReturnFile(subFolder, "車両2.jpg", body.vehiclePhoto2.data);
      if (f) vehiclePhoto2Url = f.getUrl();
    }
    if (body.autoInsuranceFile && body.autoInsuranceFile.data) {
      saveBase64(subFolder, "自賠責証券." + getExt(body.autoInsuranceFile.name), body.autoInsuranceFile.data);
    }
    if (body.cargoInsuranceFile && body.cargoInsuranceFile.data) {
      f = saveBase64ReturnFile(subFolder, "貨物保険." + getExt(body.cargoInsuranceFile.name), body.cargoInsuranceFile.data);
      if (f) cargoInsuranceFileUrl = f.getUrl();
    }
  }

  var lineStatus = "";
  var emailStatus = "";
  var errMsg = "";

  var row = [
    driverId,
    createdAt,
    data.nickname || "",
    data.city || "",
    data.vehicle_type || data.vehicle || "",
    data.availability ? (Array.isArray(data.availability) ? data.availability.join(" ") : data.availability) : "",
    data.specialties ? (Array.isArray(data.specialties) ? data.specialties.join(" ") : data.specialties) : "",
    (data.profile || "").slice(0, 1000),
    data.fullName || (data.lastName + " " + data.firstName) || "",
    data.address || "",
    data.contactPhone || "",
    data.contactEmail || "",
    data.contactLineName || "",
    data.bankName || "",
    data.bankBranch || "",
    data.bankAccountType || "",
    data.bankAccountNumber || "",
    data.bankAccountHolder || "",
    data.autoInsurance || "",
    data.cargoInsurance || "",
    data.insuranceCompany || "",
    data.insurancePolicyNumber || "",
    licenseFrontUrl,
    licenseBackUrl,
    vehicleInspectionUrl,
    vehiclePhoto1Url,
    vehiclePhoto2Url,
    cargoInsuranceFileUrl,
    lineStatus,
    emailStatus,
    errMsg,
    "",
    data.black_plate_pledge ? "1" : "0",
    data.terms_agreed ? "1" : "0"
  ];

  sheet.appendRow(row);

  // 通知（失敗しても登録は成功扱い）
  var summary = "【新規登録】" + (data.nickname || "") + " / " + (data.city || "") + " / " + (data.vehicle_type || data.vehicle || "") + " / ID:" + driverId;
  var detail = "ニックネーム: " + (data.nickname || "") + "\n市町村: " + (data.city || "") + "\n車種: " + (data.vehicle_type || data.vehicle || "") + "\n連絡先: " + (data.contactPhone || data.contactEmail || data.contactLineName || "—") + "\n受付ID: " + driverId;

  if (props.LINE_NOTIFY_TOKEN) {
    try {
      UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
        method: "post",
        headers: { "Authorization": "Bearer " + props.LINE_NOTIFY_TOKEN },
        payload: { "message": summary + "\n\n" + detail }
      });
      lineStatus = "ok";
    } catch (lineErr) {
      lineStatus = "failed";
      errMsg = (errMsg ? errMsg + "; " : "") + "LINE:" + lineErr.toString();
      Logger.log("LINE Notify error: " + lineErr.toString());
    }
  } else {
    lineStatus = "not_configured";
  }

  if (props.NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: props.NOTIFY_EMAIL,
        subject: "協力ドライバー新規登録: " + (data.nickname || driverId),
        body: detail + "\n\n--\n登録フォームから送信されました。"
      });
      emailStatus = "ok";
    } catch (mailErr) {
      emailStatus = "failed";
      errMsg = (errMsg ? errMsg + "; " : "") + "Mail:" + mailErr.toString();
      Logger.log("Mail error: " + mailErr.toString());
    }
  } else {
    emailStatus = "not_configured";
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    sheet.getRange(lastRow, 29).setValue(lineStatus);
    sheet.getRange(lastRow, 30).setValue(emailStatus);
    sheet.getRange(lastRow, 31).setValue(errMsg);
  }

  return { ok: true, receiptId: driverId, driver_id: driverId };
}

function handleDriverFiles(body) {
  var receiptId = body.receiptId || body.driver_id;
  if (!receiptId) return { ok: false, error: "no_receipt_id" };

  var props = getProps();
  var folder;
  try {
    var main = DriveApp.getFolderById(props.DRIVE_FOLDER_ID);
    var it = main.getFoldersByName(receiptId);
    folder = it.hasNext() ? it.next() : main.createFolder(receiptId);
  } catch (e) {
    return { ok: false, error: "drive_error" };
  }

  if (body.extraFile1 && body.extraFile1.data) saveBase64(folder, "追加1_" + (body.extraFile1.name || "file"), body.extraFile1.data);
  if (body.extraFile2 && body.extraFile2.data) saveBase64(folder, "追加2_" + (body.extraFile2.name || "file"), body.extraFile2.data);
  if (body.extraFile3 && body.extraFile3.data) saveBase64(folder, "追加3_" + (body.extraFile3.name || "file"), body.extraFile3.data);

  var sheet = getDriverSheet();
  if (sheet) {
    var lastRow = sheet.getLastRow();
    for (var r = 1; r <= lastRow; r++) {
      if (sheet.getRange(r, 1).getValue() === receiptId) {
        sheet.getRange(r, 32).setValue("追加書類受付済 " + new Date().toISOString());
        break;
      }
    }
  }

  return { ok: true, receiptId: receiptId };
}

function handleVehicleConsult(body) {
  var data = body.data || {};
  var props = getProps();
  if (!props.SHEET_ID) return { ok: false, error: "sheet_not_found" };
  var spreadsheet = SpreadsheetApp.openById(props.SHEET_ID);
  var sheet = spreadsheet.getSheetByName("車両相談");
  if (!sheet) sheet = spreadsheet.insertSheet("車両相談");
  var consultId = "V" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8);
  var row = [consultId, new Date().toISOString(), data.use || "", data.budget || "", data.maker || "", data.model || "", data.remark || "", data.delivery || "", data.contact || ""];
  sheet.appendRow(row);
  return { ok: true, receiptId: consultId };
}

function saveBase64(folder, fileName, base64Data) {
  if (!base64Data || base64Data.length > MAX_FILE_BYTES * 1.4) return;
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/octet-stream", fileName);
  folder.createFile(blob);
}

function saveBase64ReturnFile(folder, fileName, base64Data) {
  if (!base64Data || base64Data.length > MAX_FILE_BYTES * 1.4) return null;
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "application/octet-stream", fileName);
  return folder.createFile(blob);
}

function getExt(name) {
  if (!name) return "jpg";
  var i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "jpg";
}
