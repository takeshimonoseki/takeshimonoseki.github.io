(function () {
    "use strict";
  
    var statusEl, tbodyEl, updatedEl, emptyBoxEl, areaEl, textEl, reloadBtn;
  
    function qs(id) { return document.getElementById(id); }
  
    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }
  
    function escapeHtml(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  
    function fmtUpdatedAt(iso) {
      if (!iso) return "-";
      try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleString("ja-JP");
      } catch (e) {
        return iso;
      }
    }
  
    function getEndpoint() {
      var C = window.CONFIG || {};
      return (C.GAS_WEBAPP_URL || C.GAS_ENDPOINT || "").trim();
    }
  
    function buildUrl(action) {
      var ep = getEndpoint();
      if (!ep) return "";
      var sep = ep.indexOf("?") >= 0 ? "&" : "?";
      return ep + sep + "action=" + encodeURIComponent(action) + "&_=" + Date.now();
    }
  
    function normalizeDrivers(data) {
      var arr = (data && data.drivers) ? data.drivers : [];
      if (!Array.isArray(arr)) return [];
      return arr.map(function (d) {
        d = d || {};
        return {
          public_name: d.public_name || d.name || d.publicName || "",
          public_area: d.public_area || d.area || "",
          public_vehicle: d.public_vehicle || d.vehicle || "",
          availability: d.availability || d.time || "",
          public_note: d.public_note || d.note || ""
        };
      });
    }
  
    function applyFilter(list) {
      var area = (areaEl && areaEl.value) ? areaEl.value.trim() : "";
      var q = (textEl && textEl.value) ? textEl.value.trim() : "";
      if (!area && !q) return list;
  
      var qq = q.toLowerCase();
      return list.filter(function (d) {
        if (area && String(d.public_area || "") !== area) return false;
        if (!qq) return true;
        var hay = (d.public_name + " " + d.public_area + " " + d.public_vehicle + " " + d.availability + " " + d.public_note).toLowerCase();
        return hay.indexOf(qq) >= 0;
      });
    }
  
    function renderTable(list) {
      if (!tbodyEl) return;
      tbodyEl.innerHTML = "";
  
      if (!list || list.length === 0) {
        if (emptyBoxEl) emptyBoxEl.classList.remove("hidden");
        return;
      }
      if (emptyBoxEl) emptyBoxEl.classList.add("hidden");
  
      list.forEach(function (d) {
        var tr = document.createElement("tr");
        tr.className = "border-b border-white/5 hover:bg-white/[0.03] transition-colors";
        tr.innerHTML =
          "<td class='py-3 pr-3 font-bold'>" + escapeHtml(d.public_name || "（未設定）") + "</td>" +
          "<td class='py-3 pr-3'>" + escapeHtml(d.public_area || "-") + "</td>" +
          "<td class='py-3 pr-3'>" + escapeHtml(d.public_vehicle || "-") + "</td>" +
          "<td class='py-3 pr-3'>" + escapeHtml(d.availability || "-") + "</td>" +
          "<td class='py-3'>" + escapeHtml(d.public_note || "") + "</td>";
        tbodyEl.appendChild(tr);
      });
    }
  
    function renderFromData(data) {
      if (!data || data.ok !== true) {
        setStatus("読み込み失敗：GASの返事が変です（ok:trueになってない）");
        renderTable([]);
        return;
      }
  
      if (updatedEl) updatedEl.textContent = fmtUpdatedAt(data.updated_at || data.updatedAt || "");
  
      var list = normalizeDrivers(data);
      var filtered = applyFilter(list);
  
      setStatus("表示件数： " + filtered.length + " 件（元データ " + list.length + " 件）");
      renderTable(filtered);
  
      if (list.length === 0) {
        setStatus("公開ドライバー0人です（承認＋同意の人がまだいません）");
      }
    }
  
    // まず fetch（CORSが通れば一番簡単）
    function loadByFetch(url) {
      return fetch(url, { method: "GET", cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (data) { renderFromData(data); return true; })
        .catch(function () { return false; });
    }
  
    // fetchが読めない時の保険：JSONP（GAS側が callback 対応していれば動く）
    function loadByJsonp(url) {
      return new Promise(function (resolve) {
        var cbName = "__renderPublicDrivers_" + Date.now();
        var done = false;
  
        window[cbName] = function (data) {
          done = true;
          try { renderFromData(data); } catch (e) {}
          cleanup();
          resolve(true);
        };
  
        function cleanup() {
          try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
          if (script && script.parentNode) script.parentNode.removeChild(script);
        }
  
        var script = document.createElement("script");
        script.async = true;
  
        // callback を付与
        var src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "callback=" + encodeURIComponent(cbName);
        script.src = src;
  
        // callback未対応（=JSONがそのまま返る）だと呼ばれないのでタイムアウトで判定
        var timer = setTimeout(function () {
          if (done) return;
          cleanup();
          setStatus("読み込み失敗：GAS側が callback(JSONP) 未対応の可能性。Code.gsに callback 対応を入れてください。");
          renderTable([]);
          resolve(false);
        }, 8000);
  
        script.onerror = function () {
          clearTimeout(timer);
          cleanup();
          setStatus("読み込み失敗：ネットワーク/URLを確認してください");
          renderTable([]);
          resolve(false);
        };
  
        document.head.appendChild(script);
      });
    }
  
    function loadAll() {
      var url = buildUrl("publicDrivers");
      if (!url) {
        setStatus("設定エラー：config.js の GAS_WEBAPP_URL が空です");
        return;
      }
  
      setStatus("読み込み中…");
      if (tbodyEl) tbodyEl.innerHTML = "";
      if (emptyBoxEl) emptyBoxEl.classList.add("hidden");
  
      loadByFetch(url).then(function (ok) {
        if (ok) return;
        // fetchで読めなかったらJSONPへ
        return loadByJsonp(url);
      });
    }
  
    function boot() {
      statusEl = qs("status");
      tbodyEl = qs("driversTbody");
      updatedEl = qs("updatedAt");
      emptyBoxEl = qs("emptyBox");
      areaEl = qs("filterArea");
      textEl = qs("filterText");
      reloadBtn = qs("btnReload");
  
      if (areaEl) areaEl.addEventListener("change", loadAll);
      if (textEl) textEl.addEventListener("input", function () {
        // 入力中は再取得せず、今あるデータでフィルタしたいが、まずは簡単に再取得でOK
        loadAll();
      });
      if (reloadBtn) reloadBtn.addEventListener("click", loadAll);
  
      loadAll();
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  })();
  