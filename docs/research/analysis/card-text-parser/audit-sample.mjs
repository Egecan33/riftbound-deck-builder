// Hand-audit sample: 60 cards, seeded, stratified so that RAD has 16 and every other set is represented. Prints text + parse.
import { card, loadParsed } from './show.mjs';
import { writeFileSync } from 'node:fs';
const P = loadParsed().filter((c) => c.textUsed.replace(/\([^()]*\)/g, '').trim());
let seed = 20261111; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const pick = (arr, n) => { const a = [...arr]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
const quota = { OGN: 13, OGS: 3, SFD: 10, UNL: 10, VEN: 8, RAD: 16 };
const sample = Object.entries(quota).flatMap(([set, n]) => pick(P.filter((c) => c.sets[0] === set), n));
writeFileSync(new URL('./out/audit-sample.json', import.meta.url), JSON.stringify(sample.map((c) => c.code)));
for (const c of sample) console.log(card(c) + '\n');
