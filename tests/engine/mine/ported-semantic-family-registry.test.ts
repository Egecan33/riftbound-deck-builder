// Ported from Riftfoundry apps/web/src/lib/scoring-semantic-family-registry.test.ts at origin/main 4b90179.
// 7 of 7 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
  deriveTraits,
  isScoredCard,
  type BaseCardRatingBreakdown,
  type BaseCardRatingComponent,
  type ScoreCard,
  type Trait,
} from "@/engine/mine";

type SemanticFamilyId =
  | "ready-action-economy"
  | "interaction-control"
  | "recursion-value"
  | "amplification-cost-xp-gear"
  | "partial-keyword-package";

interface SemanticFamilyContract {
  cards: readonly string[];
  mechanicPattern: RegExp;
  positiveComponents: readonly BaseCardRatingComponent[];
  traits: readonly Trait[];
}

interface MaskedEffectContract {
  family: SemanticFamilyId;
  mechanicPattern: RegExp;
  name: string;
  positiveComponents: readonly BaseCardRatingComponent[];
}

const POSITIVE_SEMANTIC_COMPONENTS = [
  "expectedStrength",
  "effectValue",
  "cardAdvantage",
  "boardControl",
  "battlefieldControl",
  "resourceValue",
  "flexibility",
  "roleUtility",
] as const satisfies readonly BaseCardRatingComponent[];

export const SEMANTIC_FAMILY_REGISTRY = {
  "ready-action-economy": {
    cards: [
      "Sun Disc",
      "Sona, Harmonious",
      "Pit Crew",
      "First Mate",
      "Vanguard Attendant",
      "Eager Drakehound",
      "Royal Entourage",
      "Bubble Bot",
      "Dropboarder",
      "Direwing",
      "Renata Glasc, Industrialist",
      "On the Hunt",
      "Towering Pairofant",
      "Shadow Watcher",
      "Bandle Soldier",
      "Shadow Assassin",
      "Twilight Reveler",
      "Defender of Tomorrow",
    ],
    positiveComponents: ["effectValue", "resourceValue", "boardControl"],
    mechanicPattern: /\b(?:ready|exhaust|rune)\b/i,
    traits: ["ready", "exhaust"],
  },
  "interaction-control": {
    cards: [
      "Carnivorous Snapvine",
      "Fading Memories",
      "Solari Chief",
      "Lucian, Gunslinger",
      "Strike Down",
      "Soraka, Wanderer",
      "Cataclysmic Duel",
      "Forgotten Relic",
      "Glowstone",
      "Soul's Reflection",
    ],
    positiveComponents: ["effectValue", "cardAdvantage", "boardControl"],
    mechanicPattern:
      /\b(?:combat|control|damage|debuff|kill|banish|recall|stun|temporary|might)\b/i,
    traits: [
      "interaction",
      "removal",
      "damage-provider",
      "damage-prevention",
      "stun",
      "temporary",
      "heal",
      "exhaust",
      "disempower",
    ],
  },
  "recursion-value": {
    cards: [
      "Heimerdinger, Inventor",
      "Cemetery Attendant",
      "Karthus, Eternal",
      "Annie, Stubborn",
      "Grandmaster at Arms",
      "Forge of the Fluft",
      "Cursed Sarcophagus",
      "Starhound",
    ],
    positiveComponents: ["effectValue", "cardAdvantage"],
    mechanicPattern:
      /\b(?:ability|card access|copy|death|recursion|return|trash)\b/i,
    traits: [
      "card-copy",
      "death",
      "death-payoff",
      "equip",
      "flow",
      "gear-matters",
      "trash-banish",
      "trash-payoff",
      "trash-retrieval",
    ],
  },
  "amplification-cost-xp-gear": {
    cards: [
      "Ravenborn Tome",
      "Irelia, Graceful",
      "Demacian Diplomat",
      "Vicious Snapjaws",
      "Gardens of Becoming",
      "Helm of Suppression",
      "Hextech Formula",
      "Risen Altar",
    ],
    positiveComponents: [
      "expectedStrength",
      "effectValue",
      "resourceValue",
      "boardControl",
    ],
    mechanicPattern: /\b(?:amplif|bonus damage|cost|empower|gear|tax|xp)\b/i,
    traits: [
      "buff-producer",
      "cost-reduction",
      "damage-provider",
      "disempower",
      "empower",
      "empowered-payoff",
      "energy-ramp",
      "gear-matters",
      "hunt",
      "level",
      "spell-matters",
      "xp-spend",
    ],
  },
  "partial-keyword-package": {
    cards: [
      "Stealthy Pursuer",
      "Daring Poro",
      "Petty Officer",
      "Sentinel Adept",
      "Combat Chef",
      "Veteran Poro",
      "Master Bingwen",
      "Purifier",
      "Blade Twirler",
      "Riven, Shattered",
      "Repair Specialist",
    ],
    positiveComponents: [
      "expectedStrength",
      "effectValue",
      "boardControl",
      "resourceValue",
    ],
    mechanicPattern:
      /\b(?:assault|burn|equipment|gear|movement|weaponmaster)\b/i,
    traits: [
      "assault",
      "buff-producer",
      "burn-opponent",
      "damage-provider",
      "equip",
      "gear-matters",
      "movement",
      "ready",
      "weaponmaster",
    ],
  },
} as const satisfies Record<SemanticFamilyId, SemanticFamilyContract>;

