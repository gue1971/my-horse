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
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeHorsesDoc(doc) {
  if (Array.isArray(doc)) return doc;
  if (doc && Array.isArray(doc.horses)) return doc.horses;
  throw new Error('horses JSON は配列、または { horses: [...] } 形式で指定してください');
}

function deriveHorseId(horse) {
  const club = String(horse.club || '').trim().toLowerCase() || 'unknown';
  const clubPage = String(horse.clubPage || '').trim().replace(/^\/+|\/+$/g, '');
  if (clubPage) return `${club}:${clubPage}`;

  const netkeiba = String(horse.netkeiba_horse_id || '').trim();
  if (netkeiba) return `${club}:netkeiba:${netkeiba}`;

  const slug = String(horse.slug || '').trim().toLowerCase();
  if (slug) return `${club}:slug:${slug}`;

  return `${club}:unknown`;
}

function normalizeHorse(rawHorse, source) {
  const horse = { ...rawHorse };
  delete horse.birth_year;

  horse.horse_id = deriveHorseId(horse);
  horse.source = source;
  return horse;
}

function ensureUniqueHorseIds(horses) {
  const counts = new Map();
  for (const horse of horses) {
    counts.set(horse.horse_id, (counts.get(horse.horse_id) || 0) + 1);
  }

  const seen = new Map();
  for (const horse of horses) {
    const id = horse.horse_id;
    const total = counts.get(id) || 0;
    if (total <= 1) continue;

    const seq = (seen.get(id) || 0) + 1;
    seen.set(id, seq);
    const slug = String(horse.slug || '').trim().toLowerCase();
    const suffix = slug || `dup${seq}`;
    horse.horse_id = `${id}:${suffix}`;
  }
}

function reverseMerge(baseHorses, importedHorses, reverseClubs) {
  const merged = [];
  const baseMap = new Map();

  for (const horse of baseHorses) {
    merged.push(horse);
    baseMap.set(horse.horse_id, horse);
  }

  for (const horse of importedHorses) {
    const key = horse.horse_id;
    const exists = baseMap.get(key);

    if (!exists) {
      merged.push(horse);
      baseMap.set(key, horse);
      continue;
    }

    if (reverseClubs.has(String(horse.club || '').toLowerCase())) {
      const idx = merged.findIndex((h) => h.horse_id === key);
      if (idx >= 0) merged[idx] = horse;
      baseMap.set(key, horse);
    }
  }

  return merged;
}

const args = parseArgs(process.argv);
const myHorsePath = path.resolve(args.myhorse || 'data/horses.json');
const importPath = args.import ? path.resolve(args.import) : null;
const outputPath = path.resolve(args.output || 'shared-data/horses.json');
const writeMyHorse = Boolean(args['write-myhorse']);
const reverseClubs = new Set(
  String(args['reverse-clubs'] || 'union,normandy')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean),
);

const myHorseDoc = readJson(myHorsePath);
const myHorse = normalizeHorsesDoc(myHorseDoc).map((h) => normalizeHorse(h, 'my-horse'));

let merged = myHorse;
if (importPath) {
  const importDoc = readJson(importPath);
  const imported = normalizeHorsesDoc(importDoc).map((h) => normalizeHorse(h, 'ouma-no-kayoi'));
  merged = reverseMerge(myHorse, imported, reverseClubs);
}

const output = {
  meta: {
    generated_at: new Date().toISOString(),
    source: 'build_shared_horses.mjs',
    reverse_import_clubs: [...reverseClubs],
  },
  horses: merged,
};

ensureUniqueHorseIds(output.horses);

writeJson(outputPath, output);
console.log(`written: ${outputPath} (${merged.length} horses)`);

if (writeMyHorse) {
  writeJson(myHorsePath, merged);
  console.log(`updated my-horse data: ${myHorsePath}`);
}
