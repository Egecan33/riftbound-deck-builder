// `fixtures` step: writes the committed test fixture from the synced database (run after a real
// `pnpm sync cards errata legality meta`). Deterministic for a given database.
//
// tests/fixtures/cards.json   a subset of the cards, with their printing aliases
// tests/fixtures/meta.json    meta statistics of the six reference-deck legends
// tests/fixtures/decks/*.txt  six reference lists from Piltover Archive, different legends
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serializeCard } from '@/engine/carddb';
import type { Card, CardDb, LegendMeta } from '@/engine/types';
import { loadAliases, loadCardDb, loadCards, loadLegendMeta } from '@/server/carddb';
import { readSyncData, type Db } from '@/server/db';
import { readOverridesFile, type OverridesFile } from '@/server/syncdata';
import type { Log } from './cards';
import { erasOf } from './meta';

export const FIXTURE_DIR = path.join(process.cwd(), 'tests', 'fixtures');
const RULES_FILE = path.join(process.cwd(), 'docs', 'research', 'rules.md');
const EXTRA_CARDS = 150;
const EXTRA_RADIANCE = 40;
const REFERENCE_DECKS = 6;

interface DeckRow { id: string; legendId: string; championId: string | null; editedAt: string; views: number; event: number }
type Zones = Record<'main' | 'side' | 'battlefields' | 'runes', Record<string, number>>;

const isMainDeck = (c: Card): boolean => c.type === 'unit' || c.type === 'spell' || c.type === 'gear';
const sum = (z: Record<string, number>): number => Object.values(z).reduce((a, b) => a + b, 0);

function zonesOf(db: Db, deckId: string): Zones {
  const zones: Zones = { main: {}, side: {}, battlefields: {}, runes: {} };
  const rows = db.prepare('SELECT zone, card_id AS card, qty FROM meta_deck_cards WHERE deck_id = ?').all(deckId) as { zone: keyof Zones; card: string; qty: number }[];
  for (const r of rows) zones[r.zone][r.card] = r.qty;
  return zones;
}

/**
 * A pre-check that a list can serve as a "legal today" reference deck for tournament Standard
 * (rules.md §2-§7): the real validator arrives with plan Task 3 and re-checks these files.
 */
export function looksLegal(deck: DeckRow, zones: Zones, cards: CardDb): boolean {
  const legend = cards.get(deck.legendId);
  const champion = deck.championId ? cards.get(deck.championId) : undefined;
  if (!legend || legend.type !== 'legend' || !champion) return false;
  if (champion.type !== 'unit' || !champion.superTypes.includes('champion') || champion.championTag !== legend.championTag) return false;
  if (sum(zones.main) !== 40 || sum(zones.runes) !== 12 || Object.keys(zones.battlefields).length !== 3) return false;
  if (sum(zones.side) > cards.legality().sideboardMax) return false;
  const inIdentity = (c: Card) => c.noDomain || c.domains.every((d) => legend.domains.includes(d));
  const copies = new Map<string, number>();
  let signatures = 0;
  for (const zone of [zones.main, zones.side]) {
    for (const [id, q] of Object.entries(zone)) {
      const c = cards.get(id);
      if (!c || c.dataIncomplete || !isMainDeck(c) || !inIdentity(c)) return false;
      copies.set(id, (copies.get(id) ?? 0) + q);
      if (c.superTypes.includes('signature')) {
        signatures += q;
        if (c.championTag !== legend.championTag) return false;
      }
    }
  }
  if (signatures > 3) return false;
  for (const [id, q] of copies) if (q > (cards.get(id) as Card).copyLimit) return false;
  for (const id of Object.keys(zones.runes)) { const c = cards.get(id); if (!c || !inIdentity(c)) return false; }
  for (const [id, q] of Object.entries(zones.battlefields)) { const c = cards.get(id); if (!c || c.dataIncomplete || q !== 1) return false; }
  const bans = cards.legality().bans.filter((b) => b.formats.includes('standard-bo3')).map((b) => cards.byName(b.name)?.id);
  const used = new Set([deck.legendId, ...Object.keys(zones.main), ...Object.keys(zones.side), ...Object.keys(zones.battlefields)]);
  return !bans.some((id) => id !== undefined && used.has(id));
}

