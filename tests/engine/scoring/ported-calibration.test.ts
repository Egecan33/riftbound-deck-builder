// Ported from Riftfoundry apps/web/src/lib/scoring-calibration.test.ts at origin/main 4b90179.
// 1 of 4 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  isScoredCard,
  scoreDeck,
  synergyAffinity,
  type ScoreCard,
} from "./riftfoundry";

const catalog = gallery.cards as ScoreCard[];

describe("RDS 0.8.4 calibration", () => {



  it("keeps representative 40-card scores finite, bounded, and order independent", () => {
    const playable = catalog.filter((candidate) =>
      ["unit", "spell", "gear"].includes(candidate.type),
    );

    for (let offset = 0; offset < playable.length; offset += 37) {
      const selected = Array.from(
        { length: 20 },
        (_, index) => playable[(offset + index * 7) % playable.length]!,
      );
      const entries = selected.map((card) => ({ card, quantity: 2 }));
      const forward = scoreDeck(entries);
      const reverse = scoreDeck([...entries].reverse());

      expect(forward.total).toBeGreaterThanOrEqual(0);
      expect(forward.total).toBeLessThanOrEqual(160);
      expect(forward.synergy).toBeLessThanOrEqual(24);
      expect(forward.antisynergy).toBeLessThanOrEqual(48);
      expect(forward.structure).toBeLessThanOrEqual(14);
      expect(forward.compatibility).toBeLessThanOrEqual(12);
      expect(reverse).toEqual(forward);
    }
  }, 20_000);
});
