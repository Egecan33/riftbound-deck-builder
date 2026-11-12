// Ported from Riftfoundry apps/web/src/lib/scoring-calibration.test.ts at origin/main 4b90179.
// 1 of 4 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { synergyAffinity } from "@/engine/network";

const catalog = gallery.cards as ScoreCard[];

describe("RDS 0.8.4 calibration", () => {

  it("does not turn a shared region into a mechanical combo", () => {
    const draven = catalog.find(
      (candidate) => candidate.name === "Draven, Showboat",
    );
    const pigeons = catalog.find(
      (candidate) => candidate.name === "Crimson Pigeons",
    );

    expect(draven).toBeDefined();
    expect(pigeons).toBeDefined();
    expect(synergyAffinity(draven as ScoreCard, pigeons as ScoreCard)).toBe(0);
  });

});
