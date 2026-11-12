// Ported from Riftfoundry apps/web/src/lib/scoring-final-audit.test.ts at origin/main 4b90179.
// 1 of 6 tests ported here: the ones that exercise the pair/triple network or the reliability maths without deck scoring
// (scoreDeck and candidate fit are plan Task 6; card-mine tests are in tests/engine/mine).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import { type ScoreCard } from "@/engine/mine";
import { analyzeCardPair, analyzeCardTriple } from "@/engine/network";

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

function reasonLabels(left: ScoreCard, right: ScoreCard): string[] {
  return analyzeCardPair(left, right).reasons.map((reason) => reason.label);
}

describe("final scoring audit regressions", () => {

  it("does not convert Mageseeker Warden into pair or triple Time Warp upside", () => {
    const timeWarp = canonicalCard("Time Warp");
    const warden = canonicalCard("Mageseeker Warden");
    const ramp = card("ramp", "[Add] [A].", {
      type: "spell",
      might: null,
    });

    expect(reasonLabels(timeWarp, warden)).not.toContain(
      "Extra-turn battlefield conversion",
    );
    expect(
      analyzeCardTriple(timeWarp, warden, ramp).reasons,
    ).not.toContainEqual(
      expect.objectContaining({
        label: "Accelerated extra-turn scoring engine",
        scope: "triple-motif",
      }),
    );
  });

});
