#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    args[key.slice(2)] = value;
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const args = parseArgs(process.argv);
const inputPath = path.resolve(args.input || 'shared-data/horses.json');
const outputPath = path.resolve(args.output || 'data/horses.json');

const doc = readJson(inputPath);
const horses = Array.isArray(doc) ? doc : doc.horses;
if (!Array.isArray(horses)) {
  throw new Error('入力は配列、または { horses: [...] } 形式である必要があります');
}

const normalized = horses.map((h) => {
  const clone = { ...h };
  delete clone.horse_id;
  delete clone.source;
  delete clone.birth_year;
  return clone;
});

writeJson(outputPath, normalized);
console.log(`synced: ${normalized.length} horses -> ${outputPath}`);
