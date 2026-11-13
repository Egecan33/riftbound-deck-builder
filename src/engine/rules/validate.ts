// Deck validation: docs/research/rules.md §12, check by check, with the same codes and severities.
// Pure: a Deck, a CardDb (cards + the synced legality snapshot) in, Violation[] out. Never throws on a partial deck.
//
// Readings the research left unconfirmed follow the stricter side and are flagged `interpretation: true`,
// with "(interpretation ...)" in the message (spec §7):
// - Signature total and Unique counted across main + side deck (rules.md §4);
// - a tag a champion shares with the legend (Yordle) is not a champion tag (rules.md §3);
// - Standard bans applied to free-for-all, which has no official list (rules.md §9);
// - no side deck in FFA and casual; banned extra legends for Neeko; the "wasted card" Neeko warning.
import type { Card, CardDb, Deck, DeckEntry, Domain, Format, LegalityData, Violation, Zone } from '../types';
import { championTagOf, eligibleChampions, isChampionUnit, isSignature, isTokenCard, sameTag } from './champion';
import { copyLimit } from './copies';
import { BATTLEFIELDS_BROUGHT, RUNE_DECK_SIZE, SIGNATURE_MAX, domainName, formatName, formatRules, type FormatRules } from './formats';
import { identityFit, legendOf } from './identity';
import { nameKey } from './names';

export { formatRules } from './formats';
export type { FormatRules } from './formats';
export { domainIdentity } from './identity';
export { championTagOf, eligibleChampions } from './champion';
export { copyLimit } from './copies';

type Severity = Violation['severity'];
type Ban = LegalityData['bans'][number];

const DOMAINS: readonly Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
const MAIN_TYPES: ReadonlySet<string> = new Set(['unit', 'spell', 'gear']);
const FFA: ReadonlySet<Format> = new Set<Format>(['ffa3', 'ffa4']);
const FORMATS: readonly Format[] = ['standard-bo1', 'standard-bo3', '2v2', 'ffa3', 'ffa4', 'casual'];

const violation = (code: string, severity: Severity, rule: string, message: string, cardIds: string[] = [], interpretation = false): Violation =>
  ({ code, severity, message, cardIds, rule, interpretation });

const stale = (id: string): Violation =>
  violation('DATA_STALE', 'warning', 'rules.md §0.1', `"${id}" is not in the local card data, so it cannot be checked. Run \`pnpm sync cards\`.`, [id]);

const qtyOf = (e: DeckEntry): number => (Number.isFinite(e?.qty) ? Math.max(0, Math.floor(e.qty)) : 0);

/** Zone entries as id -> quantity, in first-seen order; entries without a positive quantity are ignored. */
function tally(entries: readonly DeckEntry[] | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of entries ?? []) {
    const q = qtyOf(e);
    if (e && typeof e.id === 'string' && q > 0) out.set(e.id, (out.get(e.id) ?? 0) + q);
  }
  return out;
}
const total = (m: ReadonlyMap<string, number>): number => [...m.values()].reduce((a, b) => a + b, 0);

// ---- per-database lookups (the ban list and set legality are data: sync-data/legality.json) ----

interface Lookups { bans: Map<Format, Map<string, Ban>>; upcoming: Map<Format, Map<string, Ban>>; unknownBans: Ban[]; legalSets: Set<string> | null; runes: Map<Domain, Card> }
const lookupCache = new WeakMap<CardDb, { legality: LegalityData; value: Lookups }>();

