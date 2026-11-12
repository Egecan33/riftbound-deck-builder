// Ported from Riftfoundry apps/web/src/lib/scoring-audit.test.ts at origin/main 4b90179.
// 4 of 7 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  ORPHAN_ENGINE_RULES,
  TRAIT_LABELS,
  analyzeCardPair,
  baseCardRating,
  deriveTraits,
  isScoredCard,
  scoreDeck,
  synergyAffinity,
  type ScoreCard,
} from "./riftfoundry";

function asScoreCard(candidate: (typeof gallery.cards)[number]): ScoreCard {
  return {
    id: candidate.id,
    name: candidate.name,
    setId: candidate.setId,
    type: candidate.type,
    accessibilityText: candidate.accessibilityText,
    superTypes: candidate.superTypes,
    domains: candidate.domains,
    domainNames: candidate.domainNames,
    rulesText: candidate.rulesText,
    energy: candidate.energy,
    power: candidate.power,
    might: candidate.might,
    mightBonus: candidate.mightBonus,
    tags: candidate.tags,
    copyLimit: candidate.copyLimit,
  };
}

function syntheticCard(
  id: string,
  rulesText = "",
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
  return {
    id,
    name: id,
    setId: "OGN",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText,
    energy: 3,
    power: 1,
    might: 3,
    tags: [],
    copyLimit: 99,
    ...overrides,
  };
}

const catalog = gallery.cards.map(asScoreCard);
const mainDeckCards = catalog.filter((candidate) =>
  ["unit", "spell", "gear"].includes(candidate.type),
);
const legends = catalog.filter((candidate) => candidate.type === "legend");
const battlefields = catalog.filter(
  (candidate) => candidate.type === "battlefield",
);

describe("RDS full-catalog audit", () => {



  it("produces deterministic finite component scores for every playable catalog card", () => {
    const genericBattlefields = [1, 2, 3].map((index) =>
      syntheticCard(`battlefield-${index}`, "", {
        type: "battlefield",
        domains: [],
        domainNames: [],
        power: null,
      }),
    );

    for (const candidate of mainDeckCards) {
      const legend = syntheticCard(`legend-${candidate.id}`, "", {
        type: "legend",
        domains: candidate.domains,
        domainNames: candidate.domainNames,
        power: null,
      });
      const champion = { ...candidate, id: `champion-${candidate.id}` };
      const entries = [{ card: candidate, quantity: 40 }];
      const options = {
        legend,
        champion,
        battlefields: genericBattlefields,
        metaAdjustment: 5,
      };
      const first = scoreDeck(entries, options);
      const second = scoreDeck(entries, options);
      const numericComponents = [
        first.total,
        first.base,
        first.synergy,
        first.antisynergy,
        first.compatibility,
        first.structure,
        first.meta,
        ...first.contributions.map(({ value }) => value),
        ...first.runes.flatMap(({ count, demand }) => [count, demand]),
      ];

      expect(numericComponents.every(Number.isFinite)).toBe(true);
      expect(first.base).toBeGreaterThanOrEqual(0);
      expect(first.base).toBeLessThanOrEqual(102.9);
      expect(first.synergy).toBeGreaterThanOrEqual(0);
      expect(first.synergy).toBeLessThanOrEqual(24);
      expect(first.antisynergy).toBeGreaterThanOrEqual(0);
      expect(first.compatibility).toBeGreaterThanOrEqual(0);
      expect(first.compatibility).toBeLessThanOrEqual(12);
      expect(first.structure).toBeGreaterThanOrEqual(0);
      expect(first.structure).toBeLessThanOrEqual(14);
      expect(first.meta).toBeGreaterThanOrEqual(-5);
      expect(first.meta).toBeLessThanOrEqual(5);
      expect(first.total).toBeGreaterThanOrEqual(0);
      expect(first.total).toBeLessThanOrEqual(160);
      expect(second).toEqual(first);
    }
  }, 60_000);
});

