/* ==========================
   drivers-site form sender
   ========================== */

// TODO: あなたのGAS WebApp URLに差し替え
const GAS_ENDPOINT = "REPLACE_WITH_YOUR_GAS_WEBAPP_URL";

// 画像/ファイルの目安（クライアント側の軽い制限）
const MAX_FILE_MB = 8;

const $ = (sel, root = document) => root.querySelector(sel);

function setStatus(form, kind, message) {
  const el = $("#status", form);
  if (!el) return;
  el.classList.remove("ok", "ng", "show");
  el.classList.add("show");
  if (kind === "ok") el.classList.add("ok");
  if (kind === "ng") el.classList.add("ng");
  el.textContent = message;
}

function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function requireAnyContact(email, lineDisplayName) {
  const a = (email || "").trim();
  const b = (lineDisplayName || "").trim();
  return a.length > 0 || b.length > 0;
}

function getValue(form, name) {
  const el = form.elements[name];
  return el ? String(el.value || "").trim() : "";
}

function getFile(form, name) {
  const el = form.elements[name];
  if (!el || !el.files || !el.files[0]) return null;
  return el.files[0];
}

function disableSubmit(form, disabled) {
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = disabled;
}

async function buildFilesPayload(fileMap) {
  const files = {};
  for (const [key, file] of Object.entries(fileMap)) {
    if (!file) continue;
    const sizeMB = bytesToMB(file.size);
    if (sizeMB > MAX_FILE_MB) {
      throw new Error(`${key} のファイルが大きすぎます（${sizeMB.toFixed(1)}MB）。${MAX_FILE_MB}MB以内にしてください。`);
    }
    const dataUrl = await fileToDataUrl(file);
    files[key] = {
      name: file.name,
      type: file.type || "application/octet-stream",
      dataUrl
    };
  }
  return files;
}

/**
 * 送信（CORS対応が弱い環境向けに2段構え）
 * - 1回目：CORSでJSON
 * - 失敗：no-cors + text/plain でJSON文字列（GAS側は e.postData.contents で読める想定）
 */
async function postToGas(payload) {
  if (!GAS_ENDPOINT || GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_GAS_WEBAPP_URL")) {
    throw new Error("GAS_ENDPOINT が未設定です。/assets/app.js の先頭を差し替えてください。");
  }

  // 1) CORS + JSON
  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    // GASの実装次第で 200以外もあるので、ここは軽めに判定
    if (res && (res.ok || res.status === 0)) return { ok: true, method: "cors" };
    // レスポンスは読めない場合もあるので、失敗扱いでフォールバックへ
  } catch (e) {
    // fallthrough
  }

  // 2) no-cors + text/plain（プリフライト回避）
  try {
    await fetch(GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return { ok: true, method: "no-cors" };
  } catch (e) {
    return { ok: false, method: "failed", error: e };
  }
}

async function handleRegister(form) {
  const nickname = getValue(form, "nickname");
  const city = getValue(form, "city");
  const email = getValue(form, "email");
  const lineDisplayName = getValue(form, "lineDisplayName");
  const agree = !!form.elements["agree"]?.checked;

  const autoInsuranceFile = getFile(form, "autoInsurance");

  if (!nickname) throw new Error("ニックネーム（公開）は必須です。");
  if (!city) throw new Error("市町村（公開）は必須です。");
  if (!requireAnyContact(email, lineDisplayName)) throw new Error("連絡先は「メール or LINE表示名」のどちらかが必須です。");
  if (!autoInsuranceFile) throw new Error("任意保険（自動車保険）証券写真が必須です。");
  if (!agree) throw new Error("同意チェックが必要です。");

  const optional = {
    profile: getValue(form, "profile"),
    dispatchPreference: getValue(form, "dispatchPreference"),
    ngConditions: getValue(form, "ngConditions"),
    messageToOps: getValue(form, "messageToOps")
  };

  const files = await buildFilesPayload({ autoInsurance: autoInsuranceFile });

  return {
    type: "driver_register",
    submittedAt: new Date().toISOString(),
    public: { nickname, city },
    contact: { email, lineDisplayName },
    optional,
    files
  };
}

async function handleFullRegister(form) {
  const fullName = getValue(form, "fullName");
  const age = getValue(form, "age");
  const address = getValue(form, "address");
  const agree = !!form.elements["agree"]?.checked;

  const facePhoto = getFile(form, "facePhoto");
  const licenseFront = getFile(form, "licenseFront");
  const licenseBack = getFile(form, "licenseBack");
  const autoInsurance = getFile(form, "autoInsurance");
  const cargoInsurance = getFile(form, "cargoInsurance");

  const publicCity = getValue(form, "publicCity");
  const vehicle = getValue(form, "vehicle");
  const experience = getValue(form, "experience");
  const oneWord = getValue(form, "oneWord");
  const toolsAffiliation = getValue(form, "toolsAffiliation");

  if (!fullName) throw new Error("氏名は必須です。");
  if (!age) throw new Error("年齢は必須です。");
  if (!address) throw new Error("住所は必須です。");
  if (!facePhoto) throw new Error("顔写真は必須です。");
  if (!licenseFront) throw new Error("免許証（表）は必須です。");
  if (!licenseBack) throw new Error("免許証（裏）は必須です。");
  if (!autoInsurance) throw new Error("任意保険（自動車保険）証券写真は必須です。");

  if (!publicCity) throw new Error("市町村（公開）は必須です。");
  if (!vehicle) throw new Error("車種（公開）は必須です。");
  if (!agree) throw new Error("同意チェックが必要です。");

  const files = await buildFilesPayload({
    facePhoto,
    licenseFront,
    licenseBack,
    autoInsurance,
    ...(cargoInsurance ? { cargoInsurance } : {})
  });

  return {
    type: "driver_full_register",
    submittedAt: new Date().toISOString(),
    identity: { fullName, age, address },
    publicProfile: { city: publicCity, vehicle, experience, oneWord, toolsAffiliation },
    files
  };
}

function wireUpForm(form) {
  const formType = form.getAttribute("data-form-type");
  if (!formType) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    disableSubmit(form, true);
    setStatus(form, "", "送信中…");

    try {
      const payload =
        formType === "driver_register" ? await handleRegister(form)
        : formType === "driver_full_register" ? await handleFullRegister(form)
        : null;

      if (!payload) throw new Error("フォーム種別が不明です。");

      const result = await postToGas(payload);
      if (!result.ok) throw new Error("送信に失敗しました（通信エラー）。GAS側の受信設定も確認してください。");

      // no-cors時は結果が読めないので、送信実行のみ案内
      if (result.method === "no-cors") {
        setStatus(form, "ok", "送信しました（ブラウザの制限で送信結果の確認はできません）。運営からの連絡をお待ちください。");
      } else {
        setStatus(form, "ok", "送信しました。運営からの連絡をお待ちください。");
      }

      form.reset();
    } catch (err) {
      const msg = (err && err.message) ? err.message : "不明なエラー";
      setStatus(form, "ng", msg);
    } finally {
      disableSubmit(form, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[data-form-type]");
  forms.forEach(wireUpForm);
});
