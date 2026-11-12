// Universal deck codes. Ported from Riftfoundry apps/web/src/lib/deck-code.ts (commit 4b90179):
// a wrapper around @piltoverarchive/riftbound-deck-codes (Apache-2.0) that maps its card codes to and
// from Forge cards. Changes from the source: cards come from a CardDb instead of the bundled gallery
// file, printings merge by gameplay id, the side deck and additional legends are encoded, library
// errors are returned instead of thrown, and the hand-patched SET_MAP entries are gone (library 1.5.0
// ships VEN and RAD). Pure: the library is plain JavaScript with no Node dependency.
import { getCodeFromDeck, getDeckFromCode, type Deck as CodeDeck } from '@piltoverarchive/riftbound-deck-codes';
import type { Card, CardDb, Deck, Domain } from '../types';
import { DeckCollector } from './collector';
import { cardByCode, type UnresolvedLine } from './resolve';

export interface DecodedDeckCode {
  deck: Partial<Deck>;
  /** Card codes in the deck code that are not in the card data; `line` is the entry's position. */
  unresolved: UnresolvedLine[];
  notices: string[];
  /** Set when the code itself could not be read; `deck` is then empty. */
  error: string | null;
}

export interface EncodedDeckCode {
  code: string;
  /** Cards that could not be written into the code, by name. Empty when the code holds the whole deck. */
  skipped: string[];
  error: string | null;
}

/** True for a single base32 token long enough to be a deck code rather than a card name. */
export function looksLikeDeckCode(text: string): boolean {
  return /^[A-Za-z2-7]{24,}$/.test(text.trim());
}

const describeError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  return /unknown set/i.test(message)
    ? `Unknown set in deck code; the deck-code library needs an update. (${message})`
    : `Not a readable deck code. (${message})`;
};

/**
 * Decodes a deck code. The code's "main deck" holds everything (legend, battlefields, runes and main
 * cards, docs/research/legality-and-data.md §7.3); each entry is placed by its card type.
 */
export function decodeDeckCode(code: string, db: CardDb): DecodedDeckCode {
  const collector = new DeckCollector(db);
  const unresolved: UnresolvedLine[] = [];
  let decoded: ReturnType<typeof getDeckFromCode>;
  try {
    decoded = getDeckFromCode(String(code ?? '').trim().toUpperCase());
  } catch (error) {
    return { deck: {}, unresolved, notices: [], error: describeError(error) };
  }
  let position = 0;
  const place = (section: CodeDeck, zone: 'main' | 'side') => {
    for (const { cardCode, count } of section) {
      position += 1;
      const card = cardByCode(cardCode, db);
      if (!card || !collector.add(card, count, zone)) unresolved.push({ line: position, text: `${count} ${cardCode}` });
    }
  };
  place(decoded.mainDeck ?? [], 'main');
  place(decoded.sideboard ?? [], 'side');
  for (const legendCode of decoded.additionalLegends ?? []) {
    position += 1;
    const card = cardByCode(legendCode, db);
    if (card) collector.add(card, 1, 'main');
    else unresolved.push({ line: position, text: `1 ${legendCode}` });
  }
  if (decoded.chosenChampion) {
    const champion = cardByCode(decoded.chosenChampion, db);
    if (champion) collector.setChampion(champion);
    else {
      unresolved.push({ line: position + 1, text: `1 ${decoded.chosenChampion}` });
      collector.notices.push(`Unknown Chosen Champion: ${decoded.chosenChampion}`);
    }
  }
  return { deck: collector.deck(), unresolved, notices: collector.notices, error: null };
}

/** The rune card a domain's rune count is written as: the basic rune of the earliest set. */
export function runeCardForDomain(domain: Domain, db: CardDb): Card | undefined {
  const runes = db.all().filter((c) => c.type === 'rune' && c.domains.length === 1 && c.domains[0] === domain);
  return runes.find((c) => c.superTypes.includes('basic')) ?? runes[0];
}

const PORTABLE = /^[A-Z]{2,4}-(?:R|SP)?\d+[a-z*]?$/;

/** Encodes a deck. Never throws: cards without a portable code are listed in `skipped`. */
export function encodeDeckCode(deck: Deck, db: CardDb): EncodedDeckCode {
  const skipped: string[] = [];
  const codeOf = (id: string): string | null => {
    const card = db.get(id);
    if (!card || !PORTABLE.test(card.code)) { skipped.push(card?.name ?? id); return null; }
    return card.code;
  };
  const collect = (pairs: Iterable<[string, number]>): CodeDeck => {
    const counts = new Map<string, number>();
    for (const [id, qty] of pairs) {
      if (!(qty > 0)) continue;
      const code = codeOf(id);
      if (code) counts.set(code, (counts.get(code) ?? 0) + Math.trunc(qty));
    }
    return [...counts.entries()].map(([cardCode, count]) => ({ cardCode, count }));
  };
  const everything: [string, number][] = (deck.main ?? []).map((e) => [e.id, e.qty]);
  if (deck.legend) everything.push([deck.legend, 1]);
  for (const id of deck.battlefields ?? []) everything.push([id, 1]);
  for (const [domain, count] of Object.entries(deck.runes ?? {}) as [Domain, number][]) {
    const rune = runeCardForDomain(domain, db);
    if (rune) everything.push([rune.id, count]);
    else if (count > 0) skipped.push(`${domain} rune`);
  }
  const mainDeck = collect(everything);
  const sideboard = collect((deck.side ?? []).map((e) => [e.id, e.qty]));
  const champion = deck.champion ? codeOf(deck.champion) : null;
  const extra = (deck.extraLegends ?? []).map(codeOf).filter((c): c is string => c !== null);
  try {
    const code = getCodeFromDeck(mainDeck, sideboard, champion ?? undefined, extra.length ? extra : undefined);
    return { code, skipped, error: null };
  } catch (error) {
    return { code: '', skipped, error: error instanceof Error ? error.message : String(error) };
  }
}
