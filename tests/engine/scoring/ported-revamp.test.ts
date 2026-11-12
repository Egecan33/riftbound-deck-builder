// Ported from Riftfoundry apps/web/src/lib/scoring-revamp.test.ts at origin/main 4b90179.
// 13 of 24 tests: the ones that exercise scoreDeck or candidate fit (plan Task 6). The others are in tests/engine/mine and tests/engine/network.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  CARD_TIER_GRADES,
  analyzeCardPair,
  analyzeCardTriple,
  baseCardRating,
  baseCardRatingBreakdown,
  cardTierGrade,
  deriveTraits,
  earlyPackageReliability,
  evaluateCandidateFit,
  hypergeometricAtLeast,
  isConstructedBanned,
  isScoredCard,
  rankCandidateFits,
  scoreDeck,
  synergyAffinity,
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

function canonicalCard(id: string): ScoreCard {
  const candidate = gallery.cards.find((item) => item.id === id);
  if (!candidate) throw new Error(`Missing canonical test card ${id}`);
  return candidate as ScoreCard;
}

function permutations<T>(values: readonly [T, T, T]): [T, T, T][] {
  const [first, second, third] = values;
  return [
    [first, second, third],
    [first, third, second],
    [second, first, third],
    [second, third, first],
    [third, first, second],
    [third, second, first],
  ];
}

describe("RDS 0.7 score foundations", () => {




  it("scores an incomplete deck against its target size instead of granting a full-deck base", () => {
    const premium = card(
      "premium",
      "When you play me, draw 1. Deal 2 to a unit.",
    );
    const oneCopy = scoreDeck([{ card: premium, quantity: 1 }], {
      targetDeckSize: 40,
    });
    const complete = scoreDeck([{ card: premium, quantity: 40 }], {
      targetDeckSize: 40,
    });

    expect(oneCopy.base).toBeCloseTo(complete.base / 40, 1);
    expect(oneCopy.base).toBeLessThan(complete.base);
  });

  it("keeps the exact official ban snapshot bound to real canonical IDs", () => {
    const expectedMainDeck = [
      "ogn-110-298",
      "ogn-168-298",
      "ogn-177-298",
      "ogn-182-298",
      "ogn-183-298",
      "sfd-020-221",
      "sfd-122-221",
    ];
    const expectedBattlefields = [
      "ogn-276-298",
      "ogn-284-298",
      "ogn-285-298",
      "ogn-290-298",
      "ogn-292-298",
    ];

    // FORGE CHANGE: the ban list is synced data passed in (DeckScoreOptions.bannedCardIds), not a compiled
    // registry, so the registry assertions of the original are replaced by passing the expected ids.
    const bans = { bannedCardIds: new Set<string>(expectedMainDeck), bannedBattlefieldIds: new Set<string>(expectedBattlefields) };
    for (const id of [...expectedMainDeck, ...expectedBattlefields]) {
      expect(isConstructedBanned(canonicalCard(id), bans)).toBe(true);
    }

    const banned = canonicalCard("sfd-122-221");
    const result = scoreDeck([{ card: banned, quantity: 40 }], bans);

    expect(result.legality.issues).toContain(
      `${banned.name} is currently banned in Constructed.`,
    );
  });



});

