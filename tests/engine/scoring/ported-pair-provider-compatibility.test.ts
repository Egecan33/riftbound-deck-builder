// Ported from Riftfoundry apps/web/src/lib/scoring-pair-provider-compatibility.test.ts at origin/main 4b90179.
// 1 of 6 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  PACKAGE_PAIRS,
  analyzeCardPair,
  scoreDeck,
  type ScoreCard,
} from "./riftfoundry";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

function reasonLabels(left: ScoreCard, right: ScoreCard): string[] {
  return analyzeCardPair(left, right).reasons.map((reason) => reason.label);
}

describe("ready provider and repeatable-payoff compatibility", () => {
  const blazingScorcher = canonicalCard("Blazing Scorcher");
  const jinx = canonicalCard("Jinx, Demolitionist");
  const rengar = canonicalCard("Rengar, Pouncing");
  const lucian = canonicalCard("Lucian, Merciless");
  const firstMate = canonicalCard("First Mate");
  const purifier = canonicalCard("Purifier");




  it("keeps deck-level pair signals directional instead of scoring parallel traits", () => {
    const falsePackage = scoreDeck([
      { card: jinx, quantity: 20 },
      { card: rengar, quantity: 20 },
    ]);
    const realPackage = scoreDeck([
      { card: firstMate, quantity: 20 },
      { card: rengar, quantity: 20 },
    ]);
    const partnerReasons = (score: ReturnType<typeof scoreDeck>) =>
      score.cardBreakdown.flatMap((row) =>
        row.partners.flatMap((partner) => partner.reasons),
      );

    expect(partnerReasons(falsePackage)).not.toContain("Repeated attacks");
    expect(partnerReasons(falsePackage)).not.toContain("Repeatable trigger");
    expect(partnerReasons(realPackage)).toContain("Repeatable trigger");
    expect(
      falsePackage.contributions.map((contribution) => contribution.label),
    ).not.toContain("Repeated attacks");
  });
});


