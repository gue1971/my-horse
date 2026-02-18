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

function normalizeName(name) {
  const n = String(name || '').trim();
  if (n === 'モンタンレーヴ') return 'モンタンヴェール';
  return n;
}

function canonicalClubToOuma(club) {
  const c = String(club || '').trim().toLowerCase();
  if (c === 'tokyo') return 'tosara';
  return c;
}

function extractLocalId(clubPage) {
  const raw = String(clubPage || '').trim();
  if (!raw) return '';
  const m = raw.match(/(\d+)$/);
  return m ? m[1] : raw;
}

function parseOumaHorseId(horseId) {
  const m = String(horseId || '').trim().match(/^([^_]+)_(.+)$/);
  if (!m) return { club: '', localId: '' };
  return { club: m[1].toLowerCase(), localId: m[2] };
}

const args = parseArgs(process.argv);
const oumaPath = path.resolve(args.ouma || '/tmp/ouma-horses-real.json');
const canonicalPath = path.resolve(args.canonical || '../shared-horses-data/horses.json');
const sourceLabel = String(args.source || 'ouma-no-kayoi');
const stamp = String(args.stamp || new Date().toISOString().slice(0, 10));

const oumaDoc = readJson(oumaPath);
const oumaHorses = Array.isArray(oumaDoc) ? oumaDoc : oumaDoc.horses;
if (!Array.isArray(oumaHorses)) {
  throw new Error('ouma horses format error');
}

const canonicalDoc = readJson(canonicalPath);
const canonicalHorses = Array.isArray(canonicalDoc) ? canonicalDoc : canonicalDoc.horses;
if (!Array.isArray(canonicalHorses)) {
  throw new Error('canonical horses format error');
}

const byKey = new Map();
const byName = new Map();
for (const h of canonicalHorses) {
  const club = canonicalClubToOuma(h.club);
  const localId = String(h.local_id || '').trim() || extractLocalId(h.clubPage);
  if (club && localId) {
    byKey.set(`${club}_${localId}`, h);
  }
  const name = normalizeName(h.name);
  if (name) byName.set(name, h);
}

let matched = 0;
let unmatched = 0;
const unmatchedRows = [];

for (const oh of oumaHorses) {
  const status = String(oh.status || '').trim().toLowerCase();
  if (status !== 'active' && status !== 'retired') continue;

  const parsed = parseOumaHorseId(oh.horse_id);
  let target = null;
  if (parsed.club && parsed.localId) {
    target = byKey.get(`${parsed.club}_${parsed.localId}`) || null;
  }

  if (!target) {
    target = byName.get(normalizeName(oh.name)) || null;
  }

  if (!target) {
    unmatched += 1;
    unmatchedRows.push({ name: oh.name || '', horse_id: oh.horse_id || '', club: oh.club || '' });
    continue;
  }

  target.career_status = status;
  target.status_source = sourceLabel;
  target.status_updated_at = stamp;
  matched += 1;
}

writeJson(canonicalPath, Array.isArray(canonicalDoc) ? canonicalHorses : { ...canonicalDoc, horses: canonicalHorses });

console.log(`updated: ${canonicalPath}`);
console.log(`matched: ${matched}`);
console.log(`unmatched: ${unmatched}`);
if (unmatchedRows.length > 0) {
  console.log('unmatched rows:');
  for (const row of unmatchedRows.slice(0, 20)) {
    console.log(`- ${row.name} (${row.horse_id})`);
  }
}
