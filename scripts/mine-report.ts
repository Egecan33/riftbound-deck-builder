// pnpm tsx scripts/mine-report.ts [--json out.json]
// Runs the card mine over the full synced pool (data/forge.db) and prints the coverage report.
import { writeFileSync } from 'node:fs';
import { coverage, mineCard as mineOne, mineOverridesById, TYPE_TRAITS, type MineOverrideEntry } from '@/engine/mine';
import type { Card } from '@/engine/types';
import { readOverridesFile } from '@/server/syncdata';
import { openDb } from '@/server/db';
import { loadCardDb } from '@/server/carddb';

const db = loadCardDb(openDb());
const cards = db.all();
const started = Date.now();
const overrides = mineOverridesById((readOverridesFile() as unknown as { mine?: MineOverrideEntry[] }).mine, cards);
const mineCard = (c: Card) => mineOne(c, overrides[c.id]);
const report = coverage(cards, overrides);
const byId = new Map(cards.map((c) => [c.id, c]));
const pct = (xs: number[], p: number) => xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] : NaN;
const stats = (xs: number[]) => xs.length ? `n=${xs.length} mean=${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)} p10=${pct(xs, 0.1).toFixed(2)} p50=${pct(xs, 0.5).toFixed(2)} p90=${pct(xs, 0.9).toFixed(2)}` : 'n=0';

console.log(`pool ${cards.length} cards, ${Date.now() - started} ms`);
console.log('traits per card (count of traits: cards):', JSON.stringify(report.traitsPerCard));
const zeroTotal = cards.filter((c) => mineCard(c).traits.length === 0);
console.log(`cards with zero traits of any kind: ${zeroTotal.length} (${['legend', 'battlefield', 'rune', 'unit', 'spell', 'gear', 'null'].map((t) => `${t} ${zeroTotal.filter((c) => String(c.type) === t).length}`).join(', ')})`);
console.log(`cards with text but no mechanic trait: ${report.noTraits.length}`);
const main = cards.filter((c) => c.type === 'unit' || c.type === 'spell' || c.type === 'gear');
console.log(`  of which main-deck cards: ${report.noTraits.filter((id) => main.some((c) => c.id === id)).length} of ${main.length}`);
console.log(`unparsed sentences: ${report.unparsedTotal} of ${report.sentenceTotal} (${report.unparsedSentences.length} distinct); structural sentences set aside: ${report.structuralTotal}`);
for (const set of ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD']) {
  for (const type of ['unit', 'spell', 'gear']) {
    const xs = main.filter((c) => c.set === set && c.type === type && !c.dataIncomplete).map((c) => mineCard(c).foundation ?? 0);
    console.log(`foundation ${set} ${type}: ${stats(xs)}`);
  }
  const xs = main.filter((c) => c.set === set && !c.dataIncomplete).map((c) => mineCard(c).foundation ?? 0);
  const none = main.filter((c) => c.set === set && report.noTraits.includes(c.id)).length;
  const mech = main.filter((c) => c.set === set).map((c) => mineCard(c).traits.filter((t) => !TYPE_TRAITS.has(t)).length);
  console.log(`foundation ${set} all main: ${stats(xs)}; mechanic traits per card ${stats(mech)}; no-mechanic ${none}`);
}
for (const type of ['unit', 'spell', 'gear']) {
  const of = (rad: boolean) => main.filter((c) => (c.set === 'RAD') === rad && c.type === type && !c.dataIncomplete).map((c) => mineCard(c).foundation ?? 0);
  console.log(`foundation ${type}: Radiance ${stats(of(true))} | older sets ${stats(of(false))}`);
}
{
  const of = (rad: boolean) => main.filter((c) => (c.set === 'RAD') === rad && !c.dataIncomplete).map((c) => mineCard(c).foundation ?? 0);
  console.log(`foundation all main-deck: Radiance ${stats(of(true))} | older sets ${stats(of(false))}`);
  const grades = (rad: boolean) => { const g: Record<string, number> = {}; for (const c of main) if ((c.set === 'RAD') === rad && !c.dataIncomplete) { const k = mineCard(c).grade ?? '-'; g[k] = (g[k] ?? 0) + 1; } return JSON.stringify(g); };
  console.log(`grades Radiance ${grades(true)}\ngrades older sets ${grades(false)}`);
}
if (process.argv.includes('--list')) {
  console.log('\nNO MECHANIC TRAIT:');
  for (const id of report.noTraits) { const c = byId.get(id)!; console.log(`  ${c.code} ${c.name} [${c.type}] ${JSON.stringify(c.text)}`); }
  console.log('\nUNPARSED SENTENCES:');
  for (const s of report.unparsedSentences) console.log(`  ${s.count}× ${s.text}   <${s.cards.map((id) => byId.get(id)!.code).join(',')}>`);
}
const at = process.argv.indexOf('--json');
if (at > 0) writeFileSync(process.argv[at + 1], JSON.stringify({ report, mined: cards.map((c) => ({ code: c.code, name: c.name, set: c.set, type: c.type, ...mineCard(c) })) }, null, 1));
