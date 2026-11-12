// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 716-1355): shared helpers and the direction parsers (who an effect points at).
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  clamp,
  sumCapturedNumbers,
  tokenBoardValue,
  writtenNumber,
} from "./text";

export function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

export const RULE_ANALYSIS_CACHE_LIMIT = 4096;
export const controllerInstructionPatternCache = new Map<string, RegExp>();

export function rememberRuleAnalysis<T>(
  cache: Map<string, T>,
  text: string,
  value: T,
): T {
  if (cache.size >= RULE_ANALYSIS_CACHE_LIMIT) cache.clear();
  cache.set(text, value);
  return value;
}

/**
 * Finds instructions performed by the card's controller. Trigger conditions
 * such as "When you discard..." do not start at an instruction boundary,
 * while effects following that trigger ("..., discard 1") do. Keeping this
 * parser small and clause-based avoids treating actors, targets, and trigger
 * references as interchangeable keyword hits.
 */
export function controllerInstructionClauses(
  text: string,
  verbSource: string,
  includeAnd = false,
): string[] {
  const sequentialBoundary = includeAnd
    ? String.raw`\b(?:then|and)\s+`
    : String.raw`\bthen\s+`;
  const patternKey = `${verbSource}:${includeAnd ? "and" : "then"}`;
  let pattern = controllerInstructionPatternCache.get(patternKey);
  if (!pattern) {
    pattern = new RegExp(
      // Forge fix (not in the port): a modal option's bullet ("- Deal 4 to a unit in a base.", "* Ready
      // me.") may stand between the sentence boundary and the instruction. Without it no bulleted
      // instruction was read (found by the GameLab script comparison, scripts/mine-gamelab.ts).
      String.raw`(?:^|[.!?;:—]\s*(?:[-*•]\s+)?|\]\s*|,\s*|${sequentialBoundary})(?:you\s+(?:may\s+)?)?(${verbSource})\b([^.!?;]*)`,
      "g",
    );
    controllerInstructionPatternCache.set(patternKey, pattern);
  }
  pattern.lastIndex = 0;
  const clauses: string[] = [];
  for (const match of text.matchAll(pattern)) {
    clauses.push(`${match[1] ?? ""}${match[2] ?? ""}`.trim());
  }
  return clauses;
}

export function instructionAmount(clause: string, verb: string, fallback = 1): number {
  const match = clause.match(
    new RegExp(
      String.raw`\b${verb}\s+(?:up to\s+)?(\d+|a|an|one|two|three|four|five)\b`,
    ),
  );
  if (match) return clamp(writtenNumber(match[1]), 1, 12);
  if (
    new RegExp(String.raw`\b${verb}\s+(?:your|their)\s+hand\b`).test(clause)
  ) {
    return 2;
  }
  if (new RegExp(String.raw`\b${verb}\s+(?:this|that)\b`).test(clause)) {
    return 1;
  }
  return fallback;
}

export interface DiscardDirection {
  selfAmount: number;
  opponentAmount: number;
  symmetric: boolean;
  payoff: boolean;
}

export const discardDirectionCache = new Map<string, DiscardDirection>();

export function discardDirection(text: string): DiscardDirection {
  const cached = discardDirectionCache.get(text);
  if (cached) return cached;
  const selfAmount = controllerInstructionClauses(text, "discard").reduce(
    (total, clause) => total + instructionAmount(clause, "discard"),
    0,
  );
  let opponentAmount = 0;
  for (const match of text.matchAll(
    /\b(?:an? opponent|each opponent|opponents?|they)\s+(?:may\s+)?discards?\s+(?:(\d+|a|an|one|two|three|four|five)\b|that card\b|their hand\b)/g,
  )) {
    const instruction = match[0] ?? "";
    opponentAmount += /\btheir hand\b/.test(instruction)
      ? 2
      : writtenNumber(match[1]);
  }

  return rememberRuleAnalysis(discardDirectionCache, text, {
    selfAmount,
    opponentAmount,
    symmetric:
      /\beach player discards?\b|\byou and each opponent discard\b/.test(text),
    payoff:
      /\bwhen you discard\b|\bif you(?:'ve| have) discarded\b|\bwhen (?:one or more|a) cards? (?:is|are) discarded\b|\bwhen (?:this|me|i) (?:is|am) discarded\b|\bwhen\b[^.!?]{0,64}\b(?:this|me)\b[^.!?]{0,32}\bdiscarded\b|\bfor each cards? (?:you )?discarded\b|\bcards? (?:you )?discarded this turn\b/.test(
        text,
      ),
  });
}

