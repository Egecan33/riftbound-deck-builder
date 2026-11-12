// Ported from Riftfoundry apps/web/src/lib/scoring-final-audit.test.ts at origin/main 4b90179.
// 1 of 6 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
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
  rulesText = "",
  overrides: Partial<ScoreCard> = {},
): ScoreCard {
  return {
    id,
    name: id,
    setId: "TST",
    type: "unit",
    domains: ["mind"],
    domainNames: ["Mind"],
    rulesText,
    energy: 2,
    power: 0,
    might: 2,
    tags: [],
    copyLimit: 40,
    ...overrides,
  };
}

describe("final scoring audit regressions", () => {
  it("distinguishes self-ready, external ready, ready payoff, and ready denial", () => {
    const selfReady = card("self-ready", "When I conquer, ready me.");
    const externalReady = canonicalCard("First Mate");
    const readyPayoff = card("ready-payoff", "When I become ready, draw 1.");
    const readyDenial = canonicalCard("Mageseeker Warden");

    expect(deriveTraits(selfReady).has("ready")).toBe(true);
    expect(deriveTraits(externalReady).has("ready")).toBe(true);
    expect(deriveTraits(readyPayoff).has("ready")).toBe(true);
    expect(deriveTraits(readyDenial).has("ready")).toBe(false);
  });

});
