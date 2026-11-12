// Ported from Riftfoundry apps/web/src/lib/scoring.test.ts at origin/main 4b90179.
// 7 of 31 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  championMatchesLegend,
  deriveTraits,
  isScoredCard,
  type ScoreCard,
} from "@/engine/mine";

function card(overrides: Partial<ScoreCard> = {}): ScoreCard {
  return {
    id: "test",
    name: "Test Card",
    setId: "OGN",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText: "",
    energy: 3,
    power: 1,
    might: 3,
    tags: [],
    copyLimit: 3,
    ...overrides,
  };
}

describe("RDS scoring", () => {
  it("assigns every score-bearing canonical card exactly one shared foundation tier grade", () => {
    expect(CARD_TIER_GRADES).toEqual([
      "SSS+",
      "SSS",
      "SS",
      "S",
      "A",
      "B",
      "C",
      "D",
      "F",
    ]);

    const grades = gallery.cards
      .filter(isScoredCard)
      .map((candidate) => cardTierGrade(baseCardRating(candidate)));

    expect(grades).toHaveLength(922);
    expect(grades.every((grade) => CARD_TIER_GRADES.includes(grade))).toBe(
      true,
    );
    expect(cardTierGrade(Number.NaN)).toBe("F");
  });

  it("derives explicit rules-text traits", () => {
    const traits = deriveTraits(
      card({
        rulesText:
          "When you play me, buff a friendly unit. When you spend a buff, draw 1.",
      }),
    );

    expect(traits).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    );
    expect(traits.has("buff-producer")).toBe(true);
    expect(traits.has("buff-consumer")).toBe(true);
    expect(traits.has("draw")).toBe(true);
  });

  it("keeps base ratings bounded", () => {
    expect(
      baseCardRating(card({ rulesText: "Draw 1. Kill a unit. Score 1." })),
    ).toBeLessThanOrEqual(9.8);
    expect(
      baseCardRating(card({ energy: 10, might: 1 })),
    ).toBeGreaterThanOrEqual(1.5);
  });

  it("assigns a bounded foundation prior to every score-bearing catalog card", () => {
    const ratings = gallery.cards.filter(isScoredCard).map((candidate) =>
      baseCardRating({
        id: candidate.id,
        name: candidate.name,
        setId: candidate.setId,
        type: candidate.type,
        accessibilityText: candidate.accessibilityText,
        superTypes: candidate.superTypes,
        domains: candidate.domains,
        domainNames: candidate.domainNames,
        rulesText: candidate.rulesText,
        energy: candidate.energy,
        power: candidate.power,
        might: candidate.might,
        mightBonus: candidate.mightBonus,
        tags: candidate.tags,
        copyLimit: candidate.copyLimit,
      }),
    );

    expect(ratings).toHaveLength(922);
    expect(ratings.every(Number.isFinite)).toBe(true);
    expect(Math.min(...ratings)).toBeGreaterThanOrEqual(1.5);
    expect(Math.max(...ratings)).toBeLessThanOrEqual(9.8);
  });

  it("cross-checks Champion names so a noisy shared tag cannot create a match", () => {
    const viLegend = gallery.cards.find(
      (candidate) => candidate.name === "Piltover Enforcer",
    );
    const viChampion = gallery.cards.find(
      (candidate) => candidate.name === "Vi, Peacekeeper",
    );
    const noisyKarma = gallery.cards.find(
      (candidate) => candidate.name === "Karma, Channeler",
    );

    expect(viLegend).toBeDefined();
    expect(viChampion).toBeDefined();
    expect(noisyKarma).toBeDefined();
    expect(
      championMatchesLegend(viLegend as ScoreCard, viChampion as ScoreCard),
    ).toBe(true);
    expect(
      championMatchesLegend(viLegend as ScoreCard, noisyKarma as ScoreCard),
    ).toBe(false);
  });

  it("explains type, stats, immediacy, flexibility, drawbacks, and Power strain independently", () => {
    const efficientUnit = baseCardRatingBreakdown(
      card({ energy: 3, might: 5, power: 0 }),
    );
    const inefficientUnit = baseCardRatingBreakdown(
      card({ energy: 6, might: 2, power: 0 }),
    );
    const immediate = baseCardRatingBreakdown(
      card({ rulesText: "When you play me, draw 1." }),
    );
    const conditional = baseCardRatingBreakdown(
      card({ rulesText: "If you hold a battlefield, draw 1." }),
    );
    const reaction = baseCardRatingBreakdown(
      card({ type: "spell", might: null, rulesText: "[Reaction] Draw 1." }),
    );
    const drawback = baseCardRatingBreakdown(
      card({
        rulesText:
          "As an additional cost, discard 1. This enters exhausted. Draw 1.",
      }),
    );
    const strained = baseCardRatingBreakdown(
      card({ energy: 2, power: 4, might: 3 }),
    );

    expect(efficientUnit.statEfficiency).toBeGreaterThan(
      inefficientUnit.statEfficiency,
    );
    expect(immediate.reliability).toBeGreaterThan(conditional.reliability);
    expect(reaction.flexibility).toBeGreaterThan(0);
    expect(drawback.costsAndDrawbacks).toBeLessThan(0);
    expect(strained.powerStrain).toBeLessThan(0);
    expect(
      Object.entries(strained)
        .filter(([key]) => key !== "recognizedEffects")
        .every(([, component]) => Number.isFinite(component)),
    ).toBe(true);
    expect(Array.isArray(strained.recognizedEffects)).toBe(true);
  });

  it("treats reminder text as explanation rather than a duplicated effect", () => {
    const terse = card({
      id: "terse",
      rulesText: "[Shield] Draw 1.",
    });
    const reminded = card({
      id: "reminded",
      rulesText:
        "[Shield] (+1 Might while I'm a defender.) Draw 1. (Draw means put the top card into your hand.)",
    });

    expect(baseCardRating(reminded)).toBe(baseCardRating(terse));
  });

});
