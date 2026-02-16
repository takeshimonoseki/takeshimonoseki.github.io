// お客様用HP・drivers-site 共通設定（TELは使用しない・LINE固定・GAS未設定時はLINE相談へ誘導）
window.CONFIG = {
  REGION_LABEL: "山口県",
  REGION_CODE: "YAMAGUCHI",
  REGIONS: ["山口県", "福岡県"],
  COMPANY_NAME: "軽貨物TAKE",
  LINE_URL: "https://line.me/R/ti/p/%40277rcesk",
  LINE_OA_ID: "@277rcesk",

  EMAIL_TO: "takeshimonoseki@gmail.com",

  GAS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbwzSFlI7k_eUkHzCyMY8isEyhOCSMrdAovFM2g7XGFZAfA9_3LS2J7F-HNIb5RtCkrAqg/exec",

  // 空文字でも可。未設定時は送信せずLINE相談へ誘導
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbwG3AtO8oAIn72V0NVJ42dNtjT3XOiUkVp6en0hxtnwaUs_pWqeuNLCY0q54Wb4FQnmwA/exec",

  MAX_FILE_MB: 5
};
