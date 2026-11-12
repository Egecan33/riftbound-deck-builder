// Ported from Riftfoundry apps/web/src/lib/scoring-directionality.test.ts at origin/main 4b90179.
// 3 of 23 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import { type ScoreCard } from "@/engine/mine";
import { analyzeCardPair, PACKAGE_PAIRS } from "@/engine/network";

function card(
  id: string,
  rulesText = "",
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
  return {
    id,
    name: id,
    setId: "TST",
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

describe("discard actor and trigger direction", () => {

  it("does not invent generic discard-plus-draw package synergy", () => {
    const payoff = card(
      "discard-trigger-only",
      "When you discard a card, give me +1 [S] this turn.",
    );
    const unrelatedDraw = card("unrelated-draw", "When you play me, draw 1.");
    const analysis = analyzeCardPair(payoff, unrelatedDraw);

    expect(analysis.reasons).not.toContainEqual(
      expect.objectContaining({ label: "Discard velocity" }),
    );
  });
});

describe("movement enabler and payoff direction", () => {

  it("does not award structural movement-plus-scoring package synergy", () => {
    const movement = card(
      "plain-movement",
      "When you play me, move a friendly unit.",
    );
    const scoring = card("plain-scoring", "When I hold, you score 1 point.");

    expect(analyzeCardPair(movement, scoring).reasons).not.toContainEqual(
      expect.objectContaining({ label: "Battlefield mobility" }),
    );
  });
});

describe("rules-valid package edges", () => {
  it("removes same-keyword, rules-false, and reversed resource edges", () => {
    const labels = new Set(PACKAGE_PAIRS.map((pair) => pair.label));

    for (const falseEdge of [
      "Discard velocity",
      "Repeat empowerment",
      "Reactive equipment",
      "Battlefield mobility",
      "Ganking pressure",
      "Top-deck control",
      "Token Legion",
      "Rune ramp",
      "Power recycling",
      "Cost compression",
    ]) {
      expect(labels.has(falseEdge)).toBe(false);
    }

    expect(PACKAGE_PAIRS).toContainEqual({
      left: "channel-rune",
      right: "rune-count-payoff",
      label: "Rune-count acceleration",
    });
  });
});
