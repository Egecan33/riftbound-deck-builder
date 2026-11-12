// Ported from Riftfoundry apps/web/src/lib/scoring-effect-families.test.ts at origin/main 4b90179.
// 17 of 18 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_THRESHOLDS,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
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
    copyLimit: 3,
    ...overrides,
  };
}

const ACCELERATE =
  "[Accelerate] (You may pay [1][C] as an additional cost to have me enter ready.)";

describe("Accelerate effect-family valuation", () => {
  it("assigns identical bodies and Accelerate costs the same deterministic value", () => {
    const left = card("accelerate-equivalent-left", ACCELERATE);
    const right = card("accelerate-equivalent-right", ACCELERATE);

    expect(baseCardRatingBreakdown(left)).toEqual(
      baseCardRatingBreakdown(right),
    );
    expect(baseCardRating(left)).toBe(baseCardRating(left));
  });

  it("values the ready option above a vanilla body while keeping its net gain bounded", () => {
    const vanilla = card("accelerate-vanilla");
    const accelerated = card("accelerate-default", ACCELERATE);
    const vanillaBreakdown = baseCardRatingBreakdown(vanilla);
    const acceleratedBreakdown = baseCardRatingBreakdown(accelerated);
    const gain = acceleratedBreakdown.total - vanillaBreakdown.total;

    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(1.25);
    expect(acceleratedBreakdown.effectValue).toBeGreaterThan(
      vanillaBreakdown.effectValue,
    );
    expect(acceleratedBreakdown.costsAndDrawbacks).toBeLessThan(
      vanillaBreakdown.costsAndDrawbacks,
    );
    expect(acceleratedBreakdown.recognizedEffects).toContain(
      "Accelerate ready-tempo option",
    );
  });

  it("lowers Accelerate value as its optional Energy and colored-Power cost rises", () => {
    const affordable = card("accelerate-affordable", ACCELERATE);
    const expensive = card(
      "accelerate-expensive",
      "[Accelerate] (You may pay [3][C][C] as an additional cost to have me enter ready.)",
    );
    const affordableBreakdown = baseCardRatingBreakdown(affordable);
    const expensiveBreakdown = baseCardRatingBreakdown(expensive);

    expect(affordableBreakdown.total).toBeGreaterThan(expensiveBreakdown.total);
    expect(affordableBreakdown.effectValue).toBeGreaterThan(
      expensiveBreakdown.effectValue,
    );
    expect(affordableBreakdown.costsAndDrawbacks).toBeGreaterThan(
      expensiveBreakdown.costsAndDrawbacks,
    );
  });

  it("raises the option value when entering ready immediately converts movement into XP", () => {
    const vanilla = card("accelerate-conversion-vanilla");
    const accelerated = card("accelerate-conversion-plain", ACCELERATE);
    const xpText = "When I move to a battlefield, gain 2 XP.";
    const xpVanilla = card("accelerate-xp-vanilla", xpText);
    const xpAccelerated = card(
      "accelerate-xp-enabled",
      `${ACCELERATE}\n${xpText}`,
    );
    const plainGain = baseCardRating(accelerated) - baseCardRating(vanilla);
    const convertedGain =
      baseCardRating(xpAccelerated) - baseCardRating(xpVanilla);

    expect(convertedGain).toBeGreaterThan(plainGain);
  });

  it("raises ready-tempo value monotonically with the body it can use immediately", () => {
    const weakVanilla = card("accelerate-weak-vanilla", "", { might: 2 });
    const weakAccelerated = card("accelerate-weak", ACCELERATE, { might: 2 });
    const strongVanilla = card("accelerate-strong-vanilla", "", { might: 6 });
    const strongAccelerated = card("accelerate-strong", ACCELERATE, {
      might: 6,
    });

    expect(baseCardRating(strongAccelerated)).toBeGreaterThan(
      baseCardRating(weakAccelerated),
    );
    expect(
      baseCardRating(strongAccelerated) - baseCardRating(strongVanilla),
    ).toBeGreaterThan(
      baseCardRating(weakAccelerated) - baseCardRating(weakVanilla),
    );
  });

  it("normalizes the colored option by legal domain access", () => {
    const singleDomain = card("accelerate-single-domain", ACCELERATE);
    const dualDomain = card("accelerate-dual-domain", ACCELERATE, {
      domains: ["body", "mind"],
      domainNames: ["Body", "Mind"],
    });

    expect(baseCardRating(dualDomain)).toBeGreaterThan(
      baseCardRating(singleDomain),
    );
    expect(
      baseCardRating(dualDomain) - baseCardRating(singleDomain),
    ).toBeLessThan(0.35);
  });
});

