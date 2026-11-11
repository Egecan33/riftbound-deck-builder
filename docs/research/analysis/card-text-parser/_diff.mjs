import { readFileSync } from 'node:fs'; import { ab } from './show.mjs';
const A = JSON.parse(readFileSync(new URL('./out/_parsed.prev.json', import.meta.url))), B = JSON.parse(readFileSync(new URL('./out/parsed.json', import.meta.url)));
const bm = new Map(B.map((c) => [c.code, c])); let n = 0;
for (const a of A) { const b = bm.get(a.code); const x = a.abilities.map(ab).join('\n'), y = b.abilities.map(ab).join('\n'); if (x !== y) { n++; const xs = x.split('\n'), ys = y.split('\n'); console.log(`${a.code} ${a.name}`); xs.forEach((l, i) => { if (l !== ys[i]) console.log('   - ' + l.slice(0, 260) + '\n   + ' + (ys[i] || '').slice(0, 260)); }); } }
console.log('changed cards', n);
