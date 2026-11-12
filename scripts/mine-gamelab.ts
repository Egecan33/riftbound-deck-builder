// pnpm tsx scripts/mine-gamelab.ts [--list category] [--cards]
// Compares the card mine with the scripted cards of the GameLab rules engine (read-only, a sibling checkout:
// ~/github_repositories/GameLab, September 2026 pool, no Radiance). GameLab compiles every card to effect
// instructions that its engine executes, so a script is an independent reading of what the card does.
// For each comparable effect category the script says yes when the script contains one of the listed ops or
// keywords, the mine says yes when the card has one of the listed traits. Agreement is counted per
// (card, category) cell where at least one side says yes, and per card.
// Nothing from GameLab is copied into this repository; the comparison is recomputed from the checkout.
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mineCard } from '@/engine/mine';
import type { Card } from '@/engine/types';
import { openDb } from '@/server/db';
import { loadCardDb } from '@/server/carddb';

const GAMELAB = process.env.GAMELAB_DIR ?? path.join(os.homedir(), 'github_repositories', 'GameLab');

interface Scripted { code: string; name: string; type: string; source: string; ops: Set<string>; keywords: Set<string>; deals: boolean }

/** One comparable category: script side (ops and owned keywords) against mine side (traits). */
/**
 * `strict` marks a category whose traits mean exactly the scripted effect, so a trait without the op is a
 * disagreement ("mine only"). In the other categories the trait is wider than the op by design (`death`
 * also covers "when I die", `scoring` covers conquer and hold text) and only the script-to-mine direction
 * is counted. `confirm` lists further ops that also justify the trait.
 */
interface Category { id: string; ops?: string[]; confirm?: string[]; keywords?: string[]; traits: string[]; strict?: boolean }

const CATEGORIES: Category[] = [
  { id: 'draw', ops: ['draw'], confirm: ['lookAtTop', 'returnToHand', 'reveal', 'toChampionZone'], traits: ['draw'], strict: true },
  { id: 'damage', ops: ['deal', 'fight'], traits: ['damage-provider'], strict: true },
  { id: 'kill', ops: ['kill'], traits: ['death', 'removal', 'interaction'] },
  { id: 'stun', ops: ['stun'], traits: ['stun'] },
  { id: 'ready', ops: ['ready'], traits: ['ready', 'energy-ramp'] },
  { id: 'token', ops: ['playToken', 'eachPlayerMayPlayToken'], traits: ['token'], strict: true },
  { id: 'counter', ops: ['counter', 'counterUnlessPay'], traits: ['counter'], strict: true },
  { id: 'channel', ops: ['channel'], traits: ['channel-rune'], strict: true },
  { id: 'add-energy', ops: ['add'], confirm: ['ready', 'playToken'], traits: ['energy-ramp'], strict: true },
  { id: 'discard', ops: ['discard'], traits: ['discard', 'interaction'] },
  { id: 'buff', ops: ['buff'], traits: ['buff-producer'], strict: true },
  { id: 'recycle', ops: ['recycle', 'recycleTop', 'eachPlayerChooseThenRecycle'], traits: ['recycle'] },
  { id: 'move', ops: ['moveTo', 'moveChoose', 'moveHere', 'moveToBase', 'swapPlaces'], traits: ['movement'] },
  { id: 'points', ops: ['gainPoint'], traits: ['scoring'] },
  { id: 'xp-gain', ops: ['gainXp'], keywords: ['Hunt'], traits: ['hunt'], strict: true },
  { id: 'empower', ops: ['empower'], keywords: ['Empower'], traits: ['empower'] },
  { id: 'heal', ops: ['heal'], traits: ['heal'], strict: true },
  { id: 'burn', ops: ['burn'], traits: ['burn-self', 'burn-opponent'], strict: true },
  { id: 'might-change', ops: ['buffMight', 'doubleMight', 'setMight', 'grantKeywordsAndMight', 'swapMight'], traits: ['might-boost', 'might-reduction'] }, // static Might auras are not ops in a script
  { id: 'top-deck', ops: ['lookAtTop'], keywords: ['Vision'], traits: ['predict', 'vision', 'topdeck-payoff', 'draw'] },
  ...(['Accelerate', 'Assault', 'Deflect', 'Ganking', 'Hidden', 'Legion', 'Shield', 'Tank', 'Temporary', 'Vision', 'Equip',
    'Quick-Draw', 'Repeat', 'Weaponmaster', 'Ambush', 'Level', 'Unique', 'Backline', 'Flow'] as const).map((k) => ({
    id: `kw:${k}`, keywords: [k], traits: [k.toLocaleLowerCase()],
  })),
];

