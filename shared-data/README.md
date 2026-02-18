# shared-data

このフォルダは、将来的に `shared-horses-data` として分離する前提の共通データ置き場です。

- `horses.json`: My Horse と おウマのかよいで共有する馬マスタ
- 生成コマンド: `node scripts/build_shared_horses.mjs --output shared-data/horses.json`

`horses.json` は手編集せず、スクリプトで再生成する運用を推奨します。
