// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 2792-3110): ready / action economy valuation.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  type RuleClauseActivation,
} from "./clauses";
import {
  round,
} from "./directions";
import {
  clamp,
  finiteOr,
  writtenNumber,
} from "./text";
import {
  type ScoreCard,
} from "./types";

export interface ReadyEconomyContribution {
  activation: number;
  component: "effectValue" | "resourceValue";
  detail: string;
  label: string;
  rawValue: number;
  value: number;
}

export interface ReadyActionEconomyValuation {
  contributions: readonly ReadyEconomyContribution[];
  effectValue: number;
  resourceValue: number;
}

export function readyTargetCount(
  clause: string,
  target: "unit" | "gear" | "legend" | "rune",
): number | null {
  const targetPattern =
    target === "unit"
      ? "units?"
      : target === "gear"
        ? "(?:gear|equipment)"
        : target === "legend"
          ? "legends?"
          : "runes?";
  const match = clause.match(
    new RegExp(
      `\\bready(?:\\s+or\\s+exhaust)?\\s+(?:up to\\s+)?(?:(a|an|one|two|three|four|five|\\d+)\\s+)?(?:another\\s+)?(?:chosen\\s+|friendly\\s+|your\\s+|this\\s+)?${targetPattern}\\b`,
    ),
  );
  if (!match) return null;
  if (match[1]) return clamp(writtenNumber(match[1]), 1, 12);
  if (/\banother\b|\b(?:a|an|chosen|this)\b/.test(match[0])) return 1;
  if (target === "rune") return 4;
  if (target === "unit") return /\bunits\b/.test(match[0]) ? 3 : 1;
  if (target === "gear") return /\bgear\b/.test(match[0]) ? 2 : 1;
  return 1;
}

/**
 * Ready is action economy, but its value depends on direction and target.
 *
 * Values below are conservative standalone priors. Each contribution is
 * multiplied by the exact clause activation and choice share; deck-level
 * reuse packages provide the larger ceiling. Enemy and symmetric readying
 * never become positive controller value.
 */