describe("RDS 0.7 combination graph", () => {
  const producer = card("producer", "When you play me, buff a friendly unit.");
  const payoff = card("payoff", "While I'm buffed, I have +2 Might.");
  const neutral = card("neutral", "", {
    domains: ["mind"],
    domainNames: ["Mind"],
  });


  it("uses a second Direwing copy as the explicitly requested other Dragon", () => {
    const direwing = canonicalCard("sfd-094-221");
    const filler = card("direwing-filler");
    const pair = analyzeCardPair(direwing, direwing);
    const result = scoreDeck(
      [
        { card: direwing, quantity: 2 },
        { card: filler, quantity: 38 },
      ],
      { combinationDepth: "pair" },
    );

    expect(pair.synergy).toBeGreaterThan(0);
    expect(pair.reasons).toContainEqual(
      expect.objectContaining({
        kind: "synergy",
        label: "Dragon rules-text package",
        cardIds: [direwing.id, direwing.id],
      }),
    );
    expect(result.contributions).toContainEqual(
      expect.objectContaining({
        id: `pair-${direwing.id}-${direwing.id}`,
        value: expect.any(Number),
      }),
    );
  });


  it("adds a reliable closed triple motif to the deck ledger", () => {
    const timeWarp = canonicalCard("ogn-122-298");
    const holdPayoff = canonicalCard("ogn-066-298");
    const ramp = canonicalCard("ogn-031-298");
    const filler = card("triple-ledger-filler");
    const entries = [
      { card: timeWarp, quantity: 3 },
      { card: holdPayoff, quantity: 3 },
      { card: ramp, quantity: 3 },
      { card: filler, quantity: 31 },
    ];
    const pairOnly = scoreDeck(entries, { combinationDepth: "pair" });
    const full = scoreDeck(entries, { combinationDepth: "full" });

    expect(full.synergy).toBeGreaterThan(pairOnly.synergy);
    expect(
      full.contributions.some(
        (contribution) =>
          contribution.id.startsWith("triple-") &&
          contribution.cards?.includes(timeWarp.name),
      ),
    ).toBe(true);
  });

  it("enumerates quantity-permitted repeated identities in triple motifs", () => {
    const repeatedSetup = card(
      "repeated-token-setup",
      "Play a 1 [S] unit token. Tokens you control and other friendly units have +1 Might.",
    );
    const scoringPayoff = card(
      "repeated-scoring-payoff",
      "When you conquer, score 1.",
    );
    const filler = card("repeated-triple-filler");
    const entries = [
      { card: repeatedSetup, quantity: 6 },
      { card: scoringPayoff, quantity: 6 },
      { card: filler, quantity: 28 },
    ];
    const pairOnly = scoreDeck(entries, { combinationDepth: "pair" });
    const full = scoreDeck(entries, { combinationDepth: "full" });

    expect(full.synergy).toBeGreaterThan(pairOnly.synergy);
    const repeatedTripleId = [
      repeatedSetup.id,
      repeatedSetup.id,
      scoringPayoff.id,
    ]
      .sort()
      .join("-");
    expect(full.contributions).toContainEqual(
      expect.objectContaining({
        id: `triple-${repeatedTripleId}`,
        value: expect.any(Number),
      }),
    );
  });

  it("integrates a slow triple motif as signed deck antisynergy", () => {
    const slowOne = card("slow-triple-one", "", { energy: 6 });
    const slowTwo = card("slow-triple-two", "", { energy: 7 });
    const slowThree = card("slow-triple-three", "", { energy: 8 });
    const filler = card("slow-triple-filler");
    const entries = [
      { card: slowOne, quantity: 6 },
      { card: slowTwo, quantity: 6 },
      { card: slowThree, quantity: 6 },
      { card: filler, quantity: 22 },
    ];
    const pairOnly = scoreDeck(entries, { combinationDepth: "pair" });
    const full = scoreDeck(entries, { combinationDepth: "full" });

    expect(full.antisynergy).toBeGreaterThan(pairOnly.antisynergy);
    const contribution = full.contributions.find(
      (candidate) => candidate.label === "Slow three-card package",
    );
    expect(contribution?.value).toBeLessThan(0);
  });


});

