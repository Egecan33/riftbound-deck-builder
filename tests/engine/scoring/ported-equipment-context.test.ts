// Ported from Riftfoundry apps/web/src/lib/scoring-equipment-context.test.ts at origin/main 4b90179.
// 15 of 17 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  analyzeCardPair,
  deriveTraits,
  evaluateCandidateFit,
  rankCandidateFits,
  scoreDeck,
  type DeckEntry,
  type EquipmentActivationBreakdown,
  type ScoreCard,
} from "./riftfoundry";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

function syntheticCard(
  id: string,
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
  return {
    id,
    name: id,
    setId: "TST",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText: "",
    energy: 2,
    power: 0,
    might: 2,
    tags: [],
    copyLimit: 99,
    ...overrides,
  };
}

function equipmentPenalty(entries: DeckEntry[], payoff: ScoreCard): number {
  return Math.abs(
    scoreDeck(entries).contributions.find(
      ({ id }) => id === `equipment-activation:${payoff.id}`,
    )?.value ?? 0,
  );
}

function equipmentBreakdown(
  entries: DeckEntry[],
  card: ScoreCard,
): EquipmentActivationBreakdown {
  const breakdown = scoreDeck(entries).cardBreakdown.find(
    ({ cardId }) => cardId === card.id,
  )?.equipmentActivation;
  if (!breakdown) {
    throw new Error(`Missing Equipment activation for ${card.name}`);
  }
  return breakdown;
}

const strikeDown = canonicalCard("Strike Down");
const riven = canonicalCard("Riven, Shattered");
const rell = canonicalCard("Rell, Magnetic");
const angleShot = canonicalCard("Angle Shot");
const azir = canonicalCard("Azir, Ascendant");
const pitCrew = canonicalCard("Pit Crew");
const serratedDirk = canonicalCard("Serrated Dirk");
const bfSword = canonicalCard("B.F. Sword");
const carrier = syntheticCard("carrier");
const fillerSpell = syntheticCard("filler-spell", {
  type: "spell",
  might: null,
});
const genericGear = syntheticCard("generic-gear", {
  type: "gear",
  might: null,
  energy: 1,
  tags: ["Relic"],
  rulesText: "[Action] Draw 1, then recycle 1.",
});