export function readyActionEconomyValuation(
  card: ScoreCard,
  clauses: readonly RuleClauseActivation[],
  text: string,
): ReadyActionEconomyValuation | null {
  const contributions: ReadyEconomyContribution[] = [];
  const might = clamp(finiteOr(card.might, 0), 0, 30);

  const add = (
    clause: RuleClauseActivation,
    label: string,
    component: ReadyEconomyContribution["component"],
    rawValue: number,
    detail: string,
  ) => {
    if (rawValue <= 0) return;
    const markerFactor =
      /\[legion\]/.test(clause.text) && clause.trigger !== "conditional"
        ? 0.65
        : 1;
    const activation = clamp(
      clause.activation * clause.valueShare * markerFactor,
      0.12,
      1,
    );
    contributions.push({
      activation,
      component,
      detail,
      label,
      rawValue,
      value: rawValue * activation,
    });
  };

  for (const clause of clauses) {
    if (!/\bready\b|\breadies\b/.test(clause.text)) continue;
    const denial =
      /\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,40}\bready\b/.test(
        clause.text,
      );
    const helpsOpponent =
      /\bready(?:\s+or\s+exhaust)?\s+(?:an?\s+|the\s+|chosen\s+)?(?:enemy|opponent'?s)\b/.test(
        clause.text,
      );
    const symmetric =
      /\b(?:each|every|all) players?\b[^.!?]{0,48}\bread(?:y|ies)\b|\bready all (?:units?|gear|legends?|runes?)\b/.test(
        clause.text,
      );
    if (denial || helpsOpponent || symmetric) continue;

    const mixedMatch = clause.text.match(
      /\bready (?:up to )?(a|an|one|two|three|four|five|\d+) (?:friendly )?(?=[^.!?]*(?:units?|gear|equipment|runes?))([^.!?]*(?:and\/or|or)[^.!?]*)/,
    );
    if (
      mixedMatch &&
      new Set(
        (
          mixedMatch[0].match(/\b(?:units?|gear|equipment|runes?)\b/g) ?? []
        ).map((target) =>
          target === "gear" || target === "equipment"
            ? "gear"
            : target.replace(/s$/, ""),
        ),
      ).size >= 2
    ) {
      const count = clamp(writtenNumber(mixedMatch[1]), 1, 4);
      const total = Math.min(1.42, count * 0.34);
      add(
        clause,
        "Mixed ready action economy",
        "effectValue",
        total * 0.62,
        "A bounded share of the ready allocation converts units or Gear into another action.",
      );
      add(
        clause,
        "Mixed rune readying",
        "resourceValue",
        total * 0.38,
        "A bounded share of the flexible ready allocation recovers Rune economy.",
      );
      continue;
    }

    const readyToken = clause.text.match(
      /\bplay (?:(a|an|one|two|three|four|five|\d+)\s+)?(?:a\s+)?ready(?:\s+(\d+) \[[ms]\])? [^.!?]{0,48}\bunit tokens?\b/,
    );
    if (readyToken) {
      const quantity = clamp(writtenNumber(readyToken[1]), 1, 5);
      const tokenMight = clamp(Number(readyToken[2] ?? 0), 0, 12);
      const temporaryFactor = /\[temporary\]/.test(clause.text) ? 0.75 : 1;
      const copyBonus = /\bbecomes? a copy\b/.test(text) ? 0.1 : 0;
      add(
        clause,
        "Ready token entry tempo",
        "effectValue",
        Math.min(
          1.35,
          quantity * (0.42 + tokenMight * 0.035 + copyBonus) * temporaryFactor,
        ),
        "Ready tokens can act immediately; copied bodies receive only a small bounded conversion bonus.",
      );
      continue;
    }

    const selfEntry =
      /\b(?:i|this (?:unit|gear|legend|card)) enters? ready\b/.test(
        clause.text,
      );
    if (selfEntry) {
      add(
        clause,
        "Ready entry tempo",
        "effectValue",
        clamp(0.3 + might * 0.015, 0.3, 0.44),
        "Entering ready converts this body's printed Might into a bounded immediate action window.",
      );
      continue;
    }

    const externalEntry =
      /\b(?:the next |other )?(?:friendly )?(?:units?|tokens?) (?:you play )?(?:this turn )?enters? ready\b|\byour (?:units?|tokens?) enters? ready\b/.test(
        clause.text,
      );
    if (externalEntry) {
      const single =
        /\bthe next unit\b|\bnext time\b/.test(clause.text) ||
        /\b(?:a|one) (?:friendly )?unit\b/.test(clause.text);
      const tokenScope = /\btokens?\b/.test(clause.text);
      add(
        clause,
        tokenScope ? "Ready token entry tempo" : "Ready entry support",
        "effectValue",
        single ? 0.46 : tokenScope ? 0.5 : 0.58,
        "A future friendly body gains a bounded immediate action window instead of entering exhausted.",
      );
      continue;
    }

    if (/\bready (?:me|myself|this card)\b/.test(clause.text)) {
      add(
        clause,
        "Self-ready action",
        "effectValue",
        clamp(0.3 + might * 0.015, 0.3, 0.48),
        "Self-readying can reuse this card's action, with the larger repeat ceiling left to supported deck packages.",
      );
      continue;
    }

    const runeCount = readyTargetCount(clause.text, "rune");
    const unitCount = readyTargetCount(clause.text, "unit");
    const gearCount = readyTargetCount(clause.text, "gear");
    const legendCount = readyTargetCount(clause.text, "legend");
    if (runeCount !== null) {
      add(
        clause,
        "Rune readying",
        "resourceValue",
        Math.min(1.2, runeCount * 0.3),
        `${runeCount} Rune${runeCount === 1 ? "" : "s"} recover bounded action economy.`,
      );
    }
    if (unitCount !== null) {
      add(
        clause,
        "Unit readying",
        "effectValue",
        Math.min(1.2, 0.45 + Math.max(0, unitCount - 1) * 0.22),
        `${unitCount} unit action window${unitCount === 1 ? "" : "s"} can be recovered.`,
      );
    }
    if (gearCount !== null) {
      add(
        clause,
        "Gear readying",
        "effectValue",
        Math.min(0.82, 0.35 + Math.max(0, gearCount - 1) * 0.23),
        `${gearCount} Gear action window${gearCount === 1 ? "" : "s"} can be recovered.`,
      );
    }
    if (legendCount !== null) {
      add(
        clause,
        "Legend readying",
        "effectValue",
        0.35,
        "Legend readying recovers a bounded activated-ability window.",
      );
    }

    const hasTypedTarget =
      runeCount !== null ||
      unitCount !== null ||
      gearCount !== null ||
      legendCount !== null;
    if (
      !hasTypedTarget &&
      /\bready (?:another (?:friendly )?[a-z][a-z'-]*|something (?:else|besides me)|it|them|two of them)\b/.test(
        clause.text,
      )
    ) {
      const count = /\btwo of them\b/.test(clause.text) ? 2 : 1;
      add(
        clause,
        "Unit readying",
        "effectValue",
        Math.min(0.75, 0.45 + Math.max(0, count - 1) * 0.22),
        "A non-self friendly target receives another bounded action window.",
      );
    }
  }

  if (contributions.length === 0) return null;
  const aggregate = new Map<string, ReadyEconomyContribution>();
  for (const contribution of contributions) {
    const key = `${contribution.component}:${contribution.label}`;
    const current = aggregate.get(key);
    if (!current) {
      aggregate.set(key, contribution);
      continue;
    }
    const rawValue = current.rawValue + contribution.rawValue;
    const value = current.value + contribution.value;
    aggregate.set(key, {
      ...current,
      activation: rawValue > 0 ? value / rawValue : 0,
      rawValue,
      value,
    });
  }
  const aggregated = [...aggregate.values()];
  const effectTotal = aggregated
    .filter(({ component }) => component === "effectValue")
    .reduce((total, contribution) => total + contribution.value, 0);
  const resourceTotal = aggregated
    .filter(({ component }) => component === "resourceValue")
    .reduce((total, contribution) => total + contribution.value, 0);
  const effectScale =
    effectTotal > 2.2 && effectTotal > 0 ? 2.2 / effectTotal : 1;
  const resourceScale =
    resourceTotal > 1.5 && resourceTotal > 0 ? 1.5 / resourceTotal : 1;
  const scaled = aggregated.map((contribution) => {
    const scale =
      contribution.component === "effectValue" ? effectScale : resourceScale;
    return {
      ...contribution,
      rawValue: round(contribution.rawValue * scale, 3),
      value: round(contribution.value * scale, 3),
    };
  });

  return {
    contributions: scaled,
    effectValue: round(
      scaled
        .filter(({ component }) => component === "effectValue")
        .reduce((total, contribution) => total + contribution.value, 0),
      3,
    ),
    resourceValue: round(
      scaled
        .filter(({ component }) => component === "resourceValue")
        .reduce((total, contribution) => total + contribution.value, 0),
      3,
    ),
  };
}