export interface RemovalDirection {
  killCount: number;
  banishCount: number;
  friendlyKillCount: number;
  handDisruptionCount: number;
  banishEnabler: boolean;
  banishPayoff: boolean;
  trashBanish: boolean;
  deathPayoff: boolean;
}

export const removalDirectionCache = new Map<string, RemovalDirection>();

export interface GearInteractionDirection {
  friendlySupport: boolean;
  hostileOrSymmetric: boolean;
}

export const gearInteractionDirectionCache = new Map<
  string,
  GearInteractionDirection
>();

/**
 * Merely naming Gear is not a friendly Gear payoff. Board wipes, enemy Gear
 * removal, and symmetric sacrifice effects are interaction; only text that
 * consumes, rewards, recurs, or otherwise operates on the controller's Gear
 * supplies the Gear-workshop role.
 */
export function gearInteractionDirection(text: string): GearInteractionDirection {
  const cached = gearInteractionDirectionCache.get(text);
  if (cached) return cached;

  const friendlySupport =
    /\bwhen you play (?:a |an |another |the |non-token )*gear\b|\bwhen you (?:attach|activate|use) (?:a |an |the )*(?:gear|equipment)\b|\bfor each (?:friendly )?(?:gear|equipment)(?: you control)?\b|\b(?:gear|equipment) you control\b|\byour (?:non-token )*(?:gear|equipment)\b|\beach equipment in your hand\b|\bequipped (?:friendly )?unit\b|\b(?:gear|equipment) from your (?:trash|hand|main deck)\b|\bif (?:it|the top card) (?:is|was) a gear\b|\byou control (?:\d+|two|three|four|five|seven) or more (?:other )?gear\b|\b(?:kill|return|ready|exhaust|attach|detach|empower|disempower)\b[^.!?]{0,40}\bfriendly\b[^.!?]{0,24}\b(?:gear|equipment)\b/.test(
      text,
    );
  const hostileOrSymmetric =
    /\bkill all gear\b|\beach player\b[^.!?]{0,48}\bgear\b|\b(?:enemy|opponent'?s) gear\b|\bopponents? plays? a gear\b|\breturn all\b[^.!?]{0,32}\bgear\b|\b(?:kill|banish|return|give) (?:a|an|all) gear\b/.test(
      text,
    );

  return rememberRuleAnalysis(gearInteractionDirectionCache, text, {
    friendlySupport,
    hostileOrSymmetric,
  });
}

