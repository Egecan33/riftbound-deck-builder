// Ported from Riftfoundry apps/web/src/lib/scoring-cross-clause-costs.test.ts at origin/main 4b90179.
// 2 of 2 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
  type BaseCardMechanicContribution,
  type ScoreCard,
} from "@/engine/mine";

function canonicalCard(name: string): ScoreCard {
  const card = gallery.cards.find((candidate) => candidate.name === name);
  if (!card) throw new Error(`Missing canonical test card ${name}`);
  return card as ScoreCard;
}

function rulesVariant(
  source: ScoreCard,
  id: string,
  rulesText: string,
): ScoreCard {
  return {
    ...source,
    id,
    name: id,
    setId: "TST",
    rulesText,
    accessibilityText: rulesText,
  };
}

function scoringMechanic(card: ScoreCard): BaseCardMechanicContribution {
  const mechanic = baseCardRatingBreakdown(card).mechanics.find(
    (entry) =>
      entry.component === "battlefieldControl" &&
      ["Direct scoring", "Activated scoring"].includes(entry.label),
  );
  if (!mechanic) throw new Error(`Missing scoring mechanic for ${card.name}`);
  return mechanic;
}

describe("cross-clause and cost-shaped payoff restrictions", () => {
  it("charges Bottled Constellation's three-object sacrifice before scoring", () => {
    const bottled = canonicalCard("Bottled Constellation");
    const noSacrifice = rulesVariant(
      bottled,
      "bottled-without-sacrifice",
      "At the start of your Main Phase, you may score 1 point.",
    );
    const restricted = scoringMechanic(bottled);
    const unrestricted = scoringMechanic(noSacrifice);
    const restrictedBreakdown = baseCardRatingBreakdown(bottled);
    const unrestrictedBreakdown = baseCardRatingBreakdown(noSacrifice);

    expect(restricted.activation).toBeLessThan(unrestricted.activation);
    expect(restricted.value).toBeLessThan(unrestricted.value);
    expect(restrictedBreakdown.costsAndDrawbacks).toBeLessThan(
      unrestrictedBreakdown.costsAndDrawbacks,
    );
  });

  it("inherits Renata's trailing battlefield restriction into both abilities", () => {
    const renata = canonicalCard("Renata Glasc, Mastermind");
    const unrestricted = rulesVariant(
      renata,
      "renata-without-battlefield-restriction",
      "[1][C]: Draw 1.\n[4][C][C][C][C], [T]: Score 1 point.",
    );
    const restrictedBreakdown = baseCardRatingBreakdown(renata);
    const unrestrictedBreakdown = baseCardRatingBreakdown(unrestricted);
    const restrictedScoring = scoringMechanic(renata);
    const unrestrictedScoring = scoringMechanic(unrestricted);

    expect(restrictedScoring.activation).toBeLessThan(
      unrestrictedScoring.activation,
    );
    expect(restrictedScoring.value).toBeLessThan(unrestrictedScoring.value);
    expect(restrictedBreakdown.cardAdvantage).toBeLessThan(
      unrestrictedBreakdown.cardAdvantage,
    );
    expect(restrictedBreakdown.total).toBeLessThan(unrestrictedBreakdown.total);
  });
});
