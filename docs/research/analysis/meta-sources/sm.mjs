import { readFileSync } from 'node:fs';
const L = new Map(readFileSync('../raw/pa-list.jsonl', 'utf8').trim().split('\n').map((x) => JSON.parse(x)).map((d) => [d.id, d]));
for (const f of process.argv.slice(2)) {
  const x = readFileSync(f, 'utf8');
  const rows = [...x.matchAll(/<loc>[^<]*\/decks\/view\/([0-9a-f-]{36})<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)].map((m) => ({ id: m[1], lm: m[2] }));
  let c = 0, e = 0, n = 0; const byMonth = {};
  for (const r of rows) { byMonth[r.lm.slice(0, 7)] = (byMonth[r.lm.slice(0, 7)] || 0) + 1; const d = L.get(r.id); if (d) { n++; if (d.createdAt === r.lm) c++; if (d.editedAt === r.lm) e++; } }
  const sorted = rows.every((r, i) => i === 0 || rows[i - 1].lm <= r.lm);
  console.log(f, 'rows', rows.length, 'inListing', n, 'lastmod==createdAt', c, 'lastmod==editedAt', e, 'ascendingByLastmod', sorted, JSON.stringify(byMonth));
  console.log(x.slice(0, 600).replace(/\n/g, ' '));
}
