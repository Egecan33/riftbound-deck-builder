// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 255-286, 8091-9043):
// candidate fit: evaluateCandidateFit, rankCandidateFits.
// Port rule (spec 8.4): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  DECK_CURVE_TARGETS, baseCardRating, clamp, curveBandFor, deriveTraits, finiteOr, isMainDeckScoreCard, round,
  type CurveBandId, type DeckEntry, type ScoreCard, type Trait,
} from "../../mine";
import {
  analyzeCardPair, analyzeCardTripleWithResolvers, hasAnyTrait, type CardPairAnalysis, type CardTripleAnalysis, type CombinationReason,
} from "../../network";
import { isConstructedBanned } from "./externals";
import { DEFAULT_EARLY_DRAWS, STANDARD_OPENING_HAND, cardRuneReliability } from "../../maths/hypergeo";
import {
  allocateRunes, contextualAffinity, equipmentContextForCard, normalizeMainDeckEntries, safeQuantity, scoreDeck,
  validExternalLegend, weightedCards, type DeckFormat, type DeckScore, type DeckScoreOptions,
} from "./deck-score";
export interface CandidateFitComponentDelta {
  base: number;
  synergy: number;
  antisynergy: number;
  compatibility: number;
  structure: number;
  meta: number;
  curve: number;
  runes: number;
  roles: number;
}

export interface CandidateFit {
  card: ScoreCard;
  before: DeckScore;
  after: DeckScore;
  totalDelta: number;
  fitIndex: number;
  fitReasons: string[];
  components: CandidateFitComponentDelta;
  pairAnalyses: CardPairAnalysis[];
  tripleAnalyses: CardTripleAnalysis[];
}

export type CandidateOwnershipFilter = "all" | "owned" | "not-owned";

export interface CandidateFitOptions extends DeckScoreOptions {
  collection?: Readonly<Record<string, number>>;
  ownership?: CandidateOwnershipFilter;
  excludeBanned?: boolean;
  limit?: number;
}
export function candidateCurveRepairScore(
  entries: readonly DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions,
): number {
  const format = options.format ?? "standard-1v1";
  const profile = DECK_CURVE_TARGETS[format];
  const targetDeckSize = Math.max(
    1,
    Math.floor(
      finiteOr(options.targetDeckSize, format === "vendetta-prerift" ? 25 : 40),
    ),
  );
  const scale = targetDeckSize / profile.targetDeckSize;
  const band = curveBandFor(candidate);
  let score = 0;
  if (band) {
    const target = profile.bands.find((entry) => entry.id === band);
    const current = entries.reduce(
      (sum, entry) =>
        sum +
        (curveBandFor(entry.card) === band ? safeQuantity(entry.quantity) : 0),
      0,
    );
    if (target) {
      const ideal = Math.max(1, Math.round(target.ideal * scale));
      const maximum = Math.max(1, Math.round(target.maximum * scale));
      if (current < ideal) score += (ideal - current) / ideal;
      if (current >= maximum) score -= 0.75;
    }
  }

  const earlyUnitTarget = format === "vendetta-prerift" ? 5 : 9;
  const earlyUnits = entries.reduce(
    (sum, entry) =>
      sum +
      (entry.card.type === "unit" &&
      finiteOr(entry.card.energy, 99) >= 2 &&
      finiteOr(entry.card.energy, 99) <= 4
        ? safeQuantity(entry.quantity)
        : 0),
    0,
  );
  if (
    earlyUnits < earlyUnitTarget &&
    candidate.type === "unit" &&
    finiteOr(candidate.energy, 99) >= 2 &&
    finiteOr(candidate.energy, 99) <= 4
  ) {
    score += 0.9 * (1 - earlyUnits / earlyUnitTarget);
  }
  return round(clamp(score, -1, 2), 3);
}

