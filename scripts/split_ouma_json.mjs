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

function asHorseId(horse) {
  if (horse && horse.horse_id) return String(horse.horse_id);
  const club = String(horse?.club || '').trim().toLowerCase();
  const clubPage = String(horse?.clubPage || '').trim().replace(/^\/+|\/+$/g, '');
  if (club && clubPage) {
    const m = clubPage.match(/(\d+)$/);
    const localId = m ? m[1] : clubPage;
    return `${club}_${localId}`;
  }
  const slug = String(horse?.slug || '').trim();
  return slug ? `${club || 'unknown'}_${slug}` : '';
}

function splitDoc(doc) {
  if (doc && Array.isArray(doc.horses)) {
    return {
      horses: doc.horses,
      transactions: Array.isArray(doc.transactions) ? doc.transactions : [],
    };
  }

  if (!Array.isArray(doc)) {
    throw new Error('入力JSONは配列、または { horses, transactions } 形式で指定してください');
  }

  const horses = [];
  const transactions = [];

  for (const row of doc) {
    if (row && typeof row === 'object' && row.horse && typeof row.horse === 'object') {
      const horse = row.horse;
      horses.push(horse);

      if (Array.isArray(row.transactions)) {
        const horseId = asHorseId(horse);
        for (const tx of row.transactions) {
          transactions.push({
            ...tx,
            horse_id: tx?.horse_id || horseId,
          });
        }
      }
      continue;
    }

    if (row && typeof row === 'object') {
      const clone = { ...row };
      const rowTransactions = Array.isArray(clone.transactions) ? clone.transactions : [];
      delete clone.transactions;

      horses.push(clone);
      const horseId = asHorseId(clone);
      for (const tx of rowTransactions) {
        transactions.push({
          ...tx,
          horse_id: tx?.horse_id || horseId,
        });
      }
    }
  }

  return { horses, transactions };
}

const args = parseArgs(process.argv);
const input = args.input ? path.resolve(args.input) : null;
if (!input) {
  console.error('usage: node scripts/split_ouma_json.mjs --input <combined.json> [--horses-out data/ouma-horses.json] [--transactions-out data/ouma-transactions.json]');
  process.exit(1);
}

const horsesOut = path.resolve(args['horses-out'] || 'data/ouma-horses.json');
const txOut = path.resolve(args['transactions-out'] || 'data/ouma-transactions.json');

const source = readJson(input);
const { horses, transactions } = splitDoc(source);

writeJson(horsesOut, { horses });
writeJson(txOut, { transactions });

console.log(`written horses: ${horsesOut} (${horses.length})`);
console.log(`written transactions: ${txOut} (${transactions.length})`);
