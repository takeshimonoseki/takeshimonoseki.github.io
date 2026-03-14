# GAS運用メモ

## 正本
- `gas/Code.gs` … doPost/doGet、保存・通知
- `gas/SETUP.gs` … 環境強制リセット
- `gas/appsscript.json`

## 反映
```bash
npm run gas:push
```

## Script Properties（必須）
| キー | 説明 |
|------|------|
| SPREADSHEET_ID | スプレッドシートID |
| ADMIN_EMAIL | 管理者メール |
| LINE_CHANNEL_ACCESS_TOKEN | LINE Messaging API トークン |
| LINE_TO_USER_ID | LINE通知先 |

## Script Properties（シート名・強制）
forceResetTakeEnvironment 実行時に上書きされる。
- REQUESTS_SHEET_NAME = 配送依頼
- DRIVERS_SHEET_NAME = ドライバー登録
- LOGS_SHEET_NAME = ログ
- CONFIG_SHEET_NAME = 設定

## タブ（4つのみ）
| タブ名 | 用途 |
|--------|------|
| 配送依頼 | 配送相談（見積/正式依頼） |
| ドライバー登録 | 協力ドライバー登録 |
| ログ | エラー・監査ログ |
| 設定 | 現在の設定状態 |

## 処理フロー
1. ホームページ送信（type=customer / type=driver）
2. スプレッドシート保存（最優先）
3. 管理者メール → 管理者LINE → ユーザー確認メール
4. 保存成功ならメール/LINE失敗でも受付成功。失敗はログへ。
