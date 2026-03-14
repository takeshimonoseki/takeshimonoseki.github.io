# LINE設定メモ

## 目的
- LINE公式アカウントは「軽貨物TAKE」1本で運用する
- ホームページが主導線
- フォーム送信が正本
- LINEは補助導線
- 通知は LINE Notify ではなく LINE Messaging API を使う

## 本番アカウント
- アカウント名: 軽貨物TAKE
- BotベーシックID: @822ashrr
- 友だち追加URL: https://line.me/R/ti/p/%40822ashrr
- Channel ID: 2009446871

## すでに完了
- LINE Official Account Manager で本番アカウント作成
- Messaging API 有効化
- プロバイダー作成
- Developers ログイン確認
- GAS の Script Properties 入力

## コードに書かない秘密情報
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_TO_USER_ID
- LINE_TO_GROUP_ID

## 秘密情報の置き場所
- Google Apps Script
- プロジェクトの設定
- Script Properties

## Script Properties に入れる項目
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_TO_USER_ID
- SPREADSHEET_ID
- ADMIN_EMAIL

## 公開してよい値
- LINE友だち追加URL
- BotベーシックID
- Channel ID

## 公開側で使うもの
- App.tsx などには以下だけ入れてよい
  - LINE友だち追加URL
  - QR表示用のURL
  - 補助導線の文言

## 通知方針
- 保存成功を最優先
- 保存に成功したら LINE通知失敗でも受付成功扱い
- LINE通知には登録内容をそのまま送る
- 必要ならスプレッドシートURLボタンを付ける

## LINE通知に入れたい内容
### お客様
- 受付種別
- 名前
- メールアドレス
- 電話番号
- 郵便番号
- 住所
- 集荷先
- 納品先
- 荷物内容
- 希望日時
- 備考
- 計算結果
- 受付ID
- 受付日時

### ドライバー
- 種別
- 名前
- メールアドレス
- 電話番号
- 郵便番号
- 住所
- 対応エリア
- 車両情報
- 台数
- 備考
- 受付ID
- 受付日時

## スプレッドシート情報
- SPREADSHEET_ID: 1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8
- 管理者メール: takeshimonoseki@gmail.com

## 運用ルール
- 旧テストアカウントは削除しない
- 今後使用するのは「軽貨物TAKE」1本のみ
- トークンはチャットに貼らない
- トークンはスクショしない
- コードには直書きしない

## Cursor運用ルール
- LINEのロジックは Cursor 側で管理する
- GAS の正本は gas/ フォルダ
- 反映は clasp push
- ブラウザのGASエディタは確認用
- 外部画面でしかできないのは以下のみ
  - 公式アカウント作成
  - Messaging API 有効化
  - アクセストークン再発行
  - userId 確認
  - Script Properties 更新