function deckText(deck: DeckRow, zones: Zones, cards: CardDb): string {
  const name = (id: string) => (cards.get(id) as Card).name;
  const lines = (z: Record<string, number>) => Object.entries(z).sort((a, b) => name(a[0]).localeCompare(name(b[0]))).map(([id, q]) => `${q} ${name(id)}`);
  const main = { ...zones.main };
  const champion = deck.championId as string;
  main[champion] -= 1;
  if (main[champion] <= 0) delete main[champion];
  return [
    '# Reference deck for tests. A public list from Piltover Archive, checked against the rules on the day it was exported.',
    `# Source: https://piltoverarchive.com/decks/view/${deck.id} (edited ${deck.editedAt.slice(0, 10)})`,
    '# Format: standard-bo3. The Chosen Champion counts toward the 40 main-deck cards.',
    '',
    'Legend:', `1 ${name(deck.legendId)}`, '',
    'Champion:', `1 ${name(champion)}`, '',
    'Main:', ...lines(main), '',
    'Battlefields:', ...lines(zones.battlefields), '',
    'Runes:', ...lines(zones.runes), '',
    'Sideboard:', ...lines(zones.side), '',
  ].join('\n');
}

const slug = (s: string): string => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Card names that occur in rules.md §2-§13 (the sections the validator tests quote). */
function cardsNamedInRules(all: readonly Card[]): Card[] {
  if (!existsSync(RULES_FILE)) return [];
  const text = readFileSync(RULES_FILE, 'utf8');
  const from = text.indexOf('\n## 2.');
  const to = text.indexOf('\n## 14.');
  const body = text.slice(from === -1 ? 0 : from, to === -1 ? undefined : to);
  return all.filter((c) => c.name.length >= 5 && new RegExp(`(^|[^A-Za-z])${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z]|$)`).test(body));
}

