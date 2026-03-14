/**
 * ==========================================
 * ✅ PASTE TARGET: gas/Code.gs（全文貼り替え）
 * ==========================================
 *
 * Google Apps Script Webアプリ
 * - 仮登録: type=driver_register（Sheetsへ保存 + LINE通知）
 * - 本登録: type=driver_full_register（Sheets/Drive保存 + LINE通知）
 * - 相談（車両）: type=consult_vehicle（お客様相談へ保存 + LINE通知）✅追加
 * - 相談: type=consult_submit（別実装側で対応）※互換のため残す
 * - ふりがな候補: type=furigana（PHONETICで候補生成）
 * - 公開一覧: doGet ?type=public_drivers
 * - 監査ログ: Jobs シートに START/VALIDATE/SHEET/PHOTO/NOTIFY を記録
 *
 * Script Properties（任意/推奨）
 * - SHEET_ID（未設定時は下の SHEET_ID_FALLBACK）
 * - DRIVE_FOLDER_ID（未設定時は下の DRIVE_FOLDER_ID_FALLBACK）
 * - LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCESS_TOKEN
 * - ADMIN_LINE_USER_ID or LINE_TO_USER_ID or LINE_USER_ID
 * - KILL_SWITCH=true で受付停止
 * - MAX_POSTS_PER_MINUTE（既定30）
 * - API_TOKEN（設定した場合のみ必須）
 */

// ======= 固定（公開OKの値をフォールバックに） =======
var SHEET_ID_FALLBACK = "1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8";
var DRIVE_FOLDER_ID_FALLBACK = "1jJeND1RbxHS0rcCUJC116um2VL-UXAiC";

// ======= シート名候補 =======
var SHEET_TAB_CANDIDATES = ["Drivers", "ドライバー名簿"];
var SHEET_TAB_FULL_CANDIDATES = ["FullRegister", "本登録"];
var SHEET_TAB_PUBLIC_CANDIDATES = ["公開ドライバー一覧", "PublicDrivers"];

// ✅お客様相談（車両）シート名（確定：お客様相談）
var SHEET_TAB_CUSTOMER_CONSULT_CANDIDATES = ["お客様相談", "CustomerConsults"];

// ふりがな変換用（内部）
var SHEET_TAB_FURIGANA = "__FURIGANA";

// Jobs
var JOBS_SHEET = "Jobs";

// FullRegister URL列（14列目から）
var FULL_SHEET_URL_HEADERS = [
  "driveFolderUrl",
  "licenseFrontUrl",
  "licenseBackUrl",
  "vehicleFrontUrl",
  "vehicleInspectionUrl",
  "compulsoryInsuranceUrl",
  "voluntaryInsuranceUrl",
  "keiCargoNotificationUrl",
  "cargoInsuranceUrl",
  "debugId",
  "linePushed",
  "lineError",
  "createdAt",
  "updatedAt",
  "status",
  "adminMemo",
  "publicCity",
  "publicMaker",
  "publicModel",
  "publicExperienceYears",
  "publicAppeal",
  "lineUserId",
  "lineDisplayName",
  "linePictureUrl"
];

var FULL_REGISTER_FILE_KEYS = [
  "licenseFront",
  "licenseBack",
  "vehicleFront",
  "vehicleInspection",
  "compulsoryInsurance",
  "voluntaryInsurance",
  "keiCargoNotification",
  "cargoInsurance"
];

var FULL_REGISTER_SAVE_NAMES = {
  licenseFront: "01_免許証_表",
  licenseBack: "02_免許証_裏",
  vehicleFront: "03_黒ナン車両_前面",
  vehicleInspection: "04_車検証",
  compulsoryInsurance: "05_自賠責",
  voluntaryInsurance: "06_任意保険",
  keiCargoNotification: "07_経営届出書_受領印",
  cargoInsurance: "08_貨物保険_任意"
};

function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty("SHEET_ID") || SHEET_ID_FALLBACK;
}

function getDriveFolderId() {
  return PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID") || DRIVE_FOLDER_ID_FALLBACK;
}

function getIntProp_(key, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(key);
    if (v === null || v === undefined || v === "") return fallback;
    var n = parseInt(String(v), 10);
    return isNaN(n) ? fallback : n;
  } catch (e) {
    return fallback;
  }
}

function isKillSwitchOn_() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty("KILL_SWITCH");
    return String(v || "").trim().toLowerCase() === "true";
  } catch (e) {
    return false;
  }
}

function isHoneypotOk_(body) {
  try {
    var hp = (body && body.hp) ? String(body.hp) : "";
    return !hp || !hp.trim();
  } catch (e) {
    return true;
  }
}

function checkRateLimit_() {
  try {
    var limit = getIntProp_("MAX_POSTS_PER_MINUTE", 30);
    var cache = CacheService.getScriptCache();
    var key = "rl:" + new Date().toISOString().slice(0, 16); // minute bucket
    var cur = parseInt(cache.get(key) || "0", 10);
    if (cur >= limit) return { ok: false };
    cache.put(key, String(cur + 1), 90);
    return { ok: true };
  } catch (e) {
    return { ok: true };
  }
}

function isAuthOk_(body) {
  try {
    var required = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
    if (!required) return true; // 未設定なら互換
    var got = (body && body.token) ? String(body.token) : "";
    return got && got === required;
  } catch (e) {
    return true;
  }
}

function getIdemKey_(body) {
  try {
    return (body && (body.idempotency_key || body.idempotencyKey || body.receiptId))
      ? String(body.idempotency_key || body.idempotencyKey || body.receiptId)
      : "";
  } catch (e) {
    return "";
  }
}

function getIdemCacheKey_(type, idemKey) {
  return "idem:" + String(type || "").slice(0, 32) + ":" + String(idemKey || "").slice(0, 120);
}

function getIdemCachedResponse_(key) {
  try {
    var cache = CacheService.getScriptCache();
    var raw = cache.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function putIdemCachedResponse_(key, obj) {
  try {
    var cache = CacheService.getScriptCache();
    cache.put(key, JSON.stringify(obj), 60 * 10); // 10分
  } catch (e) { }
}

// =========================
// ✅ Sheets ユーティリティ
// =========================
function getSheetByAnyName_(ss, candidates) {
  try {
    if (!ss) return null;
    for (var i = 0; i < candidates.length; i++) {
      var n = String(candidates[i] || "").trim();
      if (!n) continue;
      var sh = ss.getSheetByName(n);
      if (sh) return sh;
    }
  } catch (e) { }
  return null;
}

function ensureHeaders_(sheet, headers) {
  try {
    if (!sheet) return;
    headers = headers || [];
    if (headers.length === 0) return;

    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
    var exist = {};
    for (var i = 0; i < row1.length; i++) exist[String(row1[i] || "").trim()] = true;

    var any = false;
    for (var k = 0; k < row1.length; k++) {
      if (String(row1[k] || "").trim()) { any = true; break; }
    }
    if (!any) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      return;
    }

    for (var j = 0; j < headers.length; j++) {
      var h = String(headers[j] || "").trim();
      if (!h) continue;
      if (!exist[h]) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
        exist[h] = true;
      }
    }
  } catch (e) { }
}

