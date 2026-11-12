// Ported from Riftfoundry apps/web/src/lib/scoring-card-eligibility.test.ts at origin/main 4b90179.
// 5 of 7 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRating,
  baseCardRatingBreakdown,
  evaluateCandidateFit,
  foundationGradeForCard,
  isScoredCard,
  rankCandidateFits,
  scoreDeck,
  type DeckScore,
  type ScoreCard,
} from "./riftfoundry";

function canonicalCard(name: string): ScoreCard {
  const candidate = gallery.cards.find((card) => card.name === name);
  if (!candidate) throw new Error(`Missing canonical test card ${name}`);
  return candidate as ScoreCard;
}

function scoreComponents(score: DeckScore) {
  return {
    total: score.total,
    base: score.base,
    synergy: score.synergy,
    antisynergy: score.antisynergy,
    compatibility: score.compatibility,
    structure: score.structure,
    meta: score.meta,
  };
}


describe("Main Deck entry boundaries", () => {
  const mainCard = canonicalCard("Blazing Scorcher");
  const candidate = canonicalCard("First Mate");
  const legend = canonicalCard("Daughter of the Void");
  const rune = canonicalCard("Fury Rune");

  it("does not let a Legend entry complete or contribute to the 40-card deck", () => {
    const mainOnly = scoreDeck([{ card: mainCard, quantity: 39 }], { legend });
    const withLegendEntry = scoreDeck(
      [
        { card: mainCard, quantity: 39 },
        { card: legend, quantity: 1 },
      ],
      { legend },
    );

    expect(scoreComponents(withLegendEntry)).toEqual(scoreComponents(mainOnly));
    expect(withLegendEntry.cardBreakdown).toEqual(mainOnly.cardBreakdown);
    expect(withLegendEntry.cardBreakdown).not.toContainEqual(
      expect.objectContaining({ cardId: legend.id }),
    );
    expect(withLegendEntry.legality.issues).toContainEqual(
      expect.stringContaining("39/40"),
    );
    expect(withLegendEntry.legality.issues).toContainEqual(
      expect.stringContaining("Legends are external"),
    );
  });

  it("keeps Rune entries out of foundation, structure, breakdown, and rune allocation", () => {
    const mainOnly = scoreDeck([{ card: mainCard, quantity: 40 }], { legend });
    const withRuneEntry = scoreDeck(
      [
        { card: mainCard, quantity: 40 },
        { card: rune, quantity: 12 },
      ],
      { legend },
    );

    expect(scoreComponents(withRuneEntry)).toEqual(scoreComponents(mainOnly));
    expect(withRuneEntry.runes).toEqual(mainOnly.runes);
    expect(withRuneEntry.cardBreakdown).toEqual(mainOnly.cardBreakdown);
    expect(withRuneEntry.legality.issues).toContainEqual(
      expect.stringContaining("Rune Deck"),
    );
  });

  it("sanitizes existing context-only entries before candidate evaluation", () => {
    const mainEntries = [{ card: mainCard, quantity: 3 }];
    const clean = evaluateCandidateFit(mainEntries, candidate, { legend });
    const polluted = evaluateCandidateFit(
      [
        ...mainEntries,
        { card: legend, quantity: 1 },
        { card: rune, quantity: 12 },
      ],
      candidate,
      { legend },
    );

    expect(polluted.fitIndex).toBe(clean.fitIndex);
    expect(polluted.totalDelta).toBe(clean.totalDelta);
    expect(polluted.components).toEqual(clean.components);
    expect(polluted.pairAnalyses).toEqual(clean.pairAnalyses);
    expect(polluted.tripleAnalyses).toEqual(clean.tripleAnalyses);
  });

  it("excludes context-only identities from candidate recommendations", () => {
    expect(() => evaluateCandidateFit([], rune)).toThrow(
      /not a Unit, Spell, or Gear/,
    );
    expect(
      rankCandidateFits([], [rune, legend, candidate], { limit: 3 }).map(
        (fit) => fit.card.id,
      ),
    ).toEqual([candidate.id]);
  });

  it("rejects a non-Legend card supplied through the external Legend slot", () => {
    const result = scoreDeck([{ card: mainCard, quantity: 40 }], {
      legend: rune,
    });

    expect(result.legality.issues).toContain(
      "Selected Legend must be a Legend card.",
    );
  });
});
