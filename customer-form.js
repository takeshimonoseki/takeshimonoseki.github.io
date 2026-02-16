/**
 * customer-form.js
 * お客様用配送依頼フォームのバリデーション・送信・LINE フォールバック
 */
(function () {
  "use strict";

  /* ── DOM参照 ── */
  var form              = document.getElementById("customerForm");
  if (!form) return; // フォームが無いページではスキップ

  var nameEl            = document.getElementById("custName");
  var phoneEl           = document.getElementById("custPhone");
  var emailEl           = document.getElementById("custEmail");
  var lineIdEl          = document.getElementById("custLineId");
  var pickupEl          = document.getElementById("custPickup");
  var dropoffEl         = document.getElementById("custDropoff");
  var deliveryTypeEl    = document.getElementById("custDeliveryType");
  var preferredDateEl   = document.getElementById("custPreferredDate");
  var notesEl           = document.getElementById("custNotes");
  var agreeEl           = document.getElementById("custAgree");
  var submitBtn         = document.getElementById("custSubmitBtn");
  var submitHintEl      = document.getElementById("custSubmitHint");

  var errorBox          = document.getElementById("custErrorBox");
  var errorListEl       = document.getElementById("custErrorList");
  var networkErrorBox   = document.getElementById("custNetworkError");
  var btnLineFallback   = document.getElementById("custLineFallback");
  var successBox        = document.getElementById("custSuccessBox");
  var receiptIdEl       = document.getElementById("custReceiptId");
  var summaryListEl     = document.getElementById("custSummaryList");
  var btnReset          = document.getElementById("custResetBtn");

  var hasTriedSubmit = false;
  var lastReceiptId  = "";

  /* ── ユーティリティ ── */
  function clearValidation() {
    document.querySelectorAll(".is-invalid").forEach(function (el) {
      el.classList.remove("is-invalid");
      try { el.removeAttribute("aria-invalid"); } catch (_) {}
    });
    document.querySelectorAll(".field-error-text").forEach(function (el) { el.remove(); });
  }

  function markInvalid(el, msg) {
    if (!el) return;
    el.classList.add("is-invalid");
    el.setAttribute("aria-invalid", "true");
    if (msg) {
      var div = document.createElement("div");
      div.className = "field-error-text";
      div.textContent = msg;
      el.insertAdjacentElement("afterend", div);
    }
  }

  /* ── バリデーション & ペイロード構築 ── */
  function buildPayload(paint) {
    var errors = [];
    var firstInvalid = null;
    function setFirst(el) { if (!firstInvalid && el) firstInvalid = el; }

    var customerName = (nameEl.value || "").trim();
    if (!customerName) {
      errors.push("お名前を入力してください。");
      if (paint) { markInvalid(nameEl, "必須です"); setFirst(nameEl); }
    }

    var phone   = (phoneEl.value || "").trim();
    var email   = (emailEl.value || "").trim();
    var lineId  = (lineIdEl.value || "").trim();
    if (!phone && !email && !lineId) {
      errors.push("連絡先（電話 / メール / LINE ID）のどれか1つを入力してください。");
      if (paint) {
        markInvalid(phoneEl);
        markInvalid(emailEl);
        markInvalid(lineIdEl, "どれか1つ必須");
        setFirst(phoneEl);
      }
    }

    var pickup  = (pickupEl.value || "").trim();
    if (!pickup) {
      errors.push("集荷場所を入力してください。");
      if (paint) { markInvalid(pickupEl, "必須です"); setFirst(pickupEl); }
    }

    var dropoff = (dropoffEl.value || "").trim();
    if (!dropoff) {
      errors.push("届け先を入力してください。");
      if (paint) { markInvalid(dropoffEl, "必須です"); setFirst(dropoffEl); }
    }

    if (agreeEl && !agreeEl.checked) {
      errors.push("同意にチェックを入れてください。");
      if (paint) { markInvalid(agreeEl, "必須です"); setFirst(agreeEl); }
    }

    var payload = {
      customerName:  customerName,
      phone:         phone,
      email:         email,
      lineId:        lineId,
      pickupLocation:  pickup,
      dropoffLocation: dropoff,
      deliveryType:  deliveryTypeEl ? (deliveryTypeEl.value || "") : "",
      preferredDate: preferredDateEl ? (preferredDateEl.value || "") : "",
      notes:         notesEl ? (notesEl.value || "").trim() : "",
      userAgent:     navigator.userAgent || "",
      source:        "customer-site",
      createdAt:     new Date().toISOString()
    };
    var fareEl = document.getElementById("fareEstimatePayload");
    if (fareEl && fareEl.value) {
      try {
        payload.fareEstimate = typeof fareEl.value === "string" ? fareEl.value : JSON.stringify(fareEl.value);
      } catch (_) {}
    }

    return { payload: payload, errors: errors, firstInvalidEl: firstInvalid };
  }

  function validateAndPaint() {
    clearValidation();
    buildPayload(true);
  }

  /* ── 送信ヒント（リアルタイム） ── */
  function updateHint() {
    if (!submitHintEl) return;
    var missing = [];
    if (!(nameEl.value || "").trim()) missing.push("お名前");
    var hasContact = (phoneEl.value || "").trim() || (emailEl.value || "").trim() || (lineIdEl.value || "").trim();
    if (!hasContact) missing.push("連絡先");
    if (!(pickupEl.value || "").trim()) missing.push("集荷場所");
    if (!(dropoffEl.value || "").trim()) missing.push("届け先");
    if (agreeEl && !agreeEl.checked) missing.push("同意チェック");

    if (missing.length === 0) {
      submitHintEl.textContent = "入力OK — 送信できます";
      if (submitBtn) { submitBtn.classList.remove("is-disabled"); submitBtn.setAttribute("aria-disabled", "false"); }
    } else {
      submitHintEl.textContent = "未入力: " + missing.join(" / ");
      if (submitBtn) { submitBtn.classList.add("is-disabled"); submitBtn.setAttribute("aria-disabled", "true"); }
    }
  }

  /* ── イベント: リアルタイムヒント ── */
  var watchEls = [nameEl, phoneEl, emailEl, lineIdEl, pickupEl, dropoffEl, agreeEl];
  ["input", "change"].forEach(function (ev) {
    watchEls.forEach(function (el) {
      if (el) el.addEventListener(ev, function () { updateHint(); if (hasTriedSubmit) validateAndPaint(); });
    });
  });
  updateHint();

  /* ── 受付番号生成 ── */
  function makeReceiptId() {
    var ts = Date.now().toString(36);
    var r  = Math.floor(Math.random() * 1e6).toString(36).padStart(4, "0");
    return "CR-" + ts + "-" + r;
  }

  /* ── LINE テキスト構築 ── */
  function buildLineText(receiptId, p) {
    var lines = [];
    lines.push("【配送依頼】");
    lines.push("受付番号: " + receiptId);
    lines.push("お名前: " + (p.customerName || ""));
    if (p.phone)  lines.push("電話: " + p.phone);
    if (p.email)  lines.push("メール: " + p.email);
    if (p.lineId) lines.push("LINE ID: " + p.lineId);
    lines.push("集荷場所: " + (p.pickupLocation || ""));
    lines.push("届け先: " + (p.dropoffLocation || ""));
    if (p.deliveryType)  lines.push("配送区分: " + p.deliveryType);
    if (p.preferredDate) lines.push("希望日時: " + p.preferredDate);
    if (p.notes) lines.push("備考: " + p.notes);
    return lines.join("\n").slice(0, 4500);
  }

  /* ── LINE で送る ── */
  function openLineWithText(text) {
    var C  = window.CONFIG || {};
    var oa = (C.LINE_OA_ID || "").trim();
    var msg = encodeURIComponent(String(text || "").slice(0, 5000));
    if (oa) {
      if (oa[0] !== "@") oa = "@" + oa;
      var isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent || "");
      var base = isMobile ? "line://oaMessage/" : "https://line.me/R/oaMessage/";
      location.href = base + oa + "/?" + msg;
      return;
    }
    location.href = "https://line.me/R/msg/text/?" + msg;
  }

  /* ── 確認サマリー表示 ── */
  function renderSummary(payload) {
    if (!summaryListEl) return;
    summaryListEl.innerHTML = "";
    var items = [
      "お名前: " + payload.customerName,
      "電話: " + (payload.phone || "—"),
      "メール: " + (payload.email || "—"),
      "LINE ID: " + (payload.lineId || "—"),
      "集荷場所: " + payload.pickupLocation,
      "届け先: " + payload.dropoffLocation
    ];
    if (payload.deliveryType)  items.push("配送区分: " + payload.deliveryType);
    if (payload.preferredDate) items.push("希望日時: " + payload.preferredDate);
    if (payload.notes) items.push("備考: " + payload.notes);

    items.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      summaryListEl.appendChild(li);
    });
  }

  /* ── フォーム送信 ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hasTriedSubmit = true;
    clearValidation();

    if (errorBox)        errorBox.style.display = "none";
    if (errorListEl)     errorListEl.innerHTML  = "";
    if (networkErrorBox) networkErrorBox.style.display = "none";
    if (successBox)      successBox.style.display = "none";

    var result = buildPayload(true);

    if (result.errors.length > 0) {
      result.errors.forEach(function (msg) {
        var li = document.createElement("li");
        li.textContent = msg;
        if (errorListEl) errorListEl.appendChild(li);
      });
      if (errorBox) errorBox.style.display = "";
      var target = result.firstInvalidEl || errorBox;
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "center" });
      try { (result.firstInvalidEl || nameEl).focus({ preventScroll: true }); } catch (_) {}
      return;
    }

    var endpoint = (window.CONFIG && window.CONFIG.GAS_ENDPOINT) || "";
    if (!endpoint || endpoint === "あとで貼る") {
      if (networkErrorBox) { networkErrorBox.style.display = ""; networkErrorBox.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return;
    }

    lastReceiptId = makeReceiptId();
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "送信中…"; }

    var bodyObj = { type: "customer_request", receiptId: lastReceiptId, data: result.payload };

    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(bodyObj)
    }).then(function () {
      if (receiptIdEl) receiptIdEl.textContent = lastReceiptId;
      renderSummary(result.payload);
      if (successBox) { successBox.style.display = ""; successBox.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }).catch(function () {
      if (networkErrorBox) { networkErrorBox.style.display = ""; networkErrorBox.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }).finally(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "配送を依頼する"; }
      updateHint();
    });
  });

  /* ── LINE フォールバック ── */
  if (btnLineFallback) {
    btnLineFallback.addEventListener("click", function () {
      var result = buildPayload(false);
      var rid = lastReceiptId || makeReceiptId();
      var text = buildLineText(rid, result.payload || {});
      openLineWithText(text);
    });
  }

  /* ── リセット ── */
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      form.reset();
      clearValidation();
      if (errorBox)        errorBox.style.display = "none";
      if (networkErrorBox) networkErrorBox.style.display = "none";
      if (successBox)      successBox.style.display = "none";
      lastReceiptId = "";
      hasTriedSubmit = false;
      updateHint();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
