// List every en-us news URL in the official sitemap (to make sure no rules/errata/FAQ article is missed).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const get = async u => { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)' } }); await new Promise(r => setTimeout(r, 1500)); return [r.status, await r.text()]; };
const [st, idx] = await get('https://playriftbound.com/sitemap_index.xml');
console.log('index', st, idx.length);
const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(maps.join('\n'));
const urls = new Set();
for (const m of maps) {
  if (!/en-us|sitemap\.xml$|news/i.test(m) && maps.length > 12) continue;
  const [s, x] = await get(m); console.log(m, s, x.length);
  for (const mm of x.matchAll(/<loc>([^<]+)<\/loc>/g)) if (mm[1].includes('/en-us/')) urls.add(mm[1]);
}
writeFileSync(join(here, 'raw', 'sitemap-en-us.txt'), [...urls].sort().join('\n'));
console.log('en-us urls', urls.size);