export function candidateRoleRepairScore(
  entries: readonly DeckEntry[],
  candidate: ScoreCard,
  format: DeckFormat,
): number {
  const cards = weightedCards([...entries]);
  const traits = deriveTraits(candidate);
  const countRole = (roles: Trait[]) =>
    cards.filter((card) => {
      const current = deriveTraits(card);
      return roles.some((role) => current.has(role));
    }).length;
  const interactionTarget = format === "vendetta-prerift" ? 3 : 6;
  const velocityTarget = format === "vendetta-prerift" ? 2 : 4;
  const scoringTarget = format === "vendetta-prerift" ? 3 : 5;
  let repair = 0;
  const interaction = countRole(["interaction", "removal", "counter", "stun"]);
  if (
    interaction < interactionTarget &&
    hasAnyTrait(traits, ["interaction", "removal", "counter", "stun"])
  ) {
    repair += 1 - interaction / interactionTarget;
  }
  const velocity = countRole(["draw", "predict", "recycle"]);
  if (
    velocity < velocityTarget &&
    hasAnyTrait(traits, ["draw", "predict", "recycle"])
  ) {
    repair += 0.7 * (1 - velocity / velocityTarget);
  }
  const scoring = countRole(["scoring", "movement", "ganking", "assault"]);
  if (
    scoring < scoringTarget &&
    hasAnyTrait(traits, ["scoring", "movement", "ganking", "assault"])
  ) {
    repair += 0.65 * (1 - scoring / scoringTarget);
  }
  return round(clamp(repair, 0, 2), 3);
}

export interface CandidateFitMetrics {
  curveRepair: number;
  roleRepair: number;
  runeReliability: number;
  fitIndex: number;
  fitReasons: string[];
}

export interface CandidateRankingSignals extends CandidateFitMetrics {
  afterEntries: DeckEntry[];
  pairAnalyses: CardPairAnalysis[];
}

export interface CandidateFitSignals extends CandidateRankingSignals {
  tripleAnalyses: CardTripleAnalysis[];
}

export interface CandidateAnalysisCache {
  pairs: Map<string, CardPairAnalysis>;
  mechanicalPairs: Map<string, boolean>;
  traits: Map<string, Set<Trait>>;
  tripleTraitMasks: Map<string, number>;
  curveBands: Map<string, CurveBandId | null>;
}

export interface CandidateRankingContext {
  baseIndexById: Map<string, number>;
  pairMatrix: Array<Array<CardPairAnalysis | undefined>>;
  mechanicalMatrix: boolean[][];
}

export function candidateAnalysisCache(): CandidateAnalysisCache {
  return {
    pairs: new Map(),
    mechanicalPairs: new Map(),
    traits: new Map(),
    tripleTraitMasks: new Map(),
    curveBands: new Map(),
  };
}

export function candidatePairKey(left: ScoreCard, right: ScoreCard): string {
  return left.id.localeCompare(right.id) <= 0
    ? `${left.id}:${right.id}`
    : `${right.id}:${left.id}`;
}

export function cachedCandidatePair(
  cache: CandidateAnalysisCache,
  left: ScoreCard,
  right: ScoreCard,
): CardPairAnalysis {
  const key = candidatePairKey(left, right);
  const existing = cache.pairs.get(key);
  if (existing) return existing;
  const analysis = analyzeCardPair(left, right);
  cache.pairs.set(key, analysis);
  cache.mechanicalPairs.set(
    key,
    analysis.reasons.some(
      (reason) =>
        reason.kind === "synergy" &&
        (reason.scope === "mechanic-package" ||
          reason.scope === "explicit-reference"),
    ),
  );
  return analysis;
}

export function cachedCandidateTraits(
  cache: CandidateAnalysisCache,
  card: ScoreCard,
): Set<Trait> {
  const existing = cache.traits.get(card.id);
  if (existing) return existing;
  const traits = deriveTraits(card);
  cache.traits.set(card.id, traits);
  return traits;
}

export const CANDIDATE_TRIPLE_TRAIT_BITS = {
  skip: 1 << 0,
  hold: 1 << 1,
  scoring: 1 << 2,
  ready: 1 << 3,
  "energy-ramp": 1 << 4,
  "cost-reduction": 1 << 5,
  "trash-filler": 1 << 6,
  flow: 1 << 7,
  "trash-payoff": 1 << 8,
  "trash-retrieval": 1 << 9,
  token: 1 << 10,
  wide: 1 << 11,
} as const satisfies Partial<Record<Trait, number>>;

