// Ported from Riftfoundry apps/web/src/lib/scoring-ready-action-economy.test.ts at origin/main 4b90179.
// 10 of 10 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import {
  baseCardRatingBreakdown,
  deriveTraits,
  type BaseCardRatingBreakdown,
  type ScoreCard,
} from "@/engine/mine";

function card(
  id: string,
  rulesText: string,
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
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
    ...overrides,
  };
}

function readyMechanics(breakdown: BaseCardRatingBreakdown) {
  return breakdown.mechanics.filter((mechanic) =>
    /ready|rune/i.test(`${mechanic.label} ${mechanic.detail}`),
  );
}

describe("Ready action-economy valuation", () => {
  it("activation-gates a conditional self-ready below unconditional entry tempo", () => {
    const unconditional = baseCardRatingBreakdown(
      card("unconditional-entry", "I enter ready."),
    );
    const conditional = baseCardRatingBreakdown(
      card(
        "conditional-entry",
        "If you control another Dragon, I enter ready.",
      ),
    );
    const unconditionalReady = readyMechanics(unconditional)[0];
    const conditionalReady = readyMechanics(conditional)[0];

    expect(unconditionalReady).toBeDefined();
    expect(conditionalReady).toBeDefined();
    expect(conditionalReady!.activation).toBeLessThan(
      unconditionalReady!.activation,
    );
    expect(conditionalReady!.value).toBeLessThan(unconditionalReady!.value);
  });

  it("values self-ready and another-unit readying without merging their jobs", () => {
    const self = baseCardRatingBreakdown(
      card("self-ready", "When you play a gear, ready me."),
    );
    const external = baseCardRatingBreakdown(
      card("external-ready", "When you play me, ready another friendly unit."),
    );

    expect(readyMechanics(self).some(({ label }) => /self/i.test(label))).toBe(
      true,
    );
    expect(
      readyMechanics(external).some(({ label }) => /unit/i.test(label)),
    ).toBe(true);
    expect(self.effectValue).toBeGreaterThan(0);
    expect(external.effectValue).toBeGreaterThan(0);
  });

  it("scales rune readying by count while keeping the four-rune ceiling bounded", () => {
    const one = baseCardRatingBreakdown(
      card("ready-one-rune", "Ready 1 friendly rune.", {
        type: "spell",
        might: null,
      }),
    );
    const four = baseCardRatingBreakdown(
      card("ready-four-runes", "Ready 4 friendly runes.", {
        type: "spell",
        might: null,
      }),
    );

    expect(one.resourceValue).toBeGreaterThan(0);
    expect(four.resourceValue).toBeGreaterThan(one.resourceValue);
    expect(four.resourceValue).toBeLessThanOrEqual(1.5);
  });

  it("splits a mixed ready choice between action and rune economy", () => {
    const mixed = baseCardRatingBreakdown(
      card("mixed-ready", "Ready up to 4 units, gear, and/or runes.", {
        type: "spell",
        might: null,
      }),
    );

    expect(mixed.effectValue).toBeGreaterThan(0);
    expect(mixed.resourceValue).toBeGreaterThan(0);
    expect(readyMechanics(mixed).length).toBeGreaterThanOrEqual(2);
  });

  it("discounts a paid ready option instead of pricing it as unconditional", () => {
    const free = baseCardRatingBreakdown(
      card("free-ready", "Ready a friendly unit.", {
        type: "spell",
        might: null,
      }),
    );
    const paid = baseCardRatingBreakdown(
      card("paid-ready", "You may pay [2] to ready a friendly unit.", {
        type: "spell",
        might: null,
      }),
    );
    const freeReady = readyMechanics(free)[0];
    const paidReady = readyMechanics(paid)[0];

    expect(paidReady!.activation).toBeLessThan(freeReady!.activation);
    expect(paidReady!.value).toBeLessThan(freeReady!.value);
    expect(paid.costsAndDrawbacks).toBeLessThan(free.costsAndDrawbacks);
  });

  it("values ready entry on a copied token as immediate token tempo", () => {
    const copy = baseCardRatingBreakdown(
      card(
        "ready-copy-token",
        "Play a ready 3 [M] Reflection unit token. It becomes a copy of another unit.",
        { type: "spell", might: null },
      ),
    );

    expect(
      readyMechanics(copy).some(({ label }) => /entry|token/i.test(label)),
    ).toBe(true);
    expect(copy.effectValue).toBeGreaterThan(0);
  });

  it("does not reward opponent, symmetric, or exhaustion-only ready text", () => {
    const opponent = baseCardRatingBreakdown(
      card("ready-enemy", "Ready an enemy unit.", {
        type: "spell",
        might: null,
      }),
    );
    const symmetric = baseCardRatingBreakdown(
      card("ready-everyone", "Each player readies their units.", {
        type: "spell",
        might: null,
      }),
    );
    const drawback = baseCardRatingBreakdown(
      card("exhaust-self", "Exhaust me.", {
        type: "spell",
        might: null,
      }),
    );

    expect(readyMechanics(opponent)).toHaveLength(0);
    expect(readyMechanics(symmetric)).toHaveLength(0);
    expect(readyMechanics(drawback)).toHaveLength(0);
    expect(opponent.effectValue).toBe(0);
    expect(symmetric.effectValue).toBe(0);
  });
});

describe("partial keyword valuation", () => {
  it("uses a conservative magnitude of one for bare Assault and Shield", () => {
    const vanilla = baseCardRatingBreakdown(card("vanilla", ""));
    const bareAssault = baseCardRatingBreakdown(
      card("bare-assault", "[Assault]"),
    );
    const assaultTwo = baseCardRatingBreakdown(
      card("assault-two", "[Assault 2]"),
    );
    const bareShield = baseCardRatingBreakdown(card("bare-shield", "[Shield]"));
    const shieldTwo = baseCardRatingBreakdown(card("shield-two", "[Shield 2]"));

    expect(bareAssault.expectedStrength).toBeGreaterThan(
      vanilla.expectedStrength,
    );
    expect(assaultTwo.expectedStrength).toBeGreaterThan(
      bareAssault.expectedStrength,
    );
    expect(bareShield.expectedStrength).toBeGreaterThan(
      vanilla.expectedStrength,
    );
    expect(shieldTwo.expectedStrength).toBeGreaterThan(
      bareShield.expectedStrength,
    );
  });

  it("values Weaponmaster as Equipment access and tags that access explicitly", () => {
    const weaponmaster = card("weaponmaster", "[Weaponmaster]");
    const breakdown = baseCardRatingBreakdown(weaponmaster);
    const traits = deriveTraits(weaponmaster);

    expect(breakdown.effectValue + breakdown.resourceValue).toBeGreaterThan(0);
    expect(
      breakdown.mechanics.some(({ label, detail }) =>
        /weaponmaster|equipment/i.test(`${label} ${detail}`),
      ),
    ).toBe(true);
    expect(traits.has("weaponmaster")).toBe(true);
    expect(traits.has("equip")).toBe(true);
  });

  it("values a bare Equipment Assault grant without inventing a numeric bonus", () => {
    const grant = baseCardRatingBreakdown(
      card("equipment-assault", "Your Equipment each give [Assault].", {
        type: "legend",
        energy: null,
        might: null,
        power: null,
      }),
    );

    expect(grant.expectedStrength).toBeGreaterThan(0);
    expect(grant.expectedStrength).toBeLessThan(0.5);
  });
});
