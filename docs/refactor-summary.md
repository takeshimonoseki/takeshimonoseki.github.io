# 整理・最適化サマリ（2026-03-15）

品質を下げずに、無駄を減らし保守しやすくするためのリファクタ結果です。

---

## 1. 何を整理したか

- **型・定数・ヘルパーの分離**
  - `src/types.ts` … ViewState, VehicleConsultKind, SimulatorInput, DeliveryFormData, DriverRegisterFormData, VehicleConsultFormData など
  - `src/constants.ts` … SITE_NAME, LINE_*, GAS_URL, ストレージキー, ドライバー書類, ルート, 車両メーカー・車種・予算等
  - `src/lib/helpers.ts` … load/save/remove LocalStorage, isMobileDevice, normalizeZip, searchAddressByZip, 受付番号・ID生成, 運賃計算, submitToGas, フォーム default 値
- **共通UIの集約**
  - `src/components/ui.tsx` … Badge, SectionCard, SummaryItem, FormInput, Modal, FileUpload, DevTestBar, VehicleTabButton, OptionBlock
- **ページの分割**
  - `src/pages/TopPage.tsx` … トップ（ヒーロー・お客様/ドライバー向けカード・開業前導線・車両相談・LINE）
  - `src/pages/PreOpenPage.tsx` … 開業前・黒ナンバー未取得向け相談（新規）
  - `src/pages/VehicleConsultPage.tsx` … 車両相談（購入・修理・車検）
  - `src/pages/SimulatorPage.tsx` … 運賃計算器
  - `src/pages/DeliveryRequestPage.tsx` … 見積依頼・正式依頼フォーム
  - `src/pages/RegisterPage.tsx` … 協力ドライバー登録
  - `src/pages/StaticPages.tsx` … 利用案内・プライバシー・ご利用上の注意・協力ドライバー登録について
- **App.tsx の役割を限定**
  - ルーティング（currentView）とストレージ連携のみ
  - ヘッダー・メイン・フッターのレイアウト
  - 約 3579 行 → 約 220 行に短縮

---

## 2. 何を分割したか

| 対象 | 分割先 |
|------|--------|
| 型定義 | `src/types.ts` |
| 定数・公開値・画像 import | `src/constants.ts` |
| ストレージ・API・計算・default 値 | `src/lib/helpers.ts` |
| 共通UI（Badge, FormInput, Modal 等） | `src/components/ui.tsx` |
| トップ | `src/pages/TopPage.tsx` |
| 開業前・黒ナンバー未取得相談 | `src/pages/PreOpenPage.tsx`（新規） |
| 車両相談 | `src/pages/VehicleConsultPage.tsx` |
| 運賃計算器 | `src/pages/SimulatorPage.tsx` |
| 見積・正式依頼 | `src/pages/DeliveryRequestPage.tsx` |
| 協力ドライバー登録 | `src/pages/RegisterPage.tsx` |
| 利用案内・プライバシー・注意・ドライバー登録について | `src/pages/StaticPages.tsx` |

---

## 3. 何を削除したか

- **未使用ビュー**
  - `CustomerTopView` … どこからも `setView('customer')` が呼ばれていなかった
  - `DriverTopView` … どこからも `setView('driver')` が呼ばれていなかった
- **ViewState から削除**
  - `'customer'` と `'driver'` を型から削除
- **App.tsx 内の重複**
  - 上記ビューと、型・定数・ヘルパー・共通UIの定義をすべて削除（分離先に移動）

---

## 4. 何を追加したか

- **開業前・黒ナンバー未取得向け相談導線**
  - **ViewState** に `'pre-open'` を追加
  - **トップ**に「開業前・書類がまだの方」ブロックを追加（クリックで `pre-open` へ）
  - **PreOpenPage**
    - 文言：登録前でも相談可・条件が合えば登録につなげる（「仮登録」は不使用）
    - 内容：黒ナンバー取得の流れ、開業届・必要書類、軽貨物向け車両選び
    - CTA：LINEで相談する / 車両相談フォームへ

---

## 5. 今後さらに改善できる点

- **画像の軽量化**
  - `hero-kanmon-take.png` が約 7MB、`logo-take-circle.png` が約 1.1MB。WebP 化やリサイズで容量削減を検討
- **SimulatorPage / DeliveryRequestPage / RegisterPage**
  - 現状は 1 ファイルあたり分量多め。必要に応じて「フォーム部分」「サマリ部分」などにさらに分割可能
- **GAS URL**
  - 現在は `constants.ts` に直書き。環境別（開発/本番）で切り替える場合は `import.meta.env` や環境変数へ移行を検討
- **テスト**
  - `lib/helpers.ts` の calculateFare, normalizeZip 等は単体テストしやすいので、テスト追加で回帰防止を検討
- **ルーティング**
  - 将来 URL パスで画面を切り替える場合は、React Router 等の導入を検討

---

## 6. ファイル構成（整理後）

```
src/
├── App.tsx                 # ルーティング・レイアウトのみ（約220行）
├── main.tsx
├── index.css
├── types.ts                # 型定義
├── constants.ts            # 定数・画像
├── assets/
│   ├── hero-kanmon-take.png
│   ├── logo-take-circle.png
│   └── line-qr-take.png
├── lib/
│   └── helpers.ts          # ストレージ・API・計算・default値
├── components/
│   └── ui.tsx              # 共通UI
└── pages/
    ├── TopPage.tsx
    ├── PreOpenPage.tsx     # 新規
    ├── VehicleConsultPage.tsx
    ├── SimulatorPage.tsx
    ├── DeliveryRequestPage.tsx
    ├── RegisterPage.tsx
    └── StaticPages.tsx     # Terms, Privacy, Notice, DriverNotice
```

ビルドは `npm run build` で成功しています。既存機能は維持したまま、保守しやすい最小構成に整理済みです。
