// サイト・LINE・画像など公開してよい固定値
import heroKanmonTake from './assets/hero-kanmon-take.png';
import logoTakeCircle from './assets/logo-take-circle.png';
import lineQrTake from './assets/line-qr-take.png';

export const SITE_NAME = '軽貨物TAKE';
export const LINE_ACCOUNT_NAME = '軽貨物TAKE';
export const LINE_FRIEND_ADD_URL = 'https://lin.ee/S0eHL2o';
export const LINE_QR_URL = lineQrTake;
export const HERO_BG_URL = heroKanmonTake;
export const LOGO_IMAGE_URL = logoTakeCircle;
export const GAS_URL =
  'https://script.google.com/macros/s/AKfycbwWQsnvGNke38i4luvYZM1SHmhScl7EEPLQli0-8ozVjQHfzeBJbyArcviVq02-ZOLWgQ/exec';

// LocalStorage キー
export const SIMULATOR_STORAGE_KEY = 'keikamotsu_take_simulator_input_v3';
export const DELIVERY_ESTIMATE_FORM_STORAGE_KEY = 'keikamotsu_take_delivery_estimate_form_v3';
export const DELIVERY_ORDER_FORM_STORAGE_KEY = 'keikamotsu_take_delivery_order_form_v3';
export const VEHICLE_FORM_STORAGE_KEY = 'keikamotsu_take_vehicle_form_v1';
export const VEHICLE_KIND_STORAGE_KEY = 'keikamotsu_take_vehicle_kind_v1';

// 開発時、または ?test=1 のときのみテスト入力バーを表示
export const ENABLE_TEST_FILL =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('test') === '1');

// 開発用テスト画像（1x1 透過 PNG の Data URL）
export const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

// ドライバー登録：必須・任意書類
export const DRIVER_DOC_REQUIRED: { key: string; label: string; driveName: string }[] = [
  { key: '免許証（表）', label: '免許証（表）', driveName: '01_免許証_表' },
  { key: '免許証（裏）', label: '免許証（裏）', driveName: '02_免許証_裏' },
  { key: '車検証', label: '車検証', driveName: '03_車検証' },
  { key: '任意保険', label: '任意保険', driveName: '04_任意保険' },
  {
    key: '貨物軽自動車運送事業経営届出書',
    label: '貨物軽自動車運送事業経営届出書',
    driveName: '05_貨物軽自動車運送事業経営届出書'
  },
  {
    key: '車両前面写真_黒ナンバー入り',
    label: '車両前面写真（黒ナンバーがはっきり写っているもの）',
    driveName: '06_車両前面写真_黒ナンバー入り'
  }
];

export const DRIVER_DOC_OPTIONAL: { key: string; label: string; driveName: string }[] = [
  { key: '貨物保険', label: '貨物保険', driveName: '07_貨物保険' },
  { key: 'その他資料', label: 'その他補足資料', driveName: '08_その他資料' }
];

// 軽貨物向けメーカー・車種（ドライバー登録用）
export const KEI_MAKERS: Record<string, string[]> = {
  ダイハツ: ['ハイゼットカーゴ', 'ハイゼットトラック', 'アトレー', 'その他'],
  スズキ: ['エブリイ', 'キャリイ', 'その他'],
  ホンダ: ['N-VAN', 'アクティ', 'その他'],
  日産: ['NV100クリッパー', 'NT100クリッパー', 'その他'],
  三菱: ['ミニキャブバン', 'ミニキャブトラック', 'その他'],
  スバル: ['サンバーバン', 'サンバートラック', 'その他'],
  マツダ: ['スクラムバン', 'スクラムトラック', 'その他'],
  トヨタ: ['ピクシスバン', 'ピクシストラック', 'その他']
};

// 運賃計算器：よく使うルート
export const COMMON_ROUTES = [
  { label: '下関 ↔ 門司', dist: '10.0', origin: '山口県下関市', destination: '福岡県北九州市門司区' },
  { label: '下関 ↔ 小倉', dist: '15.0', origin: '山口県下関市', destination: '福岡県北九州市小倉北区' },
  { label: '下関 ↔ 福岡市', dist: '75.0', origin: '山口県下関市', destination: '福岡県福岡市' },
  { label: '下関 ↔ 山口市', dist: '70.0', origin: '山口県下関市', destination: '山口県山口市' }
];

