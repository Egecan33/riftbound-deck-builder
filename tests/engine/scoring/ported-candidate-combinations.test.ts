// Ported from Riftfoundry apps/web/src/lib/scoring-candidate-combinations.test.ts at origin/main 4b90179.
// 4 of 4 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import {
  analyzeCardPair,
  baseCardRating,
  evaluateCandidateFit,
  rankCandidateFits,
  type ScoreCard,
} from "./riftfoundry";

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

function analysisKeys(
  analyses: ReadonlyArray<{ cardIds: readonly string[] }>,
): string[] {
  return analyses.map((analysis) => analysis.cardIds.join(":"));
}

describe("candidate combination coverage", () => {
  it("includes a candidate with two copies of the same current identity", () => {
    const repeatedCurrent = card(
      "repeated-current",
      "Play a 1 [S] unit token. Other friendly units have +1 Might.",
    );
    const candidate = card("scoring-candidate", "Hold");

    const fit = evaluateCandidateFit(
      [{ card: repeatedCurrent, quantity: 2 }],
      candidate,
    );
    const expectedKey = [candidate.id, repeatedCurrent.id, repeatedCurrent.id]
      .sort()
      .join(":");

    expect(analysisKeys(fit.tripleAnalyses)).toContain(expectedKey);
  });

  it("includes repeated candidate pairs and every legal repeated-candidate triple", () => {
    const candidate = card("repeatable-candidate", "Hold", { copyLimit: 3 });
    const current = card(
      "repeatable-current",
      "Play a 1 [S] unit token. Other friendly units have +1 Might.",
    );

    const fit = evaluateCandidateFit(
      [
        { card: candidate, quantity: 2 },
        { card: current, quantity: 2 },
      ],
      candidate,
    );
    const pairKeys = analysisKeys(fit.pairAnalyses);
    const tripleKeys = analysisKeys(fit.tripleAnalyses);

    expect(pairKeys).toContain([candidate.id, candidate.id].sort().join(":"));
    expect(tripleKeys).toEqual(
      expect.arrayContaining(
        [
          [candidate.id, candidate.id, candidate.id],
          [candidate.id, candidate.id, current.id],
          [candidate.id, current.id, current.id],
        ].map((ids) => ids.sort().join(":")),
      ),
    );
  });

  it("aggregates split quantities and deduplicates combinations deterministically", () => {
    const repeatedCurrent = card(
      "split-current",
      "Play a 1 [S] unit token. Other friendly units have +1 Might.",
    );
    const otherCurrent = card("other-current");
    const candidate = card("split-candidate", "Hold");
    const forward = evaluateCandidateFit(
      [
        { card: repeatedCurrent, quantity: 1 },
        { card: otherCurrent, quantity: 1 },
        { card: repeatedCurrent, quantity: 1 },
      ],
      candidate,
    );
    const reverse = evaluateCandidateFit(
      [
        { card: repeatedCurrent, quantity: 1 },
        { card: otherCurrent, quantity: 1 },
        { card: repeatedCurrent, quantity: 1 },
      ].reverse(),
      candidate,
    );
    const forwardPairs = analysisKeys(forward.pairAnalyses);
    const forwardTriples = analysisKeys(forward.tripleAnalyses);

    expect(new Set(forwardPairs).size).toBe(forwardPairs.length);
    expect(new Set(forwardTriples).size).toBe(forwardTriples.length);
    expect(analysisKeys(reverse.pairAnalyses)).toEqual(forwardPairs);
    expect(analysisKeys(reverse.tripleAnalyses)).toEqual(forwardTriples);
    expect(reverse.fitIndex).toBe(forward.fitIndex);
    expect(reverse.totalDelta).toBe(forward.totalDelta);
  });

  it("does not omit a triple-only winner behind more than 48 preflight distractors", () => {
    const token = card("rank-token", "Play a 1 [S] unit token.");
    const wide = card("rank-wide", "Other friendly units have +1 Might.");
    const tripleOnly = card("rank-triple-only", "Hold", {
      name: "zzz-triple-only",
    });
    const distractors = Array.from({ length: 49 }, (_, index) =>
      card(`rank-distractor-${index.toString().padStart(2, "0")}`, "Ganking", {
        name: `aaa-distractor-${index.toString().padStart(2, "0")}`,
      }),
    );
    const entries = [
      { card: token, quantity: 1 },
      { card: wide, quantity: 1 },
    ];
    const tripleFit = evaluateCandidateFit(entries, tripleOnly);
    const distractorFit = evaluateCandidateFit(entries, distractors[0]!);

    expect(baseCardRating(tripleOnly)).toBe(baseCardRating(distractors[0]!));
    expect(analyzeCardPair(tripleOnly, token).net).toBe(
      analyzeCardPair(distractors[0]!, token).net,
    );
    expect(tripleFit.fitIndex).toBeGreaterThan(distractorFit.fitIndex);
    expect(
      rankCandidateFits(entries, [...distractors, tripleOnly], {
        excludeBanned: false,
        limit: 1,
      })[0]?.card.id,
    ).toBe(tripleOnly.id);
  });
});
