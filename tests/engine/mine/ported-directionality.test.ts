// Ported from Riftfoundry apps/web/src/lib/scoring-directionality.test.ts at origin/main 4b90179.
// 20 of 23 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import {
  baseCardRating,
  baseCardRatingBreakdown,
  deriveTraits,
  type ScoreCard,
} from "@/engine/mine";

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

describe("rules reminder normalization", () => {
  it("keeps Temporary reminder prose from becoming removal, death, or scoring", () => {
    const traits = deriveTraits(
      card(
        "temporary-reminder",
        "[Temporary] (Kill this at the start of its controller's Beginning Phase, before scoring.)",
      ),
    );

    expect(traits.has("temporary")).toBe(true);
    expect(traits.has("interaction")).toBe(false);
    expect(traits.has("removal")).toBe(false);
    expect(traits.has("death")).toBe(false);
    expect(traits.has("scoring")).toBe(false);
  });

  it("models Quick-Draw's native timing without treating its name as card draw", () => {
    const traits = deriveTraits(
      card(
        "quick-draw-reminder",
        "[Quick-Draw] (This has [Reaction]. When you play it, attach it to a unit you control.)",
        { type: "gear", might: null, mightBonus: 1 },
      ),
    );

    expect(traits.has("quick-draw")).toBe(true);
    expect(traits.has("reaction")).toBe(true);
    expect(traits.has("equip")).toBe(true);
    expect(traits.has("draw")).toBe(false);
  });

  it("does not turn Flow's self-cleanup reminder into a banish engine", () => {
    const traits = deriveTraits(
      card(
        "flow-reminder",
        "[Flow] [1][A] (You may play this from your trash for its Flow cost. Then banish it.)",
        { type: "spell", might: null },
      ),
    );

    expect(traits.has("flow")).toBe(true);
    expect(traits.has("trash-payoff")).toBe(true);
    expect(traits.has("banish-enabler")).toBe(false);
  });

  it("keeps Recall distinct from movement and Hunt distinct from removal", () => {
    const recallTraits = deriveTraits(
      card(
        "recall-reminder",
        "Recall a friendly unit exhausted. (Send it to base. This isn't a move.)",
      ),
    );
    const huntTraits = deriveTraits(
      card("hunt-reminder", "[Hunt 2] (When I kill a unit, gain 2 XP.)"),
    );

    expect(recallTraits.has("movement")).toBe(false);
    expect(recallTraits.has("movement-payoff")).toBe(false);
    expect(huntTraits.has("hunt")).toBe(true);
    expect(huntTraits.has("interaction")).toBe(false);
    expect(huntTraits.has("removal")).toBe(false);
    expect(huntTraits.has("death")).toBe(false);
  });
});

describe("discard actor and trigger direction", () => {
  it("separates a self-discard outlet from a discard-trigger payoff", () => {
    const outlet = deriveTraits(
      card("discard-outlet", "When you play me, discard 1."),
    );
    const payoff = deriveTraits(
      card("discard-payoff", "When you discard one or more cards, ready me."),
    );

    expect(outlet.has("discard")).toBe(true);
    expect(outlet.has("discard-payoff")).toBe(false);
    expect(payoff.has("discard")).toBe(false);
    expect(payoff.has("discard-payoff")).toBe(true);
  });

  it("values opponent discard as disruption instead of a self-discard cost", () => {
    const disruption = card(
      "opponent-discard",
      "When you play me, choose an opponent. They discard 1.",
    );
    const traits = deriveTraits(disruption);
    const breakdown = baseCardRatingBreakdown(disruption);

    expect(traits.has("discard")).toBe(false);
    expect(traits.has("discard-payoff")).toBe(false);
    expect(traits.has("interaction")).toBe(true);
    expect(breakdown.cardAdvantage).toBeGreaterThan(0);
    expect(breakdown.costsAndDrawbacks).toBe(0);
    expect(breakdown.recognizedEffects).toContain("opponent discard");
  });

});

