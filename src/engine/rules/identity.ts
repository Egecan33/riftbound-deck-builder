// Domain Identity (CR 103.2.b; docs/research/rules.md §2). Pure.
import type { Card, CardDb, Deck, Domain } from '../types';

/** The Champion Legend card of a deck, or null when none is set, it is unknown, or it is not a legend. */
export function legendOf(deck: Deck, db: CardDb): Card | null {
  if (!deck.legend) return null;
  const card = db.get(deck.legend);
  return card && card.type === 'legend' && !card.superTypes.includes('token') ? card : null;
}

/**
 * The set of domains of the Champion Legend (CR 103.2.b.2). Empty when the deck has no usable legend:
 * callers then skip identity checks rather than reject every card. Legends added by effects
 * (`extraLegends`, Neeko) are not Champion Legends and do not widen it (CR 107.4.d.1).
 */
export function domainIdentity(deck: Deck, db: CardDb): Set<Domain> {
  return new Set(legendOf(deck, db)?.domains ?? []);
}

export type IdentityFit = 'ok' | 'outside' | 'unknown';

/**
 * 'ok': no-domain card (CR 103.2.b.5) or every domain inside the identity (CR 103.2.b.3-.4).
 * 'unknown': an empty domain list without the no-domain mark is missing data, never a pass (rules.md §2).
 */
export function identityFit(card: Card, identity: ReadonlySet<Domain>): IdentityFit {
  if (card.noDomain) return 'ok';
  if (card.domains.length === 0) return 'unknown';
  return card.domains.every((d) => identity.has(d)) ? 'ok' : 'outside';
}