function lookups(db: CardDb): Lookups {
  const legality = db.legality();
  const held = lookupCache.get(db);
  if (held && held.legality === legality) return held.value;
  const bans = new Map<Format, Map<string, Ban>>();
  const unknownBans: Ban[] = [];
  for (const ban of legality.bans) {
    const card = db.byName(ban.name); // bans are by name: every printing (rules.md §9)
    if (!card) { unknownBans.push(ban); continue; } // reported by validateDeck: a ban that cannot be applied is never dropped in silence
    for (const f of ban.formats) {
      if (!bans.has(f)) bans.set(f, new Map());
      (bans.get(f) as Map<string, Ban>).set(card.id, ban);
    }
  }
  const upcoming = new Map<Format, Map<string, Ban>>();
  for (const ban of legality.upcomingBans ?? []) {
    const card = db.byName(ban.name);
    if (!card) { unknownBans.push(ban); continue; }
    for (const f of ban.formats) {
      if (!upcoming.has(f)) upcoming.set(f, new Map());
      (upcoming.get(f) as Map<string, Ban>).set(card.id, ban);
    }
  }
  // A set is legal once its date has come, measured against the snapshot's own date so the result is reproducible.
  const legalSets = legality.sets.length === 0 ? null
    : new Set(legality.sets.filter((s) => s.legalFrom !== null && (!legality.asOf || s.legalFrom <= legality.asOf)).map((s) => s.code.toUpperCase()));
  const runes = new Map<Domain, Card>();
  for (const c of db.all()) {
    if (c.type === 'rune' && c.superTypes.includes('basic') && c.domains.length === 1 && !runes.has(c.domains[0])) runes.set(c.domains[0], c);
  }
  const value = { bans, upcoming, unknownBans, legalSets, runes };
  lookupCache.set(db, { legality, value });
  return value;
}

interface Ctx {
  format: Format; rules: FormatRules; legend: Card | null; identity: Set<Domain>; legendTag: string | null;
  bans: Map<string, Ban>; upcoming: Map<string, Ban>; legalSets: Set<string> | null;
}

function contextOf(deck: Deck, db: CardDb): Ctx {
  const look = lookups(db);
  const rules = formatRules(deck.format, db.legality());
  const legend = legendOf(deck, db);
  return {
    format: deck.format, rules, legend,
    identity: new Set(legend?.domains ?? []),
    legendTag: legend ? championTagOf(legend) : null,
    bans: look.bans.get(rules.banListOf) ?? new Map(),
    upcoming: look.upcoming.get(rules.banListOf) ?? new Map(),
    legalSets: deck.format === 'casual' ? null : look.legalSets,
  };
}

const ZONE_LABEL: Record<Zone, string> = { main: 'main deck', side: 'side deck', runes: 'rune deck', battlefields: 'battlefields', legend: 'legend slot' };
const typeLabel = (c: Card): string => c.type ?? 'unknown type';
const domainLabel = (ds: Iterable<Domain>): string => [...ds].map(domainName).join('/') || 'none';

