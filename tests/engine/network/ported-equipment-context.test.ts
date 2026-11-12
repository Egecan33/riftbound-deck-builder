// Ported from Riftfoundry apps/web/src/lib/scoring-equipment-context.test.ts at origin/main 4b90179.
// 1 of 18 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type DeckEntry, type ScoreCard } from "@/engine/mine";
import { analyzeCardPair } from "@/engine/network";

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

  it("does not double count Weaponmaster as two Equipment packages", () => {
    const equipmentReasons = analyzeCardPair(
      riven,
      serratedDirk,
    ).reasons.filter(({ label }) =>
      /Equipment (?:package|mastery)/.test(label),
    );

    expect(equipmentReasons).toHaveLength(1);
  });

});
