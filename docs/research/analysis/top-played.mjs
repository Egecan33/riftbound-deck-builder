// Print the N most played main-deck cards (by number of lists) with text and roles: frequency-weighted validation sample.
import { readFileSync } from 'node:fs';
import { roles, speed, strip } from './roles.mjs';
const { cards } = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8'));
const by = new Map(); for (const c of cards) { const o = by.get(c.name); if (!o || (o.rarity === 'showcase' && c.rarity !== 'showcase')) by.set(c.name, c); }
const cnt = {};
for (const l of readFileSync('raw/pa-decks.jsonl', 'utf8').trim().split('\n')) { const d = JSON.parse(l); for (const e of [...d.champions, ...d.main]) cnt[e.name] = (cnt[e.name] || 0) + 1; }
const N = Number(process.argv[2] || 45), from = Number(process.argv[3] || 0);
Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(from, from + N).forEach(([n, v], i) => { const c = by.get(n); if (!c) return console.log(n, 'MISSING'); console.log(`${from + i + 1}. ${n} (${v}) [${c.type} ${c.energy}e ${c.power ?? 0}p] ${strip(c.text).slice(0, 200)}\n    => ${roles(c).join(', ') || '(none)'} | ${speed(c)}`); });
