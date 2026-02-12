// drivers-site 共通設定
// GitHub Pages ルート直下に index.html / register.html / vehicle.html を配置
// ※LINEは「友だち追加」用URLのみ使用。QR/ログイン誘導は使用しない。
window.CONFIG = {
  REGION_LABEL: "山口県",
  REGIONS: ["山口県", "福岡県"],
  COMPANY_NAME: "軽貨物TAKE",
  TEL: "09078834125",
  EMAIL_TO: "takeshimonoseki@gmail.com",

  // たけの公式LINE（友だち追加用URL）。全ページのLINEボタンはここに統一。
  LINE_ADD_FRIEND_URL: "https://line.me/ti/p/CJSHrsA4cb",
  // 後方互換（LINE_ADD_FRIEND_URL を優先）
  LINE_URL: "https://line.me/ti/p/CJSHrsA4cb",

  // GAS WebアプリのURL（デプロイ後に取得して貼る）
  GAS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbwzSFlI7k_eUkHzCyMY8isEyhOCSMrdAovFM2g7XGFZAfA9_3LS2J7F-HNIb5RtCkrAqg/exec",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbwzSFlI7k_eUkHzCyMY8isEyhOCSMrdAovFM2g7XGFZAfA9_3LS2J7F-HNIb5RtCkrAqg/exec",

  // シークレット（LINE Notify トークン・メール先・Drive/Sheets ID）は GAS の Script Properties で設定すること。リポジトリに直書きしない。
  MAX_FILE_MB: 5
};
