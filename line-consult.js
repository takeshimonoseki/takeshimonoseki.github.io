// FILE: line-consult.js（全文）
// 各相談セクション内の選択項目 + 備考を集めて、LINEに下書き入りで開く

(function () {
  "use strict";

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function cssEscapeSafe(s) {
    s = String(s || "");
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(s);
    // 超簡易エスケープ（id/name程度に使う）
    return s.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function getLabelText(el, scope) {
    if (!el) return "";
    var id = el.id ? String(el.id) : "";
    if (id) {
      var lb = (scope || document).querySelector('label[for="' + cssEscapeSafe(id) + '"]');
      if (lb) return (lb.textContent || "").trim();
    }
    var prev = el.previousElementSibling;
    if (prev && prev.tagName === "LABEL") return (prev.textContent || "").trim();
    return "";
  }

  function normalizeOaId(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    if (s[0] !== "@") s = "@" + s;
    // NOTE: oaMessage のパスは「@」を含む文字列のままの方が安定（%40 だと環境によって失敗する）
    return s;
  }

  function buildMessage(sectionEl, title) {
    var lines = [];
    var t = String(title || "").trim();
    if (!t) {
      var h = sectionEl ? sectionEl.querySelector("h2,h3,.vehicle-card-title,.consult-title") : null;
      t = h ? (h.textContent || "").trim() : "相談";
    }

    lines.push("【" + t + "】");
    lines.push("ページ: " + (location.pathname || "/"));

    // select
    $all("select", sectionEl).forEach(function (sel) {
      var v = (sel.value == null ? "" : String(sel.value)).trim();
      if (!v) return;
      var label = getLabelText(sel, sectionEl) || sel.name || sel.id || "項目";
      lines.push(label + ": " + v);
    });

    // text/number/email/tel
    $all('input[type="text"],input[type="number"],input[type="email"],input[type="tel"]', sectionEl).forEach(function (inp) {
      var v = (inp.value == null ? "" : String(inp.value)).trim();
      if (!v) return;
      var label = getLabelText(inp, sectionEl) || inp.name || inp.id || "入力";
      lines.push(label + ": " + v);
    });

    // checkbox/radio
    var checked = $all('input[type="checkbox"]:checked, input[type="radio"]:checked', sectionEl);
    var groups = {};
    checked.forEach(function (inp) {
      var name = (inp.name || inp.id || "選択");
      if (!groups[name]) groups[name] = [];
      var lb = "";
      if (inp.id) {
        var l = sectionEl.querySelector('label[for="' + cssEscapeSafe(inp.id) + '"]');
        lb = l ? (l.textContent || "").trim() : "";
      }
      groups[name].push(lb || (inp.value || "選択"));
    });
    Object.keys(groups).forEach(function (k) {
      var label = k;
      var any = sectionEl.querySelector('[name="' + cssEscapeSafe(k) + '"]');
      if (any) {
        var fs = any.closest("fieldset");
        var lg = fs ? fs.querySelector("legend") : null;
        if (lg && (lg.textContent || "").trim()) label = (lg.textContent || "").trim();
      }
      lines.push(label + ": " + groups[k].join("・"));
    });

    // note textarea
    var noteEl = sectionEl ? sectionEl.querySelector("textarea.js-line-note, textarea[data-line-note]") : null;
    var note = noteEl ? String(noteEl.value || "").trim() : "";
    if (note) {
      lines.push("備考:");
      lines.push(note);
    }

    if (lines.length <= 2) {
      lines.push("（未選択）");
      lines.push("備考に状況を書いて送ってください。");
    }

    return lines.join("\n").slice(0, 5000);
  }

  function openLineWithText(text) {
    var msg = encodeURIComponent(String(text || "").slice(0, 5000));

    var oa = (window.CONFIG && (window.CONFIG.LINE_OA_ID || window.CONFIG.LINE_OA)) ? (window.CONFIG.LINE_OA_ID || window.CONFIG.LINE_OA) : "";
    var oaEnc = normalizeOaId(oa);

    // ✅ 公式アカウント宛て（最優先）
    if (oaEnc) {
      var isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent || "");
      var base = isMobile ? "line://oaMessage/" : "https://line.me/R/oaMessage/";
      location.href = base + oaEnc + "/?" + msg;
      return;
    }

    // 要件指定のURLスキーム（宛先は端末側の選択/直近トークに依存する可能性あり）
    location.href = "https://line.me/R/msg/text/?" + msg;
  }

  function onClick(e) {
    var btn = e.currentTarget;
    if (!btn) return;
    e.preventDefault();

    var section =
      btn.closest("section") ||
      btn.closest(".card") ||
      btn.closest(".vehicle-card") ||
      btn.closest(".consult-card") ||
      document;

    var title = btn.getAttribute("data-line-title") || "";
    var text = buildMessage(section, title);
    openLineWithText(text);
  }

  function boot() {
    $all(".js-line-send").forEach(function (el) {
      el.addEventListener("click", onClick);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
