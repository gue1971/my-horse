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

function normalizeClub(club) {
  const c = String(club || '').trim().toLowerCase() || 'unknown';
  if (c === 'tokyo') return 'tosara';
  return c;
}

function extractLocalId(horse) {
  const existing = String(horse.local_id || '').trim();
  if (existing) return existing;

  const clubPage = String(horse.clubPage || '').trim();
  if (clubPage) {
    const m = clubPage.match(/(\d+)$/);
    if (m) return m[1];
  }

  const legacyId = String(horse.horse_id || '').trim();
  if (legacyId.includes(':')) {
    const part = legacyId.split(':').pop();
    const m = String(part).match(/(\d+)$/);
    if (m) return m[1];
    if (part) return part;
  }

  const studbook = String(horse.studbook_num || horse.netkeiba_horse_id || '').trim();
  if (studbook) return studbook;

  return String(horse.slug || '').trim().toLowerCase() || 'unknown';
}

const args = parseArgs(process.argv);
const filePath = path.resolve(args.file || '../shared-horses-data/horses.json');

const doc = readJson(filePath);
const horses = Array.isArray(doc) ? doc : doc.horses;
if (!Array.isArray(horses)) {
  throw new Error('horses format error');
}

for (const horse of horses) {
  const club = normalizeClub(horse.club);
  horse.studbook_num = String(horse.studbook_num || horse.netkeiba_horse_id || '').trim();
  delete horse.source;
  const localId = extractLocalId(horse);
  horse.local_id = localId;
  horse.horse_id = `${club}_${localId}`;
}

writeJson(filePath, Array.isArray(doc) ? horses : { ...doc, horses });
console.log(`normalized horse_id/local_id: ${filePath} (${horses.length} horses)`);