export const REVIEWED_NEGATIVE_REGISTRY = [
  "Cruel Patron",
  "Sprite",
  "Perched Grimwyrm",
  "Determined Sentry",
  "Ol' Poro",
  "Sacred Protector",
  "Legion Quartermaster",
] as const;

/**
 * These cards were outside the original 62-card zero-total partition because
 * generic Action/Reaction flexibility or role utility made their aggregate
 * nonzero. The temporary full-catalog audit nevertheless showed that their
 * printed effect itself had no valued component or mechanic ledger.
 */
export const MASKED_EFFECT_EXCEPTION_REGISTRY = [
  {
    name: "Get Excited!",
    family: "interaction-control",
    positiveComponents: ["boardControl"],
    mechanicPattern: /\b(?:damage|discarded energy)\b/i,
  },
  {
    name: "Raging Firebrand",
    family: "amplification-cost-xp-gear",
    positiveComponents: ["effectValue", "resourceValue"],
    mechanicPattern: /\b(?:cost reduction|spell discount)\b/i,
  },
  {
    name: "Reinforce",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage", "effectValue", "resourceValue"],
    mechanicPattern: /\b(?:card access|cost bypass|top-deck access)\b/i,
  },
  {
    name: "Mageseeker Warden",
    family: "interaction-control",
    positiveComponents: ["boardControl", "effectValue"],
    mechanicPattern: /\b(?:lock|play restriction|ready prevention)\b/i,
  },
  {
    name: "Mystic Reversal",
    family: "interaction-control",
    positiveComponents: ["boardControl", "effectValue"],
    mechanicPattern: /\b(?:choice redirection|spell control)\b/i,
  },
  {
    name: "Promising Future",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage", "effectValue", "resourceValue"],
    mechanicPattern: /\b(?:card access|cost bypass|play from deck)\b/i,
  },
  {
    name: "Sabotage",
    family: "interaction-control",
    positiveComponents: ["boardControl", "cardAdvantage"],
    mechanicPattern: /\b(?:hand disruption|opponent recycle)\b/i,
  },
  {
    name: "Morbid Return",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage"],
    mechanicPattern: /\b(?:recursion|trash retrieval)\b/i,
  },
  {
    name: "Stacked Deck",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage"],
    mechanicPattern: /\b(?:card advantage|draw|put into hand)\b/i,
  },
  {
    name: "Facebreaker",
    family: "interaction-control",
    positiveComponents: ["boardControl", "effectValue"],
    mechanicPattern: /\b(?:stun|showdown denial)\b/i,
  },
  {
    name: "Imperial Decree",
    family: "interaction-control",
    positiveComponents: ["boardControl", "effectValue"],
    mechanicPattern: /\b(?:lethal damage conversion|kill damaged)\b/i,
  },
  {
    name: "Divine Judgment",
    family: "interaction-control",
    positiveComponents: ["boardControl", "cardAdvantage"],
    mechanicPattern: /\b(?:board reset|mass recycle)\b/i,
  },
  {
    name: "Noxian Guillotine",
    family: "interaction-control",
    positiveComponents: ["boardControl"],
    mechanicPattern: /\b(?:delayed kill|hard removal)\b/i,
  },
  {
    name: "Last Breath",
    family: "ready-action-economy",
    positiveComponents: ["effectValue", "boardControl"],
    mechanicPattern: /\b(?:ready|might-based interaction)\b/i,
  },
  {
    name: "Guerilla Warfare",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage", "effectValue"],
    mechanicPattern: /\b(?:recursion|trash retrieval)\b/i,
  },
  {
    name: "Keeper's Verdict",
    family: "interaction-control",
    positiveComponents: ["boardControl"],
    mechanicPattern: /\b(?:deck displacement|removal)\b/i,
  },
  {
    name: "Heedless Resurrection",
    family: "recursion-value",
    positiveComponents: ["cardAdvantage", "effectValue", "resourceValue"],
    mechanicPattern: /\b(?:cost bypass|play from trash|recursion)\b/i,
  },
  {
    name: "Alpha Strike",
    family: "interaction-control",
    positiveComponents: ["boardControl", "effectValue"],
    mechanicPattern: /\b(?:might-based interaction|xp gain)\b/i,
  },
  {
    name: "Acceleration Gate",
    family: "ready-action-economy",
    positiveComponents: ["effectValue", "resourceValue"],
    mechanicPattern: /\b(?:ready|rune readying)\b/i,
  },
] as const satisfies readonly MaskedEffectContract[];

