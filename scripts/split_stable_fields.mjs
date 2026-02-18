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

function splitStable(stable) {
  const raw = String(stable || '').trim();
  if (!raw) return { training_center: '', trainer: '' };

  const normalized = raw.replace(/\s+/g, ' ').trim();
  const m = normalized.match(/^(美浦|栗東|地方|海外)\s*(.+)$/);
  if (m) {
    return { training_center: m[1], trainer: m[2].trim() };
  }

  const parts = normalized.split(' ');
  if (parts.length >= 2) {
    return { training_center: parts[0], trainer: parts.slice(1).join(' ') };
  }

  return { training_center: '', trainer: normalized };
}

const args = parseArgs(process.argv);
const filePath = path.resolve(args.file || '../shared-horses-data/horses.json');

const doc = readJson(filePath);
const horses = Array.isArray(doc) ? doc : doc.horses;
if (!Array.isArray(horses)) {
  throw new Error('horses format error');
}

for (const horse of horses) {
  const { training_center, trainer } = splitStable(horse.stable);
  horse.training_center = training_center;
  horse.trainer = trainer;
}

writeJson(filePath, Array.isArray(doc) ? horses : { ...doc, horses });
console.log(`split stable fields: ${filePath} (${horses.length} horses)`);
