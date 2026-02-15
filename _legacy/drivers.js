/**
 * drivers-site：郵便番号API・住所正規化・車両メーカー連動
 */

(function (global) {
  "use strict";

  /**
   * 全角数字→半角に変換（0-9、Ａ-Ｚ、ａ-ｚ）
   */
  function toHalfWidth(str) {
    if (typeof str !== "string") return "";
    return String(str).replace(/[０-９Ａ-Ｚａ-ｚ]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
  }

  /**
   * 郵便番号の表示用整形（入力中に適用）
   * - 全角→半角に変換
   * - 数字以外を除去
   * - 7桁に達したら XXX-XXXX 形式にハイフン挿入
   * - 7桁未満は無理に整形せず数字のみ返す
   * @returns {string} 整形後の表示文字列
   */
  function formatZipDisplay(value) {
    if (typeof value !== "string") return "";
    var s = toHalfWidth(value).replace(/[^0-9]/g, "").slice(0, 7);
    if (s.length === 7) {
      return s.slice(0, 3) + "-" + s.slice(3);
    }
    return s;
  }

  /**
   * 郵便番号を7桁に正規化（ハイフン除去・検索用）
   */
  function normalizeZip(zip) {
    if (typeof zip !== "string") return "";
    return String(zip).replace(/[‐－−ー-]/g, "").replace(/\D/g, "").slice(0, 7);
  }

  /**
   * ZipCloud API で郵便番号→住所取得
   * @param {string} zip - 7桁の郵便番号
   * @returns {Promise<{pref:string, city:string, line1:string}|null>} 該当なしは null
   */
  function fetchAddressByZip(zip) {
    var code = normalizeZip(zip);
    if (code.length !== 7) return Promise.resolve(null);
    var url = "https://zipcloud.ibsnet.co.jp/api/search?zipcode=" + encodeURIComponent(code);
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.status !== 200 || !data.results || data.results.length === 0) return null;
        var r = data.results[0];
        return {
          pref: r.address1 || "",
          city: r.address2 || "",
          line1: r.address3 || ""
        };
      })
      .catch(function () { return null; });
  }

  /**
   * 住所比較用の正規化（全角→半角、空白・ハイフン統一、都道府県表記揺れ吸収）
   */
  function normalizeAddressForCompare(str) {
    if (typeof str !== "string") return "";
    var s = str
      .replace(/\s+/g, " ")
      .replace(/[‐－−ー-]/g, "-")
      .trim();
    // 全角英数→半角
    s = s.replace(/[０-９Ａ-Ｚａ-ｚ]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/\s/g, "").replace(/-/g, "");
    // 都道府県の表記揺れ（末尾の「都」「道」「府」「県」は統一して比較で吸収するのでここでは触れない）
    return s;
  }

  /**
   * 現住所と免許証住所の文字列を組み立てて正規化し、一致するか判定
   */
  function buildAddressString(parts) {
    var arr = [];
    if (parts.pref) arr.push(parts.pref);
    if (parts.city) arr.push(parts.city);
    if (parts.line1) arr.push(parts.line1);
    if (parts.line2) arr.push(parts.line2);
    return arr.join("");
  }

  function addressesMatch(addr, licenseAddr) {
    var a = normalizeAddressForCompare(buildAddressString(addr));
    var b = normalizeAddressForCompare(buildAddressString(licenseAddr));
    if (!a || !b) return false;
    return a === b;
  }

  /**
   * 車両メーカー→車種候補（VEHICLE_DB）
   * メーカー選択で datalist の option を差し替えるために使用
   */
  var VEHICLE_DB = {
    "トヨタ": ["プリウス","アクア","ノア","ヴォクシー","ハイエース","アルファード","ヴェルファイア","ラウム","タンク","カローラ","カローラツーリング","ヤリス","シエンタ","ライズ","ラッシュ","ラクティス","ヴァンガード","ランドクルーザー","ハリアー","RAV4","クラウン","マークX","86","スープラ"],
    "レクサス": ["LS","ES","GS","IS","RC","NX","RX","LX","UX"],
    "ホンダ": ["N-BOX","N-BOXスラッシュ","N-VAN","N-WGN","フィット","フリード","ステップワゴン","オデッセイ","ヴェゼル","CR-V","アコード","シビック","S660","N-ONE"],
    "日産": ["NV200","NV350","エルグランド","セレナ","キックス","デイズ","ノート","リーフ","アリア","バネット","キャラバン","マーチ","ジューク","キューブ","ティーダ","キックス","ルークス","ムラーノ","フーガ","スカイライン","フェアレディZ"],
    "インフィニティ": ["Q50","Q60","QX50","QX70","QX80"],
    "スズキ": ["エブリイ","エブリイワゴン","キャリイ","ハスラー","スペーシア","ジムニー","アルト","ワゴンR","ソリオ","エスクード","ジムニーシエラ","アルトラパン","スイフト","エスクード","バレーノ","クロスビー"],
    "ダイハツ": ["タント","ムーヴ","キャスト","ミラ","ハイゼット","ハイゼットカーゴ","アテンザ","デミオ","フレア","フレアワゴン","トール","ロッキー","ブーン","コペン"],
    "マツダ": ["CX-5","CX-8","CX-30","CX-3","ボンゴ","スクラム","デミオ","アテンザ","アクセラ","ロードスター","フレア","フレアクロスオーバー","ベリーサ","ビアンテ"],
    "スバル": ["レガシー","インプレッサ","レヴォーグ","フォレスター","アウトバック","エクシーガ","XV","WRX","BRZ","サンバー"],
    "三菱": ["デリカ","アウトランダー","パジェロ","eK","eKクロス","eKスペース","デリカD:5","ミラージュ","ランサー","アウトランダーPHEV"],
    "いすゞ": ["エルフ","デュトロ","フォワード","ギガ","コンテッサ","ファーゴ","ワイルダー","D-MAX"],
    "日野": ["デュト","レンジャー","プロフィア","セレガ","メルファ"],
    "UDトラックス": ["クオン","カザル","ビッグサム"],
    "光岡": ["オロチ","ガリュー","ヒメ"],
    "メルセデス・ベンツ": ["Aクラス","Bクラス","Cクラス","Eクラス","Sクラス","GLA","GLB","GLC","GLE","GLS","Gクラス","Vクラス","スプリンター"],
    "BMW": ["1シリーズ","2シリーズ","3シリーズ","5シリーズ","X1","X2","X3","X5","X7","i3","i4","MINI"],
    "ミニ": ["3ドア","5ドア","クラブマン","カントリーマン","コンバーチブル","ペースマン"],
    "アウディ": ["A3","A4","A6","Q3","Q5","Q7","e-tron"],
    "フォルクスワーゲン": ["ポロ","ゴルフ","パサート","ティグアン","トゥアレグ","トランスポルター","クラフト"],
    "ポルシェ": ["911","カイエン","マカン","パナメーラ","タイカン"],
    "ボルボ": ["XC40","XC60","XC90","S60","V60","V90"],
    "テスラ": ["モデル3","モデルS","モデルX","モデルY"],
    "フォード": ["フィエスタ","フォーカス","モンデオ","マスタング","レンジャー","エクスプローラー","トランзиット"],
    "シボレー": ["ボルト","トレイルブレイザー","シルバラード","エクイノックス"],
    "ジープ": ["レネゲード","コンパス","チェロキー","グランドチェロキー","ラングラー"],
    "プジョー": ["208","308","508","2008","3008","5008","パートナー","ボクサー"],
    "シトロエン": ["C3","C4","ベルランゴ","スペースツアラー"],
    "ルノー": ["ルーテシア","クリオ","キャプチャ","メガーヌ","カングー","マスター","トラフィック"],
    "フィアット": ["500","500L","500X","ドブロ","ダカ"],
    "アルファロメオ": ["ジュリア","ステルヴィオ","トナーレ"],
    "ランドローバー": ["ディフェンダー","ディスカバリー","レンジローバー","レンジローバーイヴォーク","レンジローバースポーツ"],
    "ジャガー": ["XE","XF","F-PACE","I-PACE"],
    "ヒュンダイ": ["スタリア","ツーソン","サンタフェ","パリセード","アクセント","i30","コナ"],
    "キア": ["カーニバル","ソレント","スポーテージ","セル托ス","ニロ","ピカント"]
  };

  /**
   * メーカー選択に応じて車種 datalist の option を差し替える
   */
  function updatePurchaseModelDatalist(makerSelect, datalistEl) {
    if (!datalistEl) return;
    datalistEl.innerHTML = "";
    var maker = (makerSelect && makerSelect.value) ? String(makerSelect.value).trim() : "";
    var models = VEHICLE_DB[maker];
    if (models && models.length > 0) {
      models.forEach(function (m) {
        var opt = document.createElement("option");
        opt.value = m;
        datalistEl.appendChild(opt);
      });
    }
  }

  /**
   * メーカー選択に応じて車種 select の option を再生成（select方式・端末互換性重視）
   * @param {HTMLSelectElement} makerSelect - メーカー選択の select
   * @param {HTMLSelectElement} modelSelect - 車種の select 要素
   */
  function updatePurchaseModelSelect(makerSelect, modelSelect) {
    if (!modelSelect) return;
    var maker = (makerSelect && makerSelect.value) ? String(makerSelect.value).trim() : "";
    var models = VEHICLE_DB[maker] || [];
    modelSelect.innerHTML = "";
    var opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = models.length ? "選択してください" : "メーカーを選択すると車種が出ます";
    modelSelect.appendChild(opt0);
    models.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
  }

  // 公開API
  global.DriversRegister = {
    formatZipDisplay: formatZipDisplay,
    normalizeZip: normalizeZip,
    fetchAddressByZip: fetchAddressByZip,
    normalizeAddressForCompare: normalizeAddressForCompare,
    buildAddressString: buildAddressString,
    addressesMatch: addressesMatch,
    VEHICLE_DB: VEHICLE_DB,
    updatePurchaseModelDatalist: updatePurchaseModelDatalist,
    updatePurchaseModelSelect: updatePurchaseModelSelect
  };
})(typeof window !== "undefined" ? window : this);