/** `count` cards from `pool`, evenly spread over its (set, type) groups, in id order. */
function spread(pool: readonly Card[], count: number): Card[] {
  const groups = new Map<string, Card[]>();
  for (const c of [...pool].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = `${c.set}|${c.type}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const keys = [...groups.keys()].sort();
  const quota = new Map<string, number>(keys.map((k) => [k, 0]));
  // Round-robin over the groups until `count` is reached or every group is used up.
  for (let n = 0; n < count; ) {
    let progressed = false;
    for (const k of keys) {
      if (n >= count) break;
      if ((quota.get(k) as number) < (groups.get(k) as Card[]).length) { quota.set(k, (quota.get(k) as number) + 1); n++; progressed = true; }
    }
    if (!progressed) break;
  }
  // Inside a group take evenly spaced cards rather than the first few.
  const out: Card[] = [];
  for (const k of keys) {
    const list = groups.get(k) as Card[];
    const q = quota.get(k) as number;
    for (let i = 0; i < q; i++) out.push(list[Math.floor((i * list.length) / q)]);
  }
  return out;
}

export interface FixtureInfo { cards: number; aliases: number; decks: string[]; metaLegends: number; bySet: Record<string, number>; incomplete: number }

export function writeFixtures(db: Db, log: Log, dir: string = FIXTURE_DIR): FixtureInfo {
  const cards = loadCardDb(db);
  const everything = loadCards(db).sort((a, b) => a.id.localeCompare(b.id));
  const real = everything.filter((c) => !c.superTypes.includes('token'));
  if (real.length === 0) throw new Error('fixtures need a synced database: run `pnpm sync cards errata legality meta` first');
  const eras = erasOf(cards.legality());
  const era = eras[eras.length - 1];

  // Reference decks: current-era lists with a full side deck that pass the pre-check, one per legend;
  // the legends with the most synced lists first, and for a legend an event list before the most viewed one.
  const rows = db.prepare(
    `SELECT id, legend_id AS legendId, champion_id AS championId, edited_at AS editedAt, views, event FROM meta_decks
     WHERE complete = 1 AND banned = 0 AND format = 'standard' AND legend_id IS NOT NULL AND edited_at >= ?
     ORDER BY event DESC, views DESC, id`,
  ).all(era?.from ?? '') as DeckRow[];
  const metaByLegend = new Map(loadLegendMeta(db).map((m) => [m.legendId, m]));
  const chosen: { deck: DeckRow; zones: Zones }[] = [];
  const lists = (d: DeckRow) => metaByLegend.get(d.legendId)?.decks ?? 0;
  const ordered = rows.map((deck, i) => ({ deck, i })).sort((a, b) => lists(b.deck) - lists(a.deck) || a.deck.legendId.localeCompare(b.deck.legendId) || a.i - b.i).map((x) => x.deck);
  for (const deck of ordered) {
    if (chosen.length >= REFERENCE_DECKS) break;
    if (chosen.some((c) => c.deck.legendId === deck.legendId)) continue;
    const zones = zonesOf(db, deck.id);
    if (sum(zones.side) !== cards.legality().sideboardMax) continue; // a full side deck exercises the Bo3 rules
    if (looksLegal(deck, zones, cards)) chosen.push({ deck, zones });
  }
  if (chosen.length < REFERENCE_DECKS) throw new Error(`only ${chosen.length} lists qualify as reference decks; run \`pnpm sync meta\` for more`);

  const deckDir = path.join(dir, 'decks');
  mkdirSync(deckDir, { recursive: true });
  for (const f of readdirSync(deckDir)) if (f.endsWith('.txt')) rmSync(path.join(deckDir, f));
  const deckFiles: string[] = [];
  for (const { deck, zones } of chosen) {
    const legend = cards.get(deck.legendId) as Card;
    const file = `${slug(`${legend.championTag ?? ''} ${legend.name}`)}.txt`;
    writeFileSync(path.join(deckDir, file), deckText(deck, zones, cards));
    deckFiles.push(file);
  }
  deckFiles.sort();

  // Meta for the reference legends, trimmed to cards at least two lists play.
  const metaLegends: LegendMeta[] = [];
  for (const { deck } of chosen) {
    const m = metaByLegend.get(deck.legendId);
    if (!m) continue;
    const trim = <T extends { decks: number }>(z: Record<string, T>) => Object.fromEntries(Object.entries(z).filter(([, s]) => s.decks >= 2).sort((a, b) => a[0].localeCompare(b[0])));
    metaLegends.push({ ...m, main: trim(m.main), side: trim(m.side), battlefields: trim(m.battlefields) });
  }
  metaLegends.sort((a, b) => a.legendId.localeCompare(b.legendId));

  // Cards.
  const keep = new Map<string, Card>();
  const add = (list: Iterable<Card | undefined>) => { for (const c of list) if (c) keep.set(c.id, c); };
  add(real.filter((c) => c.type === 'legend' || c.type === 'battlefield' || c.type === 'rune'));
  add(real.filter((c) => c.superTypes.includes('champion') || c.superTypes.includes('signature')));
  add(everything.filter((c) => c.superTypes.includes('token')));
  add(cards.legality().bans.map((b) => cards.byName(b.name)));
  add(cardsNamedInRules(everything));
  add(real.filter((c) => c.errata || c.dataIncomplete || c.copyLimit !== 3));
  for (const { deck, zones } of chosen) add([deck.legendId, ...Object.values(zones).flatMap((z) => Object.keys(z))].map((id) => cards.get(id)));
  for (const m of metaLegends) add([...Object.keys(m.main), ...Object.keys(m.side), ...Object.keys(m.battlefields), ...Object.keys(m.champions)].map((id) => cards.get(id)));
  const rest = real.filter((c) => !keep.has(c.id) && isMainDeck(c));
  const radiance = spread(rest.filter((c) => c.set === 'RAD'), EXTRA_RADIANCE);
  add(radiance);
  add(spread(rest.filter((c) => c.set !== 'RAD'), EXTRA_CARDS - radiance.length));

  const kept = [...keep.values()].sort((a, b) => a.id.localeCompare(b.id));
  const overrides = readSyncData<OverridesFile>(db, 'overrides') ?? readOverridesFile();
  const allAliases = loadAliases(db, everything, overrides);
  const aliases: Record<string, string> = {};
  for (const [alias, id] of Object.entries(allAliases).sort((a, b) => a[0].localeCompare(b[0]))) {
    const card = keep.get(id);
    if (card && alias !== card.id && alias !== card.code) aliases[alias] = id;
  }

  const cardsState = db.prepare("SELECT finished_at AS at FROM sync_state WHERE step = 'cards'").get() as { at: string } | undefined;
  writeFileSync(path.join(dir, 'cards.json'), `${JSON.stringify({
    note: 'Test fixture: a subset of the synced card data (card data belongs to Riot Games; see the README disclaimer). Written by `pnpm sync fixtures`; do not edit by hand.',
    syncedAt: cardsState?.at ?? null,
    totalCardsInSync: real.length,
    cards: kept.map(serializeCard),
    aliases,
  })}\n`);
  writeFileSync(path.join(dir, 'meta.json'), `${JSON.stringify({
    note: 'Test fixture: meta statistics of the six reference-deck legends from the `meta` sync step (Piltover Archive lists). Written by `pnpm sync fixtures`.',
    era: era?.id ?? null,
    legends: metaLegends,
  })}\n`);

  const bySet: Record<string, number> = {};
  for (const c of kept) bySet[c.set] = (bySet[c.set] ?? 0) + 1;
  const info: FixtureInfo = { cards: kept.length, aliases: Object.keys(aliases).length, decks: deckFiles, metaLegends: metaLegends.length, bySet, incomplete: kept.filter((c) => c.dataIncomplete).length };
  log(`fixtures ${kept.length}/${everything.length} cards (${JSON.stringify(bySet)}), ${deckFiles.length} decks (${deckFiles.join(', ')}), meta for ${metaLegends.length} legends`);
  return info;
}
