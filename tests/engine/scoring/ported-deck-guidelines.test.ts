// Ported from Riftfoundry apps/web/src/lib/deck-guidelines.test.ts at origin/main 4b90179 (all tests).
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import type { DeckEntry, ScoreCard } from "./riftfoundry";
import {
  COMMUNITY_GUIDELINE_SOURCES,
  evaluateDeckGuidelines,
  isInteractiveSpell,
} from "@/engine/scoring/ported/deck-guidelines";

function makeCard(overrides: Partial<ScoreCard> & { id: string }): ScoreCard {
  return {
    name: overrides.id,
    setId: "OGN",
    type: "unit",
    domains: ["fury"],
    domainNames: ["Fury"],
    rulesText: "",
    energy: 2,
    power: 0,
    might: 2,
    tags: [],
    copyLimit: 3,
    ...overrides,
  };
}

function catalogCard(id: string): ScoreCard {
  const card = gallery.cards.find((entry) => entry.id === id);
  if (!card) throw new Error(`Missing catalog fixture ${id}`);
  return card as ScoreCard;
}

function resultById(entries: DeckEntry[], id: string) {
  const result = evaluateDeckGuidelines(entries).find(
    (entry) => entry.id === id,
  );
  if (!result) throw new Error(`Missing guideline result ${id}`);
  return result;
}

/** 13 distinct playsets of cheap units + one spare = a fully passing shell. */
function passingDeck(): DeckEntry[] {
  const entries: DeckEntry[] = [];
  for (let index = 0; index < 7; index += 1) {
    entries.push({
      card: makeCard({ id: `unit-${index}`, energy: 2 }),
      quantity: 3,
    });
  }
  for (let index = 0; index < 4; index += 1) {
    entries.push({
      card: makeCard({ id: `mid-unit-${index}`, energy: 4 }),
      quantity: 3,
    });
  }
  for (let index = 0; index < 2; index += 1) {
    entries.push({
      card: makeCard({
        id: `answer-${index}`,
        type: "spell",
        rulesText: "Kill an enemy unit.",
        energy: 3,
      }),
      quantity: 3,
    });
  }
  entries.push({
    card: makeCard({ id: "spare-unit", energy: 1 }),
    quantity: 1,
  });
  return entries;
}

describe("community guideline sources", () => {
  it("lists the three attributed community guides", () => {
    expect(COMMUNITY_GUIDELINE_SOURCES.map((source) => source.id)).toEqual([
      "mobalytics",
      "gamertag",
      "runesandrift",
    ]);
    for (const source of COMMUNITY_GUIDELINE_SOURCES) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.label.length).toBeGreaterThan(10);
    }
  });

  it("attributes every rule to a listed source", () => {
    const sourceIds = new Set(
      COMMUNITY_GUIDELINE_SOURCES.map((source) => source.id),
    );
    for (const result of evaluateDeckGuidelines(passingDeck())) {
      expect(sourceIds.has(result.sourceId)).toBe(true);
    }
  });
});

describe("evaluateDeckGuidelines", () => {
  it("passes every rule on a well-built synthetic shell", () => {
    const results = evaluateDeckGuidelines(passingDeck());
    expect(results).toHaveLength(6);
    for (const result of results) {
      expect(result.pass).toBe(true);
      expect(result.advice).toBeNull();
    }
  });

  it("fails low-drop-units below 8 cheap units with advice", () => {
    const entries: DeckEntry[] = [
      { card: makeCard({ id: "cheap", energy: 2 }), quantity: 7 },
      { card: makeCard({ id: "big", energy: 6 }), quantity: 33 },
    ];
    const result = resultById(entries, "low-drop-units");
    expect(result.actual).toBe(7);
    expect(result.target).toBe(8);
    expect(result.pass).toBe(false);
    expect(result.advice).toMatch(/units costing 2 Energy or less/);
  });

  it("fails early-curve-units below 9 units in the 2-4 range", () => {
    const entries: DeckEntry[] = [
      { card: makeCard({ id: "one-drop", energy: 1 }), quantity: 8 },
      { card: makeCard({ id: "three-drop", energy: 3 }), quantity: 8 },
      { card: makeCard({ id: "top-end", energy: 7 }), quantity: 24 },
    ];
    const result = resultById(entries, "early-curve-units");
    expect(result.actual).toBe(8);
    expect(result.pass).toBe(false);
    expect(result.advice).toMatch(/2–4 Energy/);
  });

  it("fails unit-share below 20 units", () => {
    const entries: DeckEntry[] = [
      { card: makeCard({ id: "unit", energy: 2 }), quantity: 19 },
      {
        card: makeCard({ id: "spell", type: "spell", energy: 2 }),
        quantity: 21,
      },
    ];
    const result = resultById(entries, "unit-share");
    expect(result.actual).toBe(19);
    expect(result.pass).toBe(false);
    expect(result.advice).toMatch(/unit count/);
  });

  it("counts only interactive spells toward the 6-spell target", () => {
    const entries: DeckEntry[] = [
      {
        card: makeCard({
          id: "removal",
          type: "spell",
          rulesText: "Kill an enemy unit.",
          energy: 3,
        }),
        quantity: 5,
      },
      {
        card: makeCard({
          id: "draw",
          type: "spell",
          rulesText: "Draw 2.",
          energy: 2,
        }),
        quantity: 35,
      },
    ];
    const result = resultById(entries, "interactive-spells");
    expect(result.actual).toBe(5);
    expect(result.pass).toBe(false);
    expect(result.advice).toMatch(/opposing units or plays/);
  });

  it("fails power-pip-free below 26 pip-free cards", () => {
    const entries: DeckEntry[] = [
      { card: makeCard({ id: "free", power: 0 }), quantity: 25 },
      { card: makeCard({ id: "pipped", power: 2 }), quantity: 15 },
    ];
    const result = resultById(entries, "power-pip-free");
    expect(result.actual).toBe(25);
    expect(result.pass).toBe(false);
    expect(result.advice).toMatch(/Power pip/);
  });

  it("counts playsets by distinct name, honoring lower copy limits", () => {
    const entries: DeckEntry[] = [
      ...Array.from({ length: 9 }, (_, index) => ({
        card: makeCard({ id: `set-${index}`, energy: 2 }),
        quantity: 3,
      })),
      { card: makeCard({ id: "limited", copyLimit: 1 }), quantity: 1 },
      { card: makeCard({ id: "pair", copyLimit: 3 }), quantity: 2 },
    ];
    const result = resultById(entries, "playset-consistency");
    expect(result.actual).toBe(10);
    expect(result.pass).toBe(true);

    const short = resultById(entries.slice(0, 9), "playset-consistency");
    expect(short.actual).toBe(9);
    expect(short.pass).toBe(false);
    expect(short.advice).toMatch(/playsets/);
  });
});

describe("isInteractiveSpell on real catalog cards", () => {
  it("classifies hostile removal and burn spells as interactive", () => {
    expect(isInteractiveSpell(catalogCard("ogn-005-298"))).toBe(true); // Disintegrate
    expect(isInteractiveSpell(catalogCard("ogn-022-298"))).toBe(true); // Thermo Beam
  });

  it("keeps pure card draw out of the interactive bucket", () => {
    expect(isInteractiveSpell(catalogCard("ogn-114-298"))).toBe(false); // Progress Day
  });

  it("never classifies units as interactive spells", () => {
    expect(isInteractiveSpell(catalogCard("ogn-001-298"))).toBe(false); // Blazing Scorcher
  });
});
