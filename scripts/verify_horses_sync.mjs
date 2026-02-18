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

function canonicalFromShared(shared) {
  const horses = Array.isArray(shared) ? shared : shared.horses;
  if (!Array.isArray(horses)) {
    throw new Error('shared horses format error');
  }

  return horses.map((h) => {
    const clone = { ...h };
    delete clone.horse_id;
    delete clone.birth_year;
    return clone;
  });
}

const args = parseArgs(process.argv);
const sharedPath = path.resolve(args.shared || 'shared-data/horses.json');
const appPath = args.app ? path.resolve(args.app) : null;

const sharedDoc = readJson(sharedPath);
const expected = canonicalFromShared(sharedDoc);

if (!appPath) {
  console.log(`ok: shared horses format is valid (${expected.length} horses)`);
  process.exit(0);
}

const appDoc = readJson(appPath);
if (!Array.isArray(appDoc)) {
  throw new Error('app horses format error (expected array)');
}

const a = JSON.stringify(expected);
const b = JSON.stringify(appDoc);
if (a !== b) {
  console.error('horses sync mismatch between --shared and --app');
  process.exit(1);
}

console.log(`ok: ${appDoc.length} horses are in sync`);