function getOrCreateDriversSheet_(ss) {
  var sh = getSheetByAnyName_(ss, SHEET_TAB_CANDIDATES);
  if (sh) return sh;

  var name = SHEET_TAB_CANDIDATES[1] || SHEET_TAB_CANDIDATES[0] || "Drivers";
  sh = ss.insertSheet(name);

  ensureHeaders_(sh, [
    "receiptId",
    "createdAt",
    "fullName",
    "fullNameKana",
    "nickname",
    "city",
    "vehicle",
    "vehicleMaker",
    "vehicleModel",
    "workVehicleStatus",
    "autoInsurance",
    "contactPhone",
    "contactEmail",
    "contactLineName",
    "messageToTake",
    "profile",
    "dispatchHope",
    "ngText"
  ]);
  return sh;
}

function getOrCreateFullSheet_(ss) {
  var sh = getSheetByAnyName_(ss, SHEET_TAB_FULL_CANDIDATES);
  if (sh) return sh;

  var name = SHEET_TAB_FULL_CANDIDATES[1] || SHEET_TAB_FULL_CANDIDATES[0] || "本登録";
  sh = ss.insertSheet(name);

  sh.getRange(1, 1, 1, 13).setValues([[
    "receiptId", "date", "fullName", "address", "age",
    "city_public", "vehicle_public", "experience", "tools", "message",
    "status", "linePushed", "lineError"
  ]]);
  return sh;
}

function getOrCreatePublicSheet_(ss) {
  return getSheetByAnyName_(ss, SHEET_TAB_PUBLIC_CANDIDATES);
}

// ✅お客様相談（車両）シート（無ければ作る）
function getOrCreateCustomerConsultSheet_(ss) {
  var sh = getSheetByAnyName_(ss, SHEET_TAB_CUSTOMER_CONSULT_CANDIDATES);
  if (sh) return sh;

  var name = SHEET_TAB_CUSTOMER_CONSULT_CANDIDATES[0] || "お客様相談";
  sh = ss.insertSheet(name);

  ensureHeaders_(sh, [
    "receiptId",
    "createdAt",
    "type",
    "kind",
    "replyPreference",
    "contactName",
    "contactPhone",
    "postalCode",
    "contactAddress",
    "contactEmail",
    "contactLine",
    "summary",
    "note",
    "payloadJson",
    "sheetRowUrl",
    "debugId"
  ]);
  return sh;
}

// ふりがな変換用シート
function getOrCreateFuriganaSheet_(ss) {
  var sh = ss.getSheetByName(SHEET_TAB_FURIGANA);
  if (!sh) {
    sh = ss.insertSheet(SHEET_TAB_FURIGANA);
    sh.hideSheet();
    sh.getRange(1, 1, 1, 3).setValues([["input", "phonetic", "updatedAt"]]);
  }
  return sh;
}

function kataToHira_(s) {
  s = String(s || "");
  // カタカナ（ァ-ン）→ひらがな（ぁ-ん）
  return s.replace(/[\u30A1-\u30F6]/g, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0x60);
  });
}

function buildFuriganaByPhonetic_(ss, inputText) {
  inputText = String(inputText || "").trim().slice(0, 80);
  if (!inputText) return { ok: false, kana: "", hira: "" };

  var lock = LockService.getScriptLock();
  var locked = false;
  try { locked = lock.tryLock(8000); } catch (e) { locked = false; }

  try {
    var sh = getOrCreateFuriganaSheet_(ss);
    // A2に入力、B2にPHONETIC、C2に更新時刻
    sh.getRange(2, 1).setValue(inputText);
    sh.getRange(2, 2).setFormula("=PHONETIC(A2)");
    sh.getRange(2, 3).setValue(new Date().toISOString());
    SpreadsheetApp.flush();

    var kana = String(sh.getRange(2, 2).getDisplayValue() || "").trim();
    var hira = kataToHira_(kana);

    // 後片付け（次回のゴミ防止）
    sh.getRange(2, 1, 1, 3).clearContent();

    return { ok: true, kana: kana, hira: hira };
  } finally {
    try { if (locked) lock.releaseLock(); } catch (e2) { }
  }
}

// =========================
// Jobs（監査ログ）
// =========================
function getJobsSheet(ss) {
  if (!ss) return null;
  var sheet = ss.getSheetByName(JOBS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(JOBS_SHEET);
    sheet.getRange(1, 1, 1, 7).setValues([["created_at", "source", "url", "status", "drive_file_id", "title", "dc"]]);
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

function buildSheetRowUrl_(spreadsheetId, gid, row) {
  var sid = String(spreadsheetId || "").trim();
  if (!sid) return "";
  var g = (gid === null || gid === undefined) ? "" : String(gid);
  var r = Number(row) || 0;
  if (!g || r <= 0) return "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(sid) + "/edit";
  return "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(sid) + "/edit#gid=" + encodeURIComponent(g) + "&range=A" + encodeURIComponent(String(r));
}

function ensureFullSheetUrlColumns(sheet) {
  if (!sheet) return;
  try {
    var header14 = sheet.getRange(1, 14).getValue();
    if (header14 === "" || header14 == null) {
      sheet.getRange(1, 14, 1, FULL_SHEET_URL_HEADERS.length).setValues([FULL_SHEET_URL_HEADERS]);
    }

    var lastCol = sheet.getLastColumn();
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (v) { return String(v || "").trim(); });
    var exist = {};
    for (var i = 0; i < header.length; i++) exist[header[i]] = true;

    var bankHeaders = ["bankCode", "bankName", "branchCode", "branchName", "accountType", "accountNumber", "accountNameKana", "accountHolder"];
    for (var j = 0; j < bankHeaders.length; j++) {
      var h = bankHeaders[j];
      if (!exist[h]) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
        exist[h] = true;
      }
    }

    var lineHeaders = ["lineUserId", "lineDisplayName", "linePictureUrl"];
    for (var k = 0; k < lineHeaders.length; k++) {
      var lh = lineHeaders[k];
      if (!exist[lh]) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(lh);
        exist[lh] = true;
      }
    }
  } catch (e) { }
}

