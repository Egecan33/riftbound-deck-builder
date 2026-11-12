// Ported from Riftfoundry apps/web/src/lib/scoring-signature-legality.test.ts at origin/main 4b90179.
// 3 of 3 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { scoreDeck, type ScoreCard } from "./riftfoundry";

const cards = gallery.cards as ScoreCard[];

function card(id: string): ScoreCard {
  const match = cards.find((candidate) => candidate.id === id);
  if (!match) throw new Error(`Missing catalog fixture ${id}`);
  return match;
}

describe("Signature card legality", () => {
  it("rejects a Signature card whose champion tag does not match the Constructed Legend", () => {
    const score = scoreDeck([{ card: card("ogn-256-298"), quantity: 1 }], {
      legend: card("ogn-251-298"),
    });

    expect(score.legality.issues).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /Fox-Fire.*Ahri Signature card.*Ahri Champion Legend/i,
        ),
      ]),
    );
  });

  it("caps all matching Constructed Signature card names at three total copies", () => {
    const score = scoreDeck(
      [
        { card: card("ogs-020-024"), quantity: 2 },
        { card: card("unl-192-219"), quantity: 2 },
      ],
      { legend: card("unl-191-219") },
    );

    expect(score.legality.issues).toContain(
      "Main Deck has 4 Signature cards; Constructed allows at most 3 total.",
    );
  });

  it("keeps the official Pre-Rift exception for in-domain Signature spells", () => {
    const score = scoreDeck([{ card: card("ogn-256-298"), quantity: 1 }], {
      format: "vendetta-prerift",
      sealedPool: { "ogn-256-298": 1 },
    });

    expect(
      score.legality.issues.some((issue) => /Signature card/i.test(issue)),
    ).toBe(false);
  });
});