describe("deck-context Equipment activation", () => {

  it("does not let generic Gear increase Strike Down support", () => {
    const unsupported = equipmentPenalty(
      [
        { card: strikeDown, quantity: 2 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 18 },
      ],
      strikeDown,
    );
    const wrongGear = equipmentPenalty(
      [
        { card: strikeDown, quantity: 2 },
        { card: genericGear, quantity: 8 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 10 },
      ],
      strikeDown,
    );

    expect(unsupported).toBeGreaterThan(0);
    expect(wrongGear).toBe(unsupported);
  });

  it("raises activation monotonically with valid Equipment and saturates", () => {
    const penaltyWith = (equipmentCopies: number) =>
      equipmentPenalty(
        [
          { card: strikeDown, quantity: 2 },
          { card: serratedDirk, quantity: equipmentCopies },
          { card: carrier, quantity: 20 },
          { card: fillerSpell, quantity: 18 - equipmentCopies },
        ],
        strikeDown,
      );

    const none = penaltyWith(0);
    const one = penaltyWith(1);
    const six = penaltyWith(6);
    const twelve = penaltyWith(12);

    expect(none).toBeGreaterThan(one);
    expect(one).toBeGreaterThan(six);
    expect(six).toBeGreaterThanOrEqual(twelve);
    expect(six - twelve).toBeLessThan(one - six);
  });

  it("strands Equipment when the deck has no unit carriers", () => {
    const stranded = scoreDeck([
      { card: serratedDirk, quantity: 2 },
      { card: fillerSpell, quantity: 38 },
    ]);
    const carried = scoreDeck([
      { card: serratedDirk, quantity: 2 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 18 },
    ]);

    expect(stranded.contributions).toContainEqual(
      expect.objectContaining({ id: "equipment-carriers" }),
    );
    expect(carried.contributions).not.toContainEqual(
      expect.objectContaining({ id: "equipment-carriers" }),
    );
  });

  it("honors Rell's Equipment Energy ceiling", () => {
    const penaltyWith = (equipment: ScoreCard | null) =>
      equipmentPenalty(
        [
          { card: rell, quantity: 2 },
          ...(equipment ? [{ card: equipment, quantity: 6 }] : []),
          { card: carrier, quantity: 20 },
          { card: fillerSpell, quantity: equipment ? 12 : 18 },
        ],
        rell,
      );

    const none = penaltyWith(null);
    const tooExpensive = penaltyWith(bfSword);
    const compatible = penaltyWith(serratedDirk);

    expect(tooExpensive).toBe(none);
    expect(compatible).toBeLessThan(tooExpensive);

    const supported = scoreDeck([
      { card: rell, quantity: 2 },
      { card: serratedDirk, quantity: 6 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 12 },
    ]).cardBreakdown.find(({ cardId }) => cardId === rell.id);
    expect(supported?.equipmentActivation).toEqual(
      expect.objectContaining({
        attachedStateRequired: true,
        maximumEquipmentEnergy: 2,
        providerCardIds: [serratedDirk.id],
      }),
    );
  });

  it("treats detach as reusable re-equip tempo rather than fresh supply consumption", () => {
    const oneWindow = equipmentBreakdown(
      [
        { card: strikeDown, quantity: 1 },
        { card: serratedDirk, quantity: 1 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 18 },
      ],
      strikeDown,
    );
    const threeWindows = equipmentBreakdown(
      [
        { card: strikeDown, quantity: 3 },
        { card: serratedDirk, quantity: 1 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 16 },
      ],
      strikeDown,
    );

    expect(oneWindow.consumptionDemand).toBe(0);
    expect(threeWindows.consumptionDemand).toBe(0);
    expect(oneWindow.detachTempoDemand).toBe(1);
    expect(threeWindows.detachTempoDemand).toBe(3);
    expect(threeWindows.supportReliability).toBe(oneWindow.supportReliability);
    expect(oneWindow.reattachTempoTax).toBe(0);
    expect(threeWindows.reattachTempoTax).toBeGreaterThan(0);
    expect(Math.abs(threeWindows.scoreAdjustment / 3)).toBeGreaterThan(
      Math.abs(oneWindow.scoreAdjustment),
    );
  });

  it("requires fresh Equipment supply for destructive kill or sacrifice costs", () => {
    const destroyEquipment = syntheticCard("destroy-equipment", {
      type: "spell",
      might: null,
      rulesText: "Kill an Equipment you control to draw 2.",
    });
    const oneWindow = equipmentBreakdown(
      [
        { card: destroyEquipment, quantity: 1 },
        { card: serratedDirk, quantity: 1 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 18 },
      ],
      destroyEquipment,
    );
    const threeWindows = equipmentBreakdown(
      [
        { card: destroyEquipment, quantity: 3 },
        { card: serratedDirk, quantity: 1 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 16 },
      ],
      destroyEquipment,
    );

    expect(oneWindow.consumptionDemand).toBe(1);
    expect(threeWindows.consumptionDemand).toBe(3);
    expect(threeWindows.detachTempoDemand).toBe(0);
    expect(threeWindows.supportReliability).toBeLessThan(
      oneWindow.supportReliability,
    );
  });

  it("activation-gates one- and two-copy Riven payoffs", () => {
    for (const quantity of [1, 2]) {
      const penalty = equipmentPenalty(
        [
          { card: riven, quantity },
          { card: carrier, quantity: 20 },
          { card: fillerSpell, quantity: 20 - quantity },
        ],
        riven,
      );

      expect(penalty).toBeGreaterThan(0);
    }
  });

  it("penalizes even a one-copy generic Gear payoff when no Gear exists", () => {
    const unsupported = scoreDeck([
      { card: pitCrew, quantity: 1 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 19 },
    ]);
    const supported = scoreDeck([
      { card: pitCrew, quantity: 1 },
      { card: genericGear, quantity: 3 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 16 },
    ]);

    expect(deriveTraits(pitCrew).has("gear-matters")).toBe(true);
    expect(unsupported.contributions).toContainEqual(
      expect.objectContaining({ id: "dead-gear-payoff" }),
    );
    expect(supported.contributions).not.toContainEqual(
      expect.objectContaining({ id: "dead-gear-payoff" }),
    );
  });

  it("exposes the supported floor, ceiling, and reliability per card", () => {
    const result = scoreDeck([
      { card: strikeDown, quantity: 2 },
      { card: serratedDirk, quantity: 4 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 14 },
    ]);
    const row = result.cardBreakdown.find(
      ({ cardId }) => cardId === strikeDown.id,
    );

    expect(row?.equipmentActivation).toEqual(
      expect.objectContaining({
        equipmentCopies: 4,
        carrierCopies: 20,
        providerCardIds: [carrier.id, serratedDirk.id],
        providerRoles: {
          equipment: [serratedDirk.id],
          carriers: [carrier.id],
        },
        supportedCeiling: 1,
      }),
    );
    expect(row!.equipmentActivation!.standaloneFloor).toBeGreaterThan(0);
    expect(row!.equipmentActivation!.activation).toBeGreaterThan(
      row!.equipmentActivation!.standaloneFloor,
    );
    expect(row!.equipmentActivation!.activation).toBeLessThanOrEqual(1);
    expect(row!.equipmentActivation!.detail).toMatch(/detach|Equipment/i);
  });

  it.each([
    [angleShot, true],
    [azir, true],
  ] as const)(
    "detects canonical attachment requirements for %s",
    (payoff, needsExternalCarrier) => {
      const result = scoreDeck([
        { card: payoff, quantity: 2 },
        { card: serratedDirk, quantity: 4 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 14 },
      ]);
      const breakdown = result.cardBreakdown.find(
        ({ cardId }) => cardId === payoff.id,
      )?.equipmentActivation;

      expect(deriveTraits(payoff).has("equipment-matters")).toBe(true);
      expect(breakdown).toEqual(
        expect.objectContaining({
          attachedStateRequired: true,
          providerRoles: {
            equipment: [serratedDirk.id],
            carriers: needsExternalCarrier ? [carrier.id] : [],
          },
        }),
      );
      expect(breakdown?.conditionalValue).toBeGreaterThan(0);
    },
  );

  it("reconciles conditional value, realized value, and the exact score adjustment", () => {
    const result = scoreDeck([
      { card: strikeDown, quantity: 2 },
      { card: serratedDirk, quantity: 4 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 14 },
    ]);
    const row = result.cardBreakdown.find(
      ({ cardId }) => cardId === strikeDown.id,
    )!;
    const context = row.equipmentActivation!;
    const contribution = result.contributions.find(
      ({ id }) => id === `equipment-activation:${strikeDown.id}`,
    );

    expect(context.realizedConditionalValue).toBeCloseTo(
      context.conditionalValue * context.supportReliability,
      2,
    );
    expect(context.scoreAdjustment).toBeCloseTo(
      context.realizedConditionalValue -
        context.conditionalValue -
        context.reattachTempoTax,
      2,
    );
    expect(contribution?.value).toBeCloseTo(context.scoreAdjustment, 2);
    expect(row.antisynergy).toBeGreaterThanOrEqual(
      Math.abs(context.scoreAdjustment),
    );
  });

  it("preserves exact Equipment arithmetic outside the general antisynergy cap", () => {
    const hostileTopEnd = syntheticCard("hostile-top-end", {
      type: "spell",
      domains: ["fury"],
      domainNames: ["Fury"],
      energy: 10,
      power: 5,
      might: null,
      rulesText:
        "Play me only to an occupied enemy battlefield. Discard 1, then draw 1.",
    });
    const bodyLegend = syntheticCard("body-legend", {
      type: "legend",
      energy: null,
      might: null,
    });
    const result = scoreDeck(
      [
        { card: strikeDown, quantity: 3 },
        { card: hostileTopEnd, quantity: 37 },
      ],
      { legend: bodyLegend },
    );
    const strikeContext = result.cardBreakdown.find(
      ({ cardId }) => cardId === strikeDown.id,
    )!.equipmentActivation!;
    const apportionedAntisynergy = result.cardBreakdown.reduce(
      (total, row) => total + row.antisynergy,
      0,
    );

    expect(result.antisynergy).toBeGreaterThan(48);
    expect(result.antisynergy).toBeCloseTo(
      48 + Math.abs(strikeContext.scoreAdjustment),
      2,
    );
    expect(apportionedAntisynergy).toBeCloseTo(result.antisynergy, 2);
  });

  it("does not activation-gate Riven's unconditional printed body", () => {
    const result = scoreDeck([
      { card: riven, quantity: 2 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 18 },
    ]);
    const row = result.cardBreakdown.find(({ cardId }) => cardId === riven.id)!;
    const context = row.equipmentActivation!;
    const selectedFoundationValue = (row.foundation * row.quantity * 10.5) / 40;

    expect(context.conditionalValue).toBeGreaterThan(0);
    expect(context.conditionalValue).toBeLessThan(selectedFoundationValue);
    expect(context.standaloneFloor).toBeGreaterThan(0.5);
  });


  it("reports causal provider roles instead of Equipment self-providers", () => {
    const entries = [
      { card: strikeDown, quantity: 2 },
      { card: serratedDirk, quantity: 2 },
      { card: carrier, quantity: 20 },
      { card: fillerSpell, quantity: 16 },
    ];
    const strikeContext = equipmentBreakdown(entries, strikeDown);
    const equipmentContext = equipmentBreakdown(entries, serratedDirk);

    expect(strikeContext.providerRoles).toEqual({
      equipment: [serratedDirk.id],
      carriers: [carrier.id],
    });
    expect(strikeContext.providerCardIds).toEqual([
      carrier.id,
      serratedDirk.id,
    ]);
    expect(equipmentContext.providerRoles).toEqual({
      equipment: [],
      carriers: [carrier.id],
    });
    expect(equipmentContext.providerCardIds).toEqual([carrier.id]);
  });

  it("credits compatible Equipment providers before the candidate cutoff", () => {
    const ranked = rankCandidateFits(
      [
        { card: rell, quantity: 3 },
        { card: carrier, quantity: 19 },
        { card: fillerSpell, quantity: 17 },
      ],
      [bfSword, serratedDirk],
      { limit: 1 },
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.card.id).toBe(serratedDirk.id);
    expect(ranked[0]?.fitReasons.join(" ")).toMatch(/Rell|Equipment/i);
  });

  it("carries Equipment activation into candidate ranking", () => {
    const unsupported = evaluateCandidateFit(
      [
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 19 },
      ],
      strikeDown,
    );
    const supported = evaluateCandidateFit(
      [
        { card: serratedDirk, quantity: 6 },
        { card: carrier, quantity: 20 },
        { card: fillerSpell, quantity: 13 },
      ],
      strikeDown,
    );

    expect(supported.fitIndex).toBeGreaterThan(unsupported.fitIndex);
    expect(unsupported.fitReasons.join(" ")).toMatch(/Equipment/i);
  });
});
