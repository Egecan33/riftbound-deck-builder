// Errata texts for the parser. Source: ../rulings-and-errata/out/errata.json (70 rows extracted from the five official
// errata articles + three FAQ-only revisions; see rulings-and-errata.md section 1). For every card whose gallery text
// (out/pool.json) is NOT the errata text, emit the errata text converted to the pool notation.
// Usage: node build-errata.mjs   ->  errata-texts.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const E = JSON.parse(readFileSync(join(HERE, '../rulings-and-errata/out/errata.json'), 'utf8'));
const pool = JSON.parse(readFileSync(join(HERE, 'out/pool.json'), 'utf8')).cards;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const DOM = /\[(Fury|Calm|Mind|Body|Chaos|Order)\]/g;
// comparison form: errata notation, reminder text removed, whitespace/quotes collapsed
const norm = (t) => t.replace(/\[(Might|M|S)\]/g, '[M]').replace(/\[(Exhaust|E|T)\]/g, '[E]').replace(/\[(Rainbow|Any|A)\]/g, '[A]').replace(DOM, '[C]')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s*\([^()]*\)/g, '').replace(/\s+/g, ' ').trim();
const out = []; const skipped = [];
for (const r of E.rows) {
  const codes = r.printings.map((p) => p.code.split('/')[0]);
  const c = pool.find((x) => x.codes.some((k) => codes.includes(k)));
  if (!c) { skipped.push([r.card, 'no pool card']); continue; }
  const full = c.text + (c.effectText ? '\n' + c.effectText : '');
  const en = norm(r.errata.new.replace(/^Action \(/, '[Action] (').replace(/_\(here\)_/, 'here'));
  if (norm(full) === en || norm(c.text) === en) { skipped.push([c.code, 'gallery already shows errata text']); continue; }
  // [C] -> the card's domain rune: single-domain card, else the n-th domain rune of the gallery text
  const galleryRunes = [...full.matchAll(DOM)].map((m) => m[0]); let i = 0; let ambiguous = false;
  // defects of the errata articles themselves: a keyword printed without brackets (Disintegrate), italic markup (Edge of Night)
  let text = r.errata.new.replace(/^Action \(/, '[Action] (').replace(/_\(here\)_/, 'here').replace(/[‘’]/g, "'").replace(/\[(M|S)\]/g, '[Might]').replace(/\[(E|T)\]/g, '[Exhaust]').replace(/\[A\]/g, '[Rainbow]')
    .replace(/\[C\]/g, () => { if (c.domains.length === 1) return `[${cap(c.domains[0])}]`; const g = galleryRunes[i++]; if (g) return g; ambiguous = true; return '[Rainbow]'; });
  // equipment: the errata block carries rules text and effect text together; split on the gallery's effect text position
  let effectText = null;
  if (c.effectText) { const lines = text.split('\n'); const n = c.effectText.split('\n').length; effectText = lines.slice(-n).join('\n'); text = lines.slice(0, -n).join('\n'); }
  out.push({ code: c.code, name: c.name, erratumId: r.errata.id, date: r.errata.date, url: r.errata.url, standing: r.errata.status || 'errata-article', galleryState: r.gallery,
    ambiguousRune: ambiguous || undefined, galleryText: c.text, text, ...(effectText !== null ? { galleryEffectText: c.effectText, effectText } : {}) });
}
out.sort((a, b) => a.code.localeCompare(b.code));
writeFileSync(join(HERE, 'errata-texts.json'), JSON.stringify({ generated: '2026-11-11', source: 'docs/research/analysis/rulings-and-errata/out/errata.json', note: 'Cards whose official-gallery text (snapshot 2026-11-11) is not the current errata text. text = errata text in pool notation.', cards: out }, null, 1));
console.log('errata rows', E.rows.length, 'applied', out.length, 'skipped', skipped.length); console.log(skipped.map((s) => s.join(': ')).join('\n'));
for (const o of out) if (o.ambiguousRune || o.effectText !== undefined) console.log('CHECK', o.code, JSON.stringify(o.text), JSON.stringify(o.effectText));