describe("Counter and Reaction effect-family valuation", () => {
  const broadCounter = (id: string, overrides: Partial<ScoreCard> = {}) =>
    card(id, "[Reaction]\nCounter a spell.", {
      type: "spell",
      might: null,
      energy: 2,
      ...overrides,
    });

  it("assigns equal Counter effects equal values and keeps one-for-one parity neutral", () => {
    const left = baseCardRatingBreakdown(broadCounter("counter-equal-left"));
    const right = baseCardRatingBreakdown(broadCounter("counter-equal-right"));

    expect(left).toEqual(right);
    expect(left.cardAdvantage).toBe(0);
    expect(left.effectValue).toBeGreaterThan(0);
    expect(left.effectValue).toBeLessThan(3);
    expect(left.recognizedEffects).toContain("Counterspell tempo denial");
  });

  it("values Wind Wall's live one-for-one denial as C without promoting it to B", () => {
    const windWall = gallery.cards.find(
      (candidate) => candidate.name === "Wind Wall",
    ) as ScoreCard | undefined;
    if (!windWall) throw new Error("Missing canonical Wind Wall");

    const breakdown = baseCardRatingBreakdown(windWall);
    const grade = cardTierGrade(breakdown.total);

    expect(breakdown.cardAdvantage).toBe(0);
    expect(breakdown.effectValue).toBeGreaterThanOrEqual(1.3);
    expect(grade).toBe("C");
    expect(breakdown.total).toBeGreaterThanOrEqual(CARD_TIER_THRESHOLDS.C);
    expect(breakdown.total).toBeLessThan(CARD_TIER_THRESHOLDS.B);
  });

  it.each(["Riposte", "Rebuttal"])(
    "recognizes canonical referential counter wording on %s",
    (name) => {
      const candidate = gallery.cards.find((card) => card.name === name) as
        ScoreCard | undefined;
      if (!candidate) throw new Error(`Missing canonical ${name}`);

      const breakdown = baseCardRatingBreakdown(candidate);

      expect(breakdown.effectValue).toBeGreaterThan(0);
      expect(breakdown.recognizedEffects).toContain(
        "Counterspell tempo denial",
      );
    },
  );

  it("values a hard counter's decisive denial above a hand-return replacement", () => {
    const windWall = gallery.cards.find(
      (candidate) => candidate.name === "Wind Wall",
    ) as ScoreCard | undefined;
    const abandon = gallery.cards.find(
      (candidate) => candidate.name === "Abandon",
    ) as ScoreCard | undefined;
    if (!windWall || !abandon) {
      throw new Error("Missing canonical hard/soft counter fixtures");
    }

    expect(baseCardRatingBreakdown(windWall).effectValue).toBeGreaterThan(
      baseCardRatingBreakdown(abandon).effectValue,
    );
  });

  it("ranks a cheap unconditional counter above a narrow expensive ceiling", () => {
    const broad = baseCardRatingBreakdown(broadCounter("counter-broad"));
    const narrow = baseCardRatingBreakdown(
      card(
        "counter-narrow",
        "[Reaction]\nCounter a spell that costs no more than [2] and no more than [C].",
        {
          type: "spell",
          might: null,
          energy: 4,
          power: 1,
        },
      ),
    );

    expect(broad.total).toBeGreaterThan(narrow.total);
    expect(broad.effectValue).toBeGreaterThan(narrow.effectValue);
    expect(broad.reliability).toBeGreaterThan(narrow.reliability);
  });

  it("values a broader spell-or-ability target above spell-only interaction", () => {
    const spellOnly = baseCardRatingBreakdown(
      broadCounter("counter-spell-only"),
    );
    const spellOrAbility = baseCardRatingBreakdown(
      card(
        "counter-spell-or-ability",
        "[Reaction]\nCounter an enemy spell or ability.",
        { type: "spell", might: null, energy: 2 },
      ),
    );

    expect(spellOrAbility.effectValue).toBeGreaterThan(spellOnly.effectValue);
  });

  it("discounts a colored-Power ceiling independently of an Energy ceiling", () => {
    const energyOnly = baseCardRatingBreakdown(
      card(
        "counter-energy-ceiling",
        "[Reaction]\nCounter a spell that costs no more than [3].",
        { type: "spell", might: null, energy: 2 },
      ),
    );
    const energyAndPower = baseCardRatingBreakdown(
      card(
        "counter-energy-power-ceiling",
        "[Reaction]\nCounter a spell that costs no more than [3] and no more than [C].",
        { type: "spell", might: null, energy: 2 },
      ),
    );

    expect(energyOnly.effectValue).toBeGreaterThan(energyAndPower.effectValue);
    expect(energyOnly.reliability).toBeGreaterThan(energyAndPower.reliability);
  });

  it("normalizes the same counter effect by printed Energy and nonlinear Power burden", () => {
    const affordable = baseCardRatingBreakdown(
      broadCounter("counter-cost-affordable"),
    );
    const strained = baseCardRatingBreakdown(
      broadCounter("counter-cost-strained", { energy: 4, power: 2 }),
    );

    expect(affordable.effectValue).toBe(strained.effectValue);
    expect(affordable.total).toBeGreaterThan(strained.total);
    expect(affordable.powerStrain).toBeGreaterThan(strained.powerStrain);
  });

  it("lowers counter value and reliability for a narrower timing condition", () => {
    const unconditional = baseCardRatingBreakdown(
      broadCounter("counter-timing-unconditional"),
    );
    const conditional = baseCardRatingBreakdown(
      card(
        "counter-timing-conditional",
        "[Reaction]\nCounter a spell if an opponent has played another spell this turn.",
        { type: "spell", might: null, energy: 2 },
      ),
    );

    expect(unconditional.effectValue).toBeGreaterThan(conditional.effectValue);
    expect(unconditional.reliability).toBeGreaterThan(conditional.reliability);
  });

  it("treats Reaction as a real priority-window restriction rather than always-on flexibility", () => {
    const action = baseCardRatingBreakdown(
      card("timing-action", "[Action] Draw 1.", {
        type: "spell",
        might: null,
      }),
    );
    const reaction = baseCardRatingBreakdown(
      card("timing-reaction", "[Reaction] Draw 1.", {
        type: "spell",
        might: null,
      }),
    );

    expect(reaction.activationFactor).toBeLessThan(action.activationFactor);
    expect(reaction.reliability).toBeLessThan(action.reliability);
    expect(reaction.flexibility).toBeLessThanOrEqual(0.12);
  });
});

describe("Decisive opponent score denial", () => {
  it("keeps Tianna Crownguard's removable score lock in C below B", () => {
    const tianna = gallery.cards.find(
      (candidate) => candidate.name === "Tianna Crownguard",
    ) as ScoreCard | undefined;
    if (!tianna) throw new Error("Missing canonical Tianna Crownguard");

    const breakdown = baseCardRatingBreakdown(tianna);

    expect(cardTierGrade(breakdown.total)).toBe("C");
    expect(breakdown.total).toBeGreaterThanOrEqual(CARD_TIER_THRESHOLDS.C);
    expect(breakdown.total).toBeLessThan(CARD_TIER_THRESHOLDS.B);
    expect(breakdown.recognizedEffects).toContain("opponent score denial");
  });
});
