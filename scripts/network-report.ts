// pnpm tsx scripts/network-report.ts [--generic] [--sample N] [--label "text"] [--suppressed [id]]
// Builds the pair network over the full synced pool (data/forge.db) and prints counts, reason families and the strongest edges.
import { mineOverridesById, type MineOverrideEntry } from '@/engine/mine';
import { buildEdgesWithStats, removedTraitsOf, type ForbiddenInteraction } from '@/engine/network';
import { readOverridesFile } from '@/server/syncdata';
import { openDb } from '@/server/db';
import { loadCards } from '@/server/carddb';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? '' : undefined; };
const cards = loadCards(openDb());
const byId = new Map(cards.map((c) => [c.id, c]));
const started = Date.now();
const file = readOverridesFile() as unknown as { forbiddenInteractions?: ForbiddenInteraction[]; mine?: MineOverrideEntry[] };
const forbidden = file.forbiddenInteractions;
const removedTraits = removedTraitsOf(mineOverridesById(file.mine, cards));
const dropped: string[] = [];
const want = flag('--suppressed');
const { edges, stats } = buildEdgesWithStats(cards, { forbidden, removedTraits, includeGeneric: args.includes('--generic'), onSuppress: want === undefined ? undefined : (id, reason, l, r) => { if (!want || id === want) dropped.push(`${id} | ${reason.label} | ${l.name}: ${l.rulesText.replace(/\n/g, ' / ').slice(0, 170)} || ${r.name}: ${r.rulesText.replace(/\n/g, ' / ').slice(0, 170)}`); } });
if (want !== undefined) { let seed = 7; for (let i = 0; i < 12 && dropped.length; i += 1) { seed = (seed * 1103515245 + 12345) % 2147483648; console.log(dropped[seed % dropped.length], '\n'); } }
console.log(`nodes ${stats.nodes}, pairs checked ${stats.pairsChecked}, edges ${stats.edges} (${edges.filter((e) => e.net > 0).length} positive, ${edges.filter((e) => e.net < 0).length} negative), generic-only pairs not stored ${stats.genericOnlyDropped}, forbidden applied ${stats.forbiddenApplied}, ${Date.now() - started} ms`);
console.log('suppressed:', JSON.stringify(stats.suppressed));
const families = new Map<string, number>();
for (const e of edges) for (const r of e.reasons) { const k = r.id.startsWith('package:') ? `package:${r.label}` : r.id.startsWith('tag-reference:') ? 'tag-reference' : r.id.slice(0, r.id.indexOf(':')); families.set(k, (families.get(k) ?? 0) + 1); }
console.log('reasons:', [...families.entries()].sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join('; '));
const name = (id: string) => `${byId.get(id)?.name} (${byId.get(id)?.code})`;
const label = flag('--label');
const sample = Number(flag('--sample') ?? 0);
if (sample > 0) {
  const pool = label ? edges.filter((e) => e.reasons.some((r) => r.label === label || r.id.startsWith(label))) : edges;
  let seed = 41;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < sample && pool.length; i += 1) {
    const e = pool[Math.floor(rnd() * pool.length)];
    console.log(`\n${name(e.a)} + ${name(e.b)} net ${e.net}`);
    for (const r of e.reasons) if (!label || r.label === label || r.id.startsWith(label)) console.log(`  [${r.value}] ${r.label}: ${r.detail}`);
  }
} else {
  console.log('strongest edges:');
  for (const e of [...edges].sort((x, y) => y.net - x.net || x.a.localeCompare(y.a) || x.b.localeCompare(y.b)).slice(0, 30)) console.log(`  ${e.net.toFixed(2)} ${name(e.a)} + ${name(e.b)}: ${e.reasons.filter((r) => r.kind === 'synergy').map((r) => r.label).join(', ')}`);
}
