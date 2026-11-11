import { readFileSync } from 'node:fs';
import { flight } from '../pa-lib.mjs';
const s = flight(readFileSync(process.argv[2], 'utf8'));
const mode = process.argv[3];
if (mode === 'len') console.log(s.length);
else if (mode === 'grep') { const re = new RegExp(process.argv[4], 'gi'); let n = 0; for (const m of s.matchAll(re)) { if (n++ >= Number(process.argv[5] || 5)) break; console.log(m.index, JSON.stringify(s.slice(Math.max(0, m.index - 150), m.index + 500))); } console.log('matches', [...s.matchAll(re)].length); }
else if (mode === 'keys') { const c = {}; for (const m of s.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)":/g)) c[m[1]] = (c[m[1]] || 0) + 1; console.log(Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' ')); }
