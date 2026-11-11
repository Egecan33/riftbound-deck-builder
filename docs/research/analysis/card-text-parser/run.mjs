// Parse the whole pool and measure coverage. Usage: node run.mjs [--quiet]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCard } from './parser.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const pool = JSON.parse(readFileSync(join(HERE, 'out/pool.json'), 'utf8')).cards;
// Gameplay pool: everything except basic runes (no text) and the two play-aid "tokens".
const cards = pool.filter((c) => c.type !== 'rune' && !c.playAid);
const parsed = cards.map(parseCard);
writeFileSync(join(HERE, 'out/parsed.json'), JSON.stringify(parsed));
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
const tally = (rows, f) => { const m = { full: 0, partial: 0, none: 0 }; for (const r of rows) m[f(r)]++; return m; };
const fmt = (m) => { const n = m.full + m.partial + m.none; return `${n} | full ${m.full} (${pct(m.full, n)}) | partial ${m.partial} (${pct(m.partial, n)}) | none ${m.none} (${pct(m.none, n)})`; };
const sents = parsed.flatMap((c) => c.parse.sentences.map((s) => ({ ...s, code: c.code, name: c.name, set: c.sets[0], type: c.type })));
const report = { cards: { all: tally(parsed, (c) => c.parse.status) }, sentences: { all: tally(sents, (s) => s.status) }, bySet: {}, byType: {} };
console.log('CARDS     ', fmt(report.cards.all));
console.log('SENTENCES ', fmt(report.sentences.all));
for (const set of ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']) { const cs = parsed.filter((c) => c.sets.includes(set)); report.bySet[set] = { cards: tally(cs, (c) => c.parse.status), sentences: tally(cs.flatMap((c) => c.parse.sentences), (s) => s.status) }; console.log(set.padEnd(4), 'cards', fmt(report.bySet[set].cards), '|| sentences', fmt(report.bySet[set].sentences)); }
for (const type of ['unit', 'spell', 'gear', 'legend', 'battlefield']) { const cs = parsed.filter((c) => c.type === type); report.byType[type] = { cards: tally(cs, (c) => c.parse.status), sentences: tally(cs.flatMap((c) => c.parse.sentences), (s) => s.status) }; console.log(type.padEnd(11), 'cards', fmt(report.byType[type].cards), '|| sentences', fmt(report.byType[type].sentences)); }
// unparsed / partial sentence patterns, ranked by frequency
const shape = (t) => t.replace(/\[(\d+|Fury|Calm|Mind|Body|Chaos|Order|Rainbow)\]/g, '[C]').replace(/(\[C\])+/g, '[C]').replace(/\b\d+\b/g, 'N').replace(/\b(two|three|four)\b/g, 'N').replace(/[+-]N/g, '±N');
const bad = sents.filter((s) => s.status !== 'full');
const groups = new Map(); for (const s of bad) { const k = shape(s.text); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
writeFileSync(join(HERE, 'out/unparsed.txt'), ranked.map(([k, v]) => `${v.length}\t${v[0].status}\t${k}\t${v.map((x) => x.code).join(',')}`).join('\n') + '\n');
report.unparsedSentences = bad.length; report.unparsedShapes = ranked.length;
writeFileSync(join(HERE, 'out/coverage.json'), JSON.stringify(report, null, 1));
// leftover unknown clause heads: first two words of every clause the grammar could not match
const heads = {}; const walk = (e) => { if (!e) return; if (Array.isArray(e)) return e.forEach(walk); if (e.verb === 'unknown') { const h = e.raw.split(/\s+/).slice(0, 2).join(' ').toLowerCase(); heads[h] = (heads[h] || 0) + 1; } if (e.options) walk(e.options); if (e.granted) for (const a of e.granted) walk(a.effects); };
for (const c of parsed) for (const a of c.abilities) walk(a.effects);
report.unknownHeads = Object.entries(heads).sort((a, b) => b[1] - a[1]);
writeFileSync(join(HERE, 'out/coverage.json'), JSON.stringify(report, null, 1));
if (!process.argv.includes('--quiet')) { console.log('\nnot-full sentences', bad.length, 'distinct shapes', ranked.length); console.log('unknown clause heads:', report.unknownHeads.slice(0, 40).map((e) => e.join(':')).join(' | ')); }
