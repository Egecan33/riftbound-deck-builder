// Ported from Riftfoundry apps/web/src/lib/scoring-pair-provider-compatibility.test.ts at origin/main 4b90179.
// 2 of 7 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { PACKAGE_PAIRS, analyzeCardPair } from "@/engine/network";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

function reasonLabels(left: ScoreCard, right: ScoreCard): string[] {
  return analyzeCardPair(left, right).reasons.map((reason) => reason.label);
}

describe("ready provider and repeatable-payoff compatibility", () => {
  const blazingScorcher = canonicalCard("Blazing Scorcher");
  const jinx = canonicalCard("Jinx, Demolitionist");
  const rengar = canonicalCard("Rengar, Pouncing");
  const lucian = canonicalCard("Lucian, Merciless");
  const firstMate = canonicalCard("First Mate");
  const purifier = canonicalCard("Purifier");

  it("does not expose ready-plus-Assault as a directionless package pair", () => {
    expect(PACKAGE_PAIRS).not.toContainEqual(
      expect.objectContaining({
        left: "ready",
        right: "assault",
      }),
    );
  });

});

describe("self-contained defensive traits", () => {
  it("does not present two independent Hold defenders as an executable package", () => {
    const trevor = canonicalCard("Trevor Snoozebottom");
    const blitzcrank = canonicalCard("Blitzcrank, Impassive");
    const labels = reasonLabels(trevor, blitzcrank);

    expect(labels).not.toContain("Battlefield fortification");
    expect(labels).not.toContain("Tank & hold");
    expect(labels).not.toContain("Protected scoring");
    expect(PACKAGE_PAIRS).not.toContainEqual(
      expect.objectContaining({ right: "hold" }),
    );
  });
});
