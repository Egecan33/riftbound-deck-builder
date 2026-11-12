// Ported from Riftfoundry apps/web/src/lib/scoring-final-audit.test.ts at origin/main 4b90179.
// 2 of 6 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  analyzeCardPair,
  analyzeCardTriple,
  deriveTraits,
  scoreDeck,
  type ScoreCard,
} from "./riftfoundry";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

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
    domains: ["mind"],
    domainNames: ["Mind"],
    rulesText,
    energy: 2,
    power: 0,
    might: 2,
    tags: [],
    copyLimit: 40,
    ...overrides,
  };
}

function reasonLabels(left: ScoreCard, right: ScoreCard): string[] {
  return analyzeCardPair(left, right).reasons.map((reason) => reason.label);
}

describe("final scoring audit regressions", () => {




  it("scores an exact token-wide-Hold triple even when only one pair edge exists", () => {
    const token = card("exact-token", "Play a 1 [S] unit token.", {
      type: "spell",
      might: null,
    });
    const wide = card("exact-wide", "Other friendly units have +1 [S].");
    const hold = card("exact-hold", "When I hold, draw 1.");
    const filler = card("exact-filler");
    const entries = [
      { card: token, quantity: 4 },
      { card: wide, quantity: 4 },
      { card: hold, quantity: 4 },
      { card: filler, quantity: 28 },
    ];

    expect(analyzeCardPair(token, wide).synergy).toBeGreaterThan(0);
    expect(analyzeCardPair(token, hold).synergy).toBe(0);
    expect(analyzeCardPair(wide, hold).synergy).toBe(0);
    expect(
      scoreDeck(entries, { combinationDepth: "full" }).contributions,
    ).toContainEqual(
      expect.objectContaining({
        id: `triple-${[token.id, wide.id, hold.id].sort().join("-")}`,
        label: "Token-wide battlefield conversion",
        value: expect.any(Number),
      }),
    );
  });

  it("aggregates duplicate DeckEntry rows before every scoring and legality path", () => {
    const token = card("duplicate-token", "Play a 1 [S] unit token.", {
      type: "spell",
      might: null,
      copyLimit: 3,
    });
    const wide = card("duplicate-wide", "Other friendly units have +1 [S].");
    const hold = card("duplicate-hold", "When I hold, draw 1.");
    const filler = card("duplicate-filler");
    const combined = [
      { card: token, quantity: 4 },
      { card: wide, quantity: 4 },
      { card: hold, quantity: 4 },
      { card: filler, quantity: 28 },
    ];
    const split = [
      { card: token, quantity: 2 },
      { card: wide, quantity: 4 },
      { card: token, quantity: 2 },
      { card: hold, quantity: 4 },
      { card: filler, quantity: 28 },
    ];

    const combinedScore = scoreDeck(combined);
    const splitScore = scoreDeck(split);

    expect(splitScore).toEqual(combinedScore);
    expect(
      splitScore.cardBreakdown.filter((row) => row.cardId === token.id),
    ).toEqual([expect.objectContaining({ quantity: 4 })]);
    expect(
      splitScore.legality.issues.filter((issue) =>
        issue.includes("duplicate-token exceeds"),
      ),
    ).toHaveLength(1);
  });
});
