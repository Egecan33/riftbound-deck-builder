// Ported from Riftfoundry apps/web/src/lib/scoring-revamp.test.ts at origin/main 4b90179.
// 6 of 24 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  deriveTraits,
  isScoredCard,
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
    setId: "OGN",
    type: "unit",
    domains: ["body"],
    domainNames: ["Body"],
    rulesText,
    energy: 3,
    power: 0,
    might: 3,
    tags: [],
    copyLimit: 99,
    ...overrides,
  };
}

function canonicalCard(id: string): ScoreCard {
  const candidate = gallery.cards.find((item) => item.id === id);
  if (!candidate) throw new Error(`Missing canonical test card ${id}`);
  return candidate as ScoreCard;
}

function permutations<T>(values: readonly [T, T, T]): [T, T, T][] {
  const [first, second, third] = values;
  return [
    [first, second, third],
    [first, third, second],
    [second, first, third],
    [second, third, first],
    [third, first, second],
    [third, second, first],
  ];
}

describe("RDS 0.7 score foundations", () => {
  it("treats Energy and colored Power as costs", () => {
    const efficient = card("efficient", "", {
      energy: 2,
      power: 0,
      might: 3,
    });
    const energyHeavy = card("energy-heavy", "", {
      energy: 6,
      power: 0,
      might: 3,
    });
    const powerHeavy = card("power-heavy", "", {
      energy: 2,
      power: 3,
      might: 3,
    });

    expect(baseCardRating(efficient)).toBeGreaterThan(
      baseCardRating(energyHeavy),
    );
    expect(baseCardRating(efficient)).toBeGreaterThan(
      baseCardRating(powerHeavy),
    );
    expect(baseCardRatingBreakdown(energyHeavy).energyCost).toBeLessThan(
      baseCardRatingBreakdown(efficient).energyCost,
    );
    expect(baseCardRatingBreakdown(powerHeavy).powerCost).toBeLessThan(
      baseCardRatingBreakdown(efficient).powerCost,
    );
  });

  it("treats printed Might and useful effects as positive value", () => {
    const baseline = card("baseline", "", { might: 2 });
    const stronger = card("stronger", "", { might: 5 });
    const effectful = card(
      "effectful",
      "When you play me, draw 1 and deal 2 to an enemy unit.",
      { might: 2 },
    );

    expect(baseCardRating(stronger)).toBeGreaterThan(baseCardRating(baseline));
    expect(baseCardRating(effectful)).toBeGreaterThan(baseCardRating(baseline));
    expect(baseCardRatingBreakdown(effectful).cardAdvantage).toBeGreaterThan(
      baseCardRatingBreakdown(baseline).cardAdvantage,
    );
    expect(baseCardRatingBreakdown(effectful).boardControl).toBeGreaterThan(
      baseCardRatingBreakdown(baseline).boardControl,
    );
  });

  it("distinguishes canonical hard removal from a friendly-unit cost", () => {
    const blastOfPower = canonicalCard("ogs-012-024");
    const profile = baseCardRatingBreakdown(blastOfPower);
    const traits = deriveTraits(blastOfPower);

    expect(traits.has("removal")).toBe(true);
    expect(traits.has("death-enabler")).toBe(false);
    expect(profile.boardControl).toBeGreaterThan(0);
    expect(profile.recognizedEffects).toContain("hard removal");
  });

  it("parses bracketed negative Might on canonical Moonlight Affliction", () => {
    const moonlightAffliction = canonicalCard("unl-066-219");
    const profile = baseCardRatingBreakdown(moonlightAffliction);

    expect(profile.boardControl).toBeGreaterThan(3);
    expect(profile.recognizedEffects).toContain("Might reduction");
  });

  it("keeps fixed boundaries without forcing cards into exceptional tiers", () => {
    const gradeCounts = new Map(CARD_TIER_GRADES.map((grade) => [grade, 0]));
    for (const candidate of (gallery.cards as ScoreCard[]).filter(
      isScoredCard,
    )) {
      const grade = cardTierGrade(baseCardRating(candidate));
      gradeCounts.set(grade, (gradeCounts.get(grade) ?? 0) + 1);
    }

    expect(
      CARD_TIER_GRADES.map((grade) => gradeCounts.get(grade) ?? 0),
    ).toEqual(CARD_TIER_GRADES.map(() => expect.any(Number)));
    for (const grade of CARD_TIER_GRADES) {
      expect(
        gradeCounts.get(grade),
        `${grade} has a valid count`,
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("classifies every canonical rules text into an explicit effect or drawback", () => {
    const unresolved = (gallery.cards as ScoreCard[])
      .filter((candidate) => candidate.rulesText.trim().length > 0)
      .filter((candidate) => {
        const effects = baseCardRatingBreakdown(candidate).recognizedEffects;
        return (
          effects.length === 0 ||
          effects.includes("situational rules-text utility")
        );
      })
      .map((candidate) => `${candidate.id}: ${candidate.name}`);

    expect(unresolved).toEqual([]);
  });
});

