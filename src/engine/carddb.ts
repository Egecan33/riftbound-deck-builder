// In-memory card database. Pure: takes plain data, returns the CardDb contract of types.ts.
import { codeKey, looksLikeCode, nameKey } from './rules/names';
import type { Card, CardDb, CardEdge, CardFeatures, LegalityData, LegendMeta, LegendProfile } from './types';

/** JSON form of a card: `copyLimit` Infinity is written as null because JSON has no Infinity. */
export type StoredCard = Omit<Card, 'copyLimit'> & { copyLimit: number | null };

export const serializeCard = (card: Card): StoredCard => ({
  ...card,
  copyLimit: Number.isFinite(card.copyLimit) ? card.copyLimit : null,
});

export const reviveCard = (stored: StoredCard): Card => ({
  ...stored,
  copyLimit: stored.copyLimit === null ? Infinity : stored.copyLimit,
});

export const isToken = (card: Card): boolean => card.superTypes.includes('token');

const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const EMPTY_LEGALITY: LegalityData = { asOf: '', sets: [], bans: [], sideboardMax: 0 };

/**
 * @param aliases extra lookup keys -> card id: printing codes and ids ("OGN-066a", "rad-173-167"),
 *   and reviewed alternative names ("Yi, Meditative"). Card names, codes and ids need no alias.
 */
export function createCardDb(
  cards: readonly Card[],
  features: readonly CardFeatures[] = [],
  edges: readonly CardEdge[] = [],
  profiles: readonly LegendProfile[] = [],
  meta: readonly LegendMeta[] = [],
  legality: LegalityData = EMPTY_LEGALITY,
  aliases: Readonly<Record<string, string>> = {},
): CardDb {
  const byId = new Map<string, Card>();
  for (const card of cards) byId.set(card.id, card);

  const byNameKey = new Map<string, Card>();
  const byCodeKey = new Map<string, Card>();
  const putName = (key: string, card: Card) => {
    if (!key) return;
    const held = byNameKey.get(key);
    // A real card wins a name collision with a token ("Gold", "Sprite").
    if (!held || (isToken(held) && !isToken(card))) byNameKey.set(key, card);
  };
  for (const card of cards) {
    putName(nameKey(card.name), card);
    byCodeKey.set(codeKey(card.id), card);
    if (!byCodeKey.has(codeKey(card.code))) byCodeKey.set(codeKey(card.code), card);
  }
  for (const card of cards) {
    // Official prose writes a legend as "{champion}, {name}" ("Master Yi, Wuju Bladesman").
    if (card.type === 'legend' && card.championTag) {
      const key = nameKey(`${card.championTag}, ${card.name}`);
      if (!byNameKey.has(key)) byNameKey.set(key, card);
    }
  }
  for (const [alias, id] of Object.entries(aliases)) {
    const card = byId.get(id);
    if (!card) continue;
    if (looksLikeCode(alias)) {
      if (!byCodeKey.has(codeKey(alias))) byCodeKey.set(codeKey(alias), card);
    } else if (!byNameKey.has(nameKey(alias))) {
      byNameKey.set(nameKey(alias), card);
    }
  }

  const featuresById = new Map(features.map((f) => [f.id, f]));
  const edgesById = new Map<string, CardEdge[]>();
  const edgeByPair = new Map<string, CardEdge>();
  for (const edge of edges) {
    edgeByPair.set(pairKey(edge.a, edge.b), edge);
    for (const id of edge.a === edge.b ? [edge.a] : [edge.a, edge.b]) {
      const list = edgesById.get(id);
      if (list) list.push(edge);
      else edgesById.set(id, [edge]);
    }
  }
  const profileById = new Map(profiles.map((p) => [p.legendId, p]));
  const metaById = new Map(meta.map((m) => [m.legendId, m]));
  const nonTokens: readonly Card[] = cards.filter((c) => !isToken(c));
  const none: readonly CardEdge[] = [];

  return {
    get: (id) => byId.get(id),
    features: (id) => featuresById.get(id),
    byName: (name) => {
      const text = name.trim();
      if (!text) return undefined;
      const direct = byId.get(text);
      if (direct) return direct;
      if (looksLikeCode(text)) {
        const key = codeKey(text);
        // A variant printing the source does not list ("RAD-171*", "OGN-066b") is the card of its base number.
        const byCode = byCodeKey.get(key) ?? byCodeKey.get(key.replace(/^([a-z]+-(?:sp|t|r)?\d+)[abs]$/, '$1'));
        if (byCode) return byCode;
      }
      return byNameKey.get(nameKey(text));
    },
    all: () => nonTokens,
    edges: (id) => edgesById.get(id) ?? none,
    edge: (a, b) => edgeByPair.get(pairKey(a, b)),
    legendProfile: (id) => profileById.get(id),
    legendMeta: (id) => metaById.get(id),
    legality: () => legality,
  };
}
