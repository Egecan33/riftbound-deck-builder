// Fetch the current public card list from api.riftcodex.com (same source GameLab uses) -> raw/riftcodex-2026-11-11.json
import { writeFileSync } from 'node:fs';
const all = [];
for (let page = 1; page <= 60; page++) {
  const res = await fetch(`https://api.riftcodex.com/cards?page=${page}&size=100`, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)' } });
  if (!res.ok) { console.log('http', res.status, 'page', page); break; }
  const body = await res.json();
  all.push(...(body.items ?? []));
  if ((body.items ?? []).length < 100) break;
  await new Promise((r) => setTimeout(r, 400));
}
writeFileSync('raw/riftcodex-2026-11-11.json', JSON.stringify({ fetchedAt: new Date().toISOString(), items: all }));
const bySet = {}; for (const c of all) bySet[c.set?.set_id] = (bySet[c.set?.set_id] || 0) + 1;
console.log(all.length, bySet);