// =========================
// WebApp entry
// =========================
function doPost(e) {
  var debugId = Utilities.getUuid();
  var result = { ok: false, message: "", debugId: debugId, receiptId: "" };

  if (isKillSwitchOn_()) {
    result.message = "受付停止中（KILL_SWITCH）";
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

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
  result.debugId = debugId;
  result.receiptId = receiptId;

  if (!isHoneypotOk_(body)) {
    result.message = "blocked";
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  var rl = checkRateLimit_();
  if (!rl.ok) {
    result.message = "rate_limited";
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (!isAuthOk_(body)) {
    result.message = "unauthorized";
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (!type) {
    result.message = "missing_type";
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  var idemKey = getIdemKey_(body);
  var idemCacheKey = getIdemCacheKey_(type, idemKey);
  var cached = getIdemCachedResponse_(idemCacheKey);
  if (cached && cached.ok === true) {
    cached.debugId = cached.debugId || debugId;
    cached.receiptId = cached.receiptId || receiptId;

    // ✅ 漏洩防止：過去のキャッシュに残っていても返さない
    try { if (cached.sheetRowUrl) delete cached.sheetRowUrl; } catch (eDel) { }

    return ContentService.createTextOutput(JSON.stringify(cached)).setMimeType(ContentService.MimeType.JSON);
  }

  // ✅ ふりがな候補（ここは軽いので先に処理）
  if (type === "furigana") {
    try {
      var ssF = SpreadsheetApp.openById(getSheetId());
      appendJobLog(ssF, "FURI_START", true, "furigana request", debugId, receiptId, type);

      var t = "";
      if (body && body.text) t = String(body.text || "").trim();
      if (!t) {
        appendJobLog(ssF, "FURI_NG", false, "missing_text", debugId, receiptId, type);
        return ContentService.createTextOutput(JSON.stringify({ ok: false, message: "missing_text" })).setMimeType(ContentService.MimeType.JSON);
      }

      var conv = buildFuriganaByPhonetic_(ssF, t);
      if (!conv.ok) {
        appendJobLog(ssF, "FURI_NG", false, "convert_failed", debugId, receiptId, type);
        return ContentService.createTextOutput(JSON.stringify({ ok: false, message: "convert_failed" })).setMimeType(ContentService.MimeType.JSON);
      }

      appendJobLog(ssF, "FURI_OK", true, conv.kana, debugId, receiptId, type);
      var out = { ok: true, furiganaKana: conv.kana, furiganaHira: conv.hira, debugId: debugId };
      putIdemCachedResponse_(idemCacheKey, out);
      return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
    } catch (eF) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, message: String(eF || "furigana_error").slice(0, 180) })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  var lock = LockService.getScriptLock();
  var locked = false;
  try { locked = lock.tryLock(20000); } catch (e0) { locked = false; }

  try {
    // ✅ 車両相談（お客様相談）を追加
    if (type === "consult_vehicle") {
      var ssC = SpreadsheetApp.openById(getSheetId());
      appendJobLog(ssC, "CONSULT_START", true, "doPost received", debugId, receiptId, type);

      var validateOkC = true;
      var validateReasonC = "";
      if (!body.data) { validateOkC = false; validateReasonC = "missing_data"; }
      appendJobLog(ssC, "CONSULT_VALIDATE", validateOkC, validateReasonC || "ok", debugId, receiptId, type);

      if (!validateOkC) {
        var ng = { ok: false, debugId: debugId, receiptId: receiptId, message: validateReasonC || "validation_failed" };
        return ContentService.createTextOutput(JSON.stringify(ng)).setMimeType(ContentService.MimeType.JSON);
      }

      var rC = handleCustomerConsultVehicle(body, debugId, ssC);
      rC.receiptId = rC.receiptId || receiptId;
      rC.debugId = rC.debugId || debugId;
      rC.message = rC.message || (rC.ok ? "相談を受け付けました" : "エラー");

      // ✅ 漏洩防止：レスポンスに sheetRowUrl を絶対含めない（キー自体出さない）
      var outObjC = { ok: rC.ok, debugId: rC.debugId, receiptId: rC.receiptId, message: rC.message };
      if (outObjC.ok === true) putIdemCachedResponse_(idemCacheKey, outObjC);
      return ContentService.createTextOutput(JSON.stringify(outObjC)).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "driver_full_register") {
      var ss1 = SpreadsheetApp.openById(getSheetId());
      appendJobLog(ss1, "START", true, "doPost received", debugId, receiptId, type);

      var validateOk1 = true;
      var validateReason1 = "";
      if (!body.data) { validateOk1 = false; validateReason1 = "missing_data"; }
      else if (!body.files || typeof body.files !== "object") { validateOk1 = false; validateReason1 = "missing_files"; }
      appendJobLog(ss1, "VALIDATE", validateOk1, validateReason1 || "ok", debugId, receiptId, type);

      if (!validateOk1) {
        result.message = validateReason1 || "validation failed";
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      }

      result = handleDriverFullRegister(body, debugId, ss1);
      result.receiptId = result.receiptId || receiptId;
      result.debugId = result.debugId || debugId;
      result.message = result.message || (result.ok ? "本登録を受け付けました" : "エラー");

      var outObj1 = { ok: result.ok, debugId: result.debugId, receiptId: result.receiptId, message: result.message };
      putIdemCachedResponse_(idemCacheKey, outObj1);
      return ContentService.createTextOutput(JSON.stringify(outObj1)).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "driver_register") {
      result = handleDriverRegister(body, debugId);
    } else if (type === "driver_files") {
      result = handleDriverFiles(body, debugId);
    } else {
      result.message = "unknown_type";
    }

    if (!result.receiptId) result.receiptId = receiptId;
    if (!result.debugId) result.debugId = debugId;

    var outObj2 = { ok: result.ok, debugId: result.debugId, receiptId: result.receiptId || "", message: result.message || "" };
    if (outObj2.ok === true) putIdemCachedResponse_(idemCacheKey, outObj2);
    return ContentService.createTextOutput(JSON.stringify(outObj2)).setMimeType(ContentService.MimeType.JSON);

  } finally {
    try { if (locked) lock.releaseLock(); } catch (e1) { }
  }
}

function doGet(e) {
  var type = (e.parameter && e.parameter.type) || "";
  var callback = (e.parameter && e.parameter.callback) || "";
  var receiptId = (e.parameter && e.parameter.receiptId) || "";

  if (type === "public_drivers") {
    var drivers = getPublicDrivers();
    var json = JSON.stringify({ drivers: drivers });
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === "health") {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || props.getProperty("LINE_ACCESS_TOKEN") || "";
    var userId = props.getProperty("ADMIN_LINE_USER_ID") || props.getProperty("LINE_TO_USER_ID") || props.getProperty("LINE_USER_ID") || "";
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      now: new Date().toISOString(),
      sheetIdSet: !!getSheetId(),
      driveFolderIdSet: !!getDriveFolderId(),
      lineConfigured: !!(token && userId),
      lineTokenSet: !!token,
      lineToSet: !!userId,
      maxPostsPerMinute: getIntProp_("MAX_POSTS_PER_MINUTE", 30)
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (type === "line_status" && receiptId && callback) {
    var status = getLineStatusByReceiptId(receiptId);
    var jsonp = callback + "(" + JSON.stringify(status) + ")";
    return ContentService.createTextOutput(jsonp).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "drivers-site GAS alive" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPublicDrivers() {
  try {
    var ss = SpreadsheetApp.openById(getSheetId());

    var pub = getOrCreatePublicSheet_(ss);
    if (pub) {
      var vals = pub.getDataRange().getValues();
      if (!vals || vals.length < 2) return [];

      var header = vals[0].map(function (x) { return String(x || "").trim(); });
      var idx = {};
      for (var i = 0; i < header.length; i++) idx[header[i]] = i;

      var out = [];
      for (var r = 1; r < vals.length; r++) {
        var row = vals[r];
        var st = "";
        if (idx["status"] != null) st = String(row[idx["status"]] || "").trim().toUpperCase();
        if (st && st !== "PUBLIC") continue;

        out.push({
          nickname: (idx["nickname"] != null) ? String(row[idx["nickname"]] || "").trim() : "",
          prefecture: (idx["prefecture"] != null) ? String(row[idx["prefecture"]] || "").trim() : "",
          city: (idx["city"] != null) ? String(row[idx["city"]] || "").trim() : "",
          maker: (idx["maker"] != null) ? String(row[idx["maker"]] || "").trim() : "",
          model: (idx["model"] != null) ? String(row[idx["model"]] || "").trim() : "",
          experienceYears: (idx["experienceYears"] != null) ? String(row[idx["experienceYears"]] || "").trim() : "",
          appeal: (idx["appeal"] != null) ? String(row[idx["appeal"]] || "").trim() : "",
          updatedAt: (idx["updatedAt"] != null) ? String(row[idx["updatedAt"]] || "").trim() : ""
        });
      }
      return out;
    }

    var drv = getOrCreateDriversSheet_(ss);
    var values = drv.getDataRange().getValues();
    if (!values || values.length < 2) return [];
    var h2 = values[0].map(function (x2) { return String(x2 || "").trim(); });
    var ix = {};
    for (var j = 0; j < h2.length; j++) ix[h2[j]] = j;

    var out2 = [];
    for (var rr = 1; rr < values.length; rr++) {
      var row2 = values[rr];
      out2.push({
        receiptId: (ix["receiptId"] != null) ? row2[ix["receiptId"]] : "",
        createdAt: (ix["createdAt"] != null) ? row2[ix["createdAt"]] : "",
        fullName: (ix["fullName"] != null) ? row2[ix["fullName"]] : "",
        fullNameKana: (ix["fullNameKana"] != null) ? row2[ix["fullNameKana"]] : "",
        nickname: (ix["nickname"] != null) ? row2[ix["nickname"]] : "",
        city: (ix["city"] != null) ? row2[ix["city"]] : "",
        vehicle: (ix["vehicle"] != null) ? row2[ix["vehicle"]] : ""
      });
    }
    return out2;
  } catch (e) {
    return [];
  }
}

function getLineStatusByReceiptId(receiptId) {
  var out = { ok: false, receiptId: receiptId, linePushed: false, lineError: "" };
  try {
    var ss = SpreadsheetApp.openById(getSheetId());
    var sheet = getOrCreateFullSheet_(ss);
    ensureFullSheetUrlColumns(sheet);

    var lastRow = sheet.getLastRow();
    var headerNow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (v) { return String(v || "").trim(); });
    var idx = {};
    for (var c = 0; c < headerNow.length; c++) idx[headerNow[c]] = c + 1;

    for (var r = 2; r <= lastRow; r++) {
      if (String(sheet.getRange(r, 1).getValue() || "").trim() === String(receiptId || "").trim()) {
        out.ok = true;
        if (idx["linePushed"]) out.linePushed = sheet.getRange(r, idx["linePushed"]).getValue() === true;
        if (idx["lineError"]) out.lineError = String(sheet.getRange(r, idx["lineError"]).getValue() || "");
        return out;
      }
    }
  } catch (e) { }
  return out;
}

// =========================
// ✅ 相談（車両）: お客様相談
// =========================
function safeStr_(v, maxLen) {
  var s = (v == null) ? "" : String(v);
  s = s.trim();
  if (maxLen && maxLen > 0) return s.slice(0, maxLen);
  return s;
}

function get_(obj, keys) {
  try {
    if (!obj) return "";
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (obj[k] !== undefined && obj[k] !== null) {
        var v = String(obj[k] || "").trim();
        if (v) return v;
      }
    }
  } catch (e) { }
  return "";
}

function buildVehicleConsultSummary_(data) {
  try {
    data = data || {};
    var kind = get_(data, ["kind", "category", "consultKind", "selectedKind"]);
    if (!kind) {
      if (data.purchaseUse || data.purchaseMaker || data.purchaseModel) kind = "purchase";
      else if (data.repairWhen || data.repairSymptom || data.repairLight) kind = "repair";
      else if (data.shakenWhen || data.shakenType) kind = "shaken";
    }
    var kindJa = (kind === "purchase") ? "車両購入" : (kind === "repair") ? "修理・整備" : (kind === "shaken") ? "車検" : (kind || "不明");

    var parts = [];
    if (data.purchaseMaker || data.purchaseModel) parts.push("メーカー/車種=" + safeStr_((data.purchaseMaker || "") + " " + (data.purchaseModel || ""), 80).trim());
    if (data.purchaseUse) parts.push("用途=" + safeStr_(data.purchaseUse, 50));
    if (data.purchaseBudget) parts.push("予算=" + safeStr_(data.purchaseBudget, 50));
    if (data.purchaseDelivery) parts.push("納期=" + safeStr_(data.purchaseDelivery, 50));

    if (data.repairWhen) parts.push("いつから=" + safeStr_(data.repairWhen, 50));
    if (data.repairLight) parts.push("警告灯=" + safeStr_(data.repairLight, 50));
    if (data.repairIssues && data.repairIssues.join) parts.push("症状=" + safeStr_(data.repairIssues.join("・"), 200));
    if (data.repairSymptom) parts.push("詳細=" + safeStr_(data.repairSymptom, 200));

    if (data.shakenWhen) parts.push("車検時期=" + safeStr_(data.shakenWhen, 50));
    if (data.shakenType) parts.push("希望=" + safeStr_(data.shakenType, 50));
    if (data.shakenNote) parts.push("備考=" + safeStr_(data.shakenNote, 200));

    var note = get_(data, ["note", "memo", "freeNote"]);
    if (note) parts.push("自由記述=" + safeStr_(note, 200));

    return "種類=" + kindJa + (parts.length ? (" / " + parts.join(" / ")) : "");
  } catch (e) {
    return "";
  }
}

function handleCustomerConsultVehicle(body, debugId, ss) {
  debugId = debugId || Utilities.getUuid();
  var type = (body && body.type) ? String(body.type) : "consult_vehicle";
  var receiptId = safeStr_(body && body.receiptId ? body.receiptId : "", 100);
  if (!receiptId) receiptId = "CV-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8);

  if (!ss) ss = SpreadsheetApp.openById(getSheetId());

  var data = (body && body.data) ? body.data : {};
  // 互換：contactがネストなら拾う
  var contact = data && data.contact ? data.contact : data;

  var kind = safeStr_(get_(data, ["kind", "category", "consultKind", "selectedKind"]), 40);
  var replyPreference = safeStr_(get_(data, ["replyPreference", "reply", "contactPreference", "prefer"]), 20);

  var contactName = safeStr_(get_(contact, ["contactName", "name", "fullName"]), 200);
  var contactPhone = safeStr_(get_(contact, ["contactPhone", "phone", "tel"]), 60);
  var postalCode = safeStr_(get_(contact, ["postalCode", "zip"]), 30);
  var contactAddress = safeStr_(get_(contact, ["contactAddress", "address"]), 500);
  var contactEmail = safeStr_(get_(contact, ["contactEmail", "email"]), 200);
  var contactLine = safeStr_(get_(contact, ["contactLine", "line", "lineName", "lineId"]), 200);

  var note = safeStr_(get_(data, ["note", "memo", "freeNote"]), 1000);
  var summary = safeStr_(buildVehicleConsultSummary_(data), 900);

  var payloadJson = "";
  try { payloadJson = JSON.stringify(data).slice(0, 45000); } catch (e) { payloadJson = ""; }

  var sheet = null;
  var sheetRowUrl = "";
  try {
    sheet = getOrCreateCustomerConsultSheet_(ss);

    ensureHeaders_(sheet, [
      "receiptId",
      "createdAt",
      "type",
      "kind",
      "replyPreference",
      "contactName",
      "contactPhone",
      "postalCode",
      "contactAddress",
      "contactEmail",
      "contactLine",
      "summary",
      "note",
      "payloadJson",
      "sheetRowUrl",
      "debugId"
    ]);

    var createdAt = safeStr_(get_(data, ["createdAt"]), 40);
    if (!createdAt) createdAt = new Date().toISOString();

    // まずappend（URLは後で埋める）
    sheet.appendRow([
      receiptId,
      createdAt,
      type,
      kind,
      replyPreference,
      contactName,
      contactPhone,
      postalCode,
      contactAddress,
      contactEmail,
      contactLine,
      summary,
      note,
      payloadJson,
      "",
      debugId
    ]);

    var lastRow = sheet.getLastRow();
    sheetRowUrl = buildSheetRowUrl_(getSheetId(), sheet.getSheetId(), lastRow);

    // sheetRowUrl を行に書き戻す（列探してから）
    try {
      var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (v) { return String(v || "").trim(); });
      var idx = {};
      for (var i = 0; i < header.length; i++) idx[header[i]] = i + 1;
      if (idx["sheetRowUrl"]) sheet.getRange(lastRow, idx["sheetRowUrl"]).setValue(sheetRowUrl);
      if (idx["debugId"]) sheet.getRange(lastRow, idx["debugId"]).setValue(debugId);
    } catch (eIdx) { }

    appendJobLog(ss, "CONSULT_SHEET_OK", true, "row appended", debugId, receiptId, type);
  } catch (err) {
    var errMsg = safeStr_(err && err.toString ? err.toString() : "sheet_write_error", 220);
    appendJobLog(ss, "CONSULT_SHEET_NG", false, errMsg, debugId, receiptId, type);
    return { ok: false, debugId: debugId, receiptId: receiptId, message: errMsg };
  }

  // LINE通知（返信希望がメールでも必ず送る）
  var linePushed = false;
  var lineError = "";
  try {
    var lineRes = sendLineNotifyCustomerConsult(receiptId, {
      kind: kind,
      replyPreference: replyPreference,
      contactName: contactName,
      contactPhone: contactPhone,
      postalCode: postalCode,
      contactAddress: contactAddress,
      contactEmail: contactEmail,
      contactLine: contactLine,
      summary: summary,
      note: note
    }, sheetRowUrl);
    linePushed = lineRes.pushed === true;
    lineError = lineRes.error || "";
  } catch (e2) {
    linePushed = false;
    lineError = safeStr_(e2 && e2.toString ? e2.toString() : "notify_error", 180);
  }
  appendJobLog(ss, linePushed ? "CONSULT_NOTIFY_OK" : "CONSULT_NOTIFY_NG", linePushed, lineError || "", debugId, receiptId, type);

  var msg = linePushed ? "相談を受け付けました（LINE通知OK）" : ("相談を受け付けました（LINE通知NG: " + (lineError || "unknown") + "）");
  return { ok: true, debugId: debugId, receiptId: receiptId, message: msg, sheetRowUrl: sheetRowUrl };
}

// =========================
// 本登録（既存）
// =========================
function handleDriverFullRegister(body, debugId, ss) {
  debugId = debugId || Utilities.getUuid();
  var receiptId = (body.receiptId || "").toString().trim() || ("DRF-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8));
  var data = body.data || {};
  var publicProfile = data.publicProfile || {};
  var linePushed = false;
  var lineError = "";
  var driveFolderUrl = "";
  var type = (body.type || "driver_full_register").toString();

  if (!ss) ss = SpreadsheetApp.openById(getSheetId());

  var sheet = null;
  var sheetRowUrl = "";
  try {
    sheet = getOrCreateFullSheet_(ss);
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

    try {
      sheetRowUrl = buildSheetRowUrl_(getSheetId(), sheet.getSheetId(), sheet.getLastRow());
    } catch (eUrl) {
      sheetRowUrl = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(getSheetId()) + "/edit";
    }
    appendJobLog(ss, "SHEET_OK", true, "row appended", debugId, receiptId, type);
  } catch (err) {
    var errMsg = (err.toString() || "").slice(0, 200);
    Logger.log("[%s] SHEET_WRITE error %s", debugId, errMsg);
    appendJobLog(ss, "SHEET_NG", false, errMsg, debugId, receiptId, type);
    return { ok: false, debugId: debugId, receiptId: receiptId, message: errMsg };
  }

  var folder = null;
  try {
    folder = DriveApp.getFolderById(getDriveFolderId());
  } catch (e2) {
    Logger.log("[%s] DRIVE_FOLDER invalid: %s", debugId, e2.toString());
  }

  if (!folder) {
    appendJobLog(ss, "PHOTO_NG", false, "DRIVE_FOLDER_ID not set or invalid", debugId, receiptId, type);
    lineError = "写真保存スキップ（フォルダ未設定）";
  } else {
    var subFolder = null;
    var safeNameForFiles = "";
    try {
      var meta = getOrCreateReceiptFolder_(folder, receiptId, (data.fullName || "").toString().trim());
      subFolder = meta.folder;
      safeNameForFiles = meta.safeName || "";
      driveFolderUrl = subFolder ? (subFolder.getUrl() || "") : "";
      if (!subFolder) throw new Error("folder_not_found");
    } catch (e3) {
      appendJobLog(ss, "PHOTO_NG", false, "subfolder error: " + (e3.toString() || "").slice(0, 100), debugId, receiptId, type);
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
        var f = saveDataUrl(subFolder, baseName, fileObj, safeNameForFiles);
        if (f) saved++;
      } catch (e4) {
        failedKeys.push(key);
      }
    }
    var photoMsg = "saved=" + saved + (failedKeys.length ? " failed=" + failedKeys.join(",") : "");
    if (failedKeys.length > 0) {
      appendJobLog(ss, "PHOTO_NG", false, photoMsg, debugId, receiptId, type);
      return { ok: false, debugId: debugId, receiptId: receiptId, message: "写真保存に失敗: " + failedKeys.join(",") };
    }
    appendJobLog(ss, "PHOTO_OK", true, photoMsg, debugId, receiptId, type);
  }

  var lineResult = sendLineNotify(receiptId, (data.fullName || "").toString().trim(), sheetRowUrl);
  linePushed = lineResult.pushed;
  lineError = lineResult.error || "";
  appendJobLog(ss, linePushed ? "NOTIFY_OK" : "NOTIFY_NG", linePushed, lineError || "", debugId, receiptId, type);

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    try {
      var headerNow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (v) { return String(v || "").trim(); });
      var idx = {};
      for (var c = 0; c < headerNow.length; c++) idx[headerNow[c]] = c + 1;

      if (idx["linePushed"]) sheet.getRange(lastRow, idx["linePushed"]).setValue(linePushed);
      if (idx["lineError"]) sheet.getRange(lastRow, idx["lineError"]).setValue(lineError);

      if (idx["driveFolderUrl"]) sheet.getRange(lastRow, idx["driveFolderUrl"]).setValue(driveFolderUrl);
      if (idx["debugId"]) sheet.getRange(lastRow, idx["debugId"]).setValue(debugId);

      var bank = data.bank || {};
      if (idx["bankCode"]) sheet.getRange(lastRow, idx["bankCode"]).setValue(String(bank.bankCode || ""));
      if (idx["bankName"]) sheet.getRange(lastRow, idx["bankName"]).setValue(String(bank.bankName || ""));
      if (idx["branchCode"]) sheet.getRange(lastRow, idx["branchCode"]).setValue(String(bank.branchCode || ""));
      if (idx["branchName"]) sheet.getRange(lastRow, idx["branchName"]).setValue(String(bank.branchName || ""));
      if (idx["accountType"]) sheet.getRange(lastRow, idx["accountType"]).setValue(String(bank.accountType || ""));
      if (idx["accountNumber"]) sheet.getRange(lastRow, idx["accountNumber"]).setValue(String(bank.accountNumber || ""));
      if (idx["accountNameKana"]) sheet.getRange(lastRow, idx["accountNameKana"]).setValue(String(bank.accountNameKana || ""));
      if (idx["accountHolder"]) sheet.getRange(lastRow, idx["accountHolder"]).setValue(String(bank.accountHolder || ""));

      var line = data.line || {};
      if (idx["lineUserId"]) sheet.getRange(lastRow, idx["lineUserId"]).setValue(String(line.userId || ""));
      if (idx["lineDisplayName"]) sheet.getRange(lastRow, idx["lineDisplayName"]).setValue(String(line.displayName || ""));
      if (idx["linePictureUrl"]) sheet.getRange(lastRow, idx["linePictureUrl"]).setValue(String(line.pictureUrl || ""));
    } catch (e5) { }
  }

  var message = linePushed ? "本登録を受け付けました" : "本登録を受け付けました（LINE通知は未送信: " + (lineError || "") + "）";
  return { ok: true, debugId: debugId, receiptId: receiptId, message: message };
}

// =========================
// 仮登録（fullName/fullNameKanaを追加対応）
// =========================
function handleDriverRegister(body, debugId) {
  debugId = debugId || Utilities.getUuid();
  var data = body.data || {};
  var receiptId = (body.receiptId || "").toString().trim() || ("DR-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8));

  var ss = SpreadsheetApp.openById(getSheetId());

  var sheet = null;
  var sheetRowUrl = "";
  try {
    sheet = getOrCreateDriversSheet_(ss);

    var vehicleStr = (data.vehicle || "").toString().trim();
    if (!vehicleStr) vehicleStr = ((data.vehicleMaker || "") + " " + (data.vehicleModel || "")).trim();

    ensureHeaders_(sheet, [
      "receiptId",
      "createdAt",
      "fullName",
      "fullNameKana",
      "nickname",
      "city",
      "vehicle",
      "vehicleMaker",
      "vehicleModel",
      "workVehicleStatus",
      "autoInsurance",
      "contactPhone",
      "contactEmail",
      "contactLineName",
      "messageToTake",
      "profile",
      "dispatchHope",
      "ngText"
    ]);

    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (v) { return String(v || "").trim(); });
    var idx = {};
    for (var c = 0; c < header.length; c++) idx[header[c]] = c + 1;

    var newRow = new Array(sheet.getLastColumn());
    for (var i = 0; i < newRow.length; i++) newRow[i] = "";

    function setByKey_(key, val) {
      if (!idx[key]) return;
      newRow[idx[key] - 1] = (val == null) ? "" : String(val);
    }

    setByKey_("receiptId", receiptId);
    setByKey_("createdAt", new Date().toISOString());
    setByKey_("fullName", data.fullName || "");
    setByKey_("fullNameKana", data.fullNameKana || "");
    setByKey_("nickname", data.nickname || "");
    setByKey_("city", data.city || "");
    setByKey_("vehicle", vehicleStr);
    setByKey_("vehicleMaker", data.vehicleMaker || "");
    setByKey_("vehicleModel", data.vehicleModel || "");
    setByKey_("workVehicleStatus", data.workVehicleStatus || "");
    setByKey_("autoInsurance", data.autoInsurance || "");
    setByKey_("contactPhone", data.contactPhone || "");
    setByKey_("contactEmail", data.contactEmail || "");
    setByKey_("contactLineName", data.contactLineName || "");
    setByKey_("messageToTake", data.messageToTake || "");
    setByKey_("profile", data.profile || "");
    setByKey_("dispatchHope", data.dispatchHope || "");
    setByKey_("ngText", data.ngText || "");

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, newRow.length).setValues([newRow]);

    var lastRow = sheet.getLastRow();
    try {
      sheetRowUrl = buildSheetRowUrl_(getSheetId(), sheet.getSheetId(), lastRow);
    } catch (eUrl) {
      sheetRowUrl = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(getSheetId()) + "/edit";
    }

    appendJobLog(ss, "REG_SHEET_OK", true, "row appended", debugId, receiptId, "driver_register");
  } catch (err) {
    var msg = (err && err.toString) ? err.toString().slice(0, 200) : "sheet_write_error";
    appendJobLog(ss, "REG_SHEET_NG", false, msg, debugId, receiptId, "driver_register");
    return { ok: false, step: "SHEET_WRITE", message: msg, debugId: debugId, receiptId: receiptId };
  }

  var linePushed = false;
  var lineError = "";
  try {
    var lineRes = sendLineNotifyRegister(receiptId, data, sheetRowUrl);
    linePushed = lineRes.pushed === true;
    lineError = lineRes.error || "";
  } catch (e2) {
    linePushed = false;
    lineError = (e2 && e2.toString) ? e2.toString().slice(0, 180) : "unknown_error";
  }
  appendJobLog(ss, linePushed ? "REG_NOTIFY_OK" : "REG_NOTIFY_NG", linePushed, lineError || "", debugId, receiptId, "driver_register");

  var msg2 = linePushed ? "登録しました（LINE通知OK）" : ("登録しました（LINE通知NG: " + (lineError || "unknown") + "）");
  return { ok: true, receiptId: receiptId, step: "SHEET_WRITE", message: msg2, debugId: debugId };
}

function handleDriverFiles(body, debugId) {
  debugId = debugId || Utilities.getUuid();
  var receiptId = (body.receiptId || "").toString().trim() || ("RF-" + new Date().getTime() + "-" + Math.random().toString(36).slice(2, 8));
  var files = body.files || {};
  var folder = null;
  try {
    folder = DriveApp.getFolderById(getDriveFolderId());
  } catch (e) {
    Logger.log("[%s] DRIVE_FOLDER invalid: %s", debugId, e.toString());
  }
  if (!folder) {
    return { ok: false, debugId: debugId, receiptId: receiptId, message: "DRIVE_FOLDER_ID not set or invalid" };
  }

  var subFolder = null;
  try {
    var meta = getOrCreateReceiptFolder_(folder, receiptId, (body.fullName || body.nickname || "").toString().trim());
    subFolder = meta.folder;
  } catch (e2) {
    return { ok: false, debugId: debugId, receiptId: receiptId, message: "Drive subfolder error" };
  }

  var saved = 0;
  for (var key in files) {
    if (!files.hasOwnProperty(key)) continue;
    var fileObj = files[key];
    if (!fileObj || !fileObj.dataUrl) continue;
    try {
      var baseName = key;
      var f = saveDataUrl(subFolder, baseName, fileObj, "");
      if (f) saved++;
    } catch (e3) { }
  }
  return { ok: true, debugId: debugId, receiptId: receiptId, message: "files_saved=" + saved };
}

// =========================
// Drive helpers
// =========================
function getOrCreateReceiptFolder_(rootFolder, receiptId, fullName) {
  if (!rootFolder) throw new Error("root_folder_required");
  var rid = String(receiptId || "").trim();
  var name = String(fullName || "").trim();
  var safeName = sanitizeFilename_(name).slice(0, 60);
  var folderName = safeName ? (safeName + "_" + rid) : rid;

  var sub = null;
  try {
    var it = rootFolder.getFoldersByName(folderName);
    sub = it.hasNext() ? it.next() : rootFolder.createFolder(folderName);
  } catch (e) {
    var it2 = rootFolder.getFoldersByName(rid);
    sub = it2.hasNext() ? it2.next() : rootFolder.createFolder(rid);
    folderName = rid;
  }
  return { folder: sub, safeName: safeName, folderName: folderName };
}

function sanitizeFilename_(name) {
  return String(name || "file")
    .replace(/[\\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function saveDataUrl(folder, baseName, fileObj, safeNameForFiles) {
  if (!folder) throw new Error("folder_required");
  if (!fileObj || !fileObj.dataUrl) throw new Error("dataUrl_required");

  var dataUrl = String(fileObj.dataUrl || "");
  var m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("invalid_dataUrl");

  var mime = String(fileObj.type || m[1] || "").trim();
  var b64 = m[2];

  var bytes = Utilities.base64Decode(b64);
  if (bytes.length > (5 * 1024 * 1024)) throw new Error("file_too_large");

  var ext = guessExt(mime, String(fileObj.name || ""));
  var safeBase = sanitizeFilename_(baseName);
  var prefix = safeNameForFiles ? (sanitizeFilename_(safeNameForFiles) + "_") : "";
  var safeName = prefix + safeBase + ext;

  var blob = Utilities.newBlob(bytes, mime, safeName);
  return folder.createFile(blob);
}

function guessExt(mime, name) {
  var n = String(name || "").toLowerCase();
  var allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
  for (var i = 0; i < allowed.length; i++) {
    if (n.endsWith(allowed[i])) return allowed[i];
  }
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/webp") return ".webp";
  return ".bin";
}

// =========================
// LINE notify
// =========================
function sendLineNotifyRegister(receiptId, data, sheetRowUrl) {
  var result = { pushed: false, error: "" };
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || props.getProperty("LINE_ACCESS_TOKEN") || "";
    var userId = props.getProperty("ADMIN_LINE_USER_ID") || props.getProperty("LINE_TO_USER_ID") || props.getProperty("LINE_USER_ID") || "";

    if (!token || !userId) {
      result.error = "未設定（LINE_CHANNEL_ACCESS_TOKEN/LINE_ACCESS_TOKEN と ADMIN_LINE_USER_ID/LINE_TO_USER_ID を設定してください）";
      return result;
    }

    data = data || {};
    var fullName = (data.fullName || "").toString().trim();
    var fullNameKana = (data.fullNameKana || "").toString().trim();
    var nickname = (data.nickname || "").toString().trim();
    var city = (data.city || "").toString().trim();
    var maker = (data.vehicleMaker || "").toString().trim();
    var model = (data.vehicleModel || "").toString().trim();
    var vehicle = (data.vehicle || "").toString().trim() || ((maker + " " + model).trim());
    var black = (data.workVehicleStatus || "").toString().trim();
    var email = (data.contactEmail || "").toString().trim();
    var lineName = (data.contactLineName || "").toString().trim();
    var phone = (data.contactPhone || "").toString().trim();
    var url = String(sheetRowUrl || "").trim();

    var lines = [];
    lines.push("【仮登録】");
    lines.push("受付ID: " + receiptId);
    if (fullName) lines.push("氏名: " + fullName + (fullNameKana ? ("（" + fullNameKana + "）") : ""));
    if (nickname) lines.push("ニックネーム: " + nickname);
    if (city) lines.push("市町村: " + city);
    if (vehicle) lines.push("車種: " + vehicle);
    if (black) lines.push("黒ナンバー: " + black);

    var contactLines = [];
    if (phone) contactLines.push("電話: " + phone);
    if (email) contactLines.push("メール: " + email);
    if (lineName) contactLines.push("LINE表示名: " + lineName);
    if (contactLines.length) {
      lines.push("連絡先:");
      for (var i = 0; i < contactLines.length; i++) lines.push("・" + contactLines[i]);
    }

    if (url) lines.push("確認（ドライバー名簿）: " + url);

    var textMsg = lines.join("\n").slice(0, 4500);

    var options = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: userId, messages: [{ type: "text", text: textMsg }] }),
      muteHttpExceptions: true
    };

    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
    var code = resp.getResponseCode();
    var bodyText = "";
    try { bodyText = (resp.getContentText() || "").toString(); } catch (e2) { }

    if (code >= 200 && code < 300) {
      result.pushed = true;
      result.error = "";
    } else {
      result.error = "HTTP " + code + (bodyText ? (" / " + bodyText.slice(0, 180)) : "");
    }
  } catch (err) {
    result.error = (err.toString() || "送信失敗").slice(0, 180);
  }
  return result;
}

