// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 6262-6492): three-card motifs, analyzeCardTriple.
// Port rule (spec 8.2): behaviour unchanged; top-level declarations are exported so the split files can share them.
import { clamp, curveBandFor, deriveTraits, round, type ScoreCard, type Trait } from "../mine";
import { analyzeCardPair, hasAnyTrait } from "./pair";
import type { CardPairAnalysis, CardTripleAnalysis } from "./types";

export interface CardTripleFeatures {
  closedMechanicalChain: boolean;
  extraTurnEngine: boolean;
  trashLoop: boolean;
  wideScoring: boolean;
  slowCurvePenalty: number;
}

export function cardTripleFeatures(
  cards: readonly [ScoreCard, ScoreCard, ScoreCard],
  pairAnalyses: readonly [CardPairAnalysis, CardPairAnalysis, CardPairAnalysis],
  traitSets: readonly [Set<Trait>, Set<Trait>, Set<Trait>],
): CardTripleFeatures {
  const hasAcross = (traits: readonly Trait[]) =>
    traits.every((trait) => traitSets.some((set) => set.has(trait)));
  const mechanicalEdges = pairAnalyses.filter((analysis) =>
    analysis.reasons.some(
      (reason) =>
        reason.kind === "synergy" &&
        (reason.scope === "mechanic-package" ||
          reason.scope === "explicit-reference"),
    ),
  );
  const connectedCards = new Set(
    mechanicalEdges.flatMap((analysis) => analysis.cardIds),
  );
  const curveBands = cards.map(curveBandFor);
  return {
    closedMechanicalChain:
      mechanicalEdges.length >= 2 && connectedCards.size === 3,
    extraTurnEngine:
      traitSets.some((traits) => traits.has("skip")) &&
      traitSets.some((traits) =>
        hasAnyTrait(traits, ["hold", "scoring", "ready"]),
      ) &&
      traitSets.some((traits) =>
        hasAnyTrait(traits, ["energy-ramp", "cost-reduction"]),
      ),
    trashLoop:
      hasAcross(["trash-filler", "flow"]) &&
      traitSets.some((traits) =>
        hasAnyTrait(traits, ["trash-payoff", "trash-retrieval"]),
      ),
    wideScoring: hasAcross(["token", "wide", "scoring"]),
    slowCurvePenalty: curveBands.every(
      (band) => band === "mid" || band === "top",
    )
      ? curveBands.every((band) => band === "top")
        ? 0.95
        : 0.45
      : 0,
  };
}

export function cardTripleScore(
  pairAnalyses: readonly [CardPairAnalysis, CardPairAnalysis, CardPairAnalysis],
  features: CardTripleFeatures,
): Pick<CardTripleAnalysis, "synergy" | "antisynergy" | "net"> {
  let synergy =
    pairAnalyses.reduce((sum, analysis) => sum + analysis.synergy, 0) * 0.65;
  if (features.closedMechanicalChain) synergy += 0.72;
  if (features.extraTurnEngine) synergy += 1.85;
  if (features.trashLoop) synergy += 1.25;
  if (features.wideScoring) synergy += 1.1;
  synergy = round(clamp(synergy, 0, 18), 2);

  const antisynergy = round(
    clamp(
      pairAnalyses.reduce((sum, analysis) => sum + analysis.antisynergy, 0) *
        0.65 +
        features.slowCurvePenalty,
      0,
      8,
    ),
    2,
  );
  return {
    synergy,
    antisynergy,
    net: round(synergy - antisynergy, 2),
  };
}

