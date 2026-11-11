// Print a deterministic sample of N cards with assigned roles, for hand validation. usage: node validate-roles.mjs [N] [seed]
import { readFileSync } from 'node:fs';
import { roles, speed, strip, ROLE_RULES } from './roles.mjs';
const { cards } = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8'));
const by = new Map();
for (const c of cards) if (['unit', 'spell', 'gear'].includes(c.type) && !c.superTypes.includes('token')) { if (!by.has(c.name) || c.rarity !== 'showcase') by.set(c.name, c); }
const L = [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
const N = Number(process.argv[2] || 40); let seed = Number(process.argv[3] || 20261111);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = new Set(); while (pick.size < N) pick.add(Math.floor(rnd() * L.length));
if (process.argv[4] === 'counts') { const m = {}; for (const c of L) for (const r of roles(c)) m[r] = (m[r] || 0) + 1; console.log(L.length, m); const sp = {}; for (const c of L) sp[c.type + ':' + speed(c)] = (sp[c.type + ':' + speed(c)] || 0) + 1; console.log(sp); }
else [...pick].forEach((i, n) => { const c = L[i]; console.log(`${n + 1}. ${c.name} [${c.type} ${c.energy ?? '-'}e ${c.power ?? 0}p ${c.might ?? '-'}m ${c.domains.join('/')}] ${strip(c.text).slice(0, 210)}\n    => ${roles(c).join(', ') || '(none)'} | ${speed(c)}`); });