function sendLineNotify(receiptId, fullName, sheetRowUrl) {
  var result = { pushed: false, error: "" };
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || props.getProperty("LINE_ACCESS_TOKEN") || "";
    var userId = props.getProperty("ADMIN_LINE_USER_ID") || props.getProperty("LINE_TO_USER_ID") || props.getProperty("LINE_USER_ID") || "";

    if (!token || !userId) {
      result.error = "未設定（LINE_CHANNEL_ACCESS_TOKEN/LINE_ACCESS_TOKEN と ADMIN_LINE_USER_ID/LINE_TO_USER_ID を設定してください）";
      return result;
    }

    var url = String(sheetRowUrl || "").trim();
    var textMsg = "【本登録】\n" +
      "受付ID: " + receiptId + "\n" +
      "氏名: " + (fullName || "") + "\n" +
      "確認（本登録シート）: " + (url || "（リンク生成に失敗）") + "\n" +
      "※タップで該当行を開きます";

    var options = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: userId, messages: [{ type: "text", text: textMsg }] }),
      muteHttpExceptions: true
    };

    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
    var code = resp.getResponseCode();
    var bodyText = "";
    try { bodyText = (resp.getContentText() || "").toString(); } catch (e2) { }

    if (code >= 200 && code < 300) {
      result.pushed = true;
      result.error = "";
    } else {
      result.error = "HTTP " + code + (bodyText ? (" / " + bodyText.slice(0, 180)) : "");
    }
  } catch (err) {
    result.error = (err.toString() || "送信失敗").slice(0, 180);
  }
  return result;
}

