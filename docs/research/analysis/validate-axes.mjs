// Print a deterministic sample of N pool cards with their synergy-axis labels (E = enabler, P = payoff), for hand validation.
// usage: node validate-axes.mjs [N] [seed]   (importing axes.mjs also rewrites out/09-axes.md with identical content)
import { readFileSync } from 'node:fs';
import { strip } from './roles.mjs';
const log = console.log; console.log = () => {};
const { AXES } = await import('./axes.mjs');
console.log = log;
const { cards } = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8'));
const by = new Map();
for (const c of cards) if (['unit', 'spell', 'gear'].includes(c.type) && !c.superTypes.includes('token')) { const o = by.get(c.name); if (!o || (o.rarity === 'showcase' && c.rarity !== 'showcase')) by.set(c.name, c); }
const L = [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
const N = Number(process.argv[2] || 40); let seed = Number(process.argv[3] || 20261111);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = new Set(); while (pick.size < N) pick.add(Math.floor(rnd() * L.length));
// Structural tests (type, cost or Might only) cannot be wrong on text; they are listed separately.
const STRUCT = new Set(['gear matters:E', 'spell-slinging:E', 'show off (RAD):E', 'legion (second card):E']);
[...pick].forEach((i, n) => {
  const c = L[i]; const lab = [], st = [];
  for (const [k, ax] of Object.entries(AXES)) { for (const side of ['e', 'p']) if (ax[side](c)) { const id = `${k}:${side.toUpperCase()}`; (STRUCT.has(id) ? st : lab).push(id); } }
  log(`${n + 1}. ${c.name} [${c.type} ${c.energy ?? '-'}e ${c.power ?? 0}p ${c.might ?? '-'}m tags=${c.tags.join('/')}] ${strip(c.text).slice(0, 330)}\n    => ${lab.join(' | ') || '(none)'}${st.length ? '   {structural: ' + st.join(', ') + '}' : ''}`);
});
