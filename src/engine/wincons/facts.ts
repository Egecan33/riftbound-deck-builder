// Rule facts that lines and win routes quote. New code.
//
// FACT: every number here is from docs/research/rules.md section 10 and docs/research/matchups-and-lines.md
// section 2, with the rule numbers of the Core Rules of 2026-10-09 (the research file's section 2.9 maps the
// older numbers). Each number below was read in the 2026-10-09 rules text itself; where the research map
// disagreed (hidden targets: 811.1.d.2, not 811.1.d.5) the rules text wins. Nothing here is a list: these are
// constants of the rules text, cited where they are used.
import { RUNE_DECK_SIZE, formatRules } from '../rules/formats';
import type { Format } from '../types';

export const RULE = {
  draw4: 'CR 116',
  mulligan: 'CR 117.1',
  championZone: 'CR 103.3.a.1',
  holdStep: 'CR 315.2.b',
  channel2: 'CR 315.3.b',
  draw1: 'CR 315.4.b',
  runePool: 'CR 167',
  basicRune: 'CR 164.2',
  entersExhausted: 'CR 359.2.c',
  moveCost: 'CR 144.2',
  moveDestinations: 'CR 144.4',
  showdownTiming: 'CR 308.1.a',
  closedTiming: 'CR 309.1.a',
  focusAttacker: 'CR 466.2.c.1.a',
  focusAround: 'CR 347.2.b',
  healAfterCombat: 'CR 468.1.a.1, CR 317.2.b',
  tankFirst: 'CR 815.1.b',
  oncePerBattlefield: 'CR 472',
  finalPointOther: 'CR 473.1.a.1',
  finalPointConquer: 'CR 473.1.b.1',
  accelerate: 'CR 805.1.b',
  deathknell: 'CR 808',
  ganking: 'CR 810.1.b',
  hidden: 'CR 811.1.b',
  hiddenPermanent: 'CR 811.1.d.1',
  hiddenTargets: 'CR 811.1.d.2',
  legion: 'CR 812.1.c',
  temporary: 'CR 816.1.b',
  equip: 'CR 818.1.b',
  quickDraw: 'CR 819.1.c',
  ambush: 'CR 822.1.b',
  hunt: 'CR 823.1.c.1',
  level: 'CR 824.1.b.1',
  gearRecall: 'CR 459.1',
  thirdPartyCombat: 'CR 449.2.a',
  teammateBattlefield: 'CR 449.2.b',
  teamOncePerTurn: 'CR 491.8.b',
  teamPoints: 'CR 491.8.d',
  teamFriendly: 'CR 491.8.e',
  teamFinalPoint: 'CR 491.8.g.1',
  sideSize: 'TR 601.1.c.1',
  sideOneForOne: 'TR 403.4',
  sideChampion: 'TR 403.4.a',
  sideGameOne: 'TR 403.5',
} as const;

/** The library: the Main Deck without the Chosen Champion copy in the Champion Zone (CR 103.3.a.1). */
export const OPENING = 4;        // CR 116
export const MULLIGAN_MAX = 2;   // CR 117.1

export interface Seat {
  id: 'first' | 'last';
  /** "on the play" / "on the draw" in 1v1; "going first" / "going last" with more players. */
  label: string;
  /** Runes channelled by your own turn `t` (no ramp, no Power spent). */
  runes(turn: number): number;
  /** Cards seen by your own turn `t` without a mulligan. */
  seen(turn: number): number;
  /** The rule that sets this seat apart. */
  rule: string;
}

export interface FormatFacts {
  format: Format;
  victoryScore: number;
  victoryRule: string;
  battlefieldsOnBoard: number;
  battlefieldRule: string;
  opponents: number;
  team: boolean;
  bestOfThree: boolean;
  /** How the battlefield of a game is picked, with its rule. */
  battlefieldPick: { chosen: boolean; rule: string };
  firstTurnRule: string;
  seats: [Seat, Seat];
}

const cap = (n: number): number => Math.max(0, Math.min(RUNE_DECK_SIZE, n));

export function formatFacts(format: Format): FormatFacts {
  const rules = formatRules(format);
  const multi = format === 'ffa3' || format === 'ffa4' || format === '2v2';
  const mode = format === 'standard-bo3' ? 488 : format === 'ffa3' ? 489 : format === 'ffa4' ? 490 : format === '2v2' ? 491 : 487;
  const firstTurnRule = `CR ${mode}.7`;
  // 1v1: the second player channels one extra rune on the first turn; nobody skips a draw.
  // FFA and 2v2: the first player skips the first draw and the last player channels the extra rune.
  const first: Seat = {
    id: 'first', label: multi ? 'going first' : 'on the play', rule: multi ? firstTurnRule : RULE.channel2,
    runes: (t) => cap(2 * Math.max(0, Math.floor(t))),
    seen: (t) => (t <= 0 ? OPENING : OPENING + Math.floor(t) - (multi ? 1 : 0)),
  };
  const last: Seat = {
    id: 'last', label: multi ? 'going last' : 'on the draw', rule: firstTurnRule,
    runes: (t) => (t <= 0 ? 0 : cap(2 * Math.floor(t) + 1)),
    seen: (t) => OPENING + Math.max(0, Math.floor(t)),
  };
  return {
    format,
    victoryScore: rules.victoryScore,
    victoryRule: `CR ${mode}.3`,
    battlefieldsOnBoard: rules.battlefieldsOnBoard,
    battlefieldRule: `CR ${mode}.4`,
    opponents: format === 'ffa3' ? 2 : format === 'ffa4' ? 3 : format === '2v2' ? 2 : 1,
    team: format === '2v2',
    bestOfThree: format === 'standard-bo3',
    battlefieldPick: { chosen: format === 'standard-bo3', rule: `CR ${mode}.5` },
    firstTurnRule,
    seats: [first, last],
  };
}
