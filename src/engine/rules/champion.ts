// Champion tags and Chosen Champion eligibility (CR 103.3.a.2, 133.7.a, 133.8.b; docs/research/rules.md §3). Pure.
import type { Card, CardDb } from '../types';
import { identityFit } from './identity';
import { nameKey } from './names';

/** Champion is a supertype of units only (CR 133.7.a); some legend rows carry it by mistake (rules.md §8.2). */
export const isChampionUnit = (card: Card): boolean => card.type === 'unit' && card.superTypes.includes('champion');
export const isSignature = (card: Card): boolean => card.superTypes.includes('signature');
export const isTokenCard = (card: Card): boolean => card.superTypes.includes('token');

/**
 * The tag that links a legend, its champion units and its signature cards (CR 133.8.b).
 * - champion unit: its short name ("Kai'Sa, Survivor" -> "Kai'Sa"), unless the reviewed overrides set one.
 *   HEURISTIC backed by data (rules.md §3): the rules do not mark which tag is the champion tag, and the raw
 *   tag list is wrong for some printings (Karma, Channeler OGN-235 carries "Vi"), so tags are never compared.
 * - legend and signature card: the tag the card sync resolved.
 * - anything else: null. A shared tag such as Yordle is never a champion tag.
 */
export function championTagOf(card: Card): string | null {
  if (isChampionUnit(card)) return card.championTag ?? card.shortName ?? null;
  if (card.type === 'legend' || isSignature(card)) return card.championTag;
  return null;
}

export const sameTag = (a: string | null, b: string | null): boolean => a !== null && b !== null && nameKey(a) === nameKey(b);

/**
 * Champion units that may be the Chosen Champion under this legend: champion tag matches (CR 103.3.a.2)
 * and the card is inside the legend's domains (CR 103.3.c). Rows with incomplete data are left out.
 * Bans depend on the format and are not applied here: use `cardFitsDeck`.
 */
export function eligibleChampions(legend: Card, db: CardDb): Card[] {
  if (legend.type !== 'legend') return [];
  const tag = championTagOf(legend);
  if (!tag) return [];
  const identity = new Set(legend.domains);
  return db.all()
    .filter((c) => isChampionUnit(c) && !isTokenCard(c) && !c.dataIncomplete && sameTag(championTagOf(c), tag) && identityFit(c, identity) === 'ok')
    .sort((a, b) => a.name.localeCompare(b.name));
}
