# GAS運用メモ

## 正本
- `gas/Code.gs` … doPost/doGet、payload→canonical正規化、保存・通知
- `gas/SETUP.gs` … 環境強制リセット（forceResetTakeEnvironment）のみ
- `gas/appsscript.json`
- **データ構造の正本**: `docs/canonical-data-structure.md`（customer/driver 項目・書類定義・ヘッダー順はここに準拠）

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
| LINE_TO_USER_ID または LINE_TO_GROUP_ID | LINE通知先 |

## Script Properties（任意）
| キー | 説明 |
|------|------|
| DRIVE_FOLDER_ID | ドライバー登録の書類保存先フォルダID |

## シート名（強制）
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

## 正本データ構造・整合性
- スプレッドシートが保存の正本。payload → canonical に正規化し、保存・メール・LINE・Drive はすべて canonical から生成。
- **変更時**: ホームページ入力項目・GAS受信項目・スプレッドシート列・LINE/メール文面・Drive保存名は必ず `docs/canonical-data-structure.md` に合わせて同時に揃える。
- 詳細: `docs/canonical-data-structure.md`

## 処理フロー
1. ホームページ送信（type=customer / type=driver）
2. payload を canonical に正規化
3. スプレッドシート保存（最優先）
4. 管理者メール → 管理者LINE → ユーザー確認メール
5. 保存成功ならメール/LINE失敗でも受付成功。失敗はログへ。

## Drive保存ルール（ドライバー登録）
- 1受付につき1フォルダ。フォルダ名: `氏名_受付番号`
- ファイル名: 01_免許証_表 〜 08_その他資料（Code.gs の DRIVER_DOC_TO_FILENAME と一致）
- Drive保存先URL をスプレッドシート「Drive保存先」列に記録
- 詳細: `docs/canonical-data-structure.md`

## 環境強制リセット手順
1. スプレッドシートを開く
2. 拡張機能 → Apps Script を開く
3. メニュー「軽貨物TAKE」→「環境を強制リセット」を1回実行
4. 配送依頼 / ドライバー登録 / ログ / 設定 の4タブのみ残ることを確認