export function cachedCandidateTripleTraitMask(
  cache: CandidateAnalysisCache,
  card: ScoreCard,
): number {
  const existing = cache.tripleTraitMasks.get(card.id);
  if (existing !== undefined) return existing;
  const traits = cachedCandidateTraits(cache, card);
  let mask = 0;
  for (const [trait, bit] of Object.entries(CANDIDATE_TRIPLE_TRAIT_BITS)) {
    if (traits.has(trait as Trait)) mask |= bit;
  }
  cache.tripleTraitMasks.set(card.id, mask);
  return mask;
}

export function cachedCandidateCurveBand(
  cache: CandidateAnalysisCache,
  card: ScoreCard,
): CurveBandId | null {
  if (cache.curveBands.has(card.id)) {
    return cache.curveBands.get(card.id) ?? null;
  }
  const band = curveBandFor(card);
  cache.curveBands.set(card.id, band);
  return band;
}

export function candidateRankingContext(
  entries: readonly DeckEntry[],
  cache: CandidateAnalysisCache,
): CandidateRankingContext {
  const pairMatrix = Array.from({ length: entries.length }, () =>
    Array<CardPairAnalysis | undefined>(entries.length),
  );
  const mechanicalMatrix = Array.from({ length: entries.length }, () =>
    Array<boolean>(entries.length).fill(false),
  );
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex;
      rightIndex < entries.length;
      rightIndex += 1
    ) {
      const left = entries[leftIndex]!.card;
      const right = entries[rightIndex]!.card;
      const analysis = cachedCandidatePair(cache, left, right);
      const mechanical =
        cache.mechanicalPairs.get(candidatePairKey(left, right)) ?? false;
      pairMatrix[leftIndex]![rightIndex] = analysis;
      pairMatrix[rightIndex]![leftIndex] = analysis;
      mechanicalMatrix[leftIndex]![rightIndex] = mechanical;
      mechanicalMatrix[rightIndex]![leftIndex] = mechanical;
    }
  }
  return {
    baseIndexById: new Map(
      entries.map((entry, index) => [entry.card.id, index]),
    ),
    pairMatrix,
    mechanicalMatrix,
  };
}

export function normalizeCandidateEntries(entries: readonly DeckEntry[]): DeckEntry[] {
  return normalizeMainDeckEntries(entries);
}

export function addCandidateCopy(
  entries: readonly DeckEntry[],
  candidate: ScoreCard,
): DeckEntry[] {
  let found = false;
  const afterEntries = entries.map((entry) => {
    if (entry.card.id !== candidate.id) return { ...entry };
    found = true;
    return {
      card: candidate,
      quantity: safeQuantity(entry.quantity + 1),
    };
  });
  if (!found) afterEntries.push({ card: candidate, quantity: 1 });
  return afterEntries.sort((left, right) =>
    left.card.id.localeCompare(right.card.id),
  );
}

export function candidatePairAnalyses(
  afterEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  cache: CandidateAnalysisCache,
): CardPairAnalysis[] {
  const candidateQuantity =
    afterEntries.find((entry) => entry.card.id === candidate.id)?.quantity ?? 0;
  const analysesByIds = new Map<string, CardPairAnalysis>();
  for (const entry of afterEntries) {
    if (entry.card.id === candidate.id && candidateQuantity < 2) continue;
    const analysis = cachedCandidatePair(cache, candidate, entry.card);
    analysesByIds.set(analysis.cardIds.join(":"), analysis);
  }
  return [...analysesByIds.values()].sort(
    (left, right) =>
      right.net - left.net ||
      left.cardIds.join(":").localeCompare(right.cardIds.join(":")),
  );
}

export function visitCandidateTriples(
  afterEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  visit: (leftIndex: number, rightIndex: number) => void,
): void {
  const candidateQuantity =
    afterEntries.find((entry) => entry.card.id === candidate.id)?.quantity ?? 0;

  /*
   * Every candidate-containing three-card multiset is the candidate plus one
   * unordered pair drawn from the post-add deck identities. Copy checks remove
   * impossible repeats, and the canonical ID key makes split entry rows and
   * input permutations converge on one analysis.
   */
  for (let leftIndex = 0; leftIndex < afterEntries.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex;
      rightIndex < afterEntries.length;
      rightIndex += 1
    ) {
      const left = afterEntries[leftIndex]!;
      const right = afterEntries[rightIndex]!;
      const requiredCandidateCopies =
        1 +
        Number(left.card.id === candidate.id) +
        Number(right.card.id === candidate.id);
      if (requiredCandidateCopies > candidateQuantity) continue;
      if (
        leftIndex === rightIndex &&
        left.card.id !== candidate.id &&
        left.quantity < 2
      ) {
        continue;
      }
      visit(leftIndex, rightIndex);
    }
  }
}