describe("RDS 0.7 explainability and fit", () => {
  const producer = card(
    "fit-producer",
    "When you play me, buff a friendly unit.",
  );
  const payoff = card("fit-payoff", "While I'm buffed, I have +2 Might.");
  const neutral = card("fit-neutral");

  it("uses the Standard four-card opener consistently in package probabilities", () => {
    const entries = [
      { card: producer, quantity: 3 },
      { card: payoff, quantity: 3 },
      { card: neutral, quantity: 34 },
    ];
    const defaultScore = scoreDeck(entries);
    const explicitStandard = scoreDeck(entries, {
      openingHand: 4,
      earlyDraws: 3,
    });
    const widerWindow = scoreDeck(entries, {
      openingHand: 6,
      earlyDraws: 3,
    });

    expect(earlyPackageReliability(40, 3, 3)).toBe(
      earlyPackageReliability(40, 3, 3, 0, 4, 3),
    );
    expect(defaultScore.synergy).toBe(explicitStandard.synergy);
    expect(defaultScore.synergy).toBeLessThan(widerWindow.synergy);
    expect(
      defaultScore.contributions.find(
        (contribution) =>
          contribution.id === "package-buff-producer-buff-consumer",
      )?.detail,
    ).toContain("4-card opener plus 3 early draws");
  });

  it("returns a reconciled card-by-card table for every selected identity", () => {
    const result = scoreDeck([
      { card: producer, quantity: 12 },
      { card: payoff, quantity: 12 },
      { card: neutral, quantity: 16 },
    ]);
    const sum = (
      key:
        | "base"
        | "synergy"
        | "antisynergy"
        | "compatibility"
        | "structure"
        | "meta",
    ) => result.cardBreakdown.reduce((total, row) => total + row[key], 0);

    expect(result.cardBreakdown).toHaveLength(3);
    expect(sum("base")).toBeCloseTo(result.base, 6);
    expect(sum("synergy")).toBeCloseTo(result.synergy, 6);
    expect(sum("antisynergy")).toBeCloseTo(result.antisynergy, 6);
    expect(sum("compatibility")).toBeCloseTo(result.compatibility, 6);
    expect(sum("structure")).toBeCloseTo(result.structure, 6);
    expect(sum("meta")).toBeCloseTo(result.meta, 6);
    expect(
      result.cardBreakdown.every((row) => CARD_TIER_GRADES.includes(row.grade)),
    ).toBe(true);
    expect(
      result.cardBreakdown
        .find((row) => row.cardId === producer.id)
        ?.partners.some((partner) => partner.cardId === payoff.id),
    ).toBe(true);
  });

  it("apportions the zero floor so clamped card-row totals reconcile", () => {
    const strained = card("floor-strained", "If you hold, draw 1.", {
      type: "spell",
      energy: 20,
      power: 12,
      might: null,
      domains: ["body", "calm", "chaos"],
      domainNames: ["Body", "Calm", "Chaos"],
    });
    const result = scoreDeck([{ card: strained, quantity: 40 }], {
      metaAdjustment: -5,
    });
    const rowTotal = result.cardBreakdown.reduce(
      (sum, row) => sum + row.total,
      0,
    );
    const floorAdjustment = result.cardBreakdown.reduce(
      (sum, row) => sum + row.floorAdjustment,
      0,
    );

    expect(result.total).toBe(0);
    expect(rowTotal).toBeCloseTo(result.total, 6);
    expect(floorAdjustment).toBeGreaterThan(0);
    expect(result.contributions).toContainEqual(
      expect.objectContaining({
        id: "score-floor",
        value: floorAdjustment,
      }),
    );
  });

  it("ranks candidates by actual add-one deck delta with a component decomposition", () => {
    const entries = [
      { card: producer, quantity: 3 },
      { card: neutral, quantity: 10 },
    ];
    const complementary = evaluateCandidateFit(entries, payoff);
    const unrelated = evaluateCandidateFit(
      entries,
      card("fit-unrelated", "", {
        domains: ["mind"],
        domainNames: ["Mind"],
      }),
    );

    expect(complementary.components.synergy).toBeGreaterThan(
      unrelated.components.synergy,
    );
    expect(complementary.totalDelta).toBeGreaterThan(unrelated.totalDelta);
    expect(complementary.after.total - complementary.before.total).toBeCloseTo(
      complementary.totalDelta,
      6,
    );
  });

  it("supports owned, not-owned, and all candidate pools deterministically", () => {
    const missing = card("missing-candidate");
    const owned = card("owned-candidate");
    const candidates = [missing, owned];
    const collection = { [owned.id]: 1 };

    expect(
      rankCandidateFits([], candidates, {
        collection,
        ownership: "owned",
      }).map(({ card }) => card.id),
    ).toEqual([owned.id]);
    expect(
      rankCandidateFits([], candidates, {
        collection,
        ownership: "not-owned",
      }).map(({ card }) => card.id),
    ).toEqual([missing.id]);
    expect(
      rankCandidateFits([], candidates, {
        collection,
        ownership: "all",
      }),
    ).toHaveLength(2);
  });

  it("treats ownership as a hard available-copy constraint", () => {
    const owned = card("one-owned-copy", "", { copyLimit: 3 });
    const missing = card("zero-owned-copies", "", { copyLimit: 3 });
    const selectedEntries = [{ card: owned, quantity: 1 }];
    const candidates = [owned, missing];
    const collection = { [owned.id]: 1, [missing.id]: 0 };

    expect(
      rankCandidateFits(selectedEntries, candidates, {
        collection,
        ownership: "owned",
      }),
    ).toEqual([]);
    expect(
      rankCandidateFits(selectedEntries, candidates, {
        collection,
        ownership: "not-owned",
      }).map(({ card: candidate }) => candidate.id),
    ).toEqual(["one-owned-copy", "zero-owned-copies"]);
  });

  it("prioritizes an underfilled early curve slot over another saturated mid-cost card", () => {
    const midDeckCard = card("mid-deck", "", {
      energy: 4,
      might: 4,
      copyLimit: 99,
    });
    const earlyCandidate = card("early-repair", "", {
      energy: 2,
      might: 2,
    });
    const midCandidate = card("more-mid", "", {
      energy: 4,
      might: 4,
    });
    const entries = [{ card: midDeckCard, quantity: 20 }];
    const earlyFit = evaluateCandidateFit(entries, earlyCandidate);
    const midFit = evaluateCandidateFit(entries, midCandidate);
    const ranked = rankCandidateFits(entries, [midCandidate, earlyCandidate], {
      limit: 2,
    });

    expect(earlyFit.components.curve).toBeGreaterThan(midFit.components.curve);
    expect(ranked[0]?.card.id).toBe(earlyCandidate.id);
    expect(ranked[0]?.fitReasons).toContain("Repairs the early curve slot");
  });
});
