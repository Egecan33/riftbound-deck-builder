// Ported from Riftfoundry apps/web/src/lib/scoring-compound-point-gates.test.ts at origin/main 4b90179.
// 6 of 6 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
  type BaseCardRatingBreakdown,
  type ScoreCard,
} from "@/engine/mine";

interface DirectScoringLedger {
  activation: number;
  breakdown: BaseCardRatingBreakdown;
  value: number;
}

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

function card(id: string, rulesText: string): ScoreCard {
  return {
    id,
    name: id,
    setId: "TST",
    type: "unit",
    domains: ["calm"],
    domainNames: ["Calm"],
    rulesText,
    energy: 4,
    power: 1,
    might: 4,
    tags: [],
    copyLimit: 3,
  };
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

function directScoringLedger(candidate: ScoreCard): DirectScoringLedger {
  const breakdown = baseCardRatingBreakdown(candidate);
  const mechanic = breakdown.mechanics.find(
    (entry) =>
      entry.component === "battlefieldControl" &&
      ["Direct scoring", "Activated scoring"].includes(entry.label),
  );
  if (!mechanic) {
    throw new Error(`Missing direct-scoring ledger for ${candidate.name}`);
  }
  return {
    activation: mechanic.activation,
    breakdown,
    value: mechanic.value,
  };
}

function expectStrictPointDiscount(
  restricted: DirectScoringLedger,
  broader: DirectScoringLedger,
): void {
  expect.soft(restricted.activation).toBeLessThan(broader.activation);
  expect.soft(restricted.value).toBeLessThan(broader.value);
}

describe("canonical compound point gates", () => {
  it.each([
    {
      name: "Nasus, Ascended",
      plainText: "When I conquer, you score 1 point.",
    },
    {
      name: "Tryndamere, Barbarian",
      plainText: "When I conquer, you score 1 point.",
    },
    {
      name: "Shen, Leader of the Kinkou Order",
      plainText: "When I hold, you score 1 point.",
    },
    {
      name: "Swain, Visionary",
      plainText: "When I conquer, you score 1 point.",
    },
  ])(
    "prices $name below its otherwise-identical plain trigger",
    ({ name, plainText }) => {
      const canonical = canonicalCard(name);
      const plain = rulesVariant(
        canonical,
        `${canonical.id}-plain-point-control`,
        plainText,
      );
      const restricted = directScoringLedger(canonical);
      const broader = directScoringLedger(plain);

      expect
        .soft(restricted.breakdown.activationFactor)
        .toBeLessThan(broader.breakdown.activationFactor);
      expectStrictPointDiscount(restricted, broader);
    },
  );
});

describe("generic compound point requirements", () => {
  it("composes the attack and excess-damage gates independently", () => {
    const plainConquer = directScoringLedger(
      card("plain-conquer", "When I conquer, you score 1 point."),
    );
    const afterAttack = directScoringLedger(
      card(
        "conquer-after-attack",
        "When I conquer after an attack, you score 1 point.",
      ),
    );
    const afterAttackWithExcessDamage = directScoringLedger(
      card(
        "conquer-after-attack-with-excess",
        "When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you score 1 point.",
      ),
    );

    expectStrictPointDiscount(afterAttack, plainConquer);
    expectStrictPointDiscount(afterAttackWithExcessDamage, afterAttack);
  });

  it("treats Empowered as an additional gate on a conquer payoff", () => {
    const plainConquer = directScoringLedger(
      card("plain-conquer-control", "When I conquer, you score 1 point."),
    );
    const empoweredConquer = directScoringLedger(
      card(
        "empowered-conquer",
        "[Empowered][>] When I conquer, you score 1 point.",
      ),
    );

    expectStrictPointDiscount(empoweredConquer, plainConquer);
  });

  it("prices an exact board-state requirement below a plain Hold payoff", () => {
    const plainHold = directScoringLedger(
      card("plain-hold", "When I hold, you score 1 point."),
    );
    const exactBoardState = directScoringLedger(
      card(
        "exact-board-state-hold",
        "When I hold, if there is exactly one other unit you control here, you score 1 point.",
      ),
    );

    expectStrictPointDiscount(exactBoardState, plainHold);
  });

  it("strictly increases point value whenever one played-card requirement is removed", () => {
    const plainConquer = directScoringLedger(
      card("played-types-zero", "When I conquer, you score 1 point."),
    );
    const unitOnly = directScoringLedger(
      card(
        "played-types-one",
        "When I conquer, if you've played a non-token unit this turn, you score 1 point.",
      ),
    );
    const unitAndGear = directScoringLedger(
      card(
        "played-types-two",
        "When I conquer, if you've played a non-token unit and a non-token gear this turn, you score 1 point.",
      ),
    );
    const unitGearAndSpell = directScoringLedger(
      card(
        "played-types-three",
        "When I conquer, if you've played a non-token unit, a non-token gear, and a spell this turn, you score 1 point.",
      ),
    );

    expectStrictPointDiscount(unitOnly, plainConquer);
    expectStrictPointDiscount(unitAndGear, unitOnly);
    expectStrictPointDiscount(unitGearAndSpell, unitAndGear);
  });

  it("does not count an unrelated payoff conjunct as another requirement", () => {
    const pointOnly = directScoringLedger(
      card(
        "one-requirement-point",
        "When I conquer, if you control a unit, you score 1 point.",
      ),
    );
    const pointAndDraw = directScoringLedger(
      card(
        "one-requirement-point-and-draw",
        "When I conquer, if you control a unit, you score 1 point and draw 1.",
      ),
    );

    expect(pointAndDraw.activation).toBe(pointOnly.activation);
    expect(pointAndDraw.value).toBe(pointOnly.value);
  });
});
