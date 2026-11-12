// What Riftfoundry's scoreDeck read from modules that do not exist in Forge. Partly ported, partly replaced.
//
// Ported from Riftfoundry apps/web/src/lib/meta.ts at origin/main 4b90179 (lines 3-64, 102-109, 547-650):
// MetaCalibration types and resolveDeckMetaOverlay, unchanged, and score-model-version.ts.
//
// FORGE CHANGES (AGENTS.md rule 2: lists live in synced data, not code):
// - Riftfoundry's ban registry and preview-set dates came from a JSON file compiled into scoring.ts. Here
//   they are passed in: DeckScoreOptions.bannedCardIds / bannedBattlefieldIds / previewSets. With none
//   passed the ported legality block reports no ban; Forge's legality is src/engine/rules/validate.ts.
// - rateCardWithEvidence read Riftfoundry's tournament calibration file and its site gameplay evidence.
//   Forge has neither; a caller may pass DeckScoreOptions.cardEvidence. The default adds nothing, so the
//   ported score is the mechanical one and Forge's measured play enters in src/engine/scoring (Quality, Meta).
import { baseCardRating, cardTierGrade, type CardTierGrade, type ScoreCard } from "../../mine";

export const SCORE_MODEL_VERSION = "RDS 0.8.4";

/** Stand-in for Riftfoundry's GameplayEvidence report (site games); Forge has no such report. */
export type GameplayEvidence = null;

export interface BanSets {
  bannedCardIds?: ReadonlySet<string>;
  bannedBattlefieldIds?: ReadonlySet<string>;
  /** set id -> { label, legalFrom } for sets that are preview-only on the rules date. */
  previewSets?: Readonly<Record<string, { label: string; legalFrom: string }>>;
  /** Tournament / outcome bonus of a card on the 2..8.5 scale (Riftfoundry: 0..0.15 and a small outcome term). */
  cardEvidence?: (card: ScoreCard) => { tournament: number; outcomes: number; tournamentDecks?: number } | null;
}

const NO_IDS: ReadonlySet<string> = new Set();
export const bannedCards = (o: BanSets): ReadonlySet<string> => o.bannedCardIds ?? NO_IDS;
export const bannedBattlefields = (o: BanSets): ReadonlySet<string> => o.bannedBattlefieldIds ?? NO_IDS;
export const isConstructedBanned = (card: Pick<ScoreCard, "id">, o: BanSets): boolean =>
  bannedCards(o).has(card.id) || bannedBattlefields(o).has(card.id);
export const previewSetLegalFrom = (setId: string, o: BanSets): string | null => o.previewSets?.[setId]?.legalFrom ?? null;
export const previewSetLabel = (setId: string, o: BanSets): string => o.previewSets?.[setId]?.label ?? setId;

export interface EvidenceCardRating {
  foundation: number;
  tournament: number;
  outcomes: number;
  score: number;
  grade: CardTierGrade;
  tournamentDecks: number;
  siteGames: number;
}

/** Same shape and arithmetic as Riftfoundry's; the evidence terms come from the injected hook. */
export function rateCardWithEvidence(card: ScoreCard, o: BanSets = {}): EvidenceCardRating {
  const foundation = baseCardRating(card);
  const banned = isConstructedBanned(card, o);
  const evidence = banned ? null : o.cardEvidence?.(card) ?? null;
  const tournament = Math.min(0.15, Math.max(0, evidence?.tournament ?? 0));
  const outcomes = evidence?.outcomes ?? 0;
  const score = Math.round((foundation + tournament + outcomes) * 1000) / 1000;
  return { foundation, tournament, outcomes, score, grade: cardTierGrade(score), tournamentDecks: evidence?.tournamentDecks ?? 0, siteGames: 0 };
}

export interface MetaSnapshot {
  id: string;
  scoreModelVersionId: string;
  scoreModelVersion: string;
  sourceSlug: string;
  sourceUrl: string;
  attributionText: string;
  capturedAt: string;
  verifiedAt: string;
  activatedAt: string;
}

export interface MetaCardAdjustment {
  snapshotId: string;
  gameplayCardKey: string;
  adjustment: number;
  adjustmentCap: number;
  signalKind?: "top_list_presence";
  eligibleDecks?: number;
  includedDecks?: number;
  topListPresence?: number;
  meanCopiesWhenIncluded?: number;
  eventBreadth?: number;
  legendBreadth?: number;
  legendBreadthRequirement?: number;
  effectiveSampleSize?: number;
  evidenceConfidence?: number;
  sourceLabel?: string;
  sourceUrl?: string;
  observedFrom?: string;
  observedTo?: string;
}

