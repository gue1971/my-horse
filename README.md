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
├─ data/
│  ├─ horses.json              # 出資馬の基本情報
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

### horses.json
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

共通リポジトリは以下を作成済みです。  
`/Users/gue1971/MyWorks/競馬/出資馬アプリ/shared-horses-data`

### 1) おウマのかよいJSONを分割

```bash
node scripts/split_ouma_json.mjs \
  --input /path/to/ouma-combined.json \
  --horses-out /path/to/ouma-horses.json \
  --transactions-out /path/to/ouma-transactions.json
```

### 2) 共通horsesを生成（reverse import: union/normandy）

```bash
node scripts/build_shared_horses.mjs \
  --myhorse data/horses.json \
  --import /path/to/ouma-horses.json \
  --output shared-data/horses.json
```

`horse_id` は `club + clubPage` から生成します。  
`clubPage` が空の場合は `netkeiba_horse_id`、それも空なら `slug` で補完します。

### 3) 必要ならMy Horseデータを直接更新

```bash
node scripts/build_shared_horses.mjs \
  --myhorse data/horses.json \
  --import /path/to/ouma-horses.json \
  --write-myhorse
```

### 4) 共通データから My Horse へ反映

```bash
node scripts/sync_myhorse_from_shared.mjs \
  --input shared-data/horses.json \
  --output data/horses.json
```

### 5) `shared-data` を別リポジトリへ公開（subtree）

作業ツリーをクリーンにした後に実行:

```bash
scripts/publish_shared_subtree.sh <shared-horses-dataのremote> main
```

### 6) 別リポジトリ側の更新を取り込む

```bash
scripts/pull_shared_subtree.sh <shared-horses-dataのremote> main
node scripts/sync_myhorse_from_shared.mjs --input shared-data/horses.json --output data/horses.json
```

### 7) ローカル共通リポジトリへ同期（簡易運用）

```bash
scripts/sync_local_shared_repo.sh shared-data ../shared-horses-data
git -C ../shared-horses-data add .
git -C ../shared-horses-data commit -m "Update shared horses data"
```
