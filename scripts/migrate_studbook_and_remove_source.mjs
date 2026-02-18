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
const filePath = path.resolve(args.file || '../shared-horses-data/horses.json');

const doc = readJson(filePath);
const horses = Array.isArray(doc) ? doc : doc.horses;
if (!Array.isArray(horses)) throw new Error('horses format error');

let copied = 0;
let removedSource = 0;

for (const horse of horses) {
  const studbook = String(horse.studbook_num || '').trim();
  const legacy = String(horse.netkeiba_horse_id || '').trim();
  if (!studbook && legacy) {
    horse.studbook_num = legacy;
    copied += 1;
  }
  if ('source' in horse) {
    delete horse.source;
    removedSource += 1;
  }
}

if (doc && !Array.isArray(doc) && doc.meta && typeof doc.meta === 'object' && 'source' in doc.meta) {
  delete doc.meta.source;
}

writeJson(filePath, Array.isArray(doc) ? horses : { ...doc, horses });
console.log(`updated: ${filePath}`);
console.log(`studbook copied: ${copied}`);
console.log(`source removed: ${removedSource}`);