function catalogMatches(name: string): ScoreCard[] {
  return gallery.cards.filter((card) => card.name === name) as ScoreCard[];
}

function canonicalCard(name: string): ScoreCard {
  const matches = catalogMatches(name);
  if (matches.length !== 1) {
    throw new Error(
      `Expected one canonical ${name} card, found ${matches.length}`,
    );
  }
  return matches[0]!;
}

function componentValue(
  breakdown: BaseCardRatingBreakdown,
  component: BaseCardRatingComponent,
): number {
  return breakdown[component];
}

function positiveSemanticTotal(breakdown: BaseCardRatingBreakdown): number {
  return POSITIVE_SEMANTIC_COMPONENTS.reduce(
    (total, component) => total + componentValue(breakdown, component),
    0,
  );
}

function semanticSignals(
  card: ScoreCard,
  contract: Pick<
    SemanticFamilyContract,
    "mechanicPattern" | "positiveComponents" | "traits"
  >,
): {
  matchingComponents: string[];
  matchingMechanics: string[];
  matchingTraits: Trait[];
} {
  const breakdown = baseCardRatingBreakdown(card);
  const matchingComponents = contract.positiveComponents.filter(
    (component) => componentValue(breakdown, component) > 0.005,
  );
  const matchingMechanics = breakdown.mechanics
    .filter(
      (mechanic) =>
        mechanic.value > 0.005 &&
        contract.mechanicPattern.test(`${mechanic.label} ${mechanic.detail}`),
    )
    .map((mechanic) => mechanic.label);
  const traits = deriveTraits(card);
  const matchingTraits = contract.traits.filter((trait) => traits.has(trait));
  return { matchingComponents, matchingMechanics, matchingTraits };
}

function maskedEffectSignals(
  card: ScoreCard,
  contract: MaskedEffectContract,
): {
  matchingComponents: string[];
  matchingMechanics: string[];
} {
  const breakdown = baseCardRatingBreakdown(card);
  const matchingComponents = contract.positiveComponents.filter(
    (component) => componentValue(breakdown, component) > 0.005,
  );
  const matchingMechanics = breakdown.mechanics
    .filter(
      (mechanic) =>
        mechanic.value > 0.005 &&
        contract.mechanicPattern.test(`${mechanic.label} ${mechanic.detail}`),
    )
    .map((mechanic) => mechanic.label);
  return { matchingComponents, matchingMechanics };
}

const actionableEntries = Object.entries(SEMANTIC_FAMILY_REGISTRY).flatMap(
  ([family, contract]) =>
    contract.cards.map((name) => ({
      contract,
      family: family as SemanticFamilyId,
      name,
    })),
);

