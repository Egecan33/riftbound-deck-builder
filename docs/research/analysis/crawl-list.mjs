// Crawl /decks?page=N (robots.txt allows plain pagination) and store deck metadata only.
// usage: node crawl-list.mjs <fromPage> <toPage>
import { appendFileSync } from 'node:fs';
import { getHtml, flight, balanced, sleep } from './pa-lib.mjs';
const [from, to] = process.argv.slice(2).map(Number);
for (let p = from; p <= to; p++) {
  const html = await getHtml(`https://piltoverarchive.com/decks?page=${p}`);
  if (!html) { console.log('fail', p); await sleep(3000); continue; }
  const s = flight(html);
  let arr = null;
  for (const m of s.matchAll(/\[\{"id":"[0-9a-f-]{36}","name":/g)) {
    const a = JSON.parse(balanced(s, m.index));
    if (a[0]?.createdAt && a[0]?.authorName !== undefined) { arr = a; break; } // the deck list, not the legend/set filter arrays
  }
  if (!arr) { console.log('nodata', p); await sleep(1500); continue; }
  for (const d of arr) appendFileSync('raw/pa-list.jsonl', JSON.stringify({ page: p, id: d.id, name: d.name, author: d.authorName, views: d.views, likes: d.likes, createdAt: d.createdAt, editedAt: d.editedAt, legend: d.legend?.name, legendCode: d.legend?.variantNumber, sets: (d.sets || []).map((x) => x.prefix), isLegal: d.isLegal, banned: d.bannedCardNames }) + '\n');
  if (p % 10 === 0) console.log('page', p, arr.length);
  await sleep(1200);
}
console.log('done');
