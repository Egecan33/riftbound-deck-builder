// Ported from Riftfoundry apps/web/src/lib/scoring-card-eligibility.test.ts at origin/main 4b90179.
// 2 of 7 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRating,
  baseCardRatingBreakdown,
  foundationGradeForCard,
  isScoredCard,
  type ScoreCard,
} from "@/engine/mine";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

describe("foundation and tier eligibility", () => {
  const rune = canonicalCard("Fury Rune");
  const legend = canonicalCard("Daughter of the Void");

  it("makes canonical Runes explicitly unscored and ungraded", () => {
    expect(isScoredCard(rune)).toBe(false);
    expect(foundationGradeForCard(rune)).toBeNull();
    expect(() => baseCardRating(rune)).toThrow(/Rune cards do not have/);
    expect(() => baseCardRatingBreakdown(rune)).toThrow(
      /Rune cards do not have/,
    );
  });

  it("keeps a Legend independently gradable without making it a Main Deck card", () => {
    expect(isScoredCard(legend)).toBe(true);
    expect(Number.isFinite(baseCardRating(legend))).toBe(true);
    expect(foundationGradeForCard(legend)).not.toBeNull();
  });
});

