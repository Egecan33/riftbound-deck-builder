// Ported from Riftfoundry apps/web/src/lib/scoring.test.ts at origin/main 4b90179.
// 3 of 31 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { synergyAffinity } from "@/engine/network";
import { earlyPackageReliability } from "@/engine/maths/hypergeo";

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

  it("scores complementary cards above unrelated cards", () => {
    const producer = card({
      id: "producer",
      rulesText: "When you play me, buff a friendly unit.",
    });
    const payoff = card({
      id: "payoff",
      rulesText: "When you spend a buff, draw 1.",
    });
    const unrelated = card({
      id: "unrelated",
      domains: ["mind"],
      rulesText: "Deflect 1.",
    });

    expect(synergyAffinity(producer, payoff)).toBeGreaterThan(
      synergyAffinity(producer, unrelated),
    );
  });

  it("keeps early package reliability monotonic and bounded", () => {
    const oneEach = earlyPackageReliability(40, 1, 1);
    const threeEach = earlyPackageReliability(40, 3, 3);
    const sixEach = earlyPackageReliability(40, 6, 6);

    expect(oneEach).toBeGreaterThan(0);
    expect(threeEach).toBeGreaterThan(oneEach);
    expect(sixEach).toBeGreaterThan(threeEach);
    expect(sixEach).toBeLessThan(1);
    expect(earlyPackageReliability(40, 0, 6)).toBe(0);
  });

  it("scores only explicit tribal references strongly", () => {
    const bird = card({
      id: "bird",
      name: "Bird",
      tags: ["Bird", "Noxus"],
      rulesText: "Assault 1.",
    });
    const birdPayoff = card({
      id: "bird-payoff",
      name: "Bird Keeper",
      tags: ["Bird", "Noxus"],
      rulesText: "Bird units you control have +1 Might.",
    });
    const regionOnly = card({
      id: "region-only",
      name: "Region Ally",
      tags: ["Noxus"],
      domains: ["calm"],
      rulesText: "Deflect 1.",
    });

    expect(synergyAffinity(bird, birdPayoff)).toBeGreaterThan(1);
    expect(synergyAffinity(bird, regionOnly)).toBeLessThan(0.1);
  });

});