// 車両相談：メーカー別車種一覧
export const VEHICLE_MODELS_BY_MAKER: Record<string, string[]> = {
  トヨタ: [
    'アルファード', 'ヴェルファイア', 'ハイエース', 'プロボックス', 'ノア', 'ヴォクシー', 'シエンタ',
    'ヤリス', 'カローラ', 'プリウス', 'アクア', 'クラウン', 'ランドクルーザー', 'RAV4', 'ハリアー',
    'ルーミー', 'タウンエース', 'ライトエース', 'その他'
  ],
  レクサス: ['LS', 'ES', 'IS', 'GS', 'LC', 'UX', 'NX', 'RX', 'LX', 'LM', 'その他'],
  日産: [
    'セレナ', 'ノート', 'リーフ', 'エクストレイル', 'キックス', 'NV200バネット', 'キャラバン',
    'AD', 'デイズ', 'ルークス', 'スカイライン', 'フェアレディZ', 'エルグランド', 'クリッパー', 'その他'
  ],
  ホンダ: [
    'N-BOX', 'N-WGN', 'N-ONE', 'N-VAN', 'フィット', 'フリード', 'ステップワゴン', 'ヴェゼル',
    'ZR-V', 'CR-V', 'シビック', 'アコード', 'オデッセイ', 'その他'
  ],
  スズキ: [
    'アルト', 'ワゴンR', 'スペーシア', 'ハスラー', 'ラパン', 'ジムニー', 'エブリイ', 'キャリイ',
    'ソリオ', 'スイフト', 'クロスビー', 'イグニス', 'その他'
  ],
  ダイハツ: [
    'タント', 'ムーヴ', 'ミライース', 'ムーヴキャンバス', 'ハイゼットカーゴ', 'ハイゼットトラック',
    'アトレー', 'ロッキー', 'トール', 'コペン', 'その他'
  ],
  マツダ: [
    'MAZDA2', 'MAZDA3', 'MAZDA6', 'CX-3', 'CX-5', 'CX-8', 'CX-30', 'CX-60', 'CX-80',
    'ロードスター', 'ボンゴ', 'スクラム', 'その他'
  ],
  スバル: [
    'レヴォーグ', 'インプレッサ', 'WRX', 'フォレスター', 'XV', 'クロストレック', 'アウトバック',
    'レガシィ', 'サンバー', 'その他'
  ],
  三菱: [
    'デリカD:5', 'デリカミニ', 'eKワゴン', 'eKスペース', 'ミニキャブ', 'アウトランダー',
    'エクリプスクロス', 'RVR', 'トライトン', 'その他'
  ],
  いすゞ: ['エルフ', 'フォワード', 'ギガ', 'ファーゴ', 'その他'],
  日野: ['デュトロ', 'レンジャー', 'プロフィア', 'その他'],
  UDトラックス: ['カゼット', 'コンドル', 'クオン', 'その他'],
  BMW: ['1シリーズ', '2シリーズ', '3シリーズ', '4シリーズ', '5シリーズ', '7シリーズ', 'X1', 'X3', 'X5', 'X7', 'MINI', 'その他'],
  メルセデスベンツ: ['Aクラス', 'Bクラス', 'Cクラス', 'Eクラス', 'Sクラス', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'Vクラス', 'スプリンター', 'その他'],
  アウディ: ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'TT', 'その他'],
  フォルクスワーゲン: ['up!', 'Polo', 'Golf', 'Passat', 'T-Cross', 'T-Roc', 'Tiguan', 'Touran', 'Sharan', 'その他'],
  ポルシェ: ['911', '718', 'Panamera', 'Macan', 'Cayenne', 'Taycan', 'その他'],
  ボルボ: ['V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'S60', 'S90', 'その他'],
  プジョー: ['208', '2008', '308', '3008', '5008', 'リフター', 'その他'],
  シトロエン: ['C3', 'C4', 'ベルランゴ', 'C5', 'その他'],
  ルノー: ['ルーテシア', 'カングー', 'メガーヌ', 'キャプチャー', 'アルカナ', 'その他'],
  フィアット: ['500', 'Panda', 'Tipo', 'Doblo', 'その他'],
  アルファロメオ: ['ジュリア', 'ステルヴィオ', 'トナーレ', 'その他'],
  ジープ: ['ラングラー', 'レネゲード', 'コンパス', 'チェロキー', 'グランドチェロキー', 'その他'],
  ランドローバー: ['ディフェンダー', 'ディスカバリー', 'レンジローバー', 'イヴォーク', 'その他'],
  テスラ: ['Model 3', 'Model Y', 'Model S', 'Model X', 'その他'],
  シボレー: ['カマロ', 'コルベット', 'トレイルブレイザー', 'その他'],
  フォード: ['マスタング', 'エクスプローラー', 'F-150', 'その他'],
  その他: ['その他']
};

export const VEHICLE_PURCHASE_BUDGETS = [
  '50万円未満', '50〜100万円', '100〜150万円', '150〜200万円', '200〜300万円',
  '300〜500万円', '500万円以上', '相談したい'
];

export const VEHICLE_PURCHASE_DELIVERY = ['急ぎ', '1か月以内', '3か月以内', '半年以内', '急がない'];

export const VEHICLE_REPAIR_SYMPTOMS = [
  '異音', 'エアコン不調', 'ブレーキ', 'エンジン不調', 'バッテリー', 'オイル / 液漏れ', '警告灯', 'その他'
];

export const VEHICLE_REPAIR_SINCE = ['今日', '数日前', '1週間以上前', '前から', 'わからない'];

export const VEHICLE_REPAIR_DRIVABLE = [
  '普通に走れる', 'なるべく早く見てほしい', '走行が不安', '動かせない'
];

export const VEHICLE_INSPECTION_TIMING = ['今月', '来月', '3ヶ月以上先'];

export const VEHICLE_INSPECTION_PREFERENCES = [
  '最低限でOK', 'しっかり整備してほしい', '相談して決めたい'
];
