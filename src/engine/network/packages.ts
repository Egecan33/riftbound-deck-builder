// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 581-715): PACKAGE_PAIRS and ORPHAN_ENGINE_RULES.
// Port rule (spec 8.2): behaviour unchanged.
import type { Trait } from "../mine";

export const PACKAGE_PAIRS: ReadonlyArray<{
  left: Trait;
  right: Trait;
  label: string;
}> = [
  { left: "buff-producer", right: "buff-consumer", label: "Buff engine" },
  { left: "burn-self", right: "flow", label: "Burn into Flow" },
  { left: "burn-self", right: "burn-payoff", label: "Burn rewards" },
  { left: "trash-filler", right: "trash-payoff", label: "Trash threshold" },
  { left: "trash-filler", right: "trash-retrieval", label: "Trash recursion" },
  { left: "trash-filler", right: "trash-banish", label: "Trash as fuel" },
  { left: "banish-enabler", right: "banish-payoff", label: "Banish engine" },
  { left: "discard", right: "discard-payoff", label: "Discard rewards" },
  { left: "empower", right: "empowered-payoff", label: "Empower engine" },
  { left: "hunt", right: "level", label: "XP progression" },
  { left: "hunt", right: "xp-spend", label: "XP economy" },
  { left: "gear", right: "gear-matters", label: "Gear workshop" },
  {
    left: "equipment",
    right: "equipment-matters",
    label: "Equipment package",
  },
  { left: "movement", right: "movement-payoff", label: "Move triggers" },
  { left: "hold-enabler", right: "hold-payoff", label: "Hold engine" },
  { left: "predict", right: "topdeck-payoff", label: "Top-deck certainty" },
  { left: "spell", right: "spell-matters", label: "Spellcraft package" },
  { left: "token", right: "wide", label: "Go-wide package" },
  { left: "token", right: "token-matters", label: "Token rewards" },
  { left: "death-enabler", right: "death-payoff", label: "Death engine" },
  { left: "temporary", right: "death-payoff", label: "Disposable force" },
  { left: "stun", right: "stun-payoff", label: "Stun lock" },
  {
    left: "damage-provider",
    right: "lethal-damage-conversion",
    label: "Lethal damage conversion",
  },
  {
    left: "channel-rune",
    right: "rune-count-payoff",
    label: "Rune-count acceleration",
  },
];

export const ORPHAN_ENGINE_RULES: ReadonlyArray<{
  id: string;
  enablers: Trait[];
  payoffs: Trait[];
  label: string;
  minimumEnablers: number;
  minimumPayoffs: number;
  coefficient: number;
  cap: number;
}> = [
  {
    id: "orphan-trash",
    enablers: ["trash-filler", "burn-self"],
    payoffs: ["flow", "trash-payoff", "trash-retrieval", "trash-banish"],
    label: "Trash setup without enough payoff",
    minimumEnablers: 4,
    minimumPayoffs: 2,
    coefficient: 0.46,
    cap: 5.5,
  },
  {
    id: "orphan-empower",
    enablers: ["empower"],
    payoffs: ["empowered-payoff", "disempower"],
    label: "Empower without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.42,
    cap: 4.5,
  },
  {
    id: "orphan-xp",
    enablers: ["hunt"],
    payoffs: ["level", "xp-spend"],
    label: "XP generation without enough outlet",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.42,
    cap: 4.5,
  },
  {
    id: "orphan-token",
    enablers: ["token"],
    payoffs: ["token-matters", "wide", "legion"],
    label: "Token production without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.34,
    cap: 3.8,
  },
  {
    id: "orphan-death",
    enablers: ["death-enabler", "temporary"],
    payoffs: ["death-payoff"],
    label: "Disposable units without death payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.38,
    cap: 4.2,
  },
  {
    id: "orphan-discard",
    enablers: ["discard"],
    payoffs: ["discard-payoff"],
    label: "Discard package without enough reward",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.32,
    cap: 3.5,
  },
  {
    id: "orphan-predict",
    enablers: ["predict"],
    payoffs: ["topdeck-payoff", "recycle"],
    label: "Top-deck setup without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.3,
    cap: 3.2,
  },
  {
    id: "orphan-ramp",
    enablers: ["channel-rune"],
    payoffs: ["rune-count-payoff"],
    label: "Rune channels without enough rune-count payoff",
    minimumEnablers: 3,
    minimumPayoffs: 3,
    coefficient: 0.3,
    cap: 3.5,
  },
];

