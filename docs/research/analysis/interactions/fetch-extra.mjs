// Fetches two extra community pages named in interactions.md section 1 (serial, generic User-Agent) and prints the text around "loop"/"combo".
// Run: node fetch-extra.mjs
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const D = new URL('./data/community/', import.meta.url).pathname;
const pages = [['riftmana-reksai.html', 'https://riftmana.com/?p=52877'], ['riftjudge-589.html', 'https://app.riftjudge.com/questions/589']];
for (const [f, u] of pages) {
  let h;
  if (existsSync(D + f)) h = readFileSync(D + f, 'utf8');
  else { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)' }, redirect: 'follow' }); h = await r.text(); console.log(u, r.status, r.url); writeFileSync(D + f, h); await new Promise((x) => setTimeout(x, 1500)); }
  const t = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#8217;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  console.log(f, 'title:', (h.match(/<title>([^<]*)/) || [])[1], '| published:', (h.match(/article:published_time" content="([^"]+)/) || [])[1], '| chars', t.length);
  const i = t.search(/infinite|loop/i); console.log(t.slice(Math.max(0, i - 600), i + 2200));
}