describe("RDS engine and rune invariants", () => {
  const engineFixtures: Record<
    string,
    { enablerText: string; payoffText: string }
  > = {
    "orphan-trash": {
      enablerText: "[Burn 2]",
      payoffText: "[Flow] You may play this from your trash.",
    },
    "orphan-empower": {
      enablerText: "[Empower]",
      payoffText: "[Empowered] If I'm empowered, draw 1.",
    },
    "orphan-xp": {
      enablerText: "[Hunt 1]",
      payoffText: "[Level 2] Spend 2 XP: Draw 1.",
    },
    "orphan-token": {
      enablerText: "Create a Recruit token.",
      payoffText: "Tokens you control get +1 Might.",
    },
    "orphan-death": {
      enablerText: "Kill another friendly unit.",
      payoffText: "[Deathknell] Draw 1.",
    },
    "orphan-discard": {
      enablerText: "Discard 1.",
      payoffText: "When you discard a card, draw 1.",
    },
    "orphan-predict": {
      enablerText: "Predict 1.",
      payoffText: "If the top card is a unit, draw 1.",
    },
    "orphan-ramp": {
      enablerText: "Channel 1 rune exhausted.",
      payoffText: "If you control 3 or more runes, draw 1.",
    },
  };

  it.each(ORPHAN_ENGINE_RULES)(
    "penalizes $id setup without payoff and rewards a completed package",
    (rule) => {
      const fixture = engineFixtures[rule.id]!;
      const enabler = syntheticCard(`${rule.id}-enabler`, fixture.enablerText);
      const payoff = syntheticCard(`${rule.id}-payoff`, fixture.payoffText);
      const neutral = syntheticCard(`${rule.id}-neutral`);
      const incomplete = scoreDeck([
        { card: enabler, quantity: rule.minimumEnablers },
        { card: neutral, quantity: 40 - rule.minimumEnablers },
      ]);
      const complete = scoreDeck([
        { card: enabler, quantity: rule.minimumEnablers },
        { card: payoff, quantity: rule.minimumPayoffs },
        {
          card: neutral,
          quantity: 40 - rule.minimumEnablers - rule.minimumPayoffs,
        },
      ]);

      expect(incomplete.contributions).toContainEqual(
        expect.objectContaining({ id: rule.id, value: expect.any(Number) }),
      );
      expect(
        incomplete.contributions.find(({ id }) => id === rule.id)?.value,
      ).toBeLessThan(0);
      expect(complete.contributions).not.toContainEqual(
        expect.objectContaining({ id: rule.id }),
      );
      expect(complete.synergy).toBeGreaterThan(incomplete.synergy);
      expect(complete.antisynergy).toBeLessThan(incomplete.antisynergy);
    },
  );

  it("allocates exactly 12 integer runes for every non-empty subset of the six domains", () => {
    const domains = ["body", "calm", "chaos", "fury", "mind", "order"];

    for (let mask = 1; mask < 1 << domains.length; mask += 1) {
      const selected = domains.filter((_, index) => mask & (1 << index));
      const entries = selected.map((domain, index) => ({
        card: syntheticCard(`rune-${mask}-${domain}`, "", {
          domains: [domain],
          domainNames: [domain],
          power: (index % 4) + 1,
        }),
        quantity: index + 1,
      }));
      const result = scoreDeck(entries);

      expect(result.runes.reduce((sum, rune) => sum + rune.count, 0)).toBe(12);
      expect(
        result.runes.every(
          ({ count, demand, domain }) =>
            Number.isInteger(count) &&
            count >= 0 &&
            Number.isFinite(demand) &&
            demand > 0 &&
            selected.includes(domain),
        ),
      ).toBe(true);
    }
  });

  it("makes equal-demand rune allocation independent of deck-entry order", () => {
    const domains = ["body", "calm", "chaos", "fury", "mind"];
    const entries = domains.map((domain) => ({
      card: syntheticCard(`equal-${domain}`, "", {
        domains: [domain],
        domainNames: [domain],
        power: 1,
      }),
      quantity: 1,
    }));

    expect(scoreDeck(entries).runes).toEqual(
      scoreDeck([...entries].reverse()).runes,
    );
  });

  it("treats a non-finite meta adjustment as neutral instead of poisoning the score", () => {
    const result = scoreDeck(
      [{ card: syntheticCard("finite-meta"), quantity: 40 }],
      { metaAdjustment: Number.NaN },
    );

    expect(result.meta).toBe(0);
    expect(Number.isFinite(result.total)).toBe(true);
    expect(
      result.contributions.every(({ value }) => Number.isFinite(value)),
    ).toBe(true);
  });
});