// ✅お客様相談（車両）LINE通知
function sendLineNotifyCustomerConsult(receiptId, data, sheetRowUrl) {
  var result = { pushed: false, error: "" };
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || props.getProperty("LINE_ACCESS_TOKEN") || "";
    var userId = props.getProperty("ADMIN_LINE_USER_ID") || props.getProperty("LINE_TO_USER_ID") || props.getProperty("LINE_USER_ID") || "";

    if (!token || !userId) {
      result.error = "未設定（LINE_CHANNEL_ACCESS_TOKEN/LINE_ACCESS_TOKEN と ADMIN_LINE_USER_ID/LINE_TO_USER_ID を設定してください）";
      return result;
    }

    data = data || {};
    var url = String(sheetRowUrl || "").trim();

    var lines = [];
    lines.push("【お客様相談｜車両】");
    lines.push("受付ID: " + receiptId);

    var kind = safeStr_(data.kind, 40);
    if (kind) lines.push("種類: " + kind);

    var rp = safeStr_(data.replyPreference, 20);
    if (rp) lines.push("返信希望: " + rp);

    var cn = safeStr_(data.contactName, 200);
    if (cn) lines.push("お名前: " + cn);

    var ph = safeStr_(data.contactPhone, 60);
    if (ph) lines.push("電話: " + ph);

    var pc = safeStr_(data.postalCode, 30);
    if (pc) lines.push("郵便: " + pc);

    var ad = safeStr_(data.contactAddress, 500);
    if (ad) lines.push("住所: " + ad);

    var em = safeStr_(data.contactEmail, 200);
    if (em) lines.push("メール: " + em);

    var ln = safeStr_(data.contactLine, 200);
    if (ln) lines.push("LINE: " + ln);

    var sm = safeStr_(data.summary, 900);
    if (sm) lines.push("概要: " + sm);

    var note = safeStr_(data.note, 600);
    if (note) lines.push("備考: " + note);

    if (url) lines.push("確認（お客様相談）: " + url);

    var textMsg = lines.join("\n").slice(0, 4500);

    var options = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + token },
      payload: JSON.stringify({ to: userId, messages: [{ type: "text", text: textMsg }] }),
      muteHttpExceptions: true
    };

    var resp = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
    var code = resp.getResponseCode();
    var bodyText = "";
    try { bodyText = (resp.getContentText() || "").toString(); } catch (e2) { }

    if (code >= 200 && code < 300) {
      result.pushed = true;
      result.error = "";
    } else {
      result.error = "HTTP " + code + (bodyText ? (" / " + bodyText.slice(0, 180)) : "");
    }
  } catch (err) {
    result.error = (err.toString() || "送信失敗").slice(0, 180);
  }
  return result;
}



/**
 * SETUP.gs
 * - 台帳（設定/名簿/公開/Jobs）をコードで必ず作る
 * - ScriptProperties に「スプレッドシートID」を必ず入れる（WebApp安定化）
 */

const SETUP_DEFAULT_SPREADSHEET_ID = '1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8';

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