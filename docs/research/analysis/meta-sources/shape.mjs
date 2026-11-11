// Print the shape of the deck object on a deck page and of a listing row (values trimmed).
import { readFileSync } from 'node:fs';
import { flight, balanced } from '../pa-lib.mjs';
const [file, kind] = process.argv.slice(2);
const s = flight(readFileSync(file, 'utf8'));
const trim = (v, d = 0) => Array.isArray(v) ? (v.length ? [trim(v[0], d + 1), `…(${v.length} items)`] : []) : v && typeof v === 'object' ? (d > 3 ? '{…}' : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trim(x, d + 1)]))) : typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '…' : v;
if (kind === 'list') {
  for (const m of s.matchAll(/\[\{"id":"[0-9a-f-]{36}","name":/g)) { const a = JSON.parse(balanced(s, m.index)); if (a[0]?.createdAt && a[0]?.authorName !== undefined) { console.log(a.length, JSON.stringify(trim(a[0]), null, 1)); break; } }
  for (const m of s.matchAll(/"(totalPages|totalCount|total|pageCount|totalDecks|count)":(\d+)/g)) console.log(m[0]);
} else {
  const i = s.search(/\{"id":"[0-9a-f-]{36}","authorName"/); let j = i;
  if (i < 0) { const k = s.indexOf('"authorName"'); j = s.lastIndexOf('{', k); }
  const o = JSON.parse(balanced(s, j)); console.log(JSON.stringify(trim(o), null, 1));
}
