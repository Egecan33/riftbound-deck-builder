// Ported from Riftfoundry apps/web/src/lib/scoring-revamp.test.ts at origin/main 4b90179.
// 5 of 24 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { deriveTraits, type ScoreCard } from "@/engine/mine";
import { analyzeCardPair, analyzeCardTriple, synergyAffinity } from "@/engine/network";
import { hypergeometricAtLeast } from "@/engine/maths/hypergeo";

function card(
  id: string,
  rulesText = "",
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
  return {
    id,
    name: id,
    setId: "OGN",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText,
    energy: 3,
    power: 0,
    might: 3,
    tags: [],
    copyLimit: 99,
    ...overrides,
  };
}

function canonicalCard(id: string): ScoreCard {
  const candidate = gallery.cards.find((item) => item.id === id);
  if (!candidate) throw new Error(`Missing canonical test card ${id}`);
  return candidate as ScoreCard;
}

function permutations<T>(values: readonly [T, T, T]): [T, T, T][] {
  const [first, second, third] = values;
  return [
    [first, second, third],
    [first, third, second],
    [second, first, third],
    [second, third, first],
    [third, first, second],
    [third, second, first],
  ];
}

describe("RDS 0.7 score foundations", () => {

  it("matches the published 12-rune hypergeometric reliability anchors", () => {
    expect(hypergeometricAtLeast(12, 6, 2, 1)).toBe(0.7727);
    expect(hypergeometricAtLeast(12, 6, 3, 1)).toBe(0.9091);
    expect(hypergeometricAtLeast(12, 6, 4, 2)).toBe(0.7273);

    expect(hypergeometricAtLeast(12, 8, 2, 1)).toBe(0.9091);
    expect(hypergeometricAtLeast(12, 8, 3, 1)).toBe(0.9818);
    expect(hypergeometricAtLeast(12, 8, 4, 2)).toBe(0.9333);

    expect(hypergeometricAtLeast(12, 4, 2, 1)).toBe(0.5758);
    expect(hypergeometricAtLeast(12, 4, 3, 1)).toBe(0.7455);
    expect(hypergeometricAtLeast(12, 4, 4, 2)).toBe(0.4061);
  });

});

describe("RDS 0.7 combination graph", () => {
  const producer = card("producer", "When you play me, buff a friendly unit.");
  const payoff = card("payoff", "While I'm buffed, I have +2 Might.");
  const neutral = card("neutral", "", {
    domains: ["mind"],
    domainNames: ["Mind"],
  });

  it("returns an explainable signed pair analysis and removes identity-only noise", () => {
    const complementary = analyzeCardPair(producer, payoff);
    const sameRegionLeft = card("region-left", "", {
      tags: ["Noxus"],
    });
    const sameRegionRight = card("region-right", "", {
      tags: ["Noxus"],
    });

    expect(complementary.synergy).toBeGreaterThan(0);
    expect(complementary.antisynergy).toBe(0);
    expect(complementary.net).toBe(
      complementary.synergy - complementary.antisynergy,
    );
    expect(complementary.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "synergy",
          cardIds: ["payoff", "producer"],
        }),
      ]),
    );
    expect(synergyAffinity(sameRegionLeft, sameRegionRight)).toBe(0);
  });

  it("models canonical Time Warp as an accelerated Hold engine in every permutation", () => {
    const timeWarp = canonicalCard("ogn-122-298");
    const holdPayoff = canonicalCard("ogn-066-298");
    const ramp = canonicalCard("ogn-031-298");
    const analyses = permutations([timeWarp, holdPayoff, ramp]).map(
      ([first, second, third]) => analyzeCardTriple(first, second, third),
    );

    expect(deriveTraits(timeWarp).has("skip")).toBe(true);
    expect(analyzeCardPair(timeWarp, holdPayoff).synergy).toBeGreaterThan(0);
    expect(analyzeCardPair(timeWarp, ramp).synergy).toBeGreaterThan(0);
    expect(analyses).toEqual(analyses.map(() => analyses[0]));
    expect(analyses[0]?.reasons).toContainEqual(
      expect.objectContaining({
        label: "Accelerated extra-turn scoring engine",
        scope: "triple-motif",
      }),
    );
  });

  it("recognizes a third-card resource supplier that relieves pair conflict", () => {
    const banisher = card(
      "banisher",
      "Banish a card from your trash to draw 1.",
    );
    const flow = card("flow", "[Flow] You may play this from your trash.");
    const filler = card("filler", "[Burn 2]");

    const conflict = analyzeCardPair(banisher, flow);
    const balanced = analyzeCardTriple(banisher, flow, filler);

    expect(conflict.antisynergy).toBeGreaterThan(0);
    expect(balanced.net).toBeGreaterThan(conflict.net);
    expect(balanced.reasons).toContainEqual(
      expect.objectContaining({
        label: "Trash setup, cast, and recovery",
        scope: "triple-motif",
      }),
    );
  });

  it("keeps neutral cards neutral", () => {
    expect(analyzeCardPair(neutral, card("other-neutral"))).toMatchObject({
      synergy: 0,
      antisynergy: 0,
      net: 0,
      reasons: [],
    });
  });
});