/** Every problem with one card sitting in one zone, counts aside. */
function cardIssues(card: Card, zone: Zone, ctx: Ctx): Violation[] {
  const ids = [card.id];
  if (isTokenCard(card)) {
    const out = [violation('TOKEN_IN_DECK', 'error', 'CR 185', `${card.name} is a token. Tokens are created during play and cannot be in a deck.`, ids)];
    if (zone === 'battlefields') out.push(violation('BATTLEFIELD_WRONG_TYPE', 'error', 'CR 133.6.a, 187.8-9', `${card.name} is a battlefield token and cannot be one of your three battlefields.`, ids));
    if (zone === 'legend') out.push(violation('LEGEND_NOT_LEGEND', 'error', 'CR 103.2, 133.6.b', `${card.name} is a token, not a legend.`, ids));
    return out;
  }
  if (card.dataIncomplete || card.type === null) {
    return [violation('DATA_STALE', 'warning', 'rules.md §0.1', `${card.name} (${card.code}) has incomplete data in the official gallery, so its type and domain cannot be checked.`, ids)];
  }
  const wrongType = (code: string, rule: string, want: string) =>
    [violation(code, 'error', rule, `${card.name} is a ${typeLabel(card)}; the ${ZONE_LABEL[zone]} takes only ${want}.`, ids)];
  switch (zone) {
    case 'main':
      if (card.type === 'rune') return wrongType('RUNE_WRONG_TYPE', 'CR 103.4, 133.5', 'units, gear and spells (runes go in the rune deck)');
      if (!MAIN_TYPES.has(card.type)) return wrongType('MAIN_WRONG_TYPE', 'CR 103.3, 133.4', 'units, gear and spells');
      break;
    case 'side':
      if (!MAIN_TYPES.has(card.type)) return wrongType('SIDEBOARD_WRONG_TYPE', 'TR 601.1.c.2, 403.4.b', 'valid main-deck cards (units, gear and spells)');
      break;
    case 'runes':
      if (card.type !== 'rune') return wrongType('RUNE_WRONG_TYPE', 'CR 103.4, 133.5', 'runes');
      break;
    case 'battlefields':
      if (card.type !== 'battlefield') return wrongType('BATTLEFIELD_WRONG_TYPE', 'CR 133.6.a, 187.8-9', 'battlefields');
      break;
    case 'legend':
      if (card.type !== 'legend') return wrongType('LEGEND_NOT_LEGEND', 'CR 103.2, 133.6.b', 'a legend');
      break;
  }

  const out: Violation[] = [];
  const ban = ctx.bans.get(card.id);
  if (ban) {
    const ffa = FFA.has(ctx.format);
    const note = ffa ? ' (interpretation: free-for-all has no official ban list; the Standard list is applied)' : '';
    out.push(violation(zone === 'legend' ? 'LEGEND_BANNED' : 'CARD_BANNED', 'error', 'TR 601.2.d',
      `${card.name} is banned in ${formatName(ctx.format)} from ${ban.effectiveFrom}${note}.`, ids, ffa));
  }
  const soon = ctx.upcoming.get(card.id);
  if (soon && !ban) {
    out.push(violation(zone === 'legend' ? 'LEGEND_BANNED_SOON' : 'CARD_BANNED_SOON', 'warning', 'TR 601.2.d',
      `${card.name} will be banned in ${formatName(ctx.format)} from ${soon.effectiveFrom}; legal until then.`, ids, FFA.has(ctx.format)));
  }
  if (ctx.legalSets && !card.sets.some((s) => (ctx.legalSets as Set<string>).has(s.toUpperCase()))) {
    out.push(violation('CARD_NOT_IN_FORMAT', 'error', 'CR 103.3.e, TR 601.2.a, 601.3.c',
      `${card.name} has no printing in a set that is legal in ${formatName(ctx.format)} (printed in ${card.sets.join(', ') || 'no known set'}).`, ids));
  }
  if (zone !== 'legend' && ctx.legend) {
    const fit = identityFit(card, ctx.identity);
    if (fit === 'outside') {
      out.push(violation('DOMAIN_VIOLATION', 'error', 'CR 103.2.b',
        `${card.name} is ${domainLabel(card.domains)}; every domain of a card must be in ${ctx.legend.name}'s identity (${domainLabel(ctx.identity)}).`, ids));
    } else if (fit === 'unknown') {
      out.push(violation('DATA_STALE', 'warning', 'rules.md §2', `${card.name} (${card.code}) has no domain in the card data; that is missing data, not "no domain", so the identity check cannot run.`, ids));
    }
    if ((zone === 'main' || zone === 'side') && isSignature(card) && !sameTag(championTagOf(card), ctx.legendTag)) {
      out.push(violation('SIGNATURE_WRONG_CHAMPION', 'error', 'CR 103.3.d.2',
        `${card.name} is a signature card of ${championTagOf(card) ?? 'another champion'}; ${ctx.legend.name} is ${ctx.legendTag ?? 'a different champion'}.`, ids));
    }
  }
  return out;
}

/**
 * Whether one more copy of `card` may go into `zone` of this deck, ignoring counts (deck size, copy limits):
 * token, incomplete data, type vs zone, ban, set legality, Domain Identity, signature champion tag.
 * Returns the first error, else the first warning (incomplete data), else null. The builder filters with this.
 */
export function cardFitsDeck(card: Card, zone: Zone, deck: Deck, db: CardDb): Violation | null {
  const issues = cardIssues(card, zone, contextOf(deck, db));
  return issues.find((v) => v.severity === 'error') ?? issues[0] ?? null;
}

