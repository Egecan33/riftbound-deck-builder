import { readFileSync } from 'node:fs';
import { flight, balanced } from './pa-lib.mjs';
const s = flight(readFileSync(process.argv[2], 'utf8'));
const k = s.indexOf('"legendId"');
// walk back to enclosing object start: find '{"id":"' before k
let i = s.lastIndexOf('{"id":"', k);
const obj = JSON.parse(balanced(s, i));
const short = (v, d = 0) => Array.isArray(v) ? (v.length ? [short(v[0], d + 1), `...x${v.length}`] : []) : v && typeof v === 'object' ? (d > 3 ? '{..}' : Object.fromEntries(Object.entries(v).map(([a, b]) => [a, short(b, d + 1)]))) : (typeof v === 'string' ? v.slice(0, 60) : v);
console.log(JSON.stringify(short(obj), null, 1).slice(0, 5000));
