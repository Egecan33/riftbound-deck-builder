// Serial polite fetch of official Riftbound errata / FAQ / patch-note articles into raw/. Generic UA.
// usage: node fetch-official.mjs [--force]
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
export const SOURCES = `origins-errata https://playriftbound.com/en-us/news/rules-and-releases/riftbound-origins-card-errata/
origins-faq https://playriftbound.com/en-us/news/rules-and-releases/riftbound-origins-faq/
patch-notes-origins https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-patch-notes/
patch-notes-spiritforged https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-spiritforged-patch-notes/
patch-notes-unleashed https://playriftbound.com/en-us/news/rules-and-releases/riftbound-core-rules-unleashed-patch-notes/
patch-notes-vendetta https://playriftbound.com/en-us/news/announcements/core-rules-vendetta-patch-notes/
patch-notes-radiance https://playriftbound.com/en-us/news/announcements/core-rules-radiance-patch-notes-effective-october-16-2026/
spiritforged-errata https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-errata/
spiritforged-faq https://playriftbound.com/en-us/news/rules-and-releases/riftbound-spiritforged-faq/
unleashed-errata https://playriftbound.com/en-us/news/rules-and-releases/unleashed-errata-updates/
unleashed-faq https://playriftbound.com/en-us/news/rules-and-releases/unleashed-rules-faq-and-clarifications/
vendetta-errata https://playriftbound.com/en-us/news/announcements/vendetta-errata-updates/
vendetta-faq https://playriftbound.com/en-us/news/rules-and-releases/vendetta-rules-faq-and-clarifications/
radiance-errata https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/
radiance-faq https://playriftbound.com/en-us/news/organizedplay/radiance-rules-faq-and-clarifications/
rules-hub https://playriftbound.com/en-us/rules-hub/
news-index https://playriftbound.com/en-us/news/
news-rules-and-releases https://playriftbound.com/en-us/news/rules-and-releases/
news-announcements https://playriftbound.com/en-us/news/announcements/
news-organizedplay https://playriftbound.com/en-us/news/organizedplay/
robots https://playriftbound.com/robots.txt`.split('\n').map(l => l.split(' '));
for (const [name, url] of SOURCES) {
  const out = join(here, 'raw', `${name}.html`);
  if (existsSync(out) && !process.argv.includes('--force')) { console.log('cached', name); continue; }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)', 'Accept': 'text/html,*/*' } });
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok) writeFileSync(out, buf);
    console.log(name, res.status, buf.length, res.url);
  } catch (e) { console.log(name, 'ERR', e.message); }
  await new Promise(r => setTimeout(r, 2000));
}
