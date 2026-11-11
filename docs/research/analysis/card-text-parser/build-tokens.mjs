// Token definitions from the Core Rules (edition 2026-10-09, rules 187.1-187.12), parsed with the same parser.
// Tokens without a gallery row (Mech, Sand Soldier, Shadow Clone, Tentacle, Bomb) are otherwise known only from reminder text.
// Usage: node build-tokens.mjs  ->  tokens.cr187.json
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCard } from './parser.mjs';
const cr = readFileSync(new URL('../raw/core-rules-2026-10-09.txt', import.meta.url), 'utf8').split('\n');
const start = cr.findIndex((l) => /^187\.1\.\s/.test(l)); const end = cr.findIndex((l, i) => i > start && /^188\.\s/.test(l));
const blocks = []; for (const l of cr.slice(start, end)) { const m = /^(187\.\d+)\.\s+(.*)$/.exec(l); if (m) blocks.push({ rule: m[1], text: m[2].trim() }); else if (blocks.length && l.trim() && !/^\s*See rule/.test(l)) blocks[blocks.length - 1].text += ' ' + l.trim(); }
const sym = (t) => t.replace(/\[M\]/g, '[Might]').replace(/\[E\]/g, '[Exhaust]').replace(/\[A\]/g, '[Rainbow]').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const tokens = blocks.map((b) => {
  const t = sym(b.text);
  const m = /^(?:A|The) (?:(\d+) \[Might\] )?(.+?) (unit |gear |battlefield )?token(?: with (\w+))? is a domainless (unit|gear|battlefield) token(?: with (.*?))?\.?$/.exec(t);
  if (!m) return { rule: b.rule, definition: t, ok: false };
  const rest = m[6] || ''; const quoted = [...rest.matchAll(/"([^"]+)"/g)].map((x) => x[1].replace(/\.$/, '') + '.');
  const tags = [...rest.matchAll(/the (\w+) tag/g)].map((x) => x[1]); const kws = [...rest.matchAll(/the (\w+) keyword/g)].map((x) => `[${x[1]}]`);
  const might = (/(\d+) Might/.exec(rest) || [])[1];
  const text = [...kws, ...quoted.map((q) => (/^\[(Deploy)\]\.$/.test(q) ? q.replace(/\.$/, '') : q))].join('\n');
  const card = { code: 'CR-' + b.rule, name: m[2], type: m[5], superTypes: ['token'], domains: [], energy: null, power: null, might: might != null ? +might : null, tags, text, effectText: '', codes: ['CR-' + b.rule], sets: [], printings: [] };
  const p = parseCard(card);
  return { rule: b.rule, name: m[2], type: m[5], might: card.might, tags, text, definition: t, parseStatus: p.parse.status, keywords: p.keywords, abilities: p.abilities };
});
writeFileSync(new URL('./tokens.cr187.json', import.meta.url), JSON.stringify({ source: 'Core Rules 2026-10-09, rules 187.1-187.12 (docs/research/analysis/raw/core-rules-2026-10-09.txt)', tokens }, null, 1));
for (const t of tokens) console.log(t.rule, t.name, t.type, t.might, t.tags, t.parseStatus, JSON.stringify(t.text));