export function candidateTripleAnalyses(
  afterEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  cache: CandidateAnalysisCache,
): CardTripleAnalysis[] {
  const analyses: CardTripleAnalysis[] = [];
  visitCandidateTriples(afterEntries, candidate, (leftIndex, rightIndex) => {
    const analysis = analyzeCardTripleWithResolvers(
      candidate,
      afterEntries[leftIndex]!.card,
      afterEntries[rightIndex]!.card,
      (left, right) => cachedCandidatePair(cache, left, right),
      (card) => cachedCandidateTraits(cache, card),
    );
    analyses.push(analysis);
  });

  return analyses.sort(
    (left, right) =>
      right.net - left.net ||
      left.cardIds.join(":").localeCompare(right.cardIds.join(":")),
  );
}

export function candidateTripleNetFromFeatures(
  first: ScoreCard,
  second: ScoreCard,
  third: ScoreCard,
  firstSecond: CardPairAnalysis,
  firstThird: CardPairAnalysis,
  secondThird: CardPairAnalysis,
  mechanicalEdges: number,
  traitMask: number,
  firstBand: CurveBandId | null,
  secondBand: CurveBandId | null,
  thirdBand: CurveBandId | null,
): number {
  let synergy =
    (firstSecond.synergy + firstThird.synergy + secondThird.synergy) * 0.65;
  let antisynergy =
    (firstSecond.antisynergy +
      firstThird.antisynergy +
      secondThird.antisynergy) *
    0.65;

  if (
    first.id !== second.id &&
    first.id !== third.id &&
    second.id !== third.id &&
    mechanicalEdges >= 2
  ) {
    synergy += 0.72;
  }

  if (
    (traitMask & CANDIDATE_TRIPLE_TRAIT_BITS.skip) !== 0 &&
    (traitMask &
      (CANDIDATE_TRIPLE_TRAIT_BITS.hold |
        CANDIDATE_TRIPLE_TRAIT_BITS.scoring |
        CANDIDATE_TRIPLE_TRAIT_BITS.ready)) !==
      0 &&
    (traitMask &
      (CANDIDATE_TRIPLE_TRAIT_BITS["energy-ramp"] |
        CANDIDATE_TRIPLE_TRAIT_BITS["cost-reduction"])) !==
      0
  ) {
    synergy += 1.85;
  }
  if (
    (traitMask &
      (CANDIDATE_TRIPLE_TRAIT_BITS["trash-filler"] |
        CANDIDATE_TRIPLE_TRAIT_BITS.flow)) ===
      (CANDIDATE_TRIPLE_TRAIT_BITS["trash-filler"] |
        CANDIDATE_TRIPLE_TRAIT_BITS.flow) &&
    (traitMask &
      (CANDIDATE_TRIPLE_TRAIT_BITS["trash-payoff"] |
        CANDIDATE_TRIPLE_TRAIT_BITS["trash-retrieval"])) !==
      0
  ) {
    synergy += 1.25;
  }
  if (
    (traitMask &
      (CANDIDATE_TRIPLE_TRAIT_BITS.token |
        CANDIDATE_TRIPLE_TRAIT_BITS.wide |
        CANDIDATE_TRIPLE_TRAIT_BITS.scoring)) ===
    (CANDIDATE_TRIPLE_TRAIT_BITS.token |
      CANDIDATE_TRIPLE_TRAIT_BITS.wide |
      CANDIDATE_TRIPLE_TRAIT_BITS.scoring)
  ) {
    synergy += 1.1;
  }

  const firstSlow = firstBand === "mid" || firstBand === "top";
  const secondSlow = secondBand === "mid" || secondBand === "top";
  const thirdSlow = thirdBand === "mid" || thirdBand === "top";
  if (firstSlow && secondSlow && thirdSlow) {
    antisynergy +=
      firstBand === "top" && secondBand === "top" && thirdBand === "top"
        ? 0.95
        : 0.45;
  }

  synergy = round(clamp(synergy, 0, 18), 2);
  antisynergy = round(clamp(antisynergy, 0, 8), 2);
  return round(synergy - antisynergy, 2);
}