describe("kill, banish, and damage target direction", () => {
  it("treats a friendly kill as sacrifice setup, not enemy removal", () => {
    const sacrifice = card(
      "friendly-sacrifice",
      "As an additional cost to play this, kill a friendly unit.",
      { type: "spell", might: null },
    );
    const traits = deriveTraits(sacrifice);
    const breakdown = baseCardRatingBreakdown(sacrifice);

    expect(traits.has("death-enabler")).toBe(true);
    expect(traits.has("interaction")).toBe(false);
    expect(traits.has("removal")).toBe(false);
    expect(breakdown.boardControl).toBe(0);
    expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
  });

  it("keeps a kill trigger as a payoff condition rather than granting removal", () => {
    const traits = deriveTraits(
      card(
        "kill-trigger",
        "When you kill a unit with a spell, you may play this from your trash.",
      ),
    );

    expect(traits.has("death-payoff")).toBe(true);
    expect(traits.has("interaction")).toBe(false);
    expect(traits.has("removal")).toBe(false);
  });

  it("recognizes actual enemy kill and replacement-banish as removal", () => {
    const kill = deriveTraits(
      card("enemy-kill", "When you play me, kill an enemy unit."),
    );
    const replacement = deriveTraits(
      card(
        "enemy-banish-replacement",
        "If an enemy unit would die this turn, banish it instead.",
      ),
    );

    expect(kill.has("interaction")).toBe(true);
    expect(kill.has("removal")).toBe(true);
    expect(replacement.has("interaction")).toBe(true);
    expect(replacement.has("removal")).toBe(true);
    expect(replacement.has("banish-enabler")).toBe(true);
  });

  it("excludes transient selection and self-cleanup from banish packages", () => {
    const selection = deriveTraits(
      card(
        "transient-selection",
        "Look at the top 5 cards of your Main Deck. Banish a unit from among them, then play it, ignoring its cost.",
      ),
    );
    const cleanup = deriveTraits(
      card("self-cleanup", "Take a turn after this one. Banish this.", {
        type: "spell",
        might: null,
      }),
    );

    expect(selection.has("banish-enabler")).toBe(false);
    expect(selection.has("interaction")).toBe(false);
    expect(selection.has("removal")).toBe(false);
    expect(cleanup.has("banish-enabler")).toBe(false);
    expect(cleanup.has("removal")).toBe(false);
  });

  it("prices damage to friendly units as a drawback, not board control", () => {
    const selfDamage = baseCardRatingBreakdown(
      card(
        "friendly-board-damage",
        "When you play me, deal 5 to all units you control.",
      ),
    );
    const enemyDamage = baseCardRatingBreakdown(
      card(
        "enemy-board-damage",
        "When you play me, deal 5 to all enemy units.",
      ),
    );

    expect(selfDamage.boardControl).toBe(0);
    expect(selfDamage.costsAndDrawbacks).toBeLessThan(0);
    expect(enemyDamage.boardControl).toBeGreaterThan(0);
    expect(enemyDamage.costsAndDrawbacks).toBe(0);
    expect(enemyDamage.total).toBeGreaterThan(selfDamage.total);
  });
});

describe("token controller and lifetime direction", () => {
  it("does not count a token given to an opponent as friendly board or go-wide setup", () => {
    const liability = card(
      "opponent-token",
      "When you play me, choose an opponent. They play a 3 [S] Bird unit token.",
    );
    const traits = deriveTraits(liability);
    const breakdown = baseCardRatingBreakdown(liability);

    expect(traits.has("token")).toBe(false);
    expect(traits.has("wide")).toBe(false);
    expect(breakdown.expectedStrength).toBe(0);
    expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
  });

  it("separates token production from token-matters triggers", () => {
    const producer = deriveTraits(
      card("token-producer", "When you play me, play a 2 [S] unit token."),
    );
    const payoff = deriveTraits(
      card("token-payoff", "When you play a token, draw 1."),
    );

    expect(producer.has("token")).toBe(true);
    expect(producer.has("token-matters")).toBe(false);
    expect(payoff.has("token")).toBe(false);
    expect(payoff.has("token-matters")).toBe(true);
  });

  it("discounts a Temporary token's shorter usable lifetime", () => {
    const permanent = baseCardRatingBreakdown(
      card(
        "permanent-token",
        "When you play me, play a ready 3 [S] Sprite unit token.",
      ),
    );
    const temporary = baseCardRatingBreakdown(
      card(
        "temporary-token",
        "When you play me, play a ready 3 [S] Sprite unit token with [Temporary].",
      ),
    );

    expect(permanent.expectedStrength).toBeGreaterThan(
      temporary.expectedStrength,
    );
  });
});