export interface MetaPairAdjustment {
  snapshotId: string;
  leftCardKey: string;
  rightCardKey: string;
  adjustment: number;
  adjustmentCap: number;
  signalKind?: "conditional_cooccurrence";
  eligibleDecks?: number;
  jointDecks?: number;
  eventBreadth?: number;
  legendBreadth?: number;
  effectiveSampleSize?: number;
  sourceLabel?: string;
  sourceUrl?: string;
  observedFrom?: string;
  observedTo?: string;
}

export interface MetaCalibration {
  snapshot: MetaSnapshot | null;
  cardAdjustments: readonly MetaCardAdjustment[];
  pairAdjustments: readonly MetaPairAdjustment[];
}

export const EMPTY_META_CALIBRATION: MetaCalibration = {
  snapshot: null,
  cardAdjustments: [],
  pairAdjustments: [],
};
export interface ResolvedMetaOverlay {
  card: number;
  pair: number;
  total: number;
  matchedCardRows: number;
  matchedPairRows: number;
  matchedCardNames: string[];
}
export interface MetaDeckEntry {
  card: {
    id: string;
    name: string;
  };
  quantity: number;
}

const clamp = (value: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, value));

const MAX_SELECTED_TOP_LIST_CARD_ADJUSTMENT = 0.15;
const MAX_CONDITIONAL_PAIR_ADJUSTMENT = 0.35;

function boundedAdjustment(
  adjustment: number,
  requestedCap: number,
  maximumCap: number,
): number {
  if (!Number.isFinite(adjustment)) return 0;
  const cap = Number.isFinite(requestedCap)
    ? clamp(Math.abs(requestedCap), 0, maximumCap)
    : maximumCap;
  return clamp(adjustment, -cap, cap);
}

function pairKey(left: string, right: string): string {
  return left < right ? `${left}\u0000${right}` : `${right}\u0000${left}`;
}

function rounded(value: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function resolveDeckMetaOverlay(
  entries: readonly MetaDeckEntry[],
  calibration: MetaCalibration | undefined,
): ResolvedMetaOverlay {
  if (
    !calibration ||
    calibration.snapshot?.scoreModelVersion !== SCORE_MODEL_VERSION
  ) {
    return {
      card: 0,
      pair: 0,
      total: 0,
      matchedCardRows: 0,
      matchedPairRows: 0,
      matchedCardNames: [],
    };
  }

  const copies = new Map<string, number>();
  const names = new Map<string, string>();
  for (const { card, quantity } of entries) {
    if (!card.id || !Number.isFinite(quantity) || quantity <= 0) continue;
    const count = Math.floor(quantity);
    copies.set(card.id, (copies.get(card.id) ?? 0) + count);
    names.set(card.id, card.name);
  }

  let cardTotal = 0;
  let pairTotal = 0;
  let matchedCardRows = 0;
  let matchedPairRows = 0;
  const matchedNames = new Set<string>();

  const cardRows = [...calibration.cardAdjustments].sort((left, right) =>
    left.gameplayCardKey.localeCompare(right.gameplayCardKey),
  );
  for (const row of cardRows) {
    const quantity = copies.get(row.gameplayCardKey) ?? 0;
    if (quantity <= 0) continue;
    const adjustment = boundedAdjustment(
      row.adjustment,
      row.adjustmentCap,
      MAX_SELECTED_TOP_LIST_CARD_ADJUSTMENT,
    );
    cardTotal += Math.max(0, adjustment);
    matchedCardRows += 1;
    const name = names.get(row.gameplayCardKey);
    if (name) matchedNames.add(name);
  }

  const pairRows = [...calibration.pairAdjustments].sort((left, right) =>
    pairKey(left.leftCardKey, left.rightCardKey).localeCompare(
      pairKey(right.leftCardKey, right.rightCardKey),
    ),
  );
  for (const row of pairRows) {
    const leftQuantity = copies.get(row.leftCardKey) ?? 0;
    const rightQuantity = copies.get(row.rightCardKey) ?? 0;
    if (leftQuantity <= 0 || rightQuantity <= 0) continue;
    const adjustment = boundedAdjustment(
      row.adjustment,
      row.adjustmentCap,
      MAX_CONDITIONAL_PAIR_ADJUSTMENT,
    );
    pairTotal += adjustment;
    matchedPairRows += 1;
    const leftName = names.get(row.leftCardKey);
    const rightName = names.get(row.rightCardKey);
    if (leftName) matchedNames.add(leftName);
    if (rightName) matchedNames.add(rightName);
  }

  const card = rounded(cardTotal);
  const pair = rounded(pairTotal);
  return {
    card,
    pair,
    total: rounded(card + pair),
    matchedCardRows,
    matchedPairRows,
    matchedCardNames: [...matchedNames].sort(),
  };
}
