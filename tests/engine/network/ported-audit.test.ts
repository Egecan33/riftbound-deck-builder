// Ported from Riftfoundry apps/web/src/lib/scoring-audit.test.ts at origin/main 4b90179.
// 2 of 8 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { analyzeCardPair, synergyAffinity } from "@/engine/network";

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

  it("keeps all 430,128 canonical pair analyses symmetric, deterministic, finite, and explainable", () => {
    let checkedPairs = 0;
    let positivePairs = 0;
    let maximumSynergy = 0;
    let maximumAntisynergy = 0;
    const violations: string[] = [];

    for (let leftIndex = 0; leftIndex < catalog.length; leftIndex += 1) {
      const left = catalog[leftIndex]!;
      const repeated = analyzeCardPair(left, left);
      expect(repeated).toEqual(analyzeCardPair(left, left));
      expect(repeated.cardIds).toEqual([left.id, left.id]);
      expect(Number.isFinite(repeated.synergy)).toBe(true);
      expect(Number.isFinite(repeated.antisynergy)).toBe(true);
      expect(repeated.net).toBeCloseTo(
        repeated.synergy - repeated.antisynergy,
        9,
      );
      if (repeated.synergy > 0 || repeated.antisynergy > 0) {
        expect(repeated.reasons.length).toBeGreaterThan(0);
      }

      for (
        let rightIndex = leftIndex + 1;
        rightIndex < catalog.length;
        rightIndex += 1
      ) {
        const right = catalog[rightIndex]!;
        const forward = analyzeCardPair(left, right);
        const reverse = analyzeCardPair(right, left);

        checkedPairs += 1;
        if (forward.synergy > 0) positivePairs += 1;
        maximumSynergy = Math.max(maximumSynergy, forward.synergy);
        maximumAntisynergy = Math.max(maximumAntisynergy, forward.antisynergy);

        if (
          !Number.isFinite(forward.synergy) ||
          !Number.isFinite(forward.antisynergy) ||
          !Number.isFinite(forward.net) ||
          forward.synergy < 0 ||
          forward.synergy > 10 ||
          forward.antisynergy < 0 ||
          forward.antisynergy > 5 ||
          Math.abs(forward.net - (forward.synergy - forward.antisynergy)) >
            1e-9 ||
          JSON.stringify(forward) !== JSON.stringify(reverse) ||
          forward.reasons.some(
            (reason) =>
              reason.cardIds.length !== 2 ||
              !reason.cardIds.includes(left.id) ||
              !reason.cardIds.includes(right.id) ||
              !Number.isFinite(reason.value),
          )
        ) {
          violations.push(
            `${left.id}/${right.id}: ${JSON.stringify(forward)} forward, ${JSON.stringify(reverse)} reverse`,
          );
          if (violations.length >= 10) break;
        }
      }
      if (violations.length >= 10) break;
    }

    expect(checkedPairs).toBe((catalog.length * (catalog.length - 1)) / 2);
    expect(positivePairs).toBeGreaterThan(0);
    expect(maximumSynergy).toBeGreaterThan(0);
    expect(maximumAntisynergy).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  }, 120_000);

  it("covers every Legend/main-card and Battlefield/main-card matching without invalid affinities", () => {
    let legendMatches = 0;
    let battlefieldMatches = 0;

    for (const legend of legends) {
      for (const candidate of mainDeckCards) {
        const affinity = synergyAffinity(legend, candidate);
        expect(Number.isFinite(affinity)).toBe(true);
        expect(affinity).toBeGreaterThanOrEqual(0);
        expect(affinity).toBeLessThanOrEqual(8);
        legendMatches += 1;
      }
    }

    for (const battlefield of battlefields) {
      for (const candidate of mainDeckCards) {
        const affinity = synergyAffinity(battlefield, candidate);
        expect(Number.isFinite(affinity)).toBe(true);
        expect(affinity).toBeGreaterThanOrEqual(0);
        expect(affinity).toBeLessThanOrEqual(8);
        battlefieldMatches += 1;
      }
    }

    expect(legendMatches).toBe(legends.length * mainDeckCards.length);
    expect(battlefieldMatches).toBe(battlefields.length * mainDeckCards.length);
  }, 60_000);

});