describe("Burn and scoring actor direction", () => {
  it("separates opponent Burn from self-Burn setup and self-cost", () => {
    const opponentBurn = card(
      "opponent-burn",
      "When you play me, choose an opponent. They [Burn 3].",
    );
    const selfBurn = card("self-burn", "When you play me, [Burn 3].");
    const opponentTraits = deriveTraits(opponentBurn);
    const selfTraits = deriveTraits(selfBurn);

    expect(opponentTraits.has("burn-opponent")).toBe(true);
    expect(opponentTraits.has("burn-self")).toBe(false);
    expect(opponentTraits.has("trash-filler")).toBe(false);
    expect(baseCardRatingBreakdown(opponentBurn).costsAndDrawbacks).toBe(0);
    expect(selfTraits.has("burn-self")).toBe(true);
    expect(selfTraits.has("burn-opponent")).toBe(false);
    expect(selfTraits.has("trash-filler")).toBe(true);
    expect(baseCardRatingBreakdown(selfBurn).costsAndDrawbacks).toBeLessThan(0);
  });

  it("does not treat an opponent-score condition as direct scoring", () => {
    const condition = card(
      "opponent-score-condition",
      "If an opponent's score is within 3 points of the Victory Score, this costs [2] less.",
      { type: "spell", might: null },
    );
    const traits = deriveTraits(condition);
    const breakdown = baseCardRatingBreakdown(condition);

    expect(traits.has("scoring")).toBe(false);
    expect(breakdown.battlefieldControl).toBe(0);
    expect(breakdown.recognizedEffects).not.toContain("direct scoring");
  });

  it("values own and opponent points separately", () => {
    const ownPoint = card(
      "own-point",
      "When I win a combat, you score 1 point.",
    );
    const mixedPoint = card(
      "mixed-point",
      "When I win a combat, you score 1 point. When I die in combat, choose an opponent. They score 1 point.",
    );
    const ownBreakdown = baseCardRatingBreakdown(ownPoint);
    const mixedBreakdown = baseCardRatingBreakdown(mixedPoint);

    expect(ownBreakdown.battlefieldControl).toBeGreaterThan(0);
    expect(mixedBreakdown.battlefieldControl).toBe(
      ownBreakdown.battlefieldControl,
    );
    expect(mixedBreakdown.costsAndDrawbacks).toBeLessThan(
      ownBreakdown.costsAndDrawbacks,
    );
    expect(baseCardRating(ownPoint)).toBeGreaterThan(
      baseCardRating(mixedPoint),
    );
  });

  it("models opponent score denial without inventing direct points", () => {
    const denial = baseCardRatingBreakdown(
      card(
        "score-denial",
        "While I'm at a battlefield, opponents can't score points.",
      ),
    );

    expect(denial.battlefieldControl).toBeGreaterThan(0);
    expect(denial.recognizedEffects).toContain("opponent score denial");
    expect(denial.recognizedEffects).not.toContain("direct scoring");
  });
});

describe("movement enabler and payoff direction", () => {
  it("separates movement instructions from movement-trigger payoffs", () => {
    const provider = deriveTraits(
      card("movement-provider", "When you play me, move a friendly unit."),
    );
    const payoff = deriveTraits(
      card("movement-payoff", "When a friendly unit moves, draw 1."),
    );

    expect(provider.has("movement")).toBe(true);
    expect(provider.has("movement-payoff")).toBe(false);
    expect(payoff.has("movement")).toBe(false);
    expect(payoff.has("movement-payoff")).toBe(true);
  });

  it("does not call a movement restriction or Recall reminder an enabler", () => {
    const restriction = deriveTraits(
      card("movement-lock", "Enemy units can't move to base."),
    );
    const recall = deriveTraits(
      card(
        "friendly-recall",
        "Recall a friendly unit. (Send it to base. This isn't a move.)",
      ),
    );

    expect(restriction.has("movement")).toBe(false);
    expect(recall.has("movement")).toBe(false);
  });

});