export function resolveCardTriple(
  first: ScoreCard,
  second: ScoreCard,
  third: ScoreCard,
  analyzePair: (left: ScoreCard, right: ScoreCard) => CardPairAnalysis,
  traitsFor: (card: ScoreCard) => Set<Trait>,
): {
  cards: [ScoreCard, ScoreCard, ScoreCard];
  cardIds: [string, string, string];
  pairAnalyses: [CardPairAnalysis, CardPairAnalysis, CardPairAnalysis];
  features: CardTripleFeatures;
  score: Pick<CardTripleAnalysis, "synergy" | "antisynergy" | "net">;
} {
  const cards = [first, second, third].sort((left, right) =>
    left.id.localeCompare(right.id),
  ) as [ScoreCard, ScoreCard, ScoreCard];
  const cardIds = cards.map((card) => card.id) as [string, string, string];
  const pairAnalyses = [
    analyzePair(cards[0]!, cards[1]!),
    analyzePair(cards[0]!, cards[2]!),
    analyzePair(cards[1]!, cards[2]!),
  ] as [CardPairAnalysis, CardPairAnalysis, CardPairAnalysis];
  const traitSets = cards.map(traitsFor) as [
    Set<Trait>,
    Set<Trait>,
    Set<Trait>,
  ];
  const features = cardTripleFeatures(cards, pairAnalyses, traitSets);
  return {
    cards,
    cardIds,
    pairAnalyses,
    features,
    score: cardTripleScore(pairAnalyses, features),
  };
}

export function analyzeCardTripleWithResolvers(
  first: ScoreCard,
  second: ScoreCard,
  third: ScoreCard,
  analyzePair: (left: ScoreCard, right: ScoreCard) => CardPairAnalysis,
  traitsFor: (card: ScoreCard) => Set<Trait>,
): CardTripleAnalysis {
  const { cardIds, pairAnalyses, features, score } = resolveCardTriple(
    first,
    second,
    third,
    analyzePair,
    traitsFor,
  );
  const reasons = pairAnalyses.flatMap((analysis) => analysis.reasons);
  const addMotif = (
    id: string,
    label: string,
    value: number,
    detail: string,
    traits: Trait[],
  ) => {
    reasons.push({
      id: `${id}:${cardIds.join(":")}`,
      label,
      kind: "synergy",
      scope: "triple-motif",
      value,
      detail,
      cardIds: [...cardIds],
      traits,
    });
  };

  if (features.closedMechanicalChain) {
    addMotif(
      "closed-mechanical-chain",
      "Closed three-card engine",
      0.72,
      "At least two explicit mechanical edges connect all three cards, forming a real setup-to-payoff chain rather than three unrelated good cards.",
      [],
    );
  }

  if (features.extraTurnEngine) {
    addMotif(
      "extra-turn-engine",
      "Accelerated extra-turn scoring engine",
      1.85,
      "Acceleration reaches the finisher while Hold/scoring converts the additional ready-and-score window.",
      ["skip", "hold", "energy-ramp"],
    );
  }
  if (features.trashLoop) {
    addMotif(
      "trash-loop",
      "Trash setup, cast, and recovery",
      1.25,
      "The package supplies trash, spends it through Flow, and recovers or rewards the consumed resource.",
      ["trash-filler", "flow", "trash-payoff"],
    );
  }
  if (features.wideScoring) {
    addMotif(
      "wide-scoring",
      "Token-wide battlefield conversion",
      1.1,
      "Token production supplies a wide board and the third card converts that board into battlefield pressure.",
      ["token", "wide", "scoring"],
    );
  }

  if (features.slowCurvePenalty > 0) {
    const value = features.slowCurvePenalty;
    reasons.push({
      id: `triple-curve-cluster:${cardIds.join(":")}`,
      label: "Slow three-card package",
      kind: "antisynergy",
      scope: "triple-motif",
      value: -value,
      detail:
        "All three cards occupy the 4+ Energy portion of the curve, reducing early sequencing and same-turn combination access.",
      cardIds: [...cardIds],
      traits: ["power-demand"],
    });
  }

  return {
    cardIds,
    ...score,
    reasons: reasons.sort(
      (a, b) =>
        Math.abs(b.value) - Math.abs(a.value) || a.id.localeCompare(b.id),
    ),
  };
}

export function analyzeCardTriple(
  first: ScoreCard,
  second: ScoreCard,
  third: ScoreCard,
): CardTripleAnalysis {
  return analyzeCardTripleWithResolvers(
    first,
    second,
    third,
    analyzeCardPair,
    deriveTraits,
  );
}

