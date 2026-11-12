// Ported from Riftfoundry apps/web/src/lib/scoring-semantic-coverage.test.ts at origin/main 4b90179.
// 14 of 15 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
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

function mechanicValue(candidate: ScoreCard, label: string): number {
  const mechanic = baseCardRatingBreakdown(candidate).mechanics.find(
    (entry) => entry.label === label,
  );
  if (!mechanic) {
    throw new Error(`Missing ${label} mechanic for ${candidate.name}`);
  }
  return mechanic.value;
}

describe("semantic scoring coverage", () => {
  it("keeps Wuju Apprentice's play draw gated behind Level 6", () => {
    const wuju = canonicalCard("Wuju Apprentice");
    const unconditional = card(
      "unconditional-play-draw",
      "When you play me, draw 1.",
      {
        energy: wuju.energy,
        power: wuju.power,
        might: wuju.might,
      },
    );
    const wujuBreakdown = baseCardRatingBreakdown(wuju);
    const unconditionalBreakdown = baseCardRatingBreakdown(unconditional);

    expect(mechanicActivation(wuju, "Card advantage")).toBeCloseTo(0.48, 2);
    expect(mechanicActivation(unconditional, "Card advantage")).toBe(1);
    expect(wujuBreakdown.cardAdvantage).toBeLessThan(
      unconditionalBreakdown.cardAdvantage * 0.6,
    );
    expect(wujuBreakdown.activationFactor).toBeLessThan(1);
  });

  it("credits Rebuke's flexible unit bounce as soft enemy tempo", () => {
    const rebuke = canonicalCard("Rebuke");
    const friendlyOnly = card(
      "friendly-return-only",
      "Return a friendly unit to its owner's hand.",
      {
        type: "spell",
        might: null,
        energy: rebuke.energy,
        power: rebuke.power,
      },
    );
    const rebukeBreakdown = baseCardRatingBreakdown(rebuke);
    const friendlyBreakdown = baseCardRatingBreakdown(friendlyOnly);

    expect(rebukeBreakdown.boardControl).toBeGreaterThan(0);
    expect(rebukeBreakdown.boardControl).toBeGreaterThan(
      friendlyBreakdown.boardControl,
    );
    expect(rebukeBreakdown.recognizedEffects).toContain(
      "flexible recall tempo",
    );
    expect(rebukeBreakdown.recognizedEffects).not.toContain("hard removal");
    expect(deriveTraits(rebuke)).toContain("interaction");
  });

  it("models both sides of Star-Crossed without calling either side hard removal", () => {
    const starCrossed = canonicalCard("Star-Crossed");
    const enemyOnly = card(
      "enemy-return-only",
      "[Reaction]\nReturn an enemy unit to its owner's hand.",
      {
        type: "spell",
        might: null,
        energy: starCrossed.energy,
        power: starCrossed.power,
      },
    );
    const starBreakdown = baseCardRatingBreakdown(starCrossed);
    const enemyBreakdown = baseCardRatingBreakdown(enemyOnly);

    expect(starBreakdown.boardControl).toBeGreaterThan(0);
    expect(starBreakdown.boardControl).toBeCloseTo(
      enemyBreakdown.boardControl,
      2,
    );
    expect(starBreakdown.effectValue).toBeGreaterThan(0);
    expect(starBreakdown.costsAndDrawbacks).toBeLessThan(0);
    expect(starBreakdown.recognizedEffects).toContain(
      "friendly return protection",
    );
    expect(starBreakdown.recognizedEffects).toContain(
      "friendly return opportunity cost",
    );
    expect(starBreakdown.recognizedEffects).not.toContain("hard removal");
  });

  it("does not turn friendly-only or symmetric returns into hard removal", () => {
    const friendlyOnly = card(
      "friendly-return-negative-control",
      "Return a friendly unit to its owner's hand.",
      { type: "spell", might: null },
    );
    const symmetric = card(
      "symmetric-return-negative-control",
      "Return all units to their owners' hands.",
      { type: "spell", might: null },
    );

    for (const candidate of [friendlyOnly, symmetric]) {
      const breakdown = baseCardRatingBreakdown(candidate);
      expect(breakdown.recognizedEffects).not.toContain("hard removal");
    }
    expect(baseCardRatingBreakdown(friendlyOnly).boardControl).toBe(0);
    expect(deriveTraits(friendlyOnly)).not.toContain("removal");
  });

  it("activation-gates Leona Zealot's state-and-location dependent Might reduction", () => {
    const leona = canonicalCard("Leona, Zealot");
    const unconditional = card(
      "unconditional-location-debuff",
      "Enemy units here have -8 [S], to a minimum of 1 [S].",
      {
        energy: leona.energy,
        power: leona.power,
        might: leona.might,
      },
    );
    const leonaBreakdown = baseCardRatingBreakdown(leona);
    const unconditionalBreakdown = baseCardRatingBreakdown(unconditional);

    expect(leonaBreakdown.boardControl).toBeGreaterThan(0);
    expect(mechanicActivation(leona, "Board control")).toBeLessThan(0.6);
    expect(leonaBreakdown.boardControl).toBeLessThan(
      unconditionalBreakdown.boardControl * 0.6,
    );
    expect(leonaBreakdown.activationFactor).toBeLessThan(1);
  });

  it("does not value a friendly state-dependent Might reduction as enemy control", () => {
    const friendlyDebuff = card(
      "friendly-stunned-debuff",
      "Stunned friendly units here have -8 [S], to a minimum of 1 [S].",
    );
    const breakdown = baseCardRatingBreakdown(friendlyDebuff);

    expect(breakdown.boardControl).toBe(0);
    expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
  });

  it("does not infer lethal conversion or a hostile ping from self-damage text", () => {
    const fragile = card(
      "self-lethal-negative-control",
      "Any amount of damage dealt to me is enough to kill me.",
    );
    const selfPing = card(
      "self-ping-negative-control",
      "When you play me, deal 1 damage to me.",
    );

    expect(deriveTraits(fragile)).not.toContain("lethal-damage-conversion");
    expect(deriveTraits(selfPing)).not.toContain("damage-provider");
    expect(baseCardRatingBreakdown(fragile).recognizedEffects).not.toContain(
      "lethal damage conversion",
    );
  });

  it("values chosen Temporary as delayed control without rewarding self-Temporary", () => {
    const fadingMemories = canonicalCard("Fading Memories");
    const selfTemporary = card("self-temporary", "[Temporary]");

    expect(
      baseCardRatingBreakdown(fadingMemories).boardControl,
    ).toBeGreaterThan(0);
    expect(mechanicValue(fadingMemories, "Temporary removal")).toBeGreaterThan(
      0,
    );
    expect(baseCardRatingBreakdown(selfTemporary).boardControl).toBe(0);
    expect(
      baseCardRatingBreakdown(selfTemporary).costsAndDrawbacks,
    ).toBeLessThan(0);
  });

  it("itemizes both the control value and mandatory liability of symmetric resets", () => {
    for (const name of ["Cataclysmic Duel", "Divine Judgment"]) {
      const candidate = canonicalCard(name);
      const breakdown = baseCardRatingBreakdown(candidate);

      expect(breakdown.boardControl).toBeGreaterThan(0);
      expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
      expect(
        breakdown.mechanics.some(
          ({ component, value }) => component === "boardControl" && value > 0,
        ),
      ).toBe(true);
      expect(
        breakdown.mechanics.some(
          ({ component, value }) =>
            component === "costsAndDrawbacks" && value < 0,
        ),
      ).toBe(true);
    }
  });

  it("gives generic tagged trash retrieval explicit card-access value", () => {
    for (const name of ["Cemetery Attendant", "Annie, Stubborn", "Starhound"]) {
      const candidate = canonicalCard(name);
      const breakdown = baseCardRatingBreakdown(candidate);

      expect(breakdown.cardAdvantage).toBeGreaterThan(0);
      expect(mechanicValue(candidate, "Trash retrieval")).toBeGreaterThan(0);
    }
  });

  it("activation-gates [E] bonus-damage access without charging [E] as Power", () => {
    const ravenbornTome = canonicalCard("Ravenborn Tome");
    const unconditional = card(
      "unconditional-next-spell-damage",
      "The next spell you play this turn deals 1 Bonus Damage.",
      { type: "gear", might: null },
    );
    const tomeBreakdown = baseCardRatingBreakdown(ravenbornTome);

    expect(
      mechanicActivation(ravenbornTome, "Next-spell bonus damage"),
    ).toBeLessThan(
      mechanicActivation(unconditional, "Next-spell bonus damage"),
    );
    expect(
      mechanicValue(ravenbornTome, "Next-spell bonus damage"),
    ).toBeLessThan(mechanicValue(unconditional, "Next-spell bonus damage"));
    expect(
      tomeBreakdown.mechanics.some(
        ({ label, value }) => label === "Activated payment" && value < 0,
      ),
    ).toBe(false);
  });

  it("values an Empowered replacement tax once instead of summing both modes", () => {
    const helm = canonicalCard("Helm of Suppression");
    const breakdown = baseCardRatingBreakdown(helm);
    const tax = breakdown.mechanics.find(
      ({ label }) => label === "Spell cost tax",
    );

    expect(tax).toBeDefined();
    expect(tax!.value).toBeGreaterThan(0);
    expect(tax!.value).toBeLessThanOrEqual(0.92);
    expect(
      breakdown.mechanics.filter(({ label }) => label === "Spell cost tax"),
    ).toHaveLength(1);
  });

  it("keeps a bilateral stun's friendly action loss separate from enemy control", () => {
    const facebreaker = canonicalCard("Facebreaker");
    const breakdown = baseCardRatingBreakdown(facebreaker);

    expect(mechanicValue(facebreaker, "Bilateral stun")).toBeGreaterThan(0);
    expect(mechanicValue(facebreaker, "Friendly stun liability")).toBeLessThan(
      0,
    );
    expect(breakdown.boardControl).toBeGreaterThan(0);
    expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
  });

  it("keeps play-from-trash access positive while charging its friendly-kill cost", () => {
    const resurrection = canonicalCard("Heedless Resurrection");
    const breakdown = baseCardRatingBreakdown(resurrection);

    expect(breakdown.cardAdvantage).toBeGreaterThan(0);
    expect(
      mechanicValue(resurrection, "Play-from-trash recursion"),
    ).toBeGreaterThan(0);
    expect(breakdown.costsAndDrawbacks).toBeLessThan(0);
  });
});
