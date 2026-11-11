// Extra derived numbers for the doc: primer rule-of-thumb checks, existing curve targets vs measured, multiplayer text counts.
import { readFileSync } from 'node:fs';
import { strip } from './roles.mjs';
const r = JSON.parse(readFileSync('out/results.json', 'utf8')); const D = r.decks;
const q = (a, p) => { a = a.slice().sort((x, y) => x - y); const i = (a.length - 1) * p; return a[Math.floor(i)] + (a[Math.ceil(i)] - a[Math.floor(i)]) * (i - Math.floor(i)); };
const sh = (f) => (100 * D.filter(f).length / D.length).toFixed(0) + '%';
const band = (f) => `${q(D.map(f), 0.1)}/${q(D.map(f), 0.25)}/${q(D.map(f), 0.5)}/${q(D.map(f), 0.75)}/${q(D.map(f), 0.9)}`;
console.log('n', D.length);
console.log('energy<=2 cards p10/25/50/75/90:', band((d) => d.f.e01 + d.f.e2), '| energy 3:', band((d) => d.f.e3), '| energy 4-5:', band((d) => d.f.e4 + d.f.e5), '| 6+:', band((d) => d.f.e6p));
console.log('primer: >=9 units costing 2-4:', sh((d) => d.f.units_e2to4 >= 9), '| >=6 interactive (removal/trick/counter/debuff):', sh((d) => d.f.interaction >= 6), '| units >= spells+gear:', sh((d) => d.f.units >= d.f.spells + d.f.gear), '| extra copies of chosen champion (>=2 total):', sh((d) => d.f.chosenCopies >= 2), '| 3 signature:', sh((d) => d.f.signature === 3), '| 0 signature:', sh((d) => d.f.signature === 0));
console.log('exactly 40 main: all valid by construction; rune 6-6:', sh((d) => d.f.runeMajor === 6), '7-5:', sh((d) => d.f.runeMajor === 7), '8-4:', sh((d) => d.f.runeMajor === 8), '>=9:', sh((d) => d.f.runeMajor >= 9));
console.log('0 counterspells:', sh((d) => d.f.r_counterspells === 0), '| 0 sweepers:', sh((d) => d.f.x_sweeper === 0), '| has points/extra-turn card:', sh((d) => d.f.x_points > 0), '| 0 hard removal:', sh((d) => d.f.r_hard_removal === 0));
console.log('distinct p50', q(D.map((d) => d.f.distinct), 0.5), 'copies in 3-ofs p50', q(D.map((d) => d.f.x3 * 3), 0.5));
const { cards } = JSON.parse(readFileSync('cards-2026-11-11.json', 'utf8'));
const by = new Map(); for (const c of cards) if (['unit', 'spell', 'gear'].includes(c.type) && !c.superTypes.includes('token')) { const o = by.get(c.name); if (!o || (o.rarity === 'showcase' && c.rarity !== 'showcase')) by.set(c.name, c); }
const P = [...by.values()]; const T = (c) => strip(c.text);
const cnt = (re, neg) => { const m = P.filter((c) => re.test(T(c)) && !(neg && neg.test(T(c)))); return `${m.length} (e.g. ${m.slice(0, 4).map((c) => c.name).join('; ')})`; };
console.log('pool', P.length);
console.log('"each opponent"/"opponents"(plural scaling):', cnt(/\beach opponent\b|\bopponents\b|for each opponent/i));
console.log('"each player":', cnt(/\beach (other )?player\b/i));
console.log('"choose an opponent"/"an opponent" (single):', cnt(/\b(choose )?an opponent\b/i));
console.log('"friendly":', cnt(/\bfriendly\b/i));
console.log('"you or allies"/"ally"/"allies":', cnt(/\b(ally|allies)\b/i));
console.log('all units / all enemy units / each unit:', cnt(/\b(all|each) (enemy )?units?\b/i));
console.log('"all battlefields"/"each battlefield"/"for each battlefield":', cnt(/\b(all|each|every) battlefields?\b|for each battlefield/i));
console.log('victory score / points referencing:', cnt(/victory score|points?\b/i));
console.log('"your units"/"units you control":', cnt(/\byour units\b|units you control/i));
console.log('legends text w/ friendly:', cards.filter((c) => c.type === 'legend' && /friendly/i.test(c.text)).map((c) => c.tags[0]).filter((v, i, a) => a.indexOf(v) === i).join(', '));
console.log('battlefields w/ "allies" or "each player":', cards.filter((c) => c.type === 'battlefield' && /\ball(y|ies)\b|each player/i.test(c.text)).map((c) => c.name).filter((v, i, a) => a.indexOf(v) === i).length, '/', new Set(cards.filter((c) => c.type === 'battlefield').map((c) => c.name)).size);