export function candidateTopTripleNets(
  afterEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  cache: CandidateAnalysisCache,
  context: CandidateRankingContext,
): number[] {
  const candidateIndex = afterEntries.findIndex(
    (entry) => entry.card.id === candidate.id,
  );
  const candidatePairs = afterEntries.map((entry) =>
    cachedCandidatePair(cache, candidate, entry.card),
  );
  const candidateMechanicalPairs = afterEntries.map(
    (entry) =>
      cache.mechanicalPairs.get(candidatePairKey(candidate, entry.card)) ??
      false,
  );
  const traitMasks = afterEntries.map((entry) =>
    cachedCandidateTripleTraitMask(cache, entry.card),
  );
  const curveBands = afterEntries.map((entry) =>
    cachedCandidateCurveBand(cache, entry.card),
  );
  const baseIndexes = afterEntries.map(
    (entry) => context.baseIndexById.get(entry.card.id) ?? -1,
  );
  const candidateQuantity = afterEntries[candidateIndex]?.quantity ?? 0;
  const topNets: number[] = [];
  for (let leftIndex = 0; leftIndex < afterEntries.length; leftIndex += 1) {
    const leftEntry = afterEntries[leftIndex]!;
    for (
      let rightIndex = leftIndex;
      rightIndex < afterEntries.length;
      rightIndex += 1
    ) {
      const rightEntry = afterEntries[rightIndex]!;
      const requiredCandidateCopies =
        1 +
        Number(leftIndex === candidateIndex) +
        Number(rightIndex === candidateIndex);
      if (requiredCandidateCopies > candidateQuantity) continue;
      if (
        leftIndex === rightIndex &&
        leftIndex !== candidateIndex &&
        leftEntry.quantity < 2
      ) {
        continue;
      }

      const leftIsCandidate = leftIndex === candidateIndex;
      const rightIsCandidate = rightIndex === candidateIndex;
      const leftRight = leftIsCandidate
        ? candidatePairs[rightIndex]!
        : rightIsCandidate
          ? candidatePairs[leftIndex]!
          : context.pairMatrix[baseIndexes[leftIndex]!]![
              baseIndexes[rightIndex]!
            ]!;
      const leftRightMechanical = leftIsCandidate
        ? candidateMechanicalPairs[rightIndex]!
        : rightIsCandidate
          ? candidateMechanicalPairs[leftIndex]!
          : context.mechanicalMatrix[baseIndexes[leftIndex]!]![
              baseIndexes[rightIndex]!
            ]!;
      const net = candidateTripleNetFromFeatures(
        candidate,
        leftEntry.card,
        rightEntry.card,
        candidatePairs[leftIndex]!,
        candidatePairs[rightIndex]!,
        leftRight,
        Number(candidateMechanicalPairs[leftIndex]) +
          Number(candidateMechanicalPairs[rightIndex]) +
          Number(leftRightMechanical),
        traitMasks[candidateIndex]! |
          traitMasks[leftIndex]! |
          traitMasks[rightIndex]!,
        curveBands[candidateIndex]!,
        curveBands[leftIndex]!,
        curveBands[rightIndex]!,
      );
      if (topNets.length < 3) {
        topNets.push(net);
        topNets.sort((leftNet, rightNet) => rightNet - leftNet);
      } else if (net > topNets[2]!) {
        topNets[2] = net;
        topNets.sort((leftNet, rightNet) => rightNet - leftNet);
      }
    }
  }
  return topNets;
}

