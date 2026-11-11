// Build analysis/cards-2026-11-11.json (one row per base card code) from the official card gallery __NEXT_DATA__.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('raw/gallery-2026-11-11.html', 'utf8');
const a = html.indexOf('<script id="__NEXT_DATA__"'); const b = html.indexOf('>', a) + 1; const e = html.indexOf('</script>', b);
const next = JSON.parse(html.slice(b, e));
const blade = next.props.pageProps.page.blades.find((x) => x.cards?.items);
const items = blade.cards.items;
const txt = (h) => (h || '').replace(/<br\s*\/?>/g, '\n').replace(/<\/p>\s*<p>/g, '\n').replace(/<[^>]+>/g, '').replace(/:rb_might:/g, '[Might]').replace(/:rb_exhaust:/g, '[Exhaust]').replace(/:rb_energy_(\d+):/g, '[$1]').replace(/:rb_rune_(\w+):/g, (m, d) => '[' + d[0].toUpperCase() + d.slice(1) + ']').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ');
const by = new Map();
for (const it of items) {
  const m = /^([A-Z0-9]+)-([A-Z]*\d+)([a-z*]*)\//.exec(it.publicCode) || /^([A-Z0-9]+)-([A-Z]*\d+)([a-z*]*)$/.exec(it.publicCode);
  if (!m) { console.log('skip code', it.publicCode); continue; }
  const base = `${m[1]}-${m[2]}`; const variant = m[3];
  const row = {
    code: base, publicCode: it.publicCode, name: it.subtitle ? `${it.name}, ${it.subtitle}` : it.name, set: it.set.value.id,
    type: (it.cardType.type || []).map((x) => x.id).join('/'), superTypes: (it.cardType.superType || []).map((x) => x.id),
    domains: (it.domain?.values || []).map((x) => x.id), energy: it.energy?.value?.id ?? null, power: it.power?.value?.id ?? null,
    might: it.might?.value?.id ?? null, tags: it.tags?.tags || [], text: txt(it.text?.richText?.body), rarity: it.rarity?.value?.id ?? null, variants: [],
  };
  if (!by.has(base) || (variant === '' && by.get(base).variant !== '')) { const old = by.get(base); row.variant = variant; row.variants = old ? old.variants : []; by.set(base, row); }
  by.get(base).variants.push(it.publicCode);
}
const cards = [...by.values()];
// Gallery data error seen 2026-11-11: several RAD [Deploy] gear are typed 'unit' with no Might. CR 830.1.a: Deploy is present on Gear.
for (const c of cards) if (c.type === 'unit' && c.might === null && /\[Deploy\]|\[Equip\]/.test(c.text) ) { c.type = 'gear'; c.typeFixed = true; }
// The gallery leaves cardType empty on a few RAD rows; infer it from stats/text and flag it.
for (const c of cards) if (!c.type) { c.inferType = true; c.type = /\[(Equip|Deploy|Quick-Draw)\]/.test(c.text) || (c.might === null && /^\[Exhaust\]:|\n\[Exhaust\]:|, \[Exhaust\]:/.test(c.text)) ? 'gear' : c.might !== null ? 'unit' : 'spell'; }
// name index: different printings of the same named card (e.g. promo reprints in another set) share deck-building identity
const count = (f) => { const m = {}; for (const c of cards) for (const v of [].concat(f(c))) m[v] = (m[v] || 0) + 1; return m; };
writeFileSync('cards-2026-11-11.json', JSON.stringify({ source: 'https://playriftbound.com/en-us/card-gallery/', fetchedAt: new Date().toISOString(), galleryItems: items.length, cards }, null, 0));
console.log('gallery items', items.length, 'base codes', cards.length, 'distinct names', new Set(cards.map((c) => c.name)).size);
console.log(count((c) => c.set)); console.log(count((c) => c.type)); console.log(count((c) => c.superTypes));
console.log(cards.filter((c) => c.set === 'RAD').slice(0, 3).map((c) => JSON.stringify(c)).join('\n'));
const sym = {}; for (const it of items) for (const s of (it.text?.richText?.body || '').match(/:rb_[a-z_0-9]+:/g) || []) sym[s] = (sym[s] || 0) + 1; console.log(sym);
