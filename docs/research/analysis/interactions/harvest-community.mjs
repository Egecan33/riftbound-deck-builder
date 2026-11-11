// Harvests riftbound.gg guide/synergy articles and extracts the card codes embedded per paragraph
// (the site marks cards as <span data-card="OGN-052"> and <div data-cards="OGN-052, SFD-208">).
// Serial, 1.2 s between requests, generic User-Agent. Output: data/community/rgg-comentions.json
// Run: node harvest-community.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const D = new URL('./data/community/', import.meta.url).pathname;
mkdirSync(D + 'pages', { recursive: true });
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const urls = JSON.parse(readFileSync(D + 'rgg-urls.json', 'utf8'))
  .filter((x) => /-guide\/$|synerg|combos|movement-101/.test(x.u) && !/nba-2k|sealed|canadian|genre-choice|beginners|rarity|smart-players/.test(x.u));
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const out = [];
for (const { u, d } of urls) {
  const slug = u.replace('https://riftbound.gg/', '').replace(/\/$/, '');
  const f = `${D}pages/${slug}.html`;
  let html;
  if (existsSync(f)) html = readFileSync(f, 'utf8');
  else {
    const r = await fetch(u, { headers: UA });
    html = await r.text();
    if (r.status !== 200) { console.log('skip', r.status, u); await sleep(1200); continue; }
    writeFileSync(f, html); await sleep(1200);
  }
  const published = (html.match(/article:published_time" content="([^"]+)/) || [])[1] ?? null;
  const modified = (html.match(/article:modified_time" content="([^"]+)/) || [])[1] ?? d ?? null;
  const author = (html.match(/name="author" content="([^"]+)/) || [])[1] ?? null;
  const art = (html.match(/<article[\s\S]*?<\/article>/) || [html])[0];
  const sections = [];
  for (const part of art.split(/<h[23][^>]*>/).slice(1)) {
    const title = strip(part.split(/<\/h[23]>/)[0]);
    const body = part.split(/<\/h[23]>/).slice(1).join(' ');
    const paragraphs = [];
    // paragraph-level units: <p>, <li>, and card-grid embeds
    for (const m of body.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
      const codes = [...new Set([...m[2].matchAll(/data-card="([A-Z]{3}-\d{3})[a-z*]?"/g)].map((x) => x[1]))];
      if (codes.length >= 2) paragraphs.push({ codes, words: strip(m[2]).split(' ').length });
    }
    const grids = [...body.matchAll(/data-cards="([^"]+)"/g)].map((m) => [...new Set(m[1].split(',').map((s) => s.trim().slice(0, 7)))]).filter((g) => g.length >= 2);
    if (paragraphs.length || grids.length) sections.push({ title, paragraphs, grids });
  }
  out.push({ url: u, published, modified, author, sections });
}
writeFileSync(D + 'rgg-comentions.json', JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'https://riftbound.gg', articles: out }, null, 1));
console.log('articles', out.length, 'sections', out.reduce((a, x) => a + x.sections.length, 0), 'paragraph sets', out.reduce((a, x) => a + x.sections.reduce((b, s) => b + s.paragraphs.length, 0), 0));
