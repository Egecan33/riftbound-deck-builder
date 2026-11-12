// Ported from Riftfoundry apps/web/src/lib/scoring-semantic-coverage.test.ts at origin/main 4b90179.
// 1 of 15 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { baseCardRatingBreakdown, deriveTraits, type ScoreCard } from "@/engine/mine";
import { analyzeCardPair } from "@/engine/network";

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

  it("recognizes Elder Dragon's lethal-damage conversion and pairs it with pings", () => {
    const elderDragon = canonicalCard("Elder Dragon");
    const ping = card(
      "enemy-ping-provider",
      "When you play me, deal 1 damage to an enemy unit.",
    );
    const vanilla = card("same-body-without-ping", "");
    const breakdown = baseCardRatingBreakdown(elderDragon);
    const pingPair = analyzeCardPair(elderDragon, ping);
    const vanillaPair = analyzeCardPair(elderDragon, vanilla);

    expect(deriveTraits(elderDragon)).toContain("lethal-damage-conversion");
    expect(deriveTraits(ping)).toContain("damage-provider");
    expect(breakdown.recognizedEffects).toContain("lethal damage conversion");
    expect(pingPair.synergy).toBeGreaterThan(vanillaPair.synergy);
    expect(
      pingPair.reasons.some(
        (reason) => reason.label === "Lethal damage conversion",
      ),
    ).toBe(true);
  });

});
