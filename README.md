# takeshimonoseki.github.io

GitHub Pages で公開している協力ドライバー登録サイトです。ビルド不要でルート直下の index.html がトップです。

## お知らせの更新（コードを触らずに）

トップページの「お知らせ」は `news.json` で管理しています。更新するにはリポジトリ内の `news.json` を編集し、`items` 配列に `{ "date": "YYYY-MM-DD", "text": "表示したい本文" }` を追加または並べ替えて保存・push してください。最大5件まで表示されます。