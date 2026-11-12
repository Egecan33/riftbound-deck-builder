// Ported from Riftfoundry apps/web/src/lib/scoring-conditional-value.test.ts at origin/main 4b90179.
// 27 of 27 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  deriveTraits,
  type ScoreCard,
} from "@/engine/mine";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

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

function mechanicActivation(candidate: ScoreCard, label: string): number {
  const mechanic = baseCardRatingBreakdown(candidate).mechanics.find(
    (entry) => entry.label === label,
  );
  if (!mechanic) {
    throw new Error(`Missing ${label} mechanic for ${candidate.name}`);
  }
  return mechanic.activation;
}

describe("clause-aware conditional valuation", () => {
  it("keeps broad cheap interaction above unsupported conditional point payoffs", () => {
    const defy = canonicalCard("Defy");
    const ahri = canonicalCard("Ahri, Alluring");
    const yasuo = canonicalCard("Yasuo, Windrider");

    expect(baseCardRating(defy)).toBeGreaterThan(baseCardRating(ahri));
    expect(baseCardRating(defy)).toBeGreaterThan(baseCardRating(yasuo));
    expect(baseCardRatingBreakdown(defy).activationFactor).toBe(1);
    expect(baseCardRatingBreakdown(ahri).activationFactor).toBeLessThanOrEqual(
      0.35,
    );
    expect(baseCardRatingBreakdown(yasuo).activationFactor).toBeLessThan(0.3);
  });

  it("prices a broadly live one-for-one counter as a strong standalone card", () => {
    const defyScore = baseCardRating(canonicalCard("Defy"));
    const windWallScore = baseCardRating(canonicalCard("Wind Wall"));

    expect(defyScore).toBeGreaterThanOrEqual(5.49);
    expect(["S", "SS", "SSS", "SSS+"]).toContain(cardTierGrade(defyScore));
    expect(defyScore).toBeGreaterThan(windWallScore);
    expect(defyScore - windWallScore).toBeLessThan(1.5);
  });

  it("keeps unsupported scoring text below the grade earned by broad interaction", () => {
    const defyScore = baseCardRating(canonicalCard("Defy"));

    for (const payoffName of ["Ahri, Alluring", "Yasuo, Windrider"]) {
      const payoff = canonicalCard(payoffName);
      const payoffScore = baseCardRating(payoff);
      const breakdown = baseCardRatingBreakdown(payoff);

      expect(payoffScore).toBeLessThan(4.91);
      expect(defyScore - payoffScore).toBeGreaterThan(0.75);
      expect(breakdown.axes.synergyCeiling).toBeGreaterThan(
        breakdown.axes.standaloneFloor + 1,
      );
    }
  });

  it("does not grant a delayed point trigger most of its printed point value", () => {
    const plainBody = card("plain-body", "", {
      energy: 5,
      might: 4,
    });
    const holdPoint = card("hold-point", "When I hold, score 1 point.", {
      energy: 5,
      might: 4,
    });
    const thirdMovePoint = card(
      "third-move-point",
      "[Ganking]\nThe third time I move in a turn, score 1 point.",
      {
        energy: 5,
        might: 4,
        domains: ["chaos"],
        domainNames: ["Chaos"],
      },
    );
    const gankingBody = card("ganking-body", "[Ganking]", {
      energy: 5,
      might: 4,
      domains: ["chaos"],
      domainNames: ["Chaos"],
    });

    expect(baseCardRating(holdPoint) - baseCardRating(plainBody)).toBeLessThan(
      0.65,
    );
    expect(
      baseCardRating(thirdMovePoint) - baseCardRating(gankingBody),
    ).toBeLessThan(0.4);
  });

  it("treats 'turn after this' as a resolved extra turn, not a trigger word", () => {
    const timeWarp = baseCardRatingBreakdown(canonicalCard("Time Warp"));

    expect(timeWarp.activationFactor).toBe(1);
    expect(timeWarp.battlefieldControl).toBeGreaterThanOrEqual(9);
    expect(timeWarp.total).toBeGreaterThanOrEqual(3.5);
    expect(timeWarp.axes.synergyCeiling).toBeGreaterThan(
      timeWarp.axes.standaloneFloor + 0.75,
    );
    expect(timeWarp.recognizedEffects).toContain("additional turn");
  });

  it("does not let an immediate play clause promote a separate delayed payoff", () => {
    const mixed = card(
      "mixed-play-and-hold",
      "As you play me, draw 1.\nWhen I hold, score 1 point.",
    );
    const immediate = card(
      "all-immediate",
      "As you play me, draw 1 and score 1 point.",
    );
    const mixedBreakdown = baseCardRatingBreakdown(mixed);
    const immediateBreakdown = baseCardRatingBreakdown(immediate);

    expect(mixedBreakdown.cardAdvantage).toBeCloseTo(
      immediateBreakdown.cardAdvantage,
      2,
    );
    expect(mixedBreakdown.battlefieldControl).toBeLessThan(
      immediateBreakdown.battlefieldControl * 0.5,
    );
  });

  it("values separate direct-point clauses as separate reliability events", () => {
    const immediatePoint = card(
      "immediate-point-only",
      "As you play me, score 1 point.",
    );
    const holdPoint = card("hold-point-only", "When I hold, score 1 point.");
    const mixedPoint = card(
      "immediate-and-hold-points",
      "As you play me, score 1 point.\nWhen I hold, score 1 point.",
    );
    const scoringValue = (candidate: ScoreCard) =>
      baseCardRatingBreakdown(candidate).mechanics.find(
        (mechanic) =>
          mechanic.component === "battlefieldControl" &&
          ["Direct scoring", "Activated scoring"].includes(mechanic.label),
      )?.value ?? 0;

    expect(scoringValue(mixedPoint)).toBeCloseTo(
      scoringValue(immediatePoint) + scoringValue(holdPoint),
      1,
    );
  });

  it("does not charge one optional activated mode across unrelated clauses", () => {
    const cheapDraw = card("cheap-draw-mode", "[1], [T]: Draw 1.");
    const cheapDrawWithExpensiveScore = card(
      "cheap-draw-and-expensive-score",
      "[1], [T]: Draw 1.\n[4][C][C][C][C], [T]: Score 1 point.",
    );
    const cheapBreakdown = baseCardRatingBreakdown(cheapDraw);
    const mixedBreakdown = baseCardRatingBreakdown(cheapDrawWithExpensiveScore);

    expect(mixedBreakdown.cardAdvantage).toBeCloseTo(
      cheapBreakdown.cardAdvantage,
      2,
    );
    expect(
      mixedBreakdown.mechanics.find(
        (mechanic) => mechanic.label === "Activated payment",
      )?.value,
    ).toBeGreaterThan(-1.25);
    expect(mixedBreakdown.total).toBeGreaterThan(cheapBreakdown.total - 0.35);
  });

  it("charges one shared activated payment once across multiline effects", () => {
    const inline = card(
      "inline-shared-payment",
      "[3], [T]: Draw 1 and deal 2 damage to an enemy unit here.",
    );
    const multiline = card(
      "multiline-shared-payment",
      "[3], [T]:\n* Draw 1.\n* Deal 2 damage to an enemy unit here.",
    );
    const paymentValue = (candidate: ScoreCard) =>
      baseCardRatingBreakdown(candidate).mechanics.find(
        (mechanic) => mechanic.label === "Activated payment",
      )?.value;

    expect(paymentValue(multiline)).toBeCloseTo(paymentValue(inline) ?? 0, 2);
  });

  it("does not multiply one modal payment by the number of choices", () => {
    const oneChoice = card(
      "single-option-paid-mode",
      "[3], [T]: Do one of the following:\n* Draw 1.",
    );
    const threeChoices = card(
      "three-option-paid-mode",
      "[3], [T]: Do one of the following:\n* Draw 1.\n* Deal 2 damage to an enemy unit here.\n* Ready a friendly rune.",
    );
    const paymentValue = (candidate: ScoreCard) =>
      baseCardRatingBreakdown(candidate).mechanics.find(
        (mechanic) => mechanic.label === "Activated payment",
      )?.value;

    expect(paymentValue(threeChoices)).toBeCloseTo(
      paymentValue(oneChoice) ?? 0,
      2,
    );
  });

  it("discounts each additional conjunctive setup requirement", () => {
    const oneRequirement = card(
      "one-requirement",
      "If you control a unit, score 1 point.",
    );
    const threeRequirements = card(
      "three-requirements",
      "If you control a unit and a gear and a battlefield, score 1 point.",
    );
    const one = baseCardRatingBreakdown(oneRequirement);
    const three = baseCardRatingBreakdown(threeRequirements);

    expect(three.activationFactor).toBeLessThan(one.activationFactor);
    expect(three.battlefieldControl).toBeLessThan(
      one.battlefieldControl * 0.75,
    );
    expect(three.axes.deckBuildingTax).toBeGreaterThan(
      one.axes.deckBuildingTax,
    );
  });

  it("counts every arbitrary tag in an all-required-tags condition", () => {
    const oneTag = card(
      "one-future-tag",
      "When I conquer, score 1 point if your units have all of the following tags among them — Quartzling.",
    );
    const fourTags = card(
      "four-future-tags",
      "When I conquer, score 1 point if your units have all of the following tags among them — Quartzling, Nightglass, Sunmoth, and Voidpebble.",
    );
    const one = baseCardRatingBreakdown(oneTag);
    const four = baseCardRatingBreakdown(fourTags);

    expect(four.activationFactor).toBeLessThan(one.activationFactor);
    expect(four.battlefieldControl).toBeLessThan(one.battlefieldControl * 0.65);
    expect(four.axes.deckBuildingTax).toBeGreaterThan(
      one.axes.deckBuildingTax + 0.85,
    );
  });

  it("does not add every mutually exclusive modal payoff at full value", () => {
    const modal = card(
      "modal-choice",
      "When you play me, do one of the following:\n* Draw 1.\n* Deal 2 damage to an enemy unit here.",
    );
    const cumulative = card(
      "cumulative-effects",
      "When you play me, draw 1 and deal 2 damage to an enemy unit here.",
    );
    const modalBreakdown = baseCardRatingBreakdown(modal);
    const cumulativeBreakdown = baseCardRatingBreakdown(cumulative);

    expect(modalBreakdown.cardAdvantage).toBeLessThan(
      cumulativeBreakdown.cardAdvantage,
    );
    expect(modalBreakdown.boardControl).toBeLessThan(
      cumulativeBreakdown.boardControl,
    );
    expect(baseCardRating(modal)).toBeLessThan(baseCardRating(cumulative));
  });

  it.each([
    ["canonical em dash", "Choose one —"],
    ["colon", "Choose one:"],
    ["restricted canonical em dash", "Choose one you haven't already chosen —"],
  ])(
    "groups %s modal headers as bounded elective branches",
    (_label, header) => {
      const modal = card(
        `elective-${_label}`,
        `${header}\n- Draw 1.\n- Ready 2 runes.`,
      );

      expect(mechanicActivation(modal, "Card advantage")).toBe(0.625);
      expect(mechanicActivation(modal, "Resource conversion")).toBe(0.625);
    },
  );

  it("groups canonical Choose one card text instead of summing every branch", () => {
    const flurry = canonicalCard("Flurry of Feathers");

    expect(mechanicActivation(flurry, "Counterspell tempo denial")).toBe(0.563);
  });

  it("does not grant tactical-choice flexibility to contingent rune outcomes", () => {
    const elective = card(
      "elective-rune-modes",
      "When you play me, do one of the following:\n* Draw 1.\n* Deal 2 damage to an enemy unit here.\n* Ready a friendly rune.",
    );
    const contingent = card(
      "contingent-rune-modes",
      "When you play me, do one of the following based on its domain:\n* Draw 1.\n* Deal 2 damage to an enemy unit here.\n* Ready a friendly rune.",
    );
    const electiveBreakdown = baseCardRatingBreakdown(elective);
    const contingentBreakdown = baseCardRatingBreakdown(contingent);

    expect(contingentBreakdown.cardAdvantage).toBeLessThan(
      electiveBreakdown.cardAdvantage,
    );
    expect(baseCardRating(contingent)).toBeLessThan(
      baseCardRating(elective) - 0.1,
    );
  });

  it("uses exact contingent shares for Hwei-style based-on headers", () => {
    const hwei = canonicalCard("Hwei, Brooding Painter");
    const elective = {
      ...hwei,
      id: `${hwei.id}-elective`,
      name: `${hwei.name} elective`,
      rulesText: hwei.rulesText.replace(
        "Then, do the following based on the discarded card's type:",
        "Then, choose one:",
      ),
    };

    expect(mechanicActivation(hwei, "Resource conversion")).toBe(0.183);
    expect(mechanicActivation(elective, "Resource conversion")).toBe(0.275);
  });

  it("inherits a trigger onto indented or bulleted continuation effects", () => {
    const attackModes = card(
      "attack-modes",
      "When I attack, do one of the following:\n* Draw 1.\n* Deal 2 to an enemy unit here.",
    );
    const immediateModes = card(
      "immediate-modes",
      "When you play me, do one of the following:\n* Draw 1.\n* Deal 2 to an enemy unit here.",
    );
    const canonical = baseCardRatingBreakdown(
      canonicalCard("Twisted Fate, Gambler"),
    );

    expect(baseCardRatingBreakdown(attackModes).activationFactor).toBe(0.55);
    expect(baseCardRating(attackModes)).toBeLessThan(
      baseCardRating(immediateModes) - 0.35,
    );
    expect(canonical.activationFactor).toBe(0.55);
    expect(canonical.total).toBeLessThan(6.86);
  });

  it("keeps Ivern's four-tag conquer-or-hold score contextual despite its as-play choice", () => {
    const ivern = baseCardRatingBreakdown(
      canonicalCard("Ivern, Friend to All"),
    );

    expect(ivern.activationFactor).toBeLessThan(0.35);
    expect(ivern.battlefieldControl).toBeLessThan(1);
    expect(ivern.axes.standaloneFloor).toBeLessThan(ivern.axes.synergyCeiling);
    expect(ivern.axes.deckBuildingTax).toBeGreaterThan(2);
  });

  it("prices both the Hold window and four-resource activation on Power Nexus", () => {
    const nexus = baseCardRatingBreakdown(canonicalCard("Power Nexus"));

    expect(nexus.activationFactor).toBeLessThanOrEqual(0.3);
    expect(nexus.costsAndDrawbacks).toBeLessThanOrEqual(-0.35);
    expect(nexus.mechanics).toContainEqual(
      expect.objectContaining({
        label: "Activated scoring",
        component: "battlefieldControl",
        activation: expect.any(Number),
      }),
    );
    expect(
      nexus.mechanics.find((mechanic) => mechanic.label === "Activated payment")
        ?.activation,
    ).toBeLessThanOrEqual(0.3);
  });

  it("charges bracketed activated costs that appear before a colon", () => {
    const cheapActivation = card(
      "cheap-activated-score",
      "[1], [T]: Score 1 point.",
    );
    const expensiveActivation = card(
      "expensive-activated-score",
      "[4][C][C][C][C], [T]: Score 1 point.",
    );
    const renata = baseCardRatingBreakdown(
      canonicalCard("Renata Glasc, Mastermind"),
    );

    expect(expensiveActivation).toBeDefined();
    expect(baseCardRating(expensiveActivation)).toBeLessThan(
      baseCardRating(cheapActivation) - 0.75,
    );
    expect(renata.costsAndDrawbacks).toBeLessThanOrEqual(-1.2);
    expect(renata.total).toBeLessThan(5.81);
  });

  it("distinguishes an ordinary move payoff from a third-move payoff", () => {
    const ordinary = card(
      "ordinary-move-payoff",
      "When I move, score 1 point.",
      { domains: ["chaos"], domainNames: ["Chaos"] },
    );
    const third = card(
      "third-move-payoff",
      "The third time I move in a turn, score 1 point.",
      { domains: ["chaos"], domainNames: ["Chaos"] },
    );

    expect(baseCardRatingBreakdown(third).activationFactor).toBeLessThan(
      baseCardRatingBreakdown(ordinary).activationFactor,
    );
    expect(baseCardRating(third)).toBeLessThan(baseCardRating(ordinary));
  });

  it("exposes deterministic mechanic contributions and five explanatory axes", () => {
    const defy = baseCardRatingBreakdown(canonicalCard("Defy"));

    expect(defy.mechanics.length).toBeGreaterThan(0);
    expect(defy.mechanics).toContainEqual(
      expect.objectContaining({
        label: "Counterspell tempo denial",
        component: "effectValue",
        value: expect.any(Number),
        detail: expect.stringContaining("target-eligibility prior"),
      }),
    );
    expect(defy.axes).toEqual({
      standaloneFloor: expect.any(Number),
      synergyCeiling: expect.any(Number),
      interactionFlexibility: expect.any(Number),
      deckBuildingTax: expect.any(Number),
      activationReliability: expect.any(Number),
    });
    for (const value of Object.values(defy.axes)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it("prices counter breadth and restrictions continuously", () => {
    const unrestricted = card(
      "unrestricted-counter",
      "[Reaction]\nCounter a spell or ability.",
      { type: "spell", energy: 2, might: null },
    );
    const broadSpell = card(
      "broad-spell-counter",
      "[Reaction]\nCounter a spell.",
      { type: "spell", energy: 2, might: null },
    );
    const narrowSpell = card(
      "narrow-spell-counter",
      "[Reaction]\nCounter a spell that costs no more than [1] and no more than [A].",
      { type: "spell", energy: 2, might: null },
    );

    expect(baseCardRating(unrestricted)).toBeGreaterThan(
      baseCardRating(broadSpell),
    );
    expect(baseCardRating(broadSpell)).toBeGreaterThan(
      baseCardRating(narrowSpell),
    );
    expect(
      baseCardRating(unrestricted) - baseCardRating(narrowSpell),
    ).toBeLessThan(1.75);
  });

  it("counts counter timing and payment-escape restrictions exactly once", () => {
    const broad = card(
      "single-discount-broad-counter",
      "[Reaction]\nCounter a spell.",
      { type: "spell", energy: 2, might: null },
    );
    const paymentEscape = card(
      "single-discount-payment-counter",
      "[Reaction]\nCounter a spell unless its controller pays [2].",
      { type: "spell", energy: 2, might: null },
    );
    const timingWindow = card(
      "single-discount-timing-counter",
      "[Reaction]\nIf an opponent has played another spell this turn, counter a spell.",
      { type: "spell", energy: 2, might: null },
    );
    const counterMechanic = (candidate: ScoreCard) =>
      baseCardRatingBreakdown(candidate).mechanics.find(
        (mechanic) => mechanic.label === "Counterspell tempo denial",
      );
    const broadMechanic = counterMechanic(broad);
    const paymentMechanic = counterMechanic(paymentEscape);
    const timingMechanic = counterMechanic(timingWindow);

    expect(broadMechanic?.activation).toBe(1);
    expect(paymentMechanic?.activation).toBe(1);
    expect(timingMechanic?.activation).toBe(1);
    expect(
      (paymentMechanic?.value ?? 0) / (broadMechanic?.value ?? 1),
    ).toBeGreaterThan(0.66);
    expect(
      (paymentMechanic?.value ?? 0) / (broadMechanic?.value ?? 1),
    ).toBeLessThan(0.78);
    expect(
      (timingMechanic?.value ?? 0) / (broadMechanic?.value ?? 1),
    ).toBeGreaterThan(0.56);
    expect(
      (timingMechanic?.value ?? 0) / (broadMechanic?.value ?? 1),
    ).toBeLessThan(0.69);
  });

  it("tags Hold enhancers separately from the Hold payoffs they support", () => {
    const sentinel = deriveTraits(canonicalCard("Blue Sentinel"));
    const ahri = deriveTraits(canonicalCard("Ahri, Alluring"));

    expect(sentinel.has("hold-enabler")).toBe(true);
    expect(ahri.has("hold-payoff")).toBe(true);
    expect(ahri.has("hold-enabler")).toBe(false);
  });

  it("reliability-gates every conditional direct-point card in the catalog", () => {
    const conditionalPointCards = gallery.cards
      .filter((candidate) =>
        ["unit", "spell", "gear", "battlefield"].includes(candidate.type),
      )
      .map((candidate) => ({
        card: candidate,
        breakdown: baseCardRatingBreakdown(candidate as ScoreCard),
      }))
      .filter(({ breakdown }) =>
        breakdown.mechanics.some(
          (mechanic) =>
            mechanic.component === "battlefieldControl" &&
            ["Direct scoring", "Activated scoring"].includes(mechanic.label) &&
            mechanic.activation < 1,
        ),
      );

    expect(conditionalPointCards.length).toBeGreaterThanOrEqual(10);
    for (const { card: candidate, breakdown } of conditionalPointCards) {
      const scoringMechanic = breakdown.mechanics.find(
        (mechanic) =>
          mechanic.component === "battlefieldControl" &&
          ["Direct scoring", "Activated scoring"].includes(mechanic.label),
      );
      expect(
        scoringMechanic?.value,
        `${candidate.name} received too much unsupported direct-point credit`,
      ).toBeLessThanOrEqual(1.5);
      expect(
        breakdown.axes.synergyCeiling,
        `${candidate.name} should expose supported upside separately`,
      ).toBeGreaterThan(breakdown.axes.standaloneFloor);
    }
  });
});
