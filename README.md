# My Horse

競走馬の出資記録・アルバム・コメントをまとめて管理するための静的サイトプロジェクトです。  
GitHub Pages や Netlify などにそのままデプロイできます。

---

## 📂 フォルダ構成

```
my-horse/
├─ index.html                  # 出資馬一覧ページ
├─ horse.html                  # 各馬の詳細ページ
├─ album.html                  # アルバムページ
│
├─ css/
│  ├─ index.css                # 一覧ページ用スタイル
│  ├─ horse.css                # 詳細ページ用スタイル
│  └─ album.css                # アルバムページ用スタイル
│
├─ js/
│  ├─ index.js                 # 一覧ページ用スクリプト
│  ├─ horse.js                 # 詳細ページ用スクリプト
│  └─ album.js                 # アルバムページ用スクリプト
│
├─ shared-data/
│  ├─ horses.json              # 共通馬マスタ（正本）
│
├─ data/
│  ├─ horses.json              # My Horse表示用（shared-dataから生成）
│  ├─ albums/<slug>.json       # アルバム情報（isHero:trueを含む）
│  └─ comments/<slug>.json     # 引退後コメントなど
│
├─ assets/
│  ├─ icons/
│  │  ├─ clubs/                # クラブアイコン
│  │  │  ├─ carrot.gif
│  │  │  ├─ silk.gif
│  │  │  ├─ tokyo.gif
│  │  │  └─ win.gif
│  │  └─ app/                  # PWA用アイコン類
│  │     ├─ favicon.ico
│  │     ├─ icon-192.png
│  │     └─ icon-512.png
│  └─ fonts/                   # （必要なら）
│
├─ images/<slug>/              # 各馬ごとの写真
│
├─ manifest.json               # PWAマニフェスト
├─ sw.js                       # Service Worker
└─ README.md
```

---

## 📑 データ形式

### shared-data/horses.json（正本）
```json
[
  {
    "slug": "marakosutamuburada17",
    "name": "レシステンシア",
    "club": "carrot",
    "sire": "ダイワメジャー",
    "dam": "マラコスタムブラダ",
    "damsire": "Lizard Island",
    "birth": "2017.3.15",
    "price": "2600万",
    "stable": "栗東 松下武士",
    "farm": "ノーザンファーム",
    "height_cm": 153.5,
    "girth_cm": 179.0,
    "cannon_cm": 20.0,
    "weight_kg": 482,
    "clubPage": "1867",
    "netkeiba_horse_id": "2017105563",
    "jra_id": "pw01dud002017105563/80",
    "jbis_id": "0001237289",
    "tab": 5
  }
]
```

### albums/<slug>.json
```json
{
  "album": [
    { "file": "20191014.webp", "caption": "2歳新馬 優勝", "isHero": true },
    { "file": "20191208a.webp", "caption": "阪神JF 優勝" }
  ]
}
```

### archiveComment/<slug>.json
```json
{
  "archiveComment": [
    {
      "date": "2025-09-30",
      "title": "坂東牧場",
      "text": "馬体重：543キロ…順調に乗り込みを進めています。"
    }
  ]
}
```

---

## 🚀 運用ルール

- **ファイル／フォルダ名はハイフン（-）で統一**  
  例: `my-horse`, `horse-detail.html`

- **JSONのキーはスネークケース（snake_case）**  
  例: `height_cm`, `weight_kg`

- **アルバム**  
  - 各馬に1枚は `isHero:true` を付与  
  - ヒーロー画像が一覧・詳細ページの基準写真になる

- **コメント**  
  - 引退後のクラブコメントをアーカイブ用に保存  
  - 日付、タイトル、テキストを保持

---

## 🛠 技術要素
- HTML/CSS/JavaScript（純粋な静的サイト）
- PWA対応（`manifest.json` + `sw.js`）
- レスポンシブデザイン（スマホ／PC対応）
- タブ状態保存＆スクロール位置復元
- 画像が未整備のときは SVG プレースホルダーを表示

---

## 📌 TODO
- horse.html / album.html のテンプレ整備  
- 各馬ごとの albums.json / comments.json を順次作成  
- デザイン微調整（色味・余白など）

---

## 🔄 共通データ運用（My Horse + おウマのかよい）

`horses` は共通データ、`transactions` はアプリ固有データとして分離して運用します。

正本（手編集するのはここだけ）:
`/Users/gue1971/MyWorks/競馬/出資馬アプリ/shared-horses-data/horses.json`

MyStableが読むファイル:
`/Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/shared-data/horses.json`

互換用生成ファイル（手編集しない）:
`/Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/data/horses.json`

### 1) おウマのかよいJSONを分割

```bash
node scripts/split_ouma_json.mjs \
  --input /path/to/ouma-combined.json \
  --horses-out /path/to/ouma-horses.json \
  --transactions-out /path/to/ouma-transactions.json
```

### 1.5) おウマのかよい status を正本へ移植

```bash
node scripts/import_ouma_status_to_canonical.mjs \
  --ouma /tmp/ouma-horses-real.json \
  --canonical /Users/gue1971/MyWorks/競馬/出資馬アプリ/shared-horses-data/horses.json \
  --stamp 2026-02-18
```

移植先フィールド:
- `career_status` (`active` / `retired`)
- `status_source` (`ouma-no-kayoi`)
- `status_updated_at` (`YYYY-MM-DD`)

### 2) 共通horsesを生成（reverse import: union/normandy）

```bash
node scripts/build_shared_horses.mjs \
  --myhorse /Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/data/horses.json \
  --import /path/to/ouma-horses.json \
  --output /Users/gue1971/MyWorks/競馬/出資馬アプリ/shared-horses-data/horses.json
```

ID規約:
- `horse_id`: `<club>_<local_id>`（例: `carrot_24062`, `tosara_2919`）
- `local_id`: クラブ内ローカルID（数字部分。文字列で保持）

`local_id` は `clubPage` の末尾数字から生成します。  
`clubPage` が空の場合は `netkeiba_horse_id`、それも空なら `slug` で補完します。

### 3) 正本からMyStableへ同期（通常運用）

```bash
scripts/sync_from_shared_repo.sh
```

上のコマンドで次の2ファイルを更新します。
- `/Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/shared-data/horses.json`
- `/Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/data/horses.json`

### 4) 同期ズレ検証

```bash
node scripts/verify_horses_sync.mjs \
  --shared /Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/shared-data/horses.json \
  --app /Users/gue1971/MyWorks/競馬/出資馬アプリ/my-horse/data/horses.json
```

UIは `shared-data/horses.json` のみを参照します。  
`data/horses.json` は生成物として扱い、手編集しません。

### 5) 正本リポジトリをGitHubへ反映

```bash
git -C ../shared-horses-data add .
git -C ../shared-horses-data commit -m "Update shared horses data"
git -C ../shared-horses-data push origin main
```