export function candidateFitMetrics(
  normalizedEntries: readonly DeckEntry[],
  afterEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions,
  pairAnalyses: readonly CardPairAnalysis[],
  tripleNets: readonly number[],
): CandidateFitMetrics {
  const curveRepair = candidateCurveRepairScore(
    normalizedEntries,
    candidate,
    options,
  );
  const roleRepair = candidateRoleRepairScore(
    normalizedEntries,
    candidate,
    options.format ?? "standard-1v1",
  );
  const runeDeckSize = Math.floor(
    clamp(finiteOr(options.runeDeckSize, 12), 1, 40),
  );
  const legend = validExternalLegend(options.legend);
  const runeReliability = cardRuneReliability(
    candidate,
    allocateRunes([...afterEntries], legend?.domains, runeDeckSize),
  );
  const contextCards = [
    legend,
    options.champion,
    ...(options.battlefields ?? []),
  ].filter((card): card is ScoreCard => Boolean(card));
  const contextFit = contextCards.reduce(
    (sum, context) => sum + contextualAffinity(context, candidate),
    0,
  );
  const pairSignal = pairAnalyses
    .slice(0, 4)
    .reduce((sum, analysis) => sum + analysis.net, 0);
  const tripleSignal = tripleNets.reduce((sum, net) => sum + net, 0);
  const comboScore = clamp(pairSignal * 1.65 + tripleSignal * 0.55, -8, 25);
  const targetDeckSize = Math.max(
    1,
    Math.floor(
      finiteOr(
        options.targetDeckSize,
        options.format === "vendetta-prerift" ? 25 : 40,
      ),
    ),
  );
  const openingHand = Math.floor(
    clamp(
      finiteOr(options.openingHand, STANDARD_OPENING_HAND),
      0,
      targetDeckSize,
    ),
  );
  const earlyDraws = Math.floor(
    clamp(finiteOr(options.earlyDraws, DEFAULT_EARLY_DRAWS), 0, targetDeckSize),
  );
  const candidateQuantity =
    afterEntries.find(({ card }) => card.id === candidate.id)?.quantity ?? 1;
  const equipmentContext = equipmentContextForCard(
    candidate,
    candidateQuantity,
    afterEntries,
    targetDeckSize,
    openingHand,
    earlyDraws,
  );
  const equipmentFitPenalty = equipmentContext
    ? equipmentContext.penalty * 18
    : 0;
  const improvedEquipmentContexts = normalizedEntries
    .map(({ card: existingCard, quantity: existingQuantity }) => {
      const beforeContext = equipmentContextForCard(
        existingCard,
        existingQuantity,
        normalizedEntries,
        targetDeckSize,
        openingHand,
        earlyDraws,
      );
      const afterContext = equipmentContextForCard(
        existingCard,
        existingQuantity,
        afterEntries,
        targetDeckSize,
        openingHand,
        earlyDraws,
      );
      if (!beforeContext || !afterContext) return null;
      const delta = round(
        afterContext.breakdown.scoreAdjustment -
          beforeContext.breakdown.scoreAdjustment,
        3,
      );
      const newlyCausalProvider =
        afterContext.breakdown.providerCardIds.includes(candidate.id) &&
        !beforeContext.breakdown.providerCardIds.includes(candidate.id);
      const coverageDelta = newlyCausalProvider
        ? round(
            Math.max(
              0,
              afterContext.breakdown.conditionalValue -
                beforeContext.breakdown.realizedConditionalValue,
            ),
            3,
          )
        : 0;
      return delta > 0 || coverageDelta > 0
        ? { card: existingCard, delta, coverageDelta }
        : null;
    })
    .filter(
      (
        improvement,
      ): improvement is {
        card: ScoreCard;
        delta: number;
        coverageDelta: number;
      } => improvement !== null,
    )
    .sort(
      (left, right) =>
        right.delta + right.coverageDelta - (left.delta + left.coverageDelta) ||
        left.card.id.localeCompare(right.card.id),
    );
  const equipmentProviderDelta = round(
    improvedEquipmentContexts.reduce(
      (total, improvement) =>
        total + improvement.delta + improvement.coverageDelta,
      0,
    ),
    3,
  );
  const equipmentProviderCredit = clamp(equipmentProviderDelta * 60, 0, 36);
  const fitIndex = round(
    clamp(
      baseCardRating(candidate) * 3 +
        comboScore +
        clamp(curveRepair, -1, 1) * 20 +
        clamp(roleRepair / 2, 0, 1) * 10 +
        runeReliability * 10 +
        Math.min(5, contextFit * 0.55) -
        equipmentFitPenalty +
        equipmentProviderCredit,
      0,
      100,
    ),
    1,
  );
  const fitReasons = [
    curveRepair > 0.2
      ? `Repairs the ${curveBandFor(candidate) ?? "identity"} curve slot`
      : null,
    roleRepair > 0.2 ? "Fills a missing deck role" : null,
    pairAnalyses[0]?.net && pairAnalyses[0].net > 0.4
      ? `Best pair: ${pairAnalyses[0].reasons[0]?.label ?? "mechanical package"}`
      : null,
    runeReliability < 0.7
      ? `Colored Power reliability is only ${round(runeReliability * 100)}%`
      : null,
    equipmentContext && equipmentContext.breakdown.activation < 0.82
      ? `Equipment activation is only ${round(equipmentContext.breakdown.activation * 100)}% in this deck`
      : null,
    improvedEquipmentContexts.length > 0
      ? `Improves Equipment activation for ${improvedEquipmentContexts
          .slice(0, 3)
          .map(({ card: existingCard }) => existingCard.name)
          .join(", ")} (+${equipmentProviderDelta} bounded context impact)`
      : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    curveRepair,
    roleRepair,
    runeReliability,
    fitIndex,
    fitReasons,
  };
}