export function removalDirection(text: string): RemovalDirection {
  const cached = removalDirectionCache.get(text);
  if (cached) return cached;
  let killCount = 0;
  let banishCount = 0;
  let friendlyKillCount = 0;
  let banishEnabler = false;
  let trashBanish = false;

  for (const clause of controllerInstructionClauses(text, "kill|banish")) {
    const verb = clause.startsWith("kill") ? "kill" : "banish";
    const enemyTarget = /\b(?:enemy|opponent'?s|attacking)\b/.test(clause);
    const friendlyTarget =
      !enemyTarget &&
      /\b(?:me|myself|this|friendly|your|you control|of your)\b/.test(clause);
    const selfCleanup =
      verb === "banish" && /\bbanish (?:me|this)\b/.test(clause);
    const sourceZone =
      /\bfrom (?:your |the )?(?:trash|hand|main deck)\b|\bfrom among\b|\bamong (?:them|those cards)\b/.test(
        clause,
      );
    const transient =
      /\bthen (?:play|return|put) (?:it|them|that card|those cards)\b|\bplay (?:it|them) [^.!?]{0,24}\bignoring\b/.test(
        clause,
      );
    const boardObject = /\b(?:units?|gear)\b/.test(clause);
    const genericBoardTarget =
      boardObject && !friendlyTarget && !sourceZone && !transient;

    // Target breadth is a mechanical restriction, not unrestricted unit removal.
    const gearOnly = /\bgear\b/.test(clause) && !/\bunits?\b/.test(clause);
    const costLimit = clause.match(
      /\b(?:energy cost|costs?|might)\s+(?:of\s+)?(?:no more than|at most|up to)\s*\[?(\d+)\]?/,
    );
    const scopeWeight =
      (gearOnly ? 0.6 : 1) *
      (costLimit ? Math.min(0.9, 0.25 + Number(costLimit[1]) * 0.13) : 1);
    if (verb === "kill") {
      if (friendlyTarget) friendlyKillCount += 1;
      if (enemyTarget || genericBoardTarget) killCount += scopeWeight;
    } else {
      if (enemyTarget || genericBoardTarget) banishCount += scopeWeight;
      if (
        !selfCleanup &&
        !transient &&
        (enemyTarget ||
          genericBoardTarget ||
          sourceZone ||
          /\b(?:cards?|it|them)\b/.test(clause))
      ) {
        banishEnabler = true;
      }
      if (!transient && /\bfrom (?:your |the )?trash\b/.test(clause)) {
        trashBanish = true;
      }
    }
  }

  const enemyReplacement =
    /\b(?:enemy|opponent'?s) unit\b[^.!?]{0,48}\bwould die\b[^.!?]{0,48}\bbanish (?:it|them) instead\b/.test(
      text,
    );
  if (enemyReplacement) {
    banishCount += 1;
    banishEnabler = true;
  }
  const handDisruptionCount =
    /\b(?:choose|chosen)\b[^]{0,64}\bopponent\b[^]{0,128}\breveal\b[^]{0,128}\bchoose a card\b[^]{0,64}\bbanish it\b|\bbanish\b[^.!?]{0,48}\bfrom (?:an? |the )?opponent'?s hand\b/.test(
      text,
    )
      ? 1
      : 0;
  if (handDisruptionCount > 0) banishEnabler = true;

  return rememberRuleAnalysis(removalDirectionCache, text, {
    killCount,
    banishCount,
    friendlyKillCount,
    handDisruptionCount,
    banishEnabler,
    banishPayoff:
      /\bwhen you banish\b|\bwhenever\b[^.!?]{0,48}\byou banish\b|\bfor each banished\b|\bwhen (?:a|one or more) cards? (?:is|are) banished\b/.test(
        text,
      ),
    trashBanish,
    deathPayoff:
      /\[deathknell\]|\bwhen\b[^,.!?]{0,48}\b(?:you kill|dies?|died|is killed)\b|\bwhenever\b[^,.!?]{0,48}\b(?:dies?|died|is killed)\b|\bif\b[^,.!?]{0,48}\bkills?\b|\bfor each\b[^,.!?]{0,48}\b(?:died|in your trash)\b/.test(
        text,
      ),
  });
}

export interface DamageDirection {
  hostileAmount: number;
  friendlyAmount: number;
}

export const damageDirectionCache = new Map<string, DamageDirection>();