describe("semantic-family registry integrity", () => {
  it("keeps the reviewed family sizes and the complete 62-card audit partition", () => {
    expect(SEMANTIC_FAMILY_REGISTRY["ready-action-economy"].cards).toHaveLength(
      18,
    );
    expect(SEMANTIC_FAMILY_REGISTRY["interaction-control"].cards).toHaveLength(
      10,
    );
    expect(SEMANTIC_FAMILY_REGISTRY["recursion-value"].cards).toHaveLength(8);
    expect(
      SEMANTIC_FAMILY_REGISTRY["amplification-cost-xp-gear"].cards,
    ).toHaveLength(8);
    expect(
      SEMANTIC_FAMILY_REGISTRY["partial-keyword-package"].cards,
    ).toHaveLength(11);
    expect(actionableEntries).toHaveLength(55);
    expect(REVIEWED_NEGATIVE_REGISTRY).toHaveLength(7);
    expect(actionableEntries.length + REVIEWED_NEGATIVE_REGISTRY.length).toBe(
      62,
    );
  });

  it("contains no duplicate name across actionable and reviewed-negative cards", () => {
    const names = [
      ...actionableEntries.map(({ name }) => name),
      ...REVIEWED_NEGATIVE_REGISTRY,
    ];

    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps masked-effect exceptions unique and outside the core 62-card partition", () => {
    const coreNames = new Set<string>([
      ...actionableEntries.map(({ name }) => name),
      ...REVIEWED_NEGATIVE_REGISTRY,
    ]);
    const exceptionNames = MASKED_EFFECT_EXCEPTION_REGISTRY.map(
      ({ name }) => name,
    );

    expect(new Set(exceptionNames).size).toBe(exceptionNames.length);
    expect(exceptionNames.every((name) => !coreNames.has(name))).toBe(true);
  });

  const registeredCanonicalNames: readonly string[] = [
    ...actionableEntries.map(({ name }) => name),
    ...REVIEWED_NEGATIVE_REGISTRY,
    ...MASKED_EFFECT_EXCEPTION_REGISTRY.map(({ name }) => name),
  ];

  it.each(registeredCanonicalNames)(
    "%s is one rules-bearing, score-bearing canonical card",
    (name) => {
      const matches = catalogMatches(name);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.rulesText.trim().length).toBeGreaterThan(0);
      expect(isScoredCard(matches[0]!)).toBe(true);
    },
  );
});

describe("actionable semantic-family coverage", () => {
  it.each(actionableEntries)(
    "$family gives $name a valued component or explicit mechanic signal",
    ({ contract, family, name }) => {
      const card = canonicalCard(name);
      const signals = semanticSignals(card, contract);
      const hasValuedSignal =
        signals.matchingComponents.length > 0 ||
        signals.matchingMechanics.length > 0;

      expect(
        hasValuedSignal,
        `${name} has no valued ${family} semantic signal; components=${signals.matchingComponents.join(",") || "<none>"} mechanics=${signals.matchingMechanics.join(",") || "<none>"} supportingTraits=${signals.matchingTraits.join(",") || "<none>"}`,
      ).toBe(true);
    },
  );
});

describe("role-utility-masked effect coverage", () => {
  it.each(MASKED_EFFECT_EXCEPTION_REGISTRY)(
    "$family gives $name a valued printed-effect component or explicit mechanic",
    (contract) => {
      const signals = maskedEffectSignals(
        canonicalCard(contract.name),
        contract,
      );

      expect(
        signals.matchingComponents.length > 0 ||
          signals.matchingMechanics.length > 0,
        `${contract.name} has no valued ${contract.family} printed-effect signal; components=${signals.matchingComponents.join(",") || "<none>"} mechanics=${signals.matchingMechanics.join(",") || "<none>"}`,
      ).toBe(true);
    },
  );
});

describe("reviewed downside-only registry", () => {
  it.each(REVIEWED_NEGATIVE_REGISTRY)(
    "%s remains exempt from an artificial positive semantic value",
    (name) => {
      const breakdown = baseCardRatingBreakdown(canonicalCard(name));

      expect(positiveSemanticTotal(breakdown)).toBe(0);
      expect(breakdown.costsAndDrawbacks).toBeLessThanOrEqual(0);
    },
  );
});