export function candidateRankingSignals(
  normalizedEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions,
  cache: CandidateAnalysisCache,
  context: CandidateRankingContext,
): CandidateRankingSignals {
  const afterEntries = addCandidateCopy(normalizedEntries, candidate);
  const pairAnalyses = candidatePairAnalyses(afterEntries, candidate, cache);
  const tripleNets = candidateTopTripleNets(
    afterEntries,
    candidate,
    cache,
    context,
  );
  return {
    afterEntries,
    pairAnalyses,
    ...candidateFitMetrics(
      normalizedEntries,
      afterEntries,
      candidate,
      options,
      pairAnalyses,
      tripleNets,
    ),
  };
}

export function candidateFitSignals(
  normalizedEntries: readonly DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions,
  cache = candidateAnalysisCache(),
): CandidateFitSignals {
  const afterEntries = addCandidateCopy(normalizedEntries, candidate);
  const pairAnalyses = candidatePairAnalyses(afterEntries, candidate, cache);
  const tripleAnalyses = candidateTripleAnalyses(
    afterEntries,
    candidate,
    cache,
  );
  return {
    afterEntries,
    pairAnalyses,
    tripleAnalyses,
    ...candidateFitMetrics(
      normalizedEntries,
      afterEntries,
      candidate,
      options,
      pairAnalyses,
      tripleAnalyses.slice(0, 3).map((analysis) => analysis.net),
    ),
  };
}

export function materializeCandidateFit(
  normalizedEntries: DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions,
  signals: CandidateFitSignals,
  sharedBefore?: DeckScore,
  sharedAfter?: DeckScore,
): CandidateFit {
  const deltaOptions: DeckScoreOptions = {
    ...options,
    combinationDepth: "pair",
  };
  const before =
    sharedBefore ?? scoreDeck([...normalizedEntries], deltaOptions);
  const after =
    sharedAfter ?? scoreDeck([...signals.afterEntries], deltaOptions);

  return {
    card: candidate,
    before,
    after,
    totalDelta: round(after.total - before.total, 2),
    fitIndex: signals.fitIndex,
    fitReasons: signals.fitReasons,
    components: {
      base: round(after.base - before.base, 2),
      synergy: round(after.synergy - before.synergy, 2),
      antisynergy: round(after.antisynergy - before.antisynergy, 2),
      compatibility: round(after.compatibility - before.compatibility, 2),
      structure: round(after.structure - before.structure, 2),
      meta: round(after.meta - before.meta, 2),
      curve: signals.curveRepair,
      runes: round(signals.runeReliability, 3),
      roles: signals.roleRepair,
    },
    pairAnalyses: signals.pairAnalyses,
    tripleAnalyses: signals.tripleAnalyses,
  };
}

export function evaluateCandidateFit(
  entries: readonly DeckEntry[],
  candidate: ScoreCard,
  options: DeckScoreOptions = {},
): CandidateFit {
  if (!isMainDeckScoreCard(candidate)) {
    throw new RangeError(
      `${candidate.name} is not a Unit, Spell, or Gear Main Deck candidate.`,
    );
  }
  const normalizedEntries = normalizeCandidateEntries(entries);
  const signals = candidateFitSignals(normalizedEntries, candidate, options);
  return materializeCandidateFit(
    normalizedEntries,
    candidate,
    options,
    signals,
  );
}

