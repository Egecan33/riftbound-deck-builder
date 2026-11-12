// Ported from Riftfoundry apps/web/src/lib/scoring.test.ts at origin/main 4b90179.
// 20 of 31 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  championMatchesLegend,
  deriveTraits,
  earlyPackageReliability,
  isScoredCard,
  previewSetLegalFrom,
  SCORE_MODEL_VERSION,
  scoreDeck,
  synergyAffinity,
  type ScoreCard,
} from "./riftfoundry";

function card(overrides: Partial<ScoreCard> = {}): ScoreCard {
  return {
    id: "test",
    name: "Test Card",
    setId: "OGN",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText: "",
    energy: 3,
    power: 1,
    might: 3,
    tags: [],
    copyLimit: 3,
    ...overrides,
  };
}

describe("RDS scoring", () => {





  it("returns an explainable ledger and 12-rune recommendation", () => {
    const body = card({ id: "body", name: "Body Card", power: 2 });
    const calm = card({
      id: "calm",
      name: "Calm Card",
      domains: ["calm"],
      domainNames: ["Calm"],
      power: 1,
    });
    const entries = [
      { card: body, quantity: 24 },
      { card: calm, quantity: 16 },
    ];
    const result = scoreDeck(entries, {
      legend: card({
        id: "legend",
        type: "legend",
        domains: ["body", "calm"],
        domainNames: ["Body", "Calm"],
      }),
      champion: body,
      battlefields: [
        card({ id: "bf1", name: "One", type: "battlefield" }),
        card({ id: "bf2", name: "Two", type: "battlefield" }),
        card({ id: "bf3", name: "Three", type: "battlefield" }),
      ],
    });

    expect(result.runes.reduce((sum, rune) => sum + rune.count, 0)).toBe(12);
    expect(result.contributions.length).toBeGreaterThan(2);
    expect(result.meta).toBe(0);
  });

  it("adds approved selected-top-list presence and pair overlays by canonical id", () => {
    const left = card({ id: "ogn-001-298", name: "Left Card" });
    const right = card({
      id: "ogn-002-298",
      name: "Right Card",
      domains: ["calm"],
      domainNames: ["Calm"],
    });
    const metaCalibration = {
      snapshot: {
        id: "snapshot-1",
        scoreModelVersionId: "model-1",
        scoreModelVersion: SCORE_MODEL_VERSION,
        sourceSlug: "riftbound-one",
        sourceUrl: "https://www.riftbound.one/decklists",
        attributionText: "Tournament decklists sourced from riftbound.one",
        capturedAt: "2026-07-24T10:00:00.000Z",
        verifiedAt: "2026-07-24T10:00:00.000Z",
        activatedAt: "2026-07-24T10:05:00.000Z",
      },
      cardAdjustments: [
        {
          snapshotId: "snapshot-1",
          gameplayCardKey: left.id,
          adjustment: 1.5,
          adjustmentCap: 2.5,
        },
      ],
      pairAdjustments: [
        {
          snapshotId: "snapshot-1",
          leftCardKey: right.id,
          rightCardKey: left.id,
          adjustment: 0.9,
          adjustmentCap: 1.25,
        },
      ],
    } as const;

    const forward = scoreDeck(
      [
        { card: left, quantity: 3 },
        { card: right, quantity: 1 },
      ],
      { metaCalibration },
    );
    const reversed = scoreDeck(
      [
        { card: right, quantity: 1 },
        { card: left, quantity: 3 },
      ],
      { metaCalibration },
    );
    const fewerCopies = scoreDeck(
      [
        { card: left, quantity: 1 },
        { card: right, quantity: 1 },
      ],
      { metaCalibration },
    );

    expect(forward.meta).toBeGreaterThan(0);
    expect(forward.meta).toBe(reversed.meta);
    expect(forward.meta).toBe(fewerCopies.meta);
    expect(forward.contributions).toContainEqual(
      expect.objectContaining({
        id: "meta-calibration",
        detail: expect.stringMatching(/legacy source.*riftbound/i),
      }),
    );
  });

  it("fails closed when supplied meta evidence belongs to a stale score model", () => {
    const left = card({ id: "stale-left", name: "Stale Left" });
    const right = card({ id: "stale-right", name: "Stale Right" });
    const result = scoreDeck(
      [
        { card: left, quantity: 3 },
        { card: right, quantity: 1 },
      ],
      {
        metaCalibration: {
          snapshot: {
            id: "snapshot-stale",
            scoreModelVersionId: "model-stale",
            scoreModelVersion: "RDS 0.8.0",
            sourceSlug: "riftbound-one",
            sourceUrl: "https://www.riftbound.one/decklists",
            attributionText: "Tournament decklists sourced from riftbound.one",
            capturedAt: "2026-07-24T10:00:00.000Z",
            verifiedAt: "2026-07-24T10:00:00.000Z",
            activatedAt: "2026-07-24T10:05:00.000Z",
          },
          cardAdjustments: [
            {
              snapshotId: "snapshot-stale",
              gameplayCardKey: left.id,
              adjustment: 0.15,
              adjustmentCap: 0.15,
            },
          ],
          pairAdjustments: [
            {
              snapshotId: "snapshot-stale",
              leftCardKey: left.id,
              rightCardKey: right.id,
              adjustment: 0.35,
              adjustmentCap: 0.35,
            },
          ],
        },
      },
    );

    expect(result.meta).toBe(0);
    expect(result.contributions).toContainEqual(
      expect.objectContaining({
        id: "meta-calibration",
        value: 0,
        detail:
          "Historical Top-8 adoption 0 · qualified human inclusion outcomes 0 · legacy source 0. Total correction capped at ±5 deck points. Missing evidence is neutral.",
      }),
    );
  });

  it("contains malformed or extreme evidence inside the per-signal meta caps", () => {
    const left = card({ id: "left", name: "Left Card" });
    const right = card({ id: "right", name: "Right Card" });
    const third = card({ id: "third", name: "Third Card" });
    const result = scoreDeck(
      [
        { card: left, quantity: 99 },
        { card: right, quantity: 99 },
        { card: third, quantity: 99 },
      ],
      {
        metaCalibration: {
          snapshot: {
            id: "bad",
            scoreModelVersionId: "model-current",
            scoreModelVersion: SCORE_MODEL_VERSION,
            sourceSlug: "riftbound-one",
            sourceUrl: "https://www.riftbound.one/decklists",
            attributionText: "Tournament decklists sourced from riftbound.one",
            capturedAt: "2026-07-24T10:00:00.000Z",
            verifiedAt: "2026-07-24T10:00:00.000Z",
            activatedAt: "2026-07-24T10:05:00.000Z",
          },
          cardAdjustments: [
            {
              snapshotId: "bad",
              gameplayCardKey: left.id,
              adjustment: Number.POSITIVE_INFINITY,
              adjustmentCap: 99,
            },
            {
              snapshotId: "bad",
              gameplayCardKey: right.id,
              adjustment: 99,
              adjustmentCap: 99,
            },
            {
              snapshotId: "bad",
              gameplayCardKey: third.id,
              adjustment: 99,
              adjustmentCap: 99,
            },
          ],
          pairAdjustments: [
            {
              snapshotId: "bad",
              leftCardKey: left.id,
              rightCardKey: right.id,
              adjustment: 99,
              adjustmentCap: 99,
            },
          ],
        },
      },
    );

    expect(result.meta).toBe(0.7);
    expect(Number.isFinite(result.total)).toBe(true);
  });

  it("still returns a 12-rune plan when cards have no printed Power demand", () => {
    const result = scoreDeck(
      [
        {
          card: card({
            id: "zero-power",
            domains: ["body", "calm"],
            power: 0,
          }),
          quantity: 40,
        },
      ],
      {
        legend: card({
          id: "zero-power-legend",
          type: "legend",
          domains: ["body", "calm"],
          tags: ["Hero"],
        }),
      },
    );

    expect(result.runes.reduce((sum, rune) => sum + rune.count, 0)).toBe(12);
    expect(result.runes.map(({ domain }) => domain).sort()).toEqual([
      "body",
      "calm",
    ]);
  });

  it("treats Vendetta as Constructed-legal now that its setLegalFrom date has passed", () => {
    const vendettaCard = card({
      id: "ven-card",
      name: "Released Card",
      setId: "VEN",
    });
    const result = scoreDeck([{ card: vendettaCard, quantity: 40 }], {
      legend: card({ id: "legend", type: "legend" }),
      champion: vendettaCard,
      battlefields: [
        card({ id: "bf1", name: "One", type: "battlefield" }),
        card({ id: "bf2", name: "Two", type: "battlefield" }),
        card({ id: "bf3", name: "Three", type: "battlefield" }),
      ],
    });

    expect(result.legality.issues).not.toContainEqual(
      expect.stringContaining("preview-only"),
    );
  });


  it("allows a third Pre-Rift domain outside the optional Legend identity", () => {
    const body = card({ id: "body", name: "Body", domains: ["body"] });
    const calm = card({ id: "calm", name: "Calm", domains: ["calm"] });
    const fury = card({ id: "fury", name: "Fury", domains: ["fury"] });
    const pool = { body: 10, calm: 10, fury: 5 };
    const result = scoreDeck(
      [
        { card: body, quantity: 10 },
        { card: calm, quantity: 10 },
        { card: fury, quantity: 5 },
      ],
      {
        format: "vendetta-prerift",
        sealedPool: pool,
        blankBattlefields: 3,
        legend: card({
          id: "legend",
          name: "Body Calm Legend",
          type: "legend",
          domains: ["body", "calm"],
        }),
      },
    );

    expect(result.antisynergy).toBeLessThan(18);
    expect(result.contributions).not.toContainEqual(
      expect.objectContaining({ id: "off-domain" }),
    );
    expect(result.legality.issues).not.toContainEqual(
      expect.stringContaining("at most three domains"),
    );
  });

  it("counts optional Pre-Rift identity cards toward the three-domain cap", () => {
    const body = card({ id: "body", domains: ["body"] });
    const result = scoreDeck([{ card: body, quantity: 25 }], {
      format: "vendetta-prerift",
      sealedPool: { body: 25 },
      blankBattlefields: 3,
      legend: card({
        id: "legend",
        type: "legend",
        domains: ["calm", "fury"],
      }),
      champion: card({
        id: "champion",
        domains: ["chaos"],
      }),
    });

    expect(result.legality.issues).toContainEqual(
      expect.stringContaining("at most three domains (4 selected)"),
    );
  });

  it("uses the selected event profile instead of hardcoded Pre-Rift structure values", () => {
    const twoDomainCard = card({
      id: "future-event-card",
      domains: ["body", "calm"],
    });
    const result = scoreDeck([{ card: twoDomainCard, quantity: 31 }], {
      format: "vendetta-prerift",
      sealedPool: { [twoDomainCard.id]: 31 },
      blankBattlefields: 2,
      sealedRules: {
        minimumMainDeck: 20,
        maximumMainDeck: 30,
        maximumDomains: 1,
        battlefieldCount: 2,
      },
    });

    expect(result.legality.issues).toContain(
      "Pre-Rift Main Deck allows at most 30 cards (31/30).",
    );
    expect(result.legality.issues).toContain(
      "Pre-Rift decks may use at most 1 domain (2 selected).",
    );
    expect(result.legality.issues).not.toContainEqual(
      expect.stringContaining("Present three Battlefields"),
    );
  });

  it("requires a Standard Chosen Champion to be present in the main deck", () => {
    const body = card({ id: "body", name: "Body Card" });
    const chosenChampion = card({
      id: "champion",
      name: "Chosen Champion",
      tags: ["Hero"],
    });
    const result = scoreDeck([{ card: body, quantity: 40 }], {
      legend: card({
        id: "legend",
        name: "Hero Legend",
        type: "legend",
        tags: ["Hero"],
      }),
      champion: chosenChampion,
      battlefields: [
        card({ id: "bf1", name: "One", type: "battlefield" }),
        card({ id: "bf2", name: "Two", type: "battlefield" }),
        card({ id: "bf3", name: "Three", type: "battlefield" }),
      ],
    });

    expect(result.legality.issues).toContain(
      "Chosen Champion must be included in the Main Deck.",
    );
  });

  it("enforces Standard Legend and Chosen Champion identity matching", () => {
    const wrongChampion = card({
      id: "wrong-champion",
      name: "Wrong Champion",
      tags: ["Other Hero"],
    });
    const result = scoreDeck([{ card: wrongChampion, quantity: 40 }], {
      legend: card({
        id: "legend",
        name: "Hero Legend",
        type: "legend",
        tags: ["Hero"],
      }),
      champion: wrongChampion,
      battlefields: [
        card({ id: "bf1", name: "One", type: "battlefield" }),
        card({ id: "bf2", name: "Two", type: "battlefield" }),
        card({ id: "bf3", name: "Three", type: "battlefield" }),
      ],
    });

    expect(result.legality.issues).toContain(
      "Chosen Champion must match the selected Champion Legend.",
    );
  });


  it("honors a rule profile that disables Legend and Champion matching", () => {
    const unmatchedChampion = card({
      id: "unmatched-champion",
      tags: ["Other Hero"],
    });
    const result = scoreDeck([{ card: unmatchedChampion, quantity: 40 }], {
      legend: card({
        id: "legend",
        type: "legend",
        tags: ["Hero"],
      }),
      champion: unmatchedChampion,
      championRules: {
        mustMatchLegendChampion: false,
      },
      battlefields: [
        card({ id: "bf1", name: "One", type: "battlefield" }),
        card({ id: "bf2", name: "Two", type: "battlefield" }),
        card({ id: "bf3", name: "Three", type: "battlefield" }),
      ],
    });

    expect(result.legality.issues).not.toContain(
      "Chosen Champion must match the selected Champion Legend.",
    );
  });

  it("allows Pre-Rift to omit or mismatch its optional Chosen Champion", () => {
    const wrongChampion = card({
      id: "wrong-champion",
      name: "Wrong Champion",
      domains: ["body"],
      tags: ["Other Hero"],
    });
    const result = scoreDeck([{ card: wrongChampion, quantity: 25 }], {
      format: "vendetta-prerift",
      sealedPool: { [wrongChampion.id]: 25 },
      blankBattlefields: 3,
      legend: card({
        id: "legend",
        name: "Hero Legend",
        type: "legend",
        domains: ["body"],
        tags: ["Hero"],
      }),
      champion: wrongChampion,
    });

    expect(result.legality.issues).not.toContainEqual(
      expect.stringContaining("Chosen Champion"),
    );
  });

  it("penalizes a trash engine that has setup but no payoff", () => {
    const filler = card({
      id: "filler",
      name: "Blind Burn",
      rulesText: "[Burn 2]",
    });
    const result = scoreDeck([{ card: filler, quantity: 4 }]);

    expect(result.contributions).toContainEqual(
      expect.objectContaining({
        id: "orphan-trash",
        value: expect.any(Number),
      }),
    );
    expect(
      result.contributions.find(({ id }) => id === "orphan-trash")?.value,
    ).toBeLessThan(0);
  });

  it("removes the orphan trash penalty when the deck has enough payoff", () => {
    const filler = card({
      id: "filler",
      name: "Blind Burn",
      rulesText: "[Burn 2]",
    });
    const flow = card({
      id: "flow",
      name: "Trash Caster",
      rulesText: "[Flow] You may play this from your trash.",
    });
    const result = scoreDeck([
      { card: filler, quantity: 4 },
      { card: flow, quantity: 2 },
    ]);

    expect(result.contributions).not.toContainEqual(
      expect.objectContaining({ id: "orphan-trash" }),
    );
    expect(result.contributions).toContainEqual(
      expect.objectContaining({ label: "Burn into Flow" }),
    );
  });




  it("rewards reliable balanced packages with diminishing, capped returns", () => {
    const enabler = card({
      id: "buff-enabler",
      name: "Buff Enabler",
      rulesText: "When you play me, buff a friendly unit.",
      copyLimit: 99,
    });
    const payoff = card({
      id: "buff-payoff",
      name: "Buff Payoff",
      rulesText: "While I'm buffed, I have +2 Might.",
      copyLimit: 99,
    });
    const neutral = card({
      id: "neutral-package",
      name: "Neutral",
      copyLimit: 99,
    });
    const packageSynergy = (enablers: number, payoffs: number) =>
      scoreDeck([
        { card: enabler, quantity: enablers },
        { card: payoff, quantity: payoffs },
        { card: neutral, quantity: 40 - enablers - payoffs },
      ]).synergy;

    const balanced = packageSynergy(4, 4);
    const unbalanced = packageSynergy(7, 1);
    const sixEach = packageSynergy(6, 6);
    const nineEach = packageSynergy(9, 9);

    expect(balanced).toBeGreaterThan(unbalanced);
    expect(sixEach).toBeGreaterThan(balanced);
    expect(nineEach).toBeGreaterThanOrEqual(sixEach);
    expect(nineEach - sixEach).toBeLessThanOrEqual(sixEach - balanced);
    expect(nineEach).toBeLessThanOrEqual(2.8);
  });


  it("penalizes banish and Flow packages that compete for too little trash", () => {
    const filler = card({
      id: "trash-filler-conflict",
      rulesText: "[Burn 1]",
      copyLimit: 99,
    });
    const banisher = card({
      id: "trash-banisher",
      rulesText: "Banish a card from your trash.",
      copyLimit: 99,
    });
    const flow = card({
      id: "trash-flow",
      rulesText: "[Flow] You may play this from your trash.",
      copyLimit: 99,
    });
    const neutral = card({
      id: "trash-neutral",
      copyLimit: 99,
    });
    const conflicted = scoreDeck([
      { card: filler, quantity: 1 },
      { card: banisher, quantity: 4 },
      { card: flow, quantity: 4 },
      { card: neutral, quantity: 31 },
    ]);
    const supplied = scoreDeck([
      { card: filler, quantity: 8 },
      { card: banisher, quantity: 4 },
      { card: flow, quantity: 4 },
      { card: neutral, quantity: 24 },
    ]);

    expect(conflicted.contributions).toContainEqual(
      expect.objectContaining({ id: "trash-resource-conflict" }),
    );
    expect(supplied.contributions).not.toContainEqual(
      expect.objectContaining({ id: "trash-resource-conflict" }),
    );
  });

  it("detects gear-without-board and payoff-without-enabler dead draws", () => {
    const gear = card({
      id: "unsupported-gear",
      type: "gear",
      might: null,
      rulesText: "[Equip]",
      copyLimit: 99,
    });
    const empowerPayoff = card({
      id: "empower-payoff",
      rulesText: "[Empowered] If I'm empowered, draw 1.",
      copyLimit: 99,
    });
    const spell = card({
      id: "neutral-spell",
      type: "spell",
      might: null,
      copyLimit: 99,
    });
    const result = scoreDeck([
      { card: gear, quantity: 5 },
      { card: empowerPayoff, quantity: 3 },
      { card: spell, quantity: 32 },
    ]);

    expect(result.contributions).toContainEqual(
      expect.objectContaining({ id: "gear-without-board" }),
    );
    expect(result.contributions).toContainEqual(
      expect.objectContaining({ id: "dead-empower-payoff" }),
    );
  });

  it("distinguishes smooth role coverage from top-heavy, Power-strained curves", () => {
    const earlyUnit = card({
      id: "early-unit",
      energy: 2,
      power: 0,
      might: 3,
      copyLimit: 99,
    });
    const interaction = card({
      id: "interaction",
      type: "spell",
      might: null,
      energy: 3,
      power: 0,
      rulesText: "[Action] Deal 2 to a unit. Draw 1.",
      copyLimit: 99,
    });
    const scorer = card({
      id: "scorer",
      energy: 4,
      power: 1,
      rulesText: "When I conquer, score 1.",
      copyLimit: 99,
    });
    const expensive = card({
      id: "expensive",
      energy: 8,
      power: 4,
      might: 6,
      copyLimit: 99,
    });
    const smooth = scoreDeck([
      { card: earlyUnit, quantity: 20 },
      { card: interaction, quantity: 10 },
      { card: scorer, quantity: 10 },
    ]);
    const strained = scoreDeck([{ card: expensive, quantity: 40 }]);

    expect(smooth.structure).toBeGreaterThan(strained.structure);
    expect(strained.antisynergy).toBeGreaterThan(smooth.antisynergy);
    expect(strained.contributions).toContainEqual(
      expect.objectContaining({ id: "top-heavy" }),
    );
    expect(strained.contributions).toContainEqual(
      expect.objectContaining({ id: "rune-strain" }),
    );
  });

  it("does not inflate context fit from a shared region tag", () => {
    const legend = card({
      id: "region-legend",
      type: "legend",
      might: null,
      tags: ["Noxus"],
      rulesText: "",
    });
    const regionalUnit = card({
      id: "regional-unit",
      tags: ["Noxus"],
      rulesText: "",
      copyLimit: 99,
    });
    const explicitLegend = card({
      id: "explicit-legend",
      type: "legend",
      might: null,
      tags: [],
      rulesText: "When you play a spell, draw 1.",
    });
    const spell = card({
      id: "supported-spell",
      type: "spell",
      might: null,
      rulesText: "[Action] Draw 1.",
      copyLimit: 99,
    });

    const generic = scoreDeck([{ card: regionalUnit, quantity: 40 }], {
      legend,
    });
    const explicit = scoreDeck([{ card: spell, quantity: 40 }], {
      legend: explicitLegend,
    });

    expect(generic.compatibility).toBe(0);
    expect(explicit.compatibility).toBeGreaterThan(generic.compatibility);
  });
});