async function loadScripts(): Promise<Scripted[]> {
  const entry = path.join(GAMELAB, 'packages', 'engine', 'src', 'library.ts');
  if (!existsSync(entry)) throw new Error(`GameLab checkout not found at ${GAMELAB} (set GAMELAB_DIR)`);
  const mod = (await import(entry)) as { buildLibrary(): { lib: Map<string, { card: { name: string; type: string; printings: { cardCode: string }[] }; script: unknown }> } };
  const out: Scripted[] = [];
  for (const { card, script } of mod.buildLibrary().lib.values()) {
    const ops = new Set<string>();
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) { for (const x of v) walk(x); return; }
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o.op === 'string') ops.add(o.op);
        for (const x of Object.values(o)) walk(x);
      }
    };
    walk(script);
    const s = script as { keywords?: { name: string }[]; source?: string; empowerCost?: unknown; equipCost?: unknown };
    const keywords = new Set((s.keywords ?? []).map((k) => k.name));
    if (s.empowerCost) keywords.add('Empower');
    if (s.equipCost) keywords.add('Equip');
    for (const p of card.printings ?? []) out.push({ code: p.cardCode, name: card.name, type: card.type, source: s.source ?? 'compiled', ops, keywords, deals: ops.has('deal') });
  }
  return out;
}

const scripts = await loadScripts();
const db = loadCardDb(openDb());
const byCode = new Map<string, Card>(db.all().map((c) => [c.code, c]));
const seen = new Set<string>();
const rows: { card: Card; s: Scripted; traits: Set<string> }[] = [];
for (const s of scripts) {
  const card = byCode.get(s.code);
  if (!card || seen.has(card.id) || card.type === 'rune') continue;
  seen.add(card.id);
  rows.push({ card, s, traits: new Set<string>(mineCard(card).traits) });
}

const listed = process.argv.includes('--list') ? process.argv[process.argv.indexOf('--list') + 1] : null;
let both = 0; let scriptOnly = 0; let mineOnly = 0;
const cardAgree = new Map<string, boolean>();
const perCategory: string[] = [];
for (const cat of CATEGORIES) {
  let b = 0; let so = 0; let mo = 0;
  const lines: string[] = [];
  for (const { card, s, traits } of rows) {
    const scriptYes = (cat.ops ?? []).some((op) => s.ops.has(op)) || (cat.keywords ?? []).some((k) => s.keywords.has(k));
    const mineYes = cat.traits.some((t) => traits.has(t));
    if (!scriptYes && !mineYes) continue;
    if (scriptYes && mineYes) b += 1;
    else if (scriptYes) { so += 1; cardAgree.set(card.id, false); lines.push(`   script only: ${card.code} ${card.name} ${JSON.stringify(card.text).slice(0, 200)}`); }
    else if (cat.strict && !(cat.confirm ?? []).some((op) => s.ops.has(op))) { mo += 1; cardAgree.set(card.id, false); lines.push(`   mine only:   ${card.code} ${card.name} ${JSON.stringify(card.text).slice(0, 200)}`); }
    if (!cardAgree.has(card.id)) cardAgree.set(card.id, true);
  }
  both += b; scriptOnly += so; mineOnly += mo;
  perCategory.push(`${cat.id.padEnd(16)} both ${String(b).padStart(3)}  script only ${String(so).padStart(3)}  mine only ${String(mo).padStart(3)}`);
  if (listed === cat.id || listed === 'all') { console.log(`== ${cat.id}`); for (const l of lines) console.log(l); }
}
for (const { card } of rows) if (!cardAgree.has(card.id)) cardAgree.set(card.id, true);
const agreeCards = [...cardAgree.values()].filter(Boolean).length;
console.log(`GameLab scripted cards matched to the synced pool: ${rows.length} (of ${new Set(scripts.map((s) => s.code)).size} printings scripted)`);
console.log(perCategory.join('\n'));
const cells = both + scriptOnly + mineOnly;
console.log(`cells where either side says yes: ${cells}; agree ${both} (${(100 * both / cells).toFixed(1)}%), script only ${scriptOnly}, mine only ${mineOnly}`);
console.log(`mine finds ${(100 * both / (both + scriptOnly)).toFixed(1)}% of scripted effects; scripts confirm ${(100 * both / (both + mineOnly)).toFixed(1)}% of mined effects in these categories`);
console.log(`cards with every category in agreement: ${agreeCards} of ${rows.length} (${(100 * agreeCards / rows.length).toFixed(1)}%)`);
