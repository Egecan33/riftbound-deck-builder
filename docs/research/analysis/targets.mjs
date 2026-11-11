// Section 3.1 table: target band p25–p75 and tolerance p10–p90 per archetype, from out/results.json.
import { readFileSync, writeFileSync } from 'node:fs';
const D = JSON.parse(readFileSync('out/results.json', 'utf8')).decks;
const q = (a, p) => { a = a.slice().sort((x, y) => x - y); const i = (a.length - 1) * p; return a[Math.floor(i)] + (a[Math.ceil(i)] - a[Math.floor(i)]) * (i - Math.floor(i)); };
const ARCH = ['unit-aggro', 'spell-tempo', 'gear-engine', 'big-control'];
const ROWS = [['units', 'units'], ['spells', 'spells'], ['gear', 'gear'], ['Energy 0-1', 'e01'], ['Energy 2', 'e2'], ['Energy 3', 'e3'], ['Energy 4', 'e4'], ['Energy 5', 'e5'], ['Energy 6+', 'e6p'], ['average Energy', 'avgEnergy'], ['units costing ≤ 2', 'units_le2'], ['units costing 2-4', 'units_e2to4'],
  ['removal, any kind (kill, damage, bounce, stun, sweeper)', 'r_removal'], ['kill or damage removal', 'r_hard_removal'], ['card flow (draw + selection)', 'r_card_flow'], ['tempo (movement + ready/enter ready)', 'r_tempo'], ['combat tricks', 'r_combat_tricks'], ['counterspells', 'r_counterspells'], ['protection', 'r_protection'], ['ramp', 'r_ramp'],
  ['finishers (points, extra turn, 6+ units)', 'r_finishers'], ['interaction total', 'interaction'], ['reaction-speed spells', 'sp_reaction'], ['printed power pips', 'powerPips'], ['champion units, all', 'championUnits'], ['signature cards', 'signature'], ['names played as 3-ofs', 'x3']];
const cell = (rows, m) => { const a = rows.map((d) => d.f[m]); const r = (p) => (m === 'avgEnergy' ? q(a, p).toFixed(2) : Math.round(q(a, p))); return `${r(0.25)}–${r(0.75)} (${r(0.1)}–${r(0.9)})`; };
const o = [`| role / metric | ${ARCH.map((a) => `${a} (n=${D.filter((d) => d.arch === a).length})`).join(' | ')} |`, '|---|---|---|---|---|'];
for (const [label, m] of ROWS) o.push(`| ${label} | ${ARCH.map((a) => cell(D.filter((d) => d.arch === a), m)).join(' | ')} |`);
writeFileSync('out/13-targets.md', o.join('\n'));
const pick = (a, ms) => ms.map((m) => `${m} ${cell(D.filter((d) => d.arch === a), m)}`).join('; ');
console.log('unit-aggro:', pick('unit-aggro', ['units', 'units_le2', 'r_tempo', 'sp_reaction', 'sp_action', 'r_counterspells']));
console.log('spell-tempo:', pick('spell-tempo', ['units', 'sp_reaction', 'r_counterspells', 'r_combat_tricks', 'r_protection', 'x_removal_bounce', 'x_stun']));
console.log('gear-engine:', pick('gear-engine', ['gear', 'e01', 'r_card_flow']));
console.log('big-control:', pick('big-control', ['e6p', 'r_removal', 'r_card_flow', 'units_le2', 'r_counterspells', 'x_sweeper']));
