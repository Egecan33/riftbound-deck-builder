// Build out/pool.json: one row per distinct rules name from the official card gallery snapshot.
// Source: https://playriftbound.com/en-us/card-gallery/ (embedded __NEXT_DATA__), cached at ../raw/gallery-2026-11-11.html
// Usage: node build-pool.mjs [path-to-gallery-html]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || [join(HERE, 'raw/gallery-2026-11-11.html'), join(HERE, '../raw/gallery-2026-11-11.html')].find(existsSync);
const html = readFileSync(src, 'utf8');
const a = html.indexOf('<script id="__NEXT_DATA__"'); const b = html.indexOf('>', a) + 1; const e = html.indexOf('</script>', b);
const items = JSON.parse(html.slice(b, e)).props.pageProps.page.blades.find((x) => x.cards?.items).cards.items;

/** HTML rich text -> plain text. Icons become bracket tokens; list items become "\n- " lines. */
export function plain(h) {
  return (h || '')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/p>\s*<p>/g, '\n').replace(/<li>/g, '\n- ').replace(/<[^>]+>/g, '')
    .replace(/:rb_might:/g, '[Might]').replace(/:rb_exhaust:/g, '[Exhaust]').replace(/:rb_energy_(\d+):/g, '[$1]')
    .replace(/:rb_rune_(\w+):/g, (m, d) => '[' + d[0].toUpperCase() + d.slice(1) + ']')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
}

const rows = [];
for (const it of items) {
  const m = /^([A-Z0-9]+)-([A-Z]*\d+)([a-z*]*)(?:\/|$)/.exec(it.publicCode);
  if (!m) { console.error('skip code', it.publicCode); continue; }
  const superTypes = (it.cardType.superType || []).map((x) => x.id);
  const isChampionUnit = superTypes.includes('champion');
  rows.push({
    code: `${m[1]}-${m[2]}`, variant: m[3], publicCode: it.publicCode,
    // rules.md 11: name + ", " + subtitle is the rules name only for champion units.
    name: isChampionUnit && it.subtitle ? `${it.name}, ${it.subtitle}` : it.name,
    set: it.set.value.id, type: (it.cardType.type || []).map((x) => x.id).join('/'), superTypes,
    domains: (it.domain?.values || []).map((x) => x.id), energy: it.energy?.value?.id ?? null, power: it.power?.value?.id ?? null,
    might: it.might?.value?.id ?? null, tags: it.tags?.tags || [], rarity: it.rarity?.value?.id ?? null,
    text: plain(it.text?.richText?.body), effectText: plain(it.effect?.richText?.body),
    // The image alt text carries its own type word ("Riftbound Spell: Supernova. ..."); it is hand-written per card image and
    // disagrees with cardType on a number of RAD rows where cardType is plainly wrong (a "unit" with no Might and [Action]).
    altType: (/^Riftbound ([A-Za-z ]+?):/.exec(it.cardImage?.accessibilityText || '') || [])[1]?.toLowerCase() ?? null,
  });
}
// group by rules name + type (a legend and a unit never share a name, but be safe)
const by = new Map();
for (const r of rows) { const k = r.name + '|' + (r.type || '?'); if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
const TYPES = ['unit', 'spell', 'gear', 'legend', 'battlefield', 'rune'];
const SET_ORDER = ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD'];
const cards = [];
for (const [, g] of by) {
  // canonical printing: prefer base (no variant suffix) printings, then the longest text (carries reminder text), then earliest set
  const sorted = [...g].sort((x, y) => (x.variant ? 1 : 0) - (y.variant ? 1 : 0) || y.text.length - x.text.length || SET_ORDER.indexOf(x.set) - SET_ORDER.indexOf(y.set) || x.code.localeCompare(y.code));
  const c = { ...sorted[0] };
  c.printings = [...new Set(g.map((x) => x.publicCode))].sort();
  c.codes = [...new Set(g.map((x) => x.code))].sort();
  c.sets = SET_ORDER.filter((s) => g.some((x) => x.set === s));
  c.firstSet = c.sets[0];
  // fill gaps from sibling printings (gallery leaves type/domains empty on some RAD rows)
  for (const f of ['type', 'energy', 'power', 'might']) if (c[f] === null || c[f] === '') { const o = g.find((x) => x[f] !== null && x[f] !== ''); if (o) c[f] = o[f]; }
  if (!c.domains.length) { const o = g.find((x) => x.domains.length); if (o) c.domains = o.domains; }
  // Type resolution. Gallery cardType is wrong or empty on some RAD rows (2026-11-11). Evidence order:
  //  1. structural evidence from stats/text (Might => unit; [Equip]/[Deploy]/[Quick-Draw] => gear, CR 818/819/830),
  //  2. the image alt-text type word, 3. the cardType field.
  const galleryType = c.type; const alt = TYPES.includes(c.altType) ? c.altType : null;
  const bare = c.text.replace(/\([^()]*\)/g, '');
  const structural = /(^|\n)\[(Equip|Deploy|Quick-Draw)\]|(^|\n)Equip /.test(bare) ? 'gear' : null;
  const resolved = structural ?? alt ?? (galleryType || null) ?? (c.might !== null ? 'unit' : null);
  if (resolved !== galleryType) c.typeNote = `gallery cardType=${galleryType || '(empty)'}, alt=${c.altType}, resolved=${resolved}`;
  c.galleryType = galleryType; c.type = resolved || 'spell';
  // Equipment prints its Might bonus in the Might slot (CR 818: Equip). Keep it apart from unit Might.
  if (c.type === 'gear' && c.might !== null) { c.mightBonus = c.might; c.might = null; }
  // UNL-T04 "Buff" and UNL-T08 "XP Tracker" are play aids (counter / tracker cards), not gameplay cards.
  c.playAid = ['Buff', 'XP Tracker'].includes(c.name) && c.superTypes.includes('token');
  delete c.variant; delete c.publicCode;
  cards.push(c);
}
cards.sort((x, y) => x.code.localeCompare(y.code));
writeFileSync(join(HERE, 'out/pool.json'), JSON.stringify({ source: 'https://playriftbound.com/en-us/card-gallery/', snapshot: '2026-11-11', printings: items.length, cards }, null, 0));
const count = (f) => { const m = {}; for (const c of cards) for (const v of [].concat(f(c))) m[v] = (m[v] || 0) + 1; return m; };
console.log('printings', items.length, 'distinct cards', cards.length);
console.log('firstSet', count((c) => c.firstSet)); console.log('in set', count((c) => c.sets)); console.log('type', count((c) => c.type)); console.log('super', count((c) => c.superTypes.join('+') || '-'));
console.log('typeNote', cards.filter((c) => c.typeNote).length); for (const c of cards.filter((c) => c.typeNote)) console.log('  ', c.code, c.name, '|', c.typeNote, '| E', c.energy, 'M', c.might);
console.log('altTypes', count((c) => String(c.altType)), cards.filter((c) => !TYPES.includes(c.altType)).map((c) => c.code + ' ' + c.name + ' ' + c.altType + ' ' + c.type).join('; '));
console.log('effectText rows', cards.filter((c) => c.effectText).length, 'no text', count((c) => (c.text ? 'has' : 'none:' + c.type)));
