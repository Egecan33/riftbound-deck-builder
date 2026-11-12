// Ported from Riftfoundry apps/web/src/lib/scoring-calibration.test.ts at origin/main 4b90179.
// 2 of 4 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  isScoredCard,
  type ScoreCard,
} from "@/engine/mine";

const catalog = gallery.cards as ScoreCard[];

describe("RDS 0.8.4 calibration", () => {
  it("keeps a resolved nine-grade theory distribution across score-bearing cards", () => {
    const ratings = catalog.filter(isScoredCard).map(baseCardRating);
    const gradeCounts = Object.fromEntries(
      CARD_TIER_GRADES.map((grade) => [grade, 0]),
    ) as Record<(typeof CARD_TIER_GRADES)[number], number>;
    for (const rating of ratings) gradeCounts[cardTierGrade(rating)] += 1;

    expect(ratings).toHaveLength(922);
    expect(new Set(ratings).size).toBeGreaterThanOrEqual(150);
    expect(CARD_TIER_GRADES.every((grade) => gradeCounts[grade] >= 0)).toBe(
      true,
    );
    expect(gradeCounts["SSS+"]).toBeLessThan(ratings.length * 0.03);

    const mainDeckRatings = catalog
      .filter(
        (card) =>
          isScoredCard(card) &&
          (card.type === "unit" ||
            card.type === "spell" ||
            card.type === "gear"),
      )
      .map(baseCardRating);
    const mainDeckGradeCounts = Object.fromEntries(
      CARD_TIER_GRADES.map((grade) => [grade, 0]),
    ) as Record<(typeof CARD_TIER_GRADES)[number], number>;
    for (const rating of mainDeckRatings) {
      mainDeckGradeCounts[cardTierGrade(rating)] += 1;
    }

    expect(mainDeckRatings).toHaveLength(809);
    // Correcting replacement damage and restricted removal can empty SSS+.
    // Fixed grade boundaries must not be moved to preserve a percentile shape.
    expect(Object.values(mainDeckGradeCounts).reduce((a, b) => a + b, 0)).toBe(
      809,
    );
    for (const id of ["ven-146-166", "sfd-074-221"]) {
      expect(
        baseCardRating(catalog.find((card) => card.id === id)!),
      ).toBeLessThan(6.86);
    }
  });

  it("locks representative reliability, interaction, and cost anchors", () => {
    const anchors = [
      {
        name: "Defy",
        total: 5.61,
        grade: "S",
        standaloneFloor: 2.48,
        synergyCeiling: 2.48,
      },
      {
        name: "Ahri, Alluring",
        total: 4.24,
        grade: "C",
        standaloneFloor: 1.13,
        synergyCeiling: 3.2,
      },
      {
        name: "Yasuo, Windrider",
        total: 4.53,
        grade: "C",
        standaloneFloor: 1.21,
        synergyCeiling: 3.4,
      },
      {
        name: "Time Warp",
        total: 3.95,
        grade: "D",
        standaloneFloor: 1.48,
        synergyCeiling: 2.63,
      },
    ] as const;

    for (const expected of anchors) {
      const card = catalog.find(
        (candidate) => candidate.name === expected.name,
      );
      expect(card, `Missing catalog anchor ${expected.name}`).toBeDefined();
      const breakdown = baseCardRatingBreakdown(card as ScoreCard);

      expect(breakdown.total).toBe(expected.total);
      expect(cardTierGrade(breakdown.total)).toBe(expected.grade);
      expect(breakdown.axes.standaloneFloor).toBe(expected.standaloneFloor);
      expect(breakdown.axes.synergyCeiling).toBe(expected.synergyCeiling);
    }
  });

});