const NEEKO = /choose (up to )?(\d+|three) different legends in addition to your starting legend/i;
/** Maximum extra legends a card's text lets the deck register (Neeko, Blending In), or null. */
function extraLegendAllowance(card: Card): number | null {
  const m = NEEKO.exec(card.text) ?? NEEKO.exec(card.printedText ?? '');
  if (!m) return null;
  const n = m[2].toLowerCase() === 'three' ? 3 : Number(m[2]);
  return Number.isFinite(n) ? n : null;
}

/** All violations of a deck in its format. An empty or partial deck returns violations and never throws. */
export function validateDeck(deck: Deck, db: CardDb): Violation[] {
  const out: Violation[] = [];
  const ctx = contextOf(deck, db);
  const { rules, legend } = ctx;
  const look = lookups(db);
  const names = (cards: Card[]): string => cards.map((c) => c.name).join(', ');

  // The format itself. An unknown one would otherwise read as casual, with no ban list and no exact size.
  if (!(FORMATS as readonly string[]).includes(deck.format)) {
    out.push(violation('FORMAT_UNKNOWN', 'error', 'rules.md §10', `"${String(deck.format)}" is not a format this app knows; choose one of ${FORMATS.join(', ')}.`));
  }
  // 34: a ban entry of this format that names no card in the local data cannot be applied, so legality is unknown.
  for (const ban of look.unknownBans) {
    if (!ban.formats.includes(rules.banListOf)) continue;
    out.push(violation('DATA_STALE', 'warning', 'rules.md §0.1, §9', `The ban list names "${ban.name}", which is not in the local card data, so that ban cannot be checked. Run \`pnpm sync cards\` or correct sync-data/legality.json.`));
  }

  // 1-3: Champion Legend.
  if (!deck.legend) {
    out.push(violation('LEGEND_MISSING', 'error', 'CR 103.2', 'Choose a Champion Legend. It sets the Domain Identity of the whole deck.'));
  } else {
    const card = db.get(deck.legend);
    if (!card) out.push(stale(deck.legend));
    else out.push(...cardIssues(card, 'legend', ctx));
  }

  // Zones.
  const main = tally(deck.main);
  const side = tally(deck.side);
  const mainCount = total(main);
  const sideCount = total(side);

  // 4-7: Chosen Champion.
  const champion = deck.champion ? db.get(deck.champion) : undefined;
  if (!deck.champion) {
    out.push(violation('CHAMPION_MISSING', 'error', 'CR 103.3', 'Choose a Chosen Champion: a champion unit of your legend. It is one of the main-deck cards.'));
  } else if (!champion) {
    out.push(stale(deck.champion));
  } else {
    if (!isChampionUnit(champion)) {
      const why = isSignature(champion) ? 'a signature card, not a champion unit' : `not a champion unit (${typeLabel(champion)})`;
      out.push(violation('CHAMPION_NOT_CHAMPION_UNIT', 'error', 'CR 103.3.a.2, 103.3.d.3', `${champion.name} cannot be the Chosen Champion: it is ${why}.`, [champion.id]));
    } else if (legend && !sameTag(championTagOf(champion), ctx.legendTag)) {
      const shared = champion.tags.filter((t) => legend.tags.some((l) => nameKey(l) === nameKey(t)));
      const note = shared.length > 0
        ? ` The shared tag ${shared.join(', ')} is not a champion tag (interpretation: CR 133.8.b limits champion tags to the tags that link a legend and its champion; no official ruling says so in these words).`
        : '';
      out.push(violation('CHAMPION_TAG_MISMATCH', 'error', 'CR 103.3.a.2, 133.8.b',
        `${champion.name} is a ${championTagOf(champion)} champion; ${legend.name} needs a ${ctx.legendTag ?? 'matching'} champion.${note}`, [champion.id, legend.id], shared.length > 0));
    }
    const key = nameKey(champion.name);
    const inMain = [...main.keys()].some((id) => id === champion.id || nameKey(db.get(id)?.name ?? '') === key);
    if (!inMain) {
      out.push(violation('CHAMPION_NOT_IN_MAIN', 'error', 'CR 103.3, TR 402.1', `${champion.name} is the Chosen Champion but the main deck holds no copy of it. The Chosen Champion is one of the main-deck cards.`, [champion.id]));
    }
  }

  // 8-9: main deck size.
  if (mainCount < rules.mainMin) {
    out.push(violation('MAIN_TOO_SMALL', 'error', 'CR 103.3', `The main deck has ${mainCount} cards; it needs ${rules.mainExact !== null ? `exactly ${rules.mainExact}` : `at least ${rules.mainMin}`}, Chosen Champion included.`));
  } else if (rules.mainExact !== null && mainCount !== rules.mainExact) {
    out.push(violation('MAIN_NOT_EXACT_40', 'error', 'TR 402.1, 601.1.b', `The main deck has ${mainCount} cards; ${deck.format} needs exactly ${rules.mainExact}, Chosen Champion included.`));
  }

  // 10-12, 16, 18, 22, 23, 25: each card against its zone; and the tallies for 13-15.
  interface NameCount { card: Card; main: number; side: number; ids: string[] }
  const byName = new Map<string, NameCount>();
  const combined: Card[] = [];
  for (const [zone, entries] of [['main', main], ['side', side]] as const) {
    for (const [id, qty] of entries) {
      const card = db.get(id);
      if (!card) { out.push(stale(id)); continue; }
      out.push(...cardIssues(card, zone, ctx));
      combined.push(card);
      const key = nameKey(card.name);
      const held = byName.get(key) ?? { card, main: 0, side: 0, ids: [] };
      held[zone] += qty;
      if (!held.ids.includes(id)) held.ids.push(id);
      byName.set(key, held);
    }
  }

  // 13-14: copies per rules name, main + side deck together (TR 403.3, 601.1.c.3).
  for (const { card, main: m, side: s, ids } of byName.values()) {
    if (isTokenCard(card)) continue;
    const limit = copyLimit(card);
    const count = m + s;
    if (count <= limit) continue;
    const where = s > 0 ? `${m} main + ${s} side deck` : `${m} in the main deck`;
    if (limit === 1) {
      const interp = m <= 1 && s > 0;
      out.push(violation('UNIQUE_LIMIT_EXCEEDED', 'error', 'CR 825.3.a',
        `${card.name} is Unique: a deck can have only 1 card with this name, and this one has ${count} (${where}).${interp ? ' (interpretation: the one copy is counted across main and side deck, as TR 403.3 does for named copies)' : ''}`, ids, interp));
    } else {
      const chosen = champion && nameKey(champion.name) === nameKey(card.name) ? ' The Chosen Champion is one of the copies.' : '';
      out.push(violation('COPY_LIMIT_EXCEEDED', 'error', 'CR 103.3.b; TR 403.3, 601.1.c.3',
        `${card.name}: ${count} copies (${where}); the limit is ${limit} per name across main and side deck.${chosen}`, ids));
    }
  }

  // 15: signature cards in total.
  const signatures = [...byName.values()].filter((n) => isSignature(n.card) && !isTokenCard(n.card));
  const sigMain = signatures.reduce((a, n) => a + n.main, 0);
  const sigSide = signatures.reduce((a, n) => a + n.side, 0);
  if (sigMain + sigSide > SIGNATURE_MAX) {
    const interp = sigMain <= SIGNATURE_MAX;
    out.push(violation('SIGNATURE_TOTAL_EXCEEDED', 'error', 'CR 103.3.d.1, 825.3.b',
      `${sigMain + sigSide} signature cards (${signatures.map((n) => `${n.main + n.side} ${n.card.name}`).join(', ')}); a deck may hold ${SIGNATURE_MAX} in total, whatever their names.${interp ? ' (interpretation: main and side deck are counted together; the rules say "your deck" without naming the side deck)' : ''}`,
      signatures.flatMap((n) => n.ids), interp));
  }

  // 17-18, 12: rune deck. Runes are stored per domain, so a non-rune can only appear as an unknown key.
  let runeCount = 0;
  for (const [key, raw] of Object.entries(deck.runes ?? {})) {
    const n = Number.isFinite(raw) ? Math.max(0, Math.floor(raw as number)) : 0;
    if (n === 0) continue;
    runeCount += n;
    if (!(DOMAINS as readonly string[]).includes(key)) {
      out.push(violation('RUNE_WRONG_TYPE', 'error', 'CR 103.4, 133.5', `"${key}" is not a rune domain; the rune deck takes only the six basic runes.`));
      continue;
    }
    const rune = look.runes.get(key as Domain);
    if (legend && !ctx.identity.has(key as Domain)) {
      out.push(violation('DOMAIN_VIOLATION', 'error', 'CR 103.4.a.1',
        `${n} ${rune?.name ?? `${key} rune`}: every rune must be inside ${legend.name}'s identity (${domainLabel(ctx.identity)}).`, rune ? [rune.id] : []));
    }
  }
  if (runeCount !== RUNE_DECK_SIZE) {
    out.push(violation('RUNE_COUNT', 'error', 'CR 103.4.a, 161.2.a', `The rune deck has ${runeCount} runes; it needs exactly ${RUNE_DECK_SIZE}.`));
  }

  // 19-22, 12: battlefields.
  const fieldIds = (deck.battlefields ?? []).filter((id): id is string => typeof id === 'string' && id !== '');
  if (fieldIds.length !== BATTLEFIELDS_BROUGHT) {
    out.push(violation('BATTLEFIELD_COUNT', 'error', 'CR 487.4.a-491.4.a, TR 402.1', `${fieldIds.length} battlefields chosen; every mode asks for exactly ${BATTLEFIELDS_BROUGHT}.`));
  }
  const fieldNames = new Map<string, { name: string; ids: string[]; count: number }>();
  for (const id of fieldIds) {
    const card = db.get(id);
    const key = card ? nameKey(card.name) : id;
    const held = fieldNames.get(key) ?? { name: card?.name ?? id, ids: [], count: 0 };
    held.count += 1;
    if (!held.ids.includes(id)) {
      held.ids.push(id);
      if (!card) out.push(stale(id));
      else out.push(...cardIssues(card, 'battlefields', ctx));
    }
    fieldNames.set(key, held);
  }
  for (const f of fieldNames.values()) {
    if (f.count > 1) out.push(violation('BATTLEFIELD_DUPLICATE', 'error', 'CR 103.5.c', `${f.name} is chosen ${f.count} times; the three battlefields need different names.`, f.ids));
  }

  // 24, 26: side deck size and whether the format has one.
  if (sideCount > 0 && !rules.sideAllowed) {
    out.push(violation('SIDEBOARD_NOT_ALLOWED', 'warning', 'TR 403, 601.1.c',
      `${formatName(deck.format)} has no side deck; these ${sideCount} cards will not be used. (interpretation: side decks exist only in the Tournament Rules for Constructed)`, [...side.keys()], true));
  } else if (sideCount > rules.sideMax) {
    out.push(violation('SIDEBOARD_TOO_LARGE', 'error', 'TR 601.1.c.1', `The side deck has ${sideCount} cards; the maximum is ${rules.sideMax}.`));
  }

  // 27-30: extra legends (Neeko, Blending In).
  const extras = (deck.extraLegends ?? []).filter((id): id is string => typeof id === 'string' && id !== '');
  const askers = combined.filter((c) => !isTokenCard(c) && extraLegendAllowance(c) !== null);
  if (askers.length > 0) {
    const asker = askers[0];
    const max = Math.max(...askers.map((c) => extraLegendAllowance(c) as number));
    if (extras.length > max) {
      out.push(violation('NEEKO_LEGENDS_COUNT', 'error', 'CR 103.1; card text (errata: "up to 3")', `${asker.name} lets you choose up to ${max} extra legends; ${extras.length} are listed. All copies share one set.`, [asker.id, ...extras]));
    } else if (extras.length < max) {
      out.push(violation('NEEKO_LEGENDS_COUNT', 'warning', 'CR 103.1; card text (errata: "up to 3")',
        `${asker.name} lets you choose up to ${max} extra legends; ${extras.length} ${extras.length === 1 ? 'is' : 'are'} listed. Fewer is legal, but each missing legend is an option ${asker.shortName} gives up. (interpretation: advice, not a rule)`, [asker.id, ...extras], true));
    }
  } else if (extras.length > 0) {
    out.push(violation('NEEKO_LEGENDS_UNUSED', 'warning', 'rules.md §8.3', `${extras.length} extra ${extras.length === 1 ? 'legend is' : 'legends are'} listed, but no card in the deck asks for extra legends. (interpretation: advice, not a rule)`, extras, true));
  }
  if (extras.length > 0) {
    const seen = new Map<string, Card>();
    if (legend) seen.set(nameKey(legend.name), legend);
    const repeated: Card[] = [];
    for (const id of extras) {
      const card = db.get(id);
      if (!card) { out.push(stale(id)); continue; }
      if (card.type !== 'legend' || isTokenCard(card)) {
        out.push(violation('LEGEND_NOT_LEGEND', 'error', 'CR 103.1, 133.6.b', `${card.name} is listed as an extra legend but is a ${typeLabel(card)}.`, [id]));
        continue;
      }
      const key = nameKey(card.name);
      if (seen.has(key)) repeated.push(card); else seen.set(key, card);
      const ban = ctx.bans.get(card.id);
      if (ban) {
        out.push(violation('NEEKO_LEGEND_BANNED', 'warning', 'rules.md §8.3 (unconfirmed)',
          `${card.name} is banned in ${formatName(deck.format)} as a Champion Legend. (interpretation: no official source says whether a ban also covers an extra legend)`, [id], true));
      }
    }
    if (repeated.length > 0) {
      out.push(violation('NEEKO_LEGENDS_NOT_DIFFERENT', 'error', 'CR 103.1; card text',
        `The extra legends must differ by name from each other and from the Champion Legend: ${names(repeated)} repeats.`, repeated.map((c) => c.id)));
    }
  }

  // 31-32: 2v2 with a teammate's deck.
  if (deck.format === '2v2' && deck.teammate) {
    const mate = deck.teammate.legend ? db.get(deck.teammate.legend) : undefined;
    if (legend && mate && nameKey(mate.name) === nameKey(legend.name)) {
      out.push(violation('TEAM_SAME_LEGEND', 'error', 'CR 491.8.h', `Both teammates use ${legend.name}; in 2v2 the two Champion Legends must differ.`, [legend.id]));
    }
    const mine = new Map(fieldIds.map((id) => [nameKey(db.get(id)?.name ?? id), id] as const));
    const shared = [...new Set((deck.teammate.battlefields ?? []).map((id) => mine.get(nameKey(db.get(id)?.name ?? id))).filter((id): id is string => id !== undefined))];
    if (shared.length > 0) {
      out.push(violation('TEAM_SAME_BATTLEFIELD', 'error', 'CR 491.8.i', `Both teammates bring ${shared.map((id) => db.get(id)?.name ?? id).join(', ')}; in 2v2 partners cannot include the same battlefield.`, shared));
    }
  }

  // 33: other champion units in the list that could become the Chosen Champion while sideboarding.
  if (legend && champion && rules.sideAllowed) {
    const eligible = new Set(eligibleChampions(legend, db).map((c) => c.id));
    const alts = [...new Map(combined.map((c) => [c.id, c])).values()]
      .filter((c) => eligible.has(c.id) && nameKey(c.name) !== nameKey(champion.name) && !ctx.bans.has(c.id));
    if (alts.length > 0) {
      out.push(violation('ALT_CHAMPION_AVAILABLE', 'info', 'TR 403.4.a, 601.1.c.4', `While sideboarding you may change your Chosen Champion from ${champion.name} to ${names(alts)}.`, alts.map((c) => c.id)));
    }
  }

  return out;
}

/**
 * True when nothing in the list stops the deck from being called legal: no error, and no DATA_STALE.
 * DATA_STALE is a warning in rules.md §12, but a card that could not be checked means legality is unknown,
 * and a deck the app calls legal must be legal (AGENTS.md hard rule 3).
 */
export function isLegal(violations: readonly Violation[]): boolean {
  return !violations.some((v) => v.severity === 'error' || v.code === 'DATA_STALE');
}
