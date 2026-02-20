/**
 * full-register 拡張: 市区町村(HeartRails)・銀行支店(teraren) API / キャッシュ / サジェスト
 * initOnce ガード済み。TTL 7日、タイムアウト8秒。
 */
(function() {
  "use strict";
  var CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var FETCH_TIMEOUT_MS = 8000;
  var BANKS_CACHE_KEY = "take_banks_v1";
  var BRANCHES_CACHE_PREFIX = "take_branches_";
  var BRANCHES_CACHE_SUFFIX = "_v1";
  var CITIES_CACHE_PREFIX = "take_cities_";

  var cityCache = Object.create(null);
  var banksCache = null;
  var branchesCache = Object.create(null);

  function getCache(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.ts !== "number" || !obj.data) return null;
      if (Date.now() - obj.ts > CACHE_TTL_MS) return null;
      return obj.data;
    } catch (e) { return null; }
  }
  function setCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {}
  }

  function fetchWithTimeout(url) {
    var ctrl = new AbortController();
    var t = setTimeout(function() { ctrl.abort(); }, FETCH_TIMEOUT_MS);
    return fetch(url, { signal: ctrl.signal })
      .then(function(r) { clearTimeout(t); return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .catch(function(err) { clearTimeout(t); throw err; });
  }

  function getCitiesForPrefecture(pref, callback) {
    if (!pref || !pref.trim()) { callback(null, []); return; }
    var key = CITIES_CACHE_PREFIX + pref;
    if (cityCache[key]) { callback(null, cityCache[key]); return; }
    var cached = getCache(key);
    if (cached && Array.isArray(cached)) { cityCache[key] = cached; callback(null, cached); return; }
    var url = "https://geoapi.heartrails.com/api/json?method=getCities&prefecture=" + encodeURIComponent(pref);
    fetchWithTimeout(url)
      .then(function(json) {
        var list = [];
        if (json && json.response && json.response.location && Array.isArray(json.response.location)) {
          list = json.response.location.map(function(loc) { return (loc && loc.city) ? String(loc.city).trim() : ""; }).filter(Boolean);
        }
        cityCache[key] = list;
        setCache(key, list);
        callback(null, list);
      })
      .catch(function(err) { callback(err, null); });
  }

  function loadBanksAll(callback) {
    if (banksCache && Array.isArray(banksCache)) { callback(null, banksCache); return; }
    var cached = getCache(BANKS_CACHE_KEY);
    if (cached && Array.isArray(cached)) { banksCache = cached; callback(null, cached); return; }
    var list = [];
    var page = 1;
    var per = 500;

    function next() {
      var url = "https://bank.teraren.com/banks.json?page=" + page + "&per=" + per;
      fetchWithTimeout(url)
        .then(function(json) {
          var arr = json;
          if (json && Array.isArray(json)) arr = json;
          else if (json && json.banks && Array.isArray(json.banks)) arr = json.banks;
          else if (json && json.data && Array.isArray(json.data)) arr = json.data;
          else arr = [];
          list = list.concat(arr);
          if (arr.length >= per) { page++; next(); }
          else {
            banksCache = list;
            setCache(BANKS_CACHE_KEY, list);
            callback(null, list);
          }
        })
        .catch(function(err) { callback(err, null); });
    }
    next();
  }

  function loadBranchesForBank(bankCode, callback) {
    if (!bankCode) { callback(null, []); return; }
    var key = BRANCHES_CACHE_PREFIX + bankCode + BRANCHES_CACHE_SUFFIX;
    if (branchesCache[bankCode]) { callback(null, branchesCache[bankCode]); return; }
    var cached = getCache(key);
    if (cached && Array.isArray(cached)) { branchesCache[bankCode] = cached; callback(null, cached); return; }
    var list = [];
    var page = 1;
    var per = 500;

    function next() {
      var url = "https://bank.teraren.com/banks/" + encodeURIComponent(bankCode) + "/branches.json?page=" + page + "&per=" + per;
      fetchWithTimeout(url)
        .then(function(json) {
          var arr = json;
          if (json && Array.isArray(json)) arr = json;
          else if (json && json.branches && Array.isArray(json.branches)) arr = json.branches;
          else if (json && json.data && Array.isArray(json.data)) arr = json.data;
          else arr = [];
          list = list.concat(arr);
          if (arr.length >= per) { page++; next(); }
          else {
            branchesCache[bankCode] = list;
            setCache(key, list);
            callback(null, list);
          }
        })
        .catch(function(err) { callback(err, null); });
    }
    next();
  }

  function filterSuggest(list, query, limit) {
    limit = limit || 20;
    var q = (query || "").trim().toLowerCase();
    if (!q) return list.slice(0, limit);
    var getStr = function(item) {
      var s = (item && (item.name || item.bank_name || item.branch_name || item.city || item)) || "";
      if (typeof s !== "string") s = String(s);
      var k = (item && (item.kana || item.name_kana)) || "";
      var h = (item && (item.hira || item.name_hira)) || "";
      return (s + " " + k + " " + h).toLowerCase();
    };
    var out = [];
    for (var i = 0; i < list.length && out.length < limit; i++) {
      if (getStr(list[i]).indexOf(q) !== -1) out.push(list[i]);
    }
    return out;
  }

  function createSuggestDropdown(container, items, getLabel, onSelect) {
    getLabel = getLabel || function(x) { return (x && (x.name || x.bank_name || x.branch_name || x.city)) || String(x); };
    var ul = document.createElement("ul");
    ul.className = "absolute left-0 right-0 top-full mt-1 max-h-48 overflow-auto rounded-xl border border-white/20 bg-deep z-[100] py-1";
    ul.setAttribute("role", "listbox");
    container.style.position = "relative";
    container.appendChild(ul);

    function show(list) {
      ul.innerHTML = "";
      ul.style.display = list.length ? "block" : "none";
      list.forEach(function(item, idx) {
        var li = document.createElement("li");
        li.className = "px-3 py-2 cursor-pointer hover:bg-white/10 text-sm";
        li.textContent = getLabel(item);
        li.setAttribute("role", "option");
        li.setAttribute("data-index", idx);
        li.addEventListener("click", function() { onSelect(item); hide(); });
        ul.appendChild(li);
      });
    }
    function hide() { ul.style.display = "none"; }
    return { show: show, hide: hide, ul: ul };
  }

  window.FullRegisterEnhance = {
    CACHE_TTL_MS: CACHE_TTL_MS,
    FETCH_TIMEOUT_MS: FETCH_TIMEOUT_MS,
    getCitiesForPrefecture: getCitiesForPrefecture,
    loadBanksAll: loadBanksAll,
    loadBranchesForBank: loadBranchesForBank,
    filterSuggest: filterSuggest,
    createSuggestDropdown: createSuggestDropdown,
    getCache: getCache,
    setCache: setCache
  };
})();