export function damageDirection(text: string): DamageDirection {
  const cached = damageDirectionCache.get(text);
  if (cached) return cached;
  let hostileAmount = 0;
  let friendlyAmount = 0;
  let previousHostile = 0;
  let previousFriendly = 0;
  for (const clause of controllerInstructionClauses(text, "deal", true)) {
    const effect = clause.split(/\bthen\b/, 1)[0] ?? clause;
    const amount = instructionAmount(effect, "deal", 0);
    if (amount <= 0) continue;
    const enemyTarget = /\b(?:enemy|opponent'?s)\b/.test(effect);
    const friendlyTarget =
      !enemyTarget &&
      /\b(?:me|myself|friendly|your|you control)\b/.test(effect);
    const symmetricTarget =
      !enemyTarget && !friendlyTarget && /\ball units\b/.test(effect);

    // "Deal N instead" replaces the preceding instruction. Half of the
    // incremental ceiling is a conservative prior for an unmeasured condition.
    // Independent instructions still add, including split-target damage.
    const replacement = /\binstead\b/.test(effect);
    if (enemyTarget || !friendlyTarget) {
      hostileAmount +=
        replacement && previousHostile > 0
          ? (amount - previousHostile) * 0.5
          : amount;
      previousHostile = amount;
    }
    if (friendlyTarget || symmetricTarget) {
      friendlyAmount +=
        replacement && previousFriendly > 0
          ? (amount - previousFriendly) * 0.5
          : amount;
      previousFriendly = amount;
    }
  }
  return rememberRuleAnalysis(damageDirectionCache, text, {
    hostileAmount,
    friendlyAmount,
  });
}

export interface ReturnDirection {
  enemyCount: number;
  friendlyCount: number;
  flexibleCount: number;
  symmetric: boolean;
}

export const returnDirectionCache = new Map<string, ReturnDirection>();

/**
 * Separates board bounce by target ownership. A generic battlefield unit is
 * flexible interaction (normally used on an enemy, but also able to rescue a
 * friendly unit); a printed friendly return is replay/protection utility with
 * a real tempo opportunity cost; and an all-unit return is a symmetric reset,
 * never hard removal.
 */
export function returnDirection(text: string): ReturnDirection {
  const cached = returnDirectionCache.get(text);
  if (cached) return cached;

  let enemyCount = 0;
  let friendlyCount = 0;
  let flexibleCount = 0;
  let symmetric = false;

  for (const clause of controllerInstructionClauses(
    text,
    "return|recall",
    true,
  )) {
    const verb = clause.startsWith("recall") ? "recall" : "return";
    const boardUnit =
      /\bunits?\b/.test(clause) &&
      (verb === "recall" ||
        /\bto (?:its|their|the) owner(?:'s|s')? hands?\b/.test(clause));
    const sourceZone = /\bfrom (?:your |the )?(?:trash|hand|main deck)\b/.test(
      clause,
    );
    if (!boardUnit || sourceZone) continue;

    const enemyTarget = /\b(?:enemy|opponent'?s) units?\b/.test(clause);
    const friendlyTarget =
      /\b(?:friendly units?|units? you control|your units?)\b/.test(clause);
    const allUnits =
      !enemyTarget && !friendlyTarget && /\b(?:all|each) units?\b/.test(clause);

    if (allUnits) {
      symmetric = true;
      continue;
    }

    if (enemyTarget) {
      enemyCount += /\ball enemy units\b|\beach enemy unit\b/.test(clause)
        ? 2
        : 1;
    }
    if (friendlyTarget) {
      friendlyCount += /\ball friendly units\b|\beach friendly unit\b/.test(
        clause,
      )
        ? 2
        : 1;
    }
    if (
      !enemyTarget &&
      !friendlyTarget &&
      /\b(?:up to (?:one|two|\d+) |an? |one |chosen |target )?units?\b/.test(
        clause,
      )
    ) {
      flexibleCount += instructionAmount(clause, verb, 1);
    }
  }

  if (
    /\beach player\b[^.!?]{0,48}\bmay return\b[^.!?]{0,48}\bunits?\b[^.!?]{0,32}\bowner(?:'s|s')? hands?\b/.test(
      text,
    )
  ) {
    symmetric = true;
  }

  return rememberRuleAnalysis(returnDirectionCache, text, {
    enemyCount,
    friendlyCount,
    flexibleCount,
    symmetric,
  });
}

export interface MightReductionDirection {
  hostileAmount: number;
  friendlyAmount: number;
}

export const mightReductionDirectionCache = new Map<string, MightReductionDirection>();

/**
 * A negative modifier is interaction only when its target is hostile (or a
 * freely chosen unit). Friendly-only reductions are liabilities, and broad
 * symmetric modifiers do not masquerade as one-sided board control.
 */
export function mightReductionDirection(text: string): MightReductionDirection {
  const cached = mightReductionDirectionCache.get(text);
  if (cached) return cached;

  let hostileAmount = 0;
  let friendlyAmount = 0;
  for (const clause of text.split(/[.!?;]+/)) {
    const amount = sumCapturedNumbers(
      clause,
      /\b(?:give|gets?|have|has) [^.!?]{0,42}-(\d+) (?:\[[ms]\]|might\b)/g,
    );
    if (amount <= 0) continue;

    const enemyTarget =
      /\b(?:enemy|opponent'?s|attacking|defending) units?\b/.test(clause);
    const friendlyTarget =
      !enemyTarget &&
      /\b(?:friendly units?|units? you control|your units?|me|myself)\b/.test(
        clause,
      );
    const flexibleTarget =
      !enemyTarget &&
      !friendlyTarget &&
      /\b(?:an? |one |chosen |target )units?\b/.test(clause) &&
      !/\b(?:all|each) units?\b/.test(clause);

    if (enemyTarget) hostileAmount += amount;
    else if (friendlyTarget) friendlyAmount += amount;
    else if (flexibleTarget) hostileAmount += amount;
  }

  return rememberRuleAnalysis(mightReductionDirectionCache, text, {
    hostileAmount,
    friendlyAmount,
  });
}

export interface TokenDirection {
  controllerText: string;
  controllerProduces: boolean;
  opponentValue: number;
  matters: boolean;
}

export const tokenDirectionCache = new Map<string, TokenDirection>();

export function tokenDirection(text: string): TokenDirection {
  const cached = tokenDirectionCache.get(text);
  if (cached) return cached;
  const controllerClauses = controllerInstructionClauses(
    text,
    "play|create",
    true,
  ).filter(
    (clause) => /\btokens?\b/.test(clause) && !/\bnon-token\b/.test(clause),
  );
  const opponentClauses = [
    ...text.matchAll(
      /\b(?:an? opponent|each opponent|opponents?|they)\b[^.!?]{0,48}\b(?:may\s+)?plays?\b[^.!?]{0,80}\btokens?\b[^.!?]*/g,
    ),
  ].map((match) => (match[0] ?? "").replace(/\bplays\b/g, "play"));
  const opponentText = opponentClauses.join(". ");
  const opponentBoard = opponentText ? tokenBoardValue(opponentText).value : 0;

  return rememberRuleAnalysis(tokenDirectionCache, text, {
    controllerText: controllerClauses.join(". "),
    controllerProduces: controllerClauses.length > 0,
    opponentValue:
      opponentClauses.length > 0 ? Math.max(0.2, opponentBoard) : 0,
    matters:
      /\bwhen you play (?:a|one or more) tokens?\b|\btokens? you control\b|\bfor each tokens?\b|\bif you control (?:a|one or more) tokens?\b/.test(
        text,
      ),
  });
}

export interface BurnDirection {
  selfAmount: number;
  opponentAmount: number;
  payoff: boolean;
}

export const burnDirectionCache = new Map<string, BurnDirection>();

export function burnDirection(text: string): BurnDirection {
  const cached = burnDirectionCache.get(text);
  if (cached) return cached;
  const opponentPattern =
    /\b(?:an? opponent|each opponent|opponents?|they|chosen player)\b[^.!?]{0,32}(?:\[burn (\d+)\]|\bburns?\s+(\d+)\b)/g;
  let opponentAmount = 0;
  for (const match of text.matchAll(opponentPattern)) {
    opponentAmount += Number(match[1] ?? match[2] ?? 0);
  }
  const selfText = text.replaceAll(opponentPattern, " ");
  let selfAmount = 0;
  for (const match of selfText.matchAll(/\[burn (\d+)\]|\bburn (\d+)\b/g)) {
    selfAmount += Number(match[1] ?? match[2] ?? 0);
  }
  const symmetric = text.match(
    /\beach player\b[^.!?]{0,24}(?:\[burn (\d+)\]|\bburns?\s+(\d+)\b)/,
  );
  if (symmetric) {
    const amount = Number(symmetric[1] ?? symmetric[2] ?? 0);
    selfAmount = Math.max(selfAmount, amount);
    opponentAmount = Math.max(opponentAmount, amount);
  }

  return rememberRuleAnalysis(burnDirectionCache, text, {
    selfAmount,
    opponentAmount,
    payoff:
      /\bwhen you burn\b|\bwhen (?:a|one or more) cards? (?:is|are) burned\b|\bcards? burned this turn\b|\bfor each burned\b/.test(
        text,
      ),
  });
}

export interface ScoringDirection {
  ownPoints: number;
  opponentPoints: number;
  denial: boolean;
  symmetricLock: boolean;
}

export const scoringDirectionCache = new Map<string, ScoringDirection>();

export function scoringDirection(text: string): ScoringDirection {
  const cached = scoringDirectionCache.get(text);
  if (cached) return cached;
  let ownPoints = controllerInstructionClauses(text, "score").reduce(
    (total, clause) => total + instructionAmount(clause, "score", 0),
    0,
  );
  for (const match of text.matchAll(/\band score (\d+)\b/g)) {
    const before = text.slice(0, match.index ?? 0);
    const localClause = before.slice(
      Math.max(
        before.lastIndexOf("."),
        before.lastIndexOf("!"),
        before.lastIndexOf("?"),
        before.lastIndexOf(";"),
        before.lastIndexOf(":"),
        before.lastIndexOf(","),
      ) + 1,
    );
    if (
      !/\b(?:opponents?|they|chosen player|each player)\b/.test(localClause)
    ) {
      ownPoints += Number(match[1] ?? 0);
    }
  }
  for (const match of text.matchAll(
    /\b(?:pay|kill|exhaust)\b[^.!?]{0,48}\bto score (\d+)\b/g,
  )) {
    ownPoints += Number(match[1] ?? 0);
  }

  let opponentPoints = 0;
  for (const match of text.matchAll(
    /\b(?:each opponent|opponents?|they)\s+(?:may\s+)?scores?\s+(\d+)\b/g,
  )) {
    opponentPoints += Number(match[1] ?? 0);
  }

  return rememberRuleAnalysis(scoringDirectionCache, text, {
    ownPoints,
    opponentPoints,
    denial: /\bopponents? can'?t score\b|\bopponents? cannot score\b/.test(
      text,
    ),
    symmetricLock: /\bplayers? can'?t score\b|\bplayers? cannot score\b/.test(
      text,
    ),
  });
}

export interface MovementDirection {
  friendlyCount: number;
  enemyCount: number;
  payoff: boolean;
  lock: boolean;
  tax: boolean;
  symmetricOption: boolean;
  selfRestriction: boolean;
}

export const movementDirectionCache = new Map<string, MovementDirection>();

export function movementDirection(text: string): MovementDirection {
  const cached = movementDirectionCache.get(text);
  if (cached) return cached;
  let friendlyCount = 0;
  let enemyCount = 0;
  for (const clause of controllerInstructionClauses(text, "move")) {
    const amount = instructionAmount(
      clause,
      "move",
      /\bany number\b/.test(clause) ? 2 : 1,
    );
    if (/\b(?:enemy|opponent'?s|attacking)\b/.test(clause)) {
      enemyCount += amount;
    } else {
      friendlyCount += amount;
    }
  }
  for (const match of text.matchAll(
    /\b(?:you may )?pay\b[^.!?]{0,32}\bto move\b([^.!?]*)/g,
  )) {
    const clause = `move${match[1] ?? ""}`;
    const amount = instructionAmount(clause, "move", 1);
    if (/\b(?:enemy|opponent'?s|attacking)\b/.test(clause)) {
      enemyCount += amount;
    } else {
      friendlyCount += amount;
    }
  }
  return rememberRuleAnalysis(movementDirectionCache, text, {
    friendlyCount,
    enemyCount,
    payoff:
      /\b(?:when|whenever|after) [^,.!?]{0,48}\bmov(?:e|es|ed|ing)\b|\b(?:first|second|third|next) time [^,.!?]{0,40}\bmove\b|\bif [^,.!?]{0,40}\bmoved\b/.test(
        text,
      ),
    lock: /\b(?:enemy )?units? can'?t move\b|\b(?:enemy )?units? cannot move\b/.test(
      text,
    ),
    tax: /\bopponents? must pay\b[^.!?]{0,64}\bto move\b/.test(text),
    symmetricOption:
      /\b(?:a|each) player\b[^.!?]{0,64}\bmay move\b|\bthey may move another unit they control\b/.test(
        text,
      ),
    selfRestriction:
      /\b(?:i|this unit) can'?t move\b|\b(?:i|this unit) cannot move\b/.test(
        text,
      ),
  });
}
