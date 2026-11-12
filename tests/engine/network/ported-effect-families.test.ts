// Ported from Riftfoundry apps/web/src/lib/scoring-effect-families.test.ts at origin/main 4b90179.
// 1 of 18 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { analyzeCardPair } from "@/engine/network";

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
    copyLimit: 3,
    ...overrides,
  };
}

const ACCELERATE =
  "[Accelerate] (You may pay [1][C] as an additional cost to have me enter ready.)";

describe("Counter and Reaction effect-family valuation", () => {
  const broadCounter = (id: string, overrides: Partial<ScoreCard> = {}) =>
    card(id, "[Reaction]\nCounter a spell.", {
      type: "spell",
      might: null,
      energy: 2,
      ...overrides,
    });

  it("only gives a target-shaped counter context value beside a compatible high-impact line", () => {
    const broad = broadCounter("counter-context-broad");
    const narrow = card(
      "counter-context-narrow",
      "[Reaction]\nCounter an enemy spell or ability that chooses a friendly unit or gear.",
      { type: "spell", might: null, energy: 2 },
    );
    const highImpactSpell = card(
      "counter-context-spell-finisher",
      "Take an additional turn after this.",
      { type: "spell", might: null, energy: 8 },
    );
    const highImpactUnit = card(
      "counter-context-unit-finisher",
      "When I conquer, score 2.",
      { type: "unit", energy: 6 },
    );
    const neutral = card("counter-context-neutral");
    const broadContext = analyzeCardPair(broad, highImpactSpell);
    const narrowSpellContext = analyzeCardPair(narrow, highImpactSpell);
    const narrowUnitContext = analyzeCardPair(narrow, highImpactUnit);

    expect(broadContext.net).toBeGreaterThan(
      analyzeCardPair(broad, neutral).net,
    );
    expect(narrowSpellContext.reasons).not.toContainEqual(
      expect.objectContaining({
        label: "Counter protection for a high-impact line",
      }),
    );
    expect(narrowUnitContext.net).toBeGreaterThan(
      analyzeCardPair(narrow, neutral).net,
    );
    expect(broadContext.reasons).toContainEqual(
      expect.objectContaining({
        label: "Counter protection for a high-impact line",
      }),
    );
    expect(narrowUnitContext.reasons).toContainEqual(
      expect.objectContaining({
        label: "Counter protection for a high-impact line",
      }),
    );
  });

});

