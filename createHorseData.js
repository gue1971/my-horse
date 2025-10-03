const fs = require('fs');
const path = require('path');

// コマンドライン引数でslugを指定
const slug = process.argv[2];

if (!slug) {
  console.error("slug名を指定してください。例: node createHorseData.js resistencia24");
  process.exit(1);
}

// 2. `<slug>.json`の作成
const albumData = {
  album: [
    { "file": "", "caption": "", "isHero": false }
  ],
  archiveComment: [
    { "date": "YYYY-MM-DD", "title": "", "text": "" }
  ]
};

// `<slug>.json`のパスを決定
const jsonFilePath = path.join('data/albums', `${slug}.json`);

// ファイルがすでに存在するかチェック
if (fs.existsSync(jsonFilePath)) {
  console.log(`${slug}.jsonはすでに存在しています`);
} else {
  // `<slug>.json`を作成
  fs.writeFileSync(jsonFilePath, JSON.stringify(albumData, null, 2), 'utf8');
  console.log(`${slug}.jsonが作成されました`);
}

// 3. `<slug>`フォルダの作成
const folderPath = path.join('images', slug);

// フォルダがすでに存在するかチェック
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
  console.log(`${slug}フォルダが作成されました`);
} else {
  console.log(`${slug}フォルダはすでに存在しています`);
}
