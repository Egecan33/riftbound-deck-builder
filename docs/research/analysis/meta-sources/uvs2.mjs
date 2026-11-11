import { readFileSync } from 'node:fs';
import { flight, balanced } from '../pa-lib.mjs';
const s = flight(readFileSync(process.argv[2], 'utf8'));
const PII = /first_name|last_name|best_identifier|picture|pronoun|username|display_name|special_user|player_team_name|^team_name$|email/;
const red = (v, k = '', d = 0) => Array.isArray(v) ? (v.length ? [red(v[0], k, d + 1), `…(${v.length} items)`] : []) : v && typeof v === 'object' ? (d > 6 ? '{…}' : Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, red(x, kk, d + 1)]))) : (typeof v === 'string' && PII.test(k) ? '<redacted>' : (typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '…' : v));
const around = (needle, minLen, must) => { let p = s.indexOf(needle); for (let t = 0; t < 400 && p > 0; t++) { p = s.lastIndexOf('{', p - 1); const b = balanced(s, p); if (b && b.length >= minLen && must.every((m) => b.includes(m))) { try { return JSON.parse(b); } catch {} } } return null; };
const reg = around('"final_place_in_standings"', 2000, ['"results"', 'final_place_in_standings']);
console.log('REGISTRATIONS', JSON.stringify(red(reg), null, 1).slice(0, 2000));
const ev = around('"round_number"', 5000, ['round_number', 'phase_name', 'start_datetime']) || around('"round_number"', 5000, ['round_number', 'phase_name']);
if (ev) { console.log('EVENT keys', Object.keys(ev).join(',')); const big = Object.entries(ev).filter(([, v]) => Array.isArray(v) && v.length && typeof v[0] === 'object').map(([k]) => k); const rest = Object.fromEntries(Object.entries(ev).filter(([k]) => !big.includes(k))); console.log(JSON.stringify(red(rest)).slice(0, 2600)); for (const k of big) console.log('ARR ' + k, JSON.stringify(red(ev[k]), null, 0).slice(0, 1500)); }
