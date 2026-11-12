// Ported from Riftfoundry apps/web/src/lib/scoring-accumulated-engine.test.ts at origin/main 4b90179.
// 2 of 2 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
  cardTierGrade,
  type ScoreCard,
} from "@/engine/mine";

function legend(id: string, rulesText: string): ScoreCard {
  return {
    id,
    name: id,
    setId: "TST",
    type: "legend",
    domains: ["fury", "mind"],
    domainNames: ["Fury", "Mind"],
    rulesText,
    energy: null,
    power: null,
    might: null,
    tags: ["Test"],
    copyLimit: 3,
  };
}

describe("accumulated engine payoff reliability", () => {
  it("amortizes a payoff across every stored event required to unlock it", () => {
    const oneStoredSpell = baseCardRatingBreakdown(
      legend(
        "one-stored-spell",
        "When you play a spell, if you spent [4] or more, you may banish it. Then, if there is one spell banished with me, put it in its trash, channel 4 runes, and draw 1.",
      ),
    );
    const fourStoredSpells = baseCardRatingBreakdown(
      legend(
        "four-stored-spells",
        "When you play a spell, if you spent [4] or more, you may banish it. Then, if there are four spells banished with me, put each in its trash, channel 4 runes, and draw 1.",
      ),
    );

    expect(fourStoredSpells.activationFactor).toBeLessThan(
      oneStoredSpell.activationFactor,
    );
    expect(fourStoredSpells.cardAdvantage).toBeLessThan(
      oneStoredSpell.cardAdvantage,
    );
    expect(fourStoredSpells.resourceValue).toBeLessThan(
      oneStoredSpell.resourceValue,
    );
  });

  it("keeps Jhin's fragile four-spell engine out of the standalone top tier", () => {
    const jhin = gallery.cards.find(
      (candidate) =>
        candidate.type === "legend" &&
        candidate.name === "Virtuoso" &&
        candidate.tags.includes("Jhin"),
    );
    expect(jhin).toBeDefined();

    const breakdown = baseCardRatingBreakdown(jhin as ScoreCard);

    expect(breakdown.total).toBe(4.85);
    expect(cardTierGrade(breakdown.total)).toBe("C");
    expect(breakdown.activationFactor).toBe(0.133);
    expect(breakdown.axes.standaloneFloor).toBe(1.23);
    expect(breakdown.axes.synergyCeiling).toBe(3.35);
  });
});
