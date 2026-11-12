// What a format changes about a deck (docs/research/rules.md §4, §7, §9, §10). Pure.
import type { Format, LegalityData } from '../types';

export interface FormatRules {
  mainExact: number | null;     // tournament formats: exactly this many main-deck cards (TR 402.1, 601.1.b)
  mainMin: number;              // CR 103.3
  sideAllowed: boolean;
  sideMax: number;
  victoryScore: number;
  battlefieldsOnBoard: number;
  banListOf: Format;            // the format whose ban entries apply; 'casual' has none
}

// Rule constants, not lists: CR 103.3 (40), CR 103.4.a (12), CR 487.4.a-491.4.a (3), CR 103.3.d.1 (3).
/** Human names of formats and domains for messages the owner reads (ids stay in data). */
export const FORMAT_NAME: Record<Format, string> = {
  'standard-bo1': 'Standard best of one', 'standard-bo3': 'Standard best of three', '2v2': '2v2',
  ffa3: 'Free-for-all (3)', ffa4: 'Free-for-all (4)', casual: 'Casual',
};
export const formatName = (f: string): string => FORMAT_NAME[f as Format] ?? f;
export const domainName = (d: string): string => d.charAt(0).toUpperCase() + d.slice(1);

export const MAIN_MIN = 40;
export const RUNE_DECK_SIZE = 12;
export const BATTLEFIELDS_BROUGHT = 3;
export const SIGNATURE_MAX = 3;
/** TR 601.1.c.1. The live value is `LegalityData.sideboardMax` (sync-data/legality.json); this is the fallback when no legality data is loaded. */
const SIDE_MAX_FALLBACK = 10;

/**
 * @param legality when given, the side-deck maximum comes from the synced snapshot.
 * Side deck: standard-bo3 by rule (TR 601.1.c); standard-bo1 at the head judge's option (TR 406.1.h);
 * 2v2 optional (HEURISTIC, rules.md §10: unconfirmed whether sanctioned 2v2 uses one). FFA and casual
 * have no side deck in any rule (warning only). FFA main-deck size follows the Core Rules (at least 40)
 * because no tournament section covers free-for-all.
 */
export function formatRules(format: Format, legality?: LegalityData): FormatRules {
  const sideMax = legality && legality.sideboardMax > 0 ? legality.sideboardMax : SIDE_MAX_FALLBACK;
  switch (format) {
    case 'standard-bo1':
    case 'standard-bo3':
      return { mainExact: MAIN_MIN, mainMin: MAIN_MIN, sideAllowed: true, sideMax, victoryScore: 8, battlefieldsOnBoard: 2, banListOf: format };
    case '2v2':
      return { mainExact: MAIN_MIN, mainMin: MAIN_MIN, sideAllowed: true, sideMax, victoryScore: 11, battlefieldsOnBoard: 3, banListOf: '2v2' };
    case 'ffa3':
    case 'ffa4':
      return { mainExact: null, mainMin: MAIN_MIN, sideAllowed: false, sideMax: 0, victoryScore: 8, battlefieldsOnBoard: 3, banListOf: format };
    case 'casual':
    default:
      return { mainExact: null, mainMin: MAIN_MIN, sideAllowed: false, sideMax: 0, victoryScore: 8, battlefieldsOnBoard: 2, banListOf: 'casual' };
  }
}
