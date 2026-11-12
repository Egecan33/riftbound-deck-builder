// Ported from Riftfoundry apps/web/src/lib/scoring-audit.test.ts at origin/main 4b90179.
// 1 of 8 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  TRAIT_LABELS,
  baseCardRating,
  deriveTraits,
  isScoredCard,
  type ScoreCard,
} from "@/engine/mine";

function asScoreCard(candidate: (typeof gallery.cards)[number]): ScoreCard {
  return {
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
  };
}

function syntheticCard(
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
    power: 1,
    might: 3,
    tags: [],
    copyLimit: 99,
    ...overrides,
  };
}

const catalog = gallery.cards.map(asScoreCard);
const mainDeckCards = catalog.filter((candidate) =>
  ["unit", "spell", "gear"].includes(candidate.type),
);
const legends = catalog.filter((candidate) => candidate.type === "legend");
const battlefields = catalog.filter(
  (candidate) => candidate.type === "battlefield",
);

describe("RDS full-catalog audit", () => {
  it("derives known traits for all 928 cards and bounded ratings for the 922 score-bearing cards", () => {
    const knownTraits = new Set(Object.keys(TRAIT_LABELS));
    const uniqueRatings = new Set<number>();
    let scoredCards = 0;
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;

    expect(catalog).toHaveLength(928);

    for (const candidate of catalog) {
      const traits = deriveTraits(candidate);
      expect([...traits].every((trait) => knownTraits.has(trait))).toBe(true);
      if (!isScoredCard(candidate)) continue;

      const rating = baseCardRating(candidate);
      expect(Number.isFinite(rating)).toBe(true);
      expect(rating).toBeGreaterThanOrEqual(1.5);
      expect(rating).toBeLessThanOrEqual(9.8);
      expect(baseCardRating(candidate)).toBe(rating);

      scoredCards += 1;
      uniqueRatings.add(rating);
      minimum = Math.min(minimum, rating);
      maximum = Math.max(maximum, rating);
    }

    expect(scoredCards).toBe(922);
    expect(uniqueRatings.size).toBeGreaterThanOrEqual(150);
    expect(maximum - minimum).toBeGreaterThanOrEqual(2);
  });

});