export function rankCandidateFits(
  entries: readonly DeckEntry[],
  candidates: readonly ScoreCard[],
  options: CandidateFitOptions = {},
): CandidateFit[] {
  const {
    collection = {},
    ownership = "all",
    excludeBanned = true,
    limit = 24,
    ...scoreOptions
  } = options;
  const normalizedEntries = normalizeCandidateEntries(entries);
  const selectedQuantities = new Map(
    normalizedEntries.map((entry) => [entry.card.id, entry.quantity]),
  );
  const legendDomains = new Set(
    validExternalLegend(scoreOptions.legend)?.domains ?? [],
  );

  const eligible = candidates.filter((candidate) => {
    const selected = selectedQuantities.get(candidate.id) ?? 0;
    const owned = Math.max(0, Math.floor(collection[candidate.id] ?? 0));
    if (selected >= Math.max(1, candidate.copyLimit)) return false;
    if (ownership === "owned" && owned <= selected) return false;
    if (ownership === "not-owned" && owned > selected) return false;
    if (excludeBanned && isConstructedBanned(candidate, scoreOptions)) return false;
    if (
      legendDomains.size > 0 &&
      !candidate.domains.includes("colorless") &&
      !candidate.domains.every((domain) => legendDomains.has(domain))
    ) {
      return false;
    }
    return isMainDeckScoreCard(candidate);
  });

  /*
   * Exact feature analysis runs for every eligible identity. Because every
   * relevant triple contains the candidate, it needs only the unordered pairs
   * of post-add identities: O(eligible * identities²), not a cubic deck scan.
   * A legal 40-card deck has at most 41 post-add identities, so each candidate
   * checks at most 41 pairs and 861 quantity-gated triples in the browser.
   * Full scoreDeck materialization is deferred to candidates at or above the
   * requested fit-index cutoff (including the complete cutoff tie group).
   */
  const requestedLimit = Math.max(1, Math.floor(limit));
  const analysisCache = candidateAnalysisCache();
  const rankingContext = candidateRankingContext(
    normalizedEntries,
    analysisCache,
  );
  const exactCandidates = eligible
    .map((candidate) => ({
      candidate,
      signals: candidateRankingSignals(
        normalizedEntries,
        candidate,
        scoreOptions,
        analysisCache,
        rankingContext,
      ),
    }))
    .sort(
      (left, right) =>
        right.signals.fitIndex - left.signals.fitIndex ||
        left.candidate.name.localeCompare(right.candidate.name) ||
        left.candidate.id.localeCompare(right.candidate.id),
    );
  if (exactCandidates.length === 0) return [];

  const cutoffIndex = Math.min(requestedLimit, exactCandidates.length) - 1;
  const cutoffFitIndex = exactCandidates[cutoffIndex]!.signals.fitIndex;
  const contenders = exactCandidates.filter(
    ({ signals }) => signals.fitIndex >= cutoffFitIndex,
  );
  const deltaOptions: DeckScoreOptions = {
    ...scoreOptions,
    combinationDepth: "pair",
  };
  const before = scoreDeck([...normalizedEntries], deltaOptions);

  const winners = contenders
    .map(({ candidate, signals }) => {
      const after = scoreDeck([...signals.afterEntries], deltaOptions);
      return {
        candidate,
        signals,
        after,
        totalDelta: round(after.total - before.total, 2),
      };
    })
    .sort(
      (left, right) =>
        right.signals.fitIndex - left.signals.fitIndex ||
        right.totalDelta - left.totalDelta ||
        left.candidate.name.localeCompare(right.candidate.name) ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .slice(0, requestedLimit);

  return winners.map(({ candidate, after }) => {
    const signals = candidateFitSignals(
      normalizedEntries,
      candidate,
      scoreOptions,
      analysisCache,
    );
    return materializeCandidateFit(
      normalizedEntries,
      candidate,
      scoreOptions,
      signals,
      before,
      after,
    );
  });
}
