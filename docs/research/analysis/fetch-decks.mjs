// Fetch deck pages (/decks/view/<id>, allowed by robots.txt) serially and keep a compact record per deck.
// usage: node fetch-decks.mjs  (reads raw/pa-tournament-ids.json, appends raw/pa-decks.jsonl, resumable)
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { getHtml, flight, balanced, sleep } from './pa-lib.mjs';
const SKIP = /champion deck|precon|showdown deck|win-a-case/i;
const ids = JSON.parse(readFileSync('raw/pa-tournament-ids.json', 'utf8')).filter((d) => !SKIP.test(d.name) && (d.editedAt || d.createdAt) >= '2026-08-01').sort((a, b) => (b.editedAt || b.createdAt).localeCompare(a.editedAt || a.createdAt));
const done = new Set(existsSync('raw/pa-decks.jsonl') ? readFileSync('raw/pa-decks.jsonl', 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).id) : []);
const slim = (arr) => (arr || []).map((e) => ({ q: e.quantity, name: e.card?.name, type: e.card?.type, super: e.card?.super, energy: e.card?.energy, power: e.card?.power, might: e.card?.might, tags: e.card?.tags, colors: (e.card?.cardColors || []).map((c) => c.color?.name || c.name).filter(Boolean), text: e.card?.description, code: (e.card?.cardVariants || []).find((v) => v.id === e.variantId)?.variantNumber || e.card?.cardVariants?.[0]?.variantNumber, ban: e.card?.banEffectiveDate }));
let n = 0;
console.log('to fetch', ids.length, 'already', done.size);
for (const d of ids) {
  if (done.has(d.id)) continue;
  const html = await getHtml(`https://piltoverarchive.com/decks/view/${d.id}`);
  if (!html) { console.log('fail', d.id); await sleep(3000); continue; }
  try {
    const s = flight(html);
    const k = s.indexOf('"legendId"'); const i = s.lastIndexOf('{"id":"', k);
    const o = JSON.parse(balanced(s, i));
    const rec = { id: o.id, name: o.name, author: o.authorName, description: (o.description || '').slice(0, 1500), views: o.views, likes: o.likes, createdAt: String(o.createdAt).replace('$D', ''), editedAt: String(o.editedAt).replace('$D', ''),
      legend: { name: o.legend?.card?.name, code: o.legend?.variantNumber, tags: o.legend?.card?.tags, colors: (o.legend?.card?.cardColors || []).map((c) => c.color?.name || c.name).filter(Boolean), text: o.legend?.card?.description },
      champions: slim(o.champions), battlefields: slim(o.battlefields), runes: slim(o.runes), main: slim(o.maindeck), side: slim(o.sideboard) };
    appendFileSync('raw/pa-decks.jsonl', JSON.stringify(rec) + '\n');
  } catch (e) { console.log('parse-fail', d.id, e.message); }
  if (++n % 25 === 0) console.log('fetched', n);
  await sleep(1300);
}
console.log('done', n);
