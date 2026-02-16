/**
 * app.js — お客様用HP: 見積計算機（メインHP同様・運ぶ・移動）
 * 計算式はメインホームページ index.html から移植。距離取得は Google API オプション。
 */
(function () {
  "use strict";

  var PRICE = {
    travelFreeKm: 20,
    travelStepKm: 5,
    travelStepYen: 550,
    haulBaseFee: 3300,
    shoppingBaseFee: 2200,
    carSupportBaseFee: 3300,
    stairsPerFloor: 1100,
    extraLaborPerHour: 2200
  };

  function z2h(str) {
    if (str == null) return "";
    return String(str)
      .replace(/[０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); })
      .replace(/[．。]/g, ".")
      .replace(/[ー−―]/g, "-")
      .trim();
  }
  function num(v, fallback) {
    if (fallback === undefined) fallback = 0;
    var n = parseFloat(z2h(v));
    return Number.isFinite(n) ? n : fallback;
  }
  function int(v, fallback) {
    if (fallback === undefined) fallback = 0;
    var n = parseInt(z2h(v), 10);
    return Number.isFinite(n) ? n : fallback;
  }
  function yen(n) {
    return Math.floor(n).toLocaleString() + "円";
  }
  function roundToHalfHourHours(x) {
    var v = Math.max(0, Number(x) || 0);
    return Math.round(v * 2) / 2;
  }

  function calcTravelFee(distanceKm) {
    var km = Math.max(0, num(distanceKm, 0));
    if (km <= PRICE.travelFreeKm) {
      return { fee: 0, note: PRICE.travelFreeKm + "km圏内：無料" };
    }
    var over = km - PRICE.travelFreeKm;
    var steps = Math.ceil(over / PRICE.travelStepKm);
    var fee = steps * PRICE.travelStepYen;
    return { fee: fee, note: "超過 " + over.toFixed(1) + "km → " + steps + "段（" + PRICE.travelStepKm + "kmごと）" };
  }

  function calcStairsFee(floor, hasElev) {
    var f = Math.max(1, int(floor, 1));
    if (hasElev) return 0;
    return Math.max(0, f - 1) * PRICE.stairsPerFloor;
  }

  function makeReservationId(prefix) {
    var d = new Date();
    var y = d.getFullYear();
    var mo = ("0" + (d.getMonth() + 1)).slice(-2);
    var da = ("0" + d.getDate()).slice(-2);
    var hh = ("0" + d.getHours()).slice(-2);
    var mm = ("0" + d.getMinutes()).slice(-2);
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "TK-" + y + mo + da + "-" + hh + mm + "-" + prefix + "-" + rand;
  }

  function buildDrivingCopy(p) {
    var id = makeReservationId("drive");
    var lines = [];
    lines.push("【見積｜運ぶ・移動｜軽貨物TAKE】");
    lines.push("予約ID：" + id);
    lines.push("サービス：" + (p.serviceLabel || ""));
    lines.push("車両台数：" + p.vans + "台（走行分×" + p.vans + "）");
    if (p.origin || p.destination) {
      lines.push("積地：" + (p.origin || "(未入力)") + " / 卸地：" + (p.destination || "(未入力)"));
    }
    lines.push("距離：" + p.km + "km");
    lines.push("出張費：" + yen(p.travelFeeBase) + "（" + p.travelNote + "）");
    if (p.datetime) lines.push("希望日時：" + p.datetime);
    if (p.note) lines.push("補足：" + p.note);
    lines.push("—");
    lines.push("走行分（基本＋出張）×台数：" + yen(p.drivePart) + "（基本" + yen(p.baseFee) + " + 出張" + yen(p.travelFeeBase) + "）×" + p.vans);
    if (p.stairsFee > 0) lines.push("階段付帯：" + yen(p.stairsFee));
    if (p.laborFee > 0) lines.push("追加人件費：" + yen(p.laborFee) + "（" + p.workers + "人 × " + p.wHours + "h × " + yen(PRICE.extraLaborPerHour) + "）");
    lines.push("合計：" + yen(p.total) + "（税込概算）");
    lines.push("—");
    lines.push("確定：LINE/メールで相談→合意後に本契約へ");
    lines.push("支払い：当日決済（現金/振込）");
    return { id: id, text: lines.join("\n") };
  }

  function showToast(title, msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    var t = document.getElementById("toastTitle");
    var m = document.getElementById("toastMsg");
    if (t) t.textContent = title || "";
    if (m) m.textContent = msg || "";
    el.style.display = "block";
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      el.style.display = "none";
    }, 2600);
  }

  function renderBreakdown(container, rows) {
    if (!container) return;
    container.innerHTML = "";
    (rows || []).forEach(function (r) {
      var row = document.createElement("div");
      row.className = "fare-result-row";
      row.innerHTML = "<span>" + String(r.k).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</span><strong>" + String(r.v).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</strong>";
      container.appendChild(row);
    });
  }

  var calcEl = document.getElementById("fareCalculator");
  if (!calcEl) return;

  var payloadHidden = document.getElementById("fareEstimatePayload");

  function bindStepper(minusId, plusId, inputId, opts) {
    opts = opts || {};
    var step = opts.step !== undefined ? opts.step : 1;
    var min = opts.min !== undefined ? opts.min : 0;
    var max = opts.max !== undefined ? opts.max : 999;
    var isInt = opts.isInt !== false;
    var minus = document.getElementById(minusId);
    var plus = document.getElementById(plusId);
    var input = document.getElementById(inputId);
    if (!minus || !plus || !input) return;
    function getVal() {
      return isInt ? int(input.value, min) : num(input.value, min);
    }
    function setVal(v) {
      v = Math.max(min, Math.min(max, v));
      if (isInt) v = Math.round(v);
      input.value = String(v);
    }
    minus.addEventListener("click", function () {
      setVal(getVal() - step);
    });
    plus.addEventListener("click", function () {
      setVal(getVal() + step);
    });
  }

  bindStepper("d_workersMinus", "d_workersPlus", "d_workers", { step: 1, min: 0, max: 9, isInt: true });
  bindStepper("d_wHoursMinus", "d_wHoursPlus", "d_wHours", { step: 0.5, min: 0, max: 24, isInt: false });

  document.getElementById("btnGetDistance").addEventListener("click", function () {
    var cfg = window.CONFIG || {};
    var apiKey = (cfg.GMAPS_API_KEY || "").trim();
    var origin = (document.getElementById("d_origin") && document.getElementById("d_origin").value) || "";
    var destination = (document.getElementById("d_destination") && document.getElementById("d_destination").value) || "";

    if (!apiKey) {
      showToast("距離の入力", "積地・卸地の距離（km）を手入力してください。APIキーを設定すると自動取得できます。");
      if (document.getElementById("mapsStatus")) {
        document.getElementById("mapsStatus").textContent = "※距離は手入力でOK（config.js に GMAPS_API_KEY を設定すると自動取得）";
      }
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      showToast("積地・卸地を入力", "積地と卸地を入力してから「距離を取得」を押してください。");
      return;
    }

    var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" +
      encodeURIComponent(origin) + "&destination=" + encodeURIComponent(destination) +
      "&key=" + encodeURIComponent(apiKey) + "&mode=driving";

    document.getElementById("btnGetDistance").disabled = true;
    document.getElementById("btnGetDistance").textContent = "取得中…";

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === "OK" && data.routes && data.routes[0] && data.routes[0].legs && data.routes[0].legs[0]) {
          var meters = data.routes[0].legs[0].distance && data.routes[0].legs[0].distance.value;
          if (meters != null) {
            var kmVal = Math.round(meters / 1000 * 10) / 10;
            document.getElementById("d_km").value = String(kmVal);
            showToast("距離を取得しました", kmVal + " km");
            if (document.getElementById("mapsStatus")) {
              document.getElementById("mapsStatus").textContent = "※" + kmVal + "km を自動で入れました";
            }
          } else {
            showToast("距離を取得できませんでした", "手入力でお願いします");
          }
        } else {
          showToast("距離を取得できませんでした", data.status || "手入力でお願いします");
        }
      })
      .catch(function () {
        showToast("通信エラー", "距離は手入力でお願いします");
      })
      .finally(function () {
        var btn = document.getElementById("btnGetDistance");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "距離を取得（Google）";
        }
      });
  });

  document.getElementById("btnOpenMaps").addEventListener("click", function () {
    var origin = (document.getElementById("d_origin") && document.getElementById("d_origin").value) || "";
    var destination = (document.getElementById("d_destination") && document.getElementById("d_destination").value) || "";
    var q = (origin.trim() ? "origin=" + encodeURIComponent(origin) : "") +
      (destination.trim() ? (origin.trim() ? "&" : "") + "destination=" + encodeURIComponent(destination) : "");
    var url = "https://www.google.com/maps/dir/";
    if (q) url = "https://www.google.com/maps/dir/?api=1&" + q;
    window.open(url, "_blank", "noopener,noreferrer");
    if (!origin.trim() && !destination.trim()) {
      showToast("Googleマップを開きました", "積地・卸地を入力するとルート検索できます");
    }
  });

  var lastDriving = null;

  document.getElementById("btnCalcDriving").addEventListener("click", function () {
    var serviceKey = document.getElementById("d_service").value;
    var km = num(document.getElementById("d_km").value, 0);
    var vans = Math.max(1, Math.min(2, int(document.getElementById("d_vans").value, 1)));
    var note = (document.getElementById("d_note") && document.getElementById("d_note").value) || "";
    var dtEl = document.getElementById("d_datetime");
    var datetime = dtEl && dtEl.value ? dtEl.value.replace("T", " ") : "";

    var travel = calcTravelFee(km);
    var labelMap = {
      haul: "運搬（距離＆階段）",
      shopping: "買い物代行（2,200円〜）",
      carSupport: "車検・整備（代行／搬入）"
    };
    var baseFee = PRICE.haulBaseFee;
    if (serviceKey === "shopping") baseFee = PRICE.shoppingBaseFee;
    if (serviceKey === "carSupport") baseFee = PRICE.carSupportBaseFee;

    var travelFeeBase = travel.fee;
    var drivePart = (baseFee + travelFeeBase) * vans;

    var stairsFee = 0;
    var origin = "";
    var destination = "";
    if (serviceKey === "haul") {
      var oEl = document.getElementById("d_origin");
      var dEl = document.getElementById("d_destination");
      origin = oEl ? oEl.value.trim() : "";
      destination = dEl ? dEl.value.trim() : "";
      var pickFloor = int(document.getElementById("d_pickFloor").value, 1);
      var dropFloor = int(document.getElementById("d_dropFloor").value, 1);
      var pickElev = document.getElementById("d_pickElev").value === "yes";
      var dropElev = document.getElementById("d_dropElev").value === "yes";
      stairsFee = calcStairsFee(pickFloor, pickElev) + calcStairsFee(dropFloor, dropElev);
    }

    var workers = Math.max(0, int(document.getElementById("d_workers").value, 0));
    var wHours = roundToHalfHourHours(num(document.getElementById("d_wHours").value, 0));
    var laborFee = workers * wHours * PRICE.extraLaborPerHour;

    var total = drivePart + stairsFee + laborFee;

    var breakdown = [
      { k: "サービス", v: labelMap[serviceKey] || serviceKey },
      { k: "車両台数", v: vans + "台（走行分×" + vans + "）" },
      { k: "距離", v: (km || 0) + "km" },
      { k: "走行分（基本＋出張）×台数", v: yen(drivePart) + "（基本" + yen(baseFee) + " + 出張" + yen(travelFeeBase) + "）×" + vans }
    ];
    if (serviceKey === "haul") {
      breakdown.push({ k: "階段付帯", v: stairsFee ? yen(stairsFee) : "なし（エレベーター/1階）" });
    }
    breakdown.push({ k: "追加人件費（ドライバー以外）", v: laborFee ? yen(laborFee) + "（" + workers + "人×" + wHours + "h×" + yen(PRICE.extraLaborPerHour) + "）" : "なし" });
    breakdown.push({ k: "合計", v: yen(total) });

    var resultEl = document.getElementById("resultDriving");
    var totalEl = document.getElementById("d_total");
    var breakdownEl = document.getElementById("d_breakdown");
    if (resultEl) resultEl.style.display = "block";
    if (totalEl) totalEl.textContent = yen(total);
    renderBreakdown(breakdownEl, breakdown);

    var payload = {
      type: "driving",
      serviceKey: serviceKey,
      serviceLabel: labelMap[serviceKey] || serviceKey,
      vans: vans,
      origin: origin,
      destination: destination,
      km: km || 0,
      travelFeeBase: travelFeeBase,
      travelNote: travel.note,
      datetime: datetime,
      note: note,
      baseFee: baseFee,
      drivePart: drivePart,
      stairsFee: stairsFee,
      workers: workers,
      wHours: wHours,
      laborFee: laborFee,
      total: total,
      breakdown: breakdown
    };

    var pack = buildDrivingCopy(payload);
    lastDriving = { payload: payload, copyText: pack.text };

    if (payloadHidden) {
      try {
        payloadHidden.value = JSON.stringify({ text: pack.text, payload: payload });
      } catch (e) {
        payloadHidden.value = pack.text;
      }
    }

    showToast("計算OK", "見積がLINE/メール用に準備できました");
  });

  document.getElementById("d_copy").addEventListener("click", function () {
    if (!lastDriving) {
      showToast("先に計算してください", "「計算する」を押してからコピーできます");
      return;
    }
    var text = lastDriving.copyText;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast("コピーしました", "LINE/メールに貼り付けてください");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("コピーしました", "LINE/メールに貼り付けてください");
      }
    } catch (e) {
      showToast("コピーできませんでした", "本文を手動でコピーしてください");
    }
  });

  var lineBtn = document.getElementById("d_toLine");
  if (lineBtn) {
    var cfg = window.CONFIG || {};
    lineBtn.href = (cfg.LINE_URL || "https://line.me/R/ti/p/%40277rcesk").trim();
    lineBtn.addEventListener("click", function (e) {
      if (!lastDriving) {
        e.preventDefault();
        showToast("先に計算してください", "「計算する」を押してから送れます");
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastDriving.copyText);
        }
      } catch (err) {}
      showToast("LINEを開きます", "見積はコピー済みです。貼り付けて送ってください");
    });
  }

  window.FareCalculator = {
    PRICE: PRICE,
    calcTravelFee: calcTravelFee,
    calcStairsFee: calcStairsFee,
    buildDrivingCopy: buildDrivingCopy,
    yen: yen
  };
})();
