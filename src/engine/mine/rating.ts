// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 3960-5076): baseCardRatingBreakdown and baseCardRating.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  accumulatedStateRequirementCount,
  activatedPaymentSummary,
  activationForEffects,
  clausesForScoring,
  requiredAllTagNames,
  rulesActivationFactor,
} from "./clauses";
import {
  burnDirection,
  countMatches,
  damageDirection,
  discardDirection,
  mightReductionDirection,
  movementDirection,
  removalDirection,
  returnDirection,
  round,
  scoringDirection,
  tokenDirection,
} from "./directions";
import {
  isScoredCard,
} from "./grades";
import {
  TRAIT_LABELS,
} from "./labels";
import {
  type BaseCardMechanicContribution,
  type BaseCardRatingAxes,
  type BaseCardRatingBreakdown,
  type BaseCardRatingComponent,
  TYPE_BASELINES,
  baseCardRatingBreakdownCache,
} from "./rating-types";
import {
  readyActionEconomyValuation,
} from "./ready-economy";
import {
  structuredSemanticValuation,
} from "./semantic";
import {
  clamp,
  finiteOr,
  keywordMagnitude,
  rulesForScoring,
  sumCapturedNumbers,
  tokenBoardValue,
} from "./text";
import {
  deriveTraits,
} from "./traits";
import {
  type ScoreCard,
} from "./types";
import {
  accelerateOptionValuation,
  conditionalClauseCount,
  counterEffectValuation,
  directPointClauseLedger,
  directPointFoundationValue,
  isImmediatePlayEffect,
} from "./valuations";

export function baseCardRatingBreakdown(
  card: ScoreCard,
): BaseCardRatingBreakdown {
  if (!isScoredCard(card)) {
    throw new RangeError(
      card.type === "rune"
        ? "Rune cards do not have foundation scores; evaluate them through the rune plan and colored-Power compatibility."
        : `${card.type} cards do not have foundation scores.`,
    );
  }
  const cachedBreakdown = baseCardRatingBreakdownCache.get(card);
  if (cachedBreakdown) return cachedBreakdown;
  const text = rulesForScoring(card);
  const typeBaseline = TYPE_BASELINES[card.type] ?? 4.35;
  const energy = clamp(finiteOr(card.energy, 3), 0, 20);
  const might = clamp(finiteOr(card.might, 0), 0, 30);
  const mightBonus = clamp(finiteOr(card.mightBonus, 0), 0, 20);
  const power = clamp(finiteOr(card.power, 0), 0, 12);
  const recognizedEffects = new Set<string>();
  const playable = ["unit", "spell", "gear"].includes(card.type);
  const clauses = clausesForScoring(card);
  const accumulatedRequirement = Math.max(
    1,
    ...clauses.map(({ text: clause }) =>
      accumulatedStateRequirementCount(clause),
    ),
  );
  const battlefieldAbilityRestrictions = countMatches(
    text,
    /\buse (?:my|this (?:card|unit|gear)'?s|its) abilities only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield\b|\buse this ability only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield\b/g,
  );
  const conditions = conditionalClauseCount(text);
  const activationFactor = rulesActivationFactor(clauses);
  const immediate = isImmediatePlayEffect(text) && activationFactor === 1;
  const strengthActivation = activationForEffects(
    clauses,
    /\[assault|\[shield|\bbuff\b|\bmight\b|\bunit tokens?\b/,
  );
  const cardAdvantageActivation = activationForEffects(
    clauses,
    /\bdraw\b|\bdiscard\b|\binto your hand\b|\bplay\b[^.!?]{0,48}\bfrom (?:your )?(?:trash|main deck)\b/,
  );
  const boardControlActivation = activationForEffects(
    clauses,
    /\bkill\b|\bbanish\b|\brecall\b|\bstun\b|\bdeal\b[^.!?]{0,40}\bdamage\b|\btake control\b|-\d+ (?:\[[ms]\]|might\b)/,
  );
  const controllerBattlefieldClauses = clauses.filter(({ text: clause }) => {
    const opponentScores =
      /\b(?:opponents?|they|chosen player)\b[^.!?]{0,48}\bscores?\b/.test(
        clause,
      );
    const scoreDenial =
      /\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,28}\bscore\b/.test(
        clause,
      );
    return !opponentScores || scoreDenial;
  });
  const battlefieldControlActivation = activationForEffects(
    controllerBattlefieldClauses,
    /\bscore\b|\bpoints?\b|\bconquer\b|\bhold\b|\bmov(?:e|es|ed|ing)\b|\badditional turn\b|\bturn after this\b/,
  );
  const opponentScoreActivation = activationForEffects(
    clauses,
    /\b(?:opponents?|they|chosen player)\b[^.!?]{0,48}\bscores?\b/,
  );
  const resourceActivation = activationForEffects(
    clauses,
    /\badd \d+ energy\b|\[add\]|\bchannel\b|\bcost\b[^.!?]{0,32}\bless\b|\bignoring\b[^.!?]{0,24}\bcost\b/,
  );
  const effectActivation = activationForEffects(
    clauses,
    /\bcounter\b|\bcopy\b|\breturn\b|\bprevent\b|\bcan'?t be dealt damage\b|\benough to kill\b|\[vision\]|\[deflect|\[ganking\]|\[backline\]|\[tank\]|\[hunt|\bturn lock\b|\bcan'?t play cards\b/,
  );
  const accelerateOption = accelerateOptionValuation(card, text);
  const readyEconomy = readyActionEconomyValuation(card, clauses, text);
  const structuredSemantics = structuredSemanticValuation(clauses, text);
  for (const contribution of structuredSemantics.contributions) {
    recognizedEffects.add(contribution.label);
  }
  const weaponmasterActivation = activationForEffects(
    clauses,
    /\[weaponmaster\]/,
  );
  const weaponmasterValue = /\[weaponmaster\]/.test(text)
    ? round(0.32 * weaponmasterActivation, 3)
    : 0;
  const counterEffect = counterEffectValuation(text);
  const discard = discardDirection(text);
  const removal = removalDirection(text);
  const damage = damageDirection(text);
  const returns = returnDirection(text);
  const mightReduction = mightReductionDirection(text);
  const tokens = tokenDirection(text);
  const burn = burnDirection(text);
  const scoring = scoringDirection(text);
  const movement = movementDirection(text);
  const paymentSummary = activatedPaymentSummary(clauses);
  const paymentBurden = paymentSummary.maximumBurden;
  const activatedPaymentTax = paymentSummary.expectedTax;

  // Colossus presence: bodies past eight Might demand multiple answers,
  // an inevitability the linear Might credit undercounts.
  const colossusPresence =
    card.type === "unit" && might > 8 ? Math.min(0.6, (might - 8) * 0.15) : 0;
  const printedStrength = clamp(
    (card.type === "unit" ? might * 0.55 : 0) +
      colossusPresence +
      (card.type === "gear" || mightBonus > 0 ? mightBonus * 0.55 : 0),
    0,
    16.5,
  );
  let expectedStrength = 0;
  const assault = keywordMagnitude(text, "assault");
  const shield = keywordMagnitude(text, "shield");
  const explicitMight = sumCapturedNumbers(
    text,
    /\b(?:give|gets?|have) [^.!?]{0,42}\+(\d+) (?:\[?[ms]\]?|might)\b/g,
  );
  const buffCount = countMatches(
    text,
    /\bbuff (?:me|a|an|another|all|each|friendly|up to|one|this)\b/g,
  );
  const tokenBoard = tokenBoardValue(tokens.controllerText);
  if (assault > 0) {
    expectedStrength += assault * 0.55 * 0.55;
    recognizedEffects.add("attacking Might");
  }
  if (shield > 0) {
    expectedStrength += shield * 0.45 * 0.55;
    recognizedEffects.add("defending Might");
  }
  if (explicitMight > 0) {
    expectedStrength +=
      explicitMight * (/\[reaction\]/.test(text) ? 0.85 : 0.65) * 0.55;
    recognizedEffects.add("Might modification");
  }
  if (buffCount > 0) {
    expectedStrength += buffCount * 0.85 * 0.55;
    recognizedEffects.add("persistent buffs");
  }
  if (tokenBoard.value > 0) {
    expectedStrength += tokenBoard.value;
    recognizedEffects.add("token strength");
  }
  if (/\bmy might is increased by your points\b/.test(text)) {
    // Neutral midgame prior: three points are common enough to matter, while
    // the deck-context layer can reward faster scoring shells further.
    expectedStrength += 3 * 0.55 * 0.65;
    recognizedEffects.add("point-scaled Might");
  }
  if (
    /\bincrease its might to the might of another friendly unit\b/.test(text)
  ) {
    expectedStrength += 1.05;
    recognizedEffects.add("Might equalization");
  }
  if (
    /\bdouble my might\b|\bdouble (?:a|the|its) (?:friendly )?unit'?s might\b/.test(
      text,
    )
  ) {
    expectedStrength += Math.max(0.8, might * 0.55 * 0.55);
    recognizedEffects.add("Might doubling");
  }
  expectedStrength = clamp(expectedStrength * strengthActivation, 0, 6.5);
  const generalExpectedStrength = expectedStrength;
  expectedStrength = clamp(
    generalExpectedStrength + structuredSemantics.expectedStrength,
    0,
    6.5,
  );

  let effectValue = 0;
  if (accelerateOption) {
    effectValue += accelerateOption.effectValue;
    recognizedEffects.add("Accelerate ready-tempo option");
  }
  if (counterEffect) {
    // The printed restriction is decomposed between the effect and reliability
    // ledgers without changing its single net contribution to the score.
    effectValue += counterEffect.effectValue + counterEffect.reliabilityPenalty;
    recognizedEffects.add("Counterspell tempo denial");
  }
  const drawText = text.replaceAll(/\[quick-draw\]/g, " ");
  const drawAmount = sumCapturedNumbers(drawText, /\bdraw (\d+)\b/g);
  const drawClauses = countMatches(drawText, /\bdraw\b/g);
  const damageAmount = damage.hostileAmount;
  const scoreAmount = scoring.ownPoints;
  const symmetricHandReset =
    /\beach player discards their hand, then draws? \d+\b/.test(text);

  let cardAdvantage = 0;
  if (!symmetricHandReset && (drawAmount > 0 || drawClauses > 0)) {
    cardAdvantage +=
      drawAmount * 1.25 * 0.55 + Math.max(0, drawClauses - drawAmount) * 0.4;
    recognizedEffects.add("card draw");
  }
  const opponentDiscard = discard.opponentAmount;
  if (opponentDiscard > 0) {
    cardAdvantage += opponentDiscard * 1.2 * 0.55;
    recognizedEffects.add("opponent discard");
  }
  if (removal.handDisruptionCount > 0) {
    cardAdvantage += removal.handDisruptionCount * 0.65;
    recognizedEffects.add("opponent hand banish");
  }
  if (
    /\bplay (?:it|that card|a card|the card) from (?:your )?(?:trash|main deck)\b/.test(
      text,
    )
  ) {
    cardAdvantage += 0.65;
    recognizedEffects.add("virtual card access");
  }
  if (
    /\bdiscard (?:a|1|one) cards?, then draw (?:a|1|one) cards?\b|\bdiscard \d+, then draw \d+\b/.test(
      text,
    )
  ) {
    cardAdvantage += 0.19;
    recognizedEffects.add("card filtering");
  }
  if (symmetricHandReset) {
    cardAdvantage += 0.48;
    recognizedEffects.add("symmetric hand reset");
  }
  cardAdvantage = clamp(cardAdvantage * cardAdvantageActivation, 0, 4.5);
  const generalCardAdvantage = cardAdvantage;
  cardAdvantage = clamp(
    generalCardAdvantage + structuredSemantics.cardAdvantage,
    0,
    4.5,
  );

  let boardControl = 0;
  const kills = removal.killCount;
  const banishes = removal.banishCount;
  const stuns = countMatches(
    text,
    /\bstun (?:an? |chosen )?(?:enemy )?units?\b/g,
  );
  if (kills > 0 || banishes > 0) {
    boardControl += kills * 1.65 + banishes * 1.82;
    recognizedEffects.add("hard removal");
  }
  if (returns.enemyCount > 0) {
    boardControl += returns.enemyCount * 0.9;
    recognizedEffects.add("recall tempo");
  }
  if (returns.flexibleCount > 0) {
    boardControl += returns.flexibleCount * 0.84;
    recognizedEffects.add("flexible recall tempo");
  }
  if (returns.symmetric) {
    boardControl += 0.45;
    recognizedEffects.add("symmetric recall replacement");
  }
  if (stuns > 0) {
    boardControl += stuns * 0.78;
    recognizedEffects.add("stun tempo");
  }
  if (damageAmount > 0) {
    const lethalProbability = Math.min(1, damageAmount / 4);
    boardControl += (damageAmount * 0.65 + lethalProbability * 0.6) * 0.55;
    recognizedEffects.add("damage");
  }
  if (
    /\b(?:deal|deals) damage equal to (?:its|their|that unit'?s|my) might\b|\bthey deal damage equal to their mights\b/.test(
      text,
    )
  ) {
    boardControl += 1.05;
    recognizedEffects.add("Might-based interaction");
  }
  if (/\bpay any amount of \[c\] to deal that much damage\b/.test(text)) {
    boardControl += 1.85;
    recognizedEffects.add("scalable damage");
  }
  if (mightReduction.hostileAmount > 0) {
    boardControl += mightReduction.hostileAmount * 0.65 * 0.55;
    recognizedEffects.add("Might reduction");
  }
  if (/\bkill all units\b|\bkill each unit\b/.test(text)) {
    boardControl += 2.4;
    recognizedEffects.add("board reset");
  }
  if (
    /\b(?:opponent|enemy|defender|they) [^.!?]{0,28}\bkill (?:one|a|an) (?:of )?(?:their )?units?\b/.test(
      text,
    )
  ) {
    boardControl += 1.2;
    recognizedEffects.add("opponent sacrifice");
  }
  if (/\beach player kills one of their units\b/.test(text)) {
    boardControl += 0.52;
    recognizedEffects.add("symmetric sacrifice");
  }
  if (/\btake control of\b/.test(text)) {
    boardControl += 2.15;
    recognizedEffects.add("control change");
  }
  boardControl = clamp(boardControl * boardControlActivation, 0, 6.8);
  const generalBoardControl = boardControl;
  boardControl = clamp(
    generalBoardControl + structuredSemantics.boardControl,
    0,
    6.8,
  );

  const directPointLedger = directPointClauseLedger(
    controllerBattlefieldClauses,
  );
  const directScoringActivation =
    directPointLedger.length > 0
      ? round(
          directPointLedger.reduce(
            (sum, clause) => sum + clause.activation * clause.points,
            0,
          ) / directPointLedger.reduce((sum, clause) => sum + clause.points, 0),
          3,
        )
      : activationForEffects(controllerBattlefieldClauses, /\bscore\b/);
  const directScoringValue =
    directPointLedger.length > 0
      ? round(
          directPointLedger.reduce((sum, clause) => sum + clause.value, 0),
          3,
        )
      : directPointFoundationValue(scoreAmount, directScoringActivation);
  const directScoringPaymentBurden = round(
    Math.max(0, ...directPointLedger.map((clause) => clause.paymentBurden)),
    3,
  );
  let battlefieldControl = directScoringValue;
  let contextualBattlefieldControl = 0;
  if (scoreAmount > 0) {
    recognizedEffects.add("direct scoring");
  }
  if (scoring.denial) {
    contextualBattlefieldControl += 3.5;
    recognizedEffects.add("opponent score denial");
  }
  if (scoring.symmetricLock) {
    contextualBattlefieldControl += 0.1;
    recognizedEffects.add("symmetric score lock");
  }
  const moves = movement.friendlyCount + movement.enemyCount;
  if (moves > 0) {
    contextualBattlefieldControl += Math.min(
      2.2,
      movement.enemyCount * 0.95 + movement.friendlyCount * 0.55,
    );
    recognizedEffects.add("battlefield movement");
  }
  if (movement.symmetricOption) {
    contextualBattlefieldControl += 0.12;
    recognizedEffects.add("symmetric movement option");
  }
  const unsupportedHoldClause = clauses.some(
    ({ text: clause }) =>
      /\bwhen you hold\b|\bwhile you hold\b|\bhold a battlefield\b/.test(
        clause,
      ) && !/\bscore\b/.test(clause),
  );
  if (unsupportedHoldClause) {
    contextualBattlefieldControl += 0.42;
    recognizedEffects.add("Hold value");
  }
  const unsupportedConquerClause = clauses.some(
    ({ text: clause }) =>
      /\bwhen you conquer\b|\bif you conquer\b/.test(clause) &&
      !/\bscore\b/.test(clause),
  );
  if (unsupportedConquerClause) {
    contextualBattlefieldControl += 0.34;
    recognizedEffects.add("conquer payoff");
  }
  if (
    /\btake (?:a|an) (?:additional |extra )?turn\b|\bturn after this\b/.test(
      text,
    )
  ) {
    // A full turn can ready resources and score/hold again. The standalone
    // prior stays below its deck-context ceiling; ramp and Hold engines are
    // credited by pair/triple analysis.
    contextualBattlefieldControl += 9.25;
    recognizedEffects.add("additional turn");
  }
  battlefieldControl = clamp(
    battlefieldControl +
      contextualBattlefieldControl * battlefieldControlActivation,
    0,
    9.5,
  );

  let resourceValue = 0;
  const energyGain = sumCapturedNumbers(text, /\badd (\d+) energy\b/g);
  const runeChannels = sumCapturedNumbers(text, /\bchannel (\d+) runes?\b/g);
  const symbolEnergyAdds = countMatches(text, /\[add\]\s*(?:\[1\])?\s*\[a\]/g);
  if (energyGain > 0) {
    resourceValue += energyGain * 0.55 * 0.55;
    recognizedEffects.add("Energy acceleration");
  }
  if (symbolEnergyAdds > 0) {
    resourceValue += symbolEnergyAdds * 0.55 * 0.55;
    recognizedEffects.add("Energy acceleration");
  }
  if (runeChannels > 0) {
    const exhausted = /\bchannel \d+ runes? exhausted\b/.test(text);
    resourceValue += runeChannels * (exhausted ? 1.3 : 1.8) * 0.55;
    recognizedEffects.add("Rune acceleration");
  }
  if (
    /\bplay (?:it|a|an|the|that|this|up to)\b[^.!?]{0,56}ignoring (?:its|the) (?:energy )?cost\b/.test(
      text,
    )
  ) {
    resourceValue += 1.05;
    recognizedEffects.add("cost bypass");
  }
  if (
    /\bcost (?:\[[^\]]+\])+\s*less\b|\breduce (?:my|its|this|the) cost\b|\b(?:energy )?costs? [^.!?]{0,32}\breduced by \[\d+\]/.test(
      text,
    )
  ) {
    resourceValue += 0.55;
    if (/\bless for each\b/.test(text)) resourceValue += 0.28;
    recognizedEffects.add("cost reduction");
  }
  const nonReadyResourceValue = clamp(
    resourceValue * resourceActivation,
    0,
    4.2,
  );
  resourceValue = clamp(
    nonReadyResourceValue + (readyEconomy?.resourceValue ?? 0),
    0,
    4.2,
  );
  if ((readyEconomy?.resourceValue ?? 0) > 0) {
    recognizedEffects.add("Rune readying");
  }
  const readyResourceContributions =
    readyEconomy?.contributions.filter(
      ({ component }) => component === "resourceValue",
    ) ?? [];
  const readyResourceRawValue = readyResourceContributions.reduce(
    (total, contribution) => total + contribution.rawValue,
    0,
  );
  const nonReadyResourceRawValue =
    resourceActivation > 0
      ? nonReadyResourceValue / resourceActivation
      : nonReadyResourceValue;
  const totalResourceRawValue =
    nonReadyResourceRawValue + readyResourceRawValue;
  const resourceMechanicActivation =
    totalResourceRawValue > 0
      ? round(clamp(resourceValue / totalResourceRawValue, 0.12, 1), 3)
      : resourceActivation;
  const generalResourceValue = resourceValue;
  resourceValue = clamp(
    generalResourceValue + structuredSemantics.resourceValue,
    0,
    4.2,
  );

  if (/\bcopy (?:a|the|this)\b|\bcopy of\b/.test(text)) {
    effectValue += 0.72;
    recognizedEffects.add("copy effect");
  }
  if (/\bprevent\b|\bcan'?t be dealt damage\b/.test(text)) {
    effectValue += 0.48;
    recognizedEffects.add("damage prevention");
  }
  if (/\[vision\]/.test(text)) {
    effectValue += 0.14;
    recognizedEffects.add("Vision filtering");
  }
  if (/\bequip (?:\[[^\]]+\])+|\[equip\]/.test(text)) {
    effectValue += 0.08;
    recognizedEffects.add("Equip access");
  }
  if (/\[deflect(?: \d+)?\]/.test(text)) {
    effectValue += 0.34;
    recognizedEffects.add("Deflect protection");
  }
  if (/\[ganking\]/.test(text)) {
    effectValue += 0.33;
    recognizedEffects.add("Ganking mobility");
  }
  if (/\[backline\]/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("Backline protection");
  }
  if (/\[tank\]/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("Tank protection");
  }
  if (returns.friendlyCount > 0) {
    effectValue += Math.min(0.54, returns.friendlyCount * 0.32);
    recognizedEffects.add("friendly return protection");
  }
  if (
    /\bany amount of (?:your|friendly) damage is enough to kill (?:an? |any |all )?enemy units?\b/.test(
      text,
    )
  ) {
    // A static that converts any damage into removal warps the whole
    // board even before dedicated damage providers arrive, and its known
    // carrier self-enables with an on-play multi-location ping. Tracked
    // tournament play (~14% of decks) confirms a mid-tier standalone
    // floor; the larger ceiling still belongs to PACKAGE_PAIRS.
    effectValue += 2.2;
    recognizedEffects.add("lethal damage conversion");
  }
  if (/\[hunt(?: (\d+))?\]/.test(text)) {
    const huntAmount = Number(text.match(/\[hunt(?: (\d+))?\]/)?.[1] ?? 1);
    effectValue += clamp(huntAmount, 1, 5) * 0.18;
    recognizedEffects.add("XP progression");
  }
  if (/\bopponents? can'?t play cards this turn\b/.test(text)) {
    effectValue += 1.9;
    recognizedEffects.add("turn lock");
  }
  if (
    /\b(?:i|this|friendly units?) can'?t be chosen by enemy spells and abilities\b/.test(
      text,
    )
  ) {
    effectValue += 0.46;
    recognizedEffects.add("targeting protection");
  }
  if (
    /\bname a spell\b[^]*\bopponents? can'?t play spells with that name\b/.test(
      text,
    )
  ) {
    effectValue += 0.74;
    recognizedEffects.add("named-spell lock");
  }
  if (/\bplay me to an occupied enemy battlefield\b/.test(text)) {
    effectValue += 0.32;
    recognizedEffects.add("enemy-field deployment");
  }
  if (/\bincrease the points needed to win the game\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("game-length modifier");
  }
  if (/\bhide an additional card here\b/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("Hidden capacity");
  }
  if (
    /\bat the start of each player'?s first beginning phase\b[^.!?]*\bchannels? 1 rune\b/.test(
      text,
    )
  ) {
    effectValue += 0.14;
    recognizedEffects.add("symmetric rune acceleration");
  }
  if (
    /\bat the start of each player'?s first beginning phase\b[^.!?]*\bgains? 1 point\b/.test(
      text,
    )
  ) {
    effectValue += 0.12;
    recognizedEffects.add("symmetric point acceleration");
  }
  if (/\bunits can'?t be played here\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("battlefield deployment lock");
  }
  if (/\bany player may pay\b[^.!?]*\bplay a dragon\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("symmetric Dragon deployment");
  }
  if (/\bcards with \[reaction\] cost \[a\] more\b/.test(text)) {
    effectValue += 0.16;
    recognizedEffects.add("Reaction tax");
  }
  if (
    /\bwhen a player plays a unit here\b[^.!?]*\bmay pay \[1\] to \[buff\]/.test(
      text,
    )
  ) {
    effectValue += 0.14;
    recognizedEffects.add("symmetric buff option");
  }
  if (/\bdeal \d+ bonus damage\b|\beach deal \d+ bonus damage\b/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("damage amplification");
  }
  if (movement.tax) {
    effectValue += 0.22;
    recognizedEffects.add("movement tax");
  }
  if (
    /\bwhile a unit\b[^.!?]{0,48}\bdefending alone\b[^.!?]{0,32}\bhas -\d+ \[[ms]\]/.test(
      text,
    )
  ) {
    effectValue += 0.1;
    recognizedEffects.add("symmetric defending Might modifier");
  }

  const repeatOrFlowBase =
    expectedStrength +
    cardAdvantage +
    boardControl +
    battlefieldControl +
    resourceValue +
    effectValue +
    (readyEconomy?.effectValue ?? 0) +
    weaponmasterValue;
  if (/\[repeat\]/.test(text)) {
    effectValue += clamp(repeatOrFlowBase * 0.22, 0.14, 1.35);
    recognizedEffects.add("Repeat value");
  }
  if (/\[flow\]/.test(text)) {
    effectValue += clamp(repeatOrFlowBase * 0.28, 0.18, 1.45);
    recognizedEffects.add("Flow reuse");
  }
  const generalRulesTextEffectValue = clamp(
    effectValue * effectActivation,
    0,
    5.4,
  );
  effectValue = clamp(
    generalRulesTextEffectValue +
      (readyEconomy?.effectValue ?? 0) +
      weaponmasterValue +
      structuredSemantics.effectValue,
    0,
    5.4,
  );
  if ((readyEconomy?.effectValue ?? 0) > 0) {
    recognizedEffects.add("Ready action economy");
  }
  if (weaponmasterValue > 0) {
    recognizedEffects.add("Weaponmaster Equipment access");
  }

  let flexibility = 0;
  if (/\[reaction\]/.test(text)) flexibility += counterEffect ? 0.08 : 0.1;
  if (/\[action\]/.test(text)) flexibility += 0.08;
  if (/\[hidden\]/.test(text)) flexibility += 0.14;
  if (/\bchoose (?:one|two)\b/.test(text)) flexibility += 0.28;
  if (/\byou may\b|\bmay pay\b/.test(text)) flexibility += 0.08;
  if (/\bup to\b|\bany battlefield\b/.test(text)) flexibility += 0.08;
  if (/\[quick-draw\]/.test(text)) flexibility += 0.22;
  if (/\[ambush\]/.test(text)) flexibility += 0.38;
  flexibility = clamp(flexibility, 0, 0.6);

  const traits = deriveTraits(card);
  const roleFlags = [
    traits.has("interaction") || traits.has("removal"),
    traits.has("draw") || traits.has("predict") || traits.has("recycle"),
    traits.has("scoring") || traits.has("movement"),
    traits.has("shield") ||
      traits.has("tank") ||
      traits.has("deflect") ||
      traits.has("damage-prevention"),
    traits.has("energy-ramp") || traits.has("cost-reduction"),
    traits.has("token") || traits.has("wide"),
  ].filter(Boolean).length;
  const roleUtility = clamp(roleFlags * 0.08, 0, 0.4);

  let reliability = text.length === 0 ? 0 : 0.08;
  if (immediate) reliability += 0.16;
  if (counterEffect) {
    reliability -= counterEffect.reliabilityPenalty;
  } else {
    reliability -= Math.min(0.38, conditions * 0.065);
  }
  if (/\beach turn\b|\bat (?:the )?start\b|\[t\]:/.test(text)) {
    reliability += 0.1;
  }
  if (card.copyLimit <= 1 && conditions > 0) reliability -= 0.12;
  else if (card.copyLimit === 2 && conditions > 0) reliability -= 0.05;
  if (/\brandom\b|\breveal the top\b/.test(text)) reliability -= 0.07;
  reliability = clamp(reliability, -0.55, 0.38);

  let costsAndDrawbacks = 0;
  costsAndDrawbacks -= Math.min(0.6, discard.selfAmount * 0.16);
  costsAndDrawbacks -= Math.min(0.52, burn.selfAmount * 0.1);
  if (removal.friendlyKillCount > 0 || /\bsacrifice\b/.test(text)) {
    costsAndDrawbacks -= Math.min(
      0.76,
      Math.max(1, removal.friendlyKillCount) * 0.38,
    );
  }
  if (damage.friendlyAmount > 0) {
    costsAndDrawbacks -= Math.min(0.9, damage.friendlyAmount * 0.12);
    recognizedEffects.add("friendly damage drawback");
  }
  if (returns.friendlyCount > 0) {
    costsAndDrawbacks -= Math.min(0.46, returns.friendlyCount * 0.22);
    recognizedEffects.add("friendly return opportunity cost");
  }
  if (mightReduction.friendlyAmount > 0) {
    costsAndDrawbacks -= Math.min(0.9, mightReduction.friendlyAmount * 0.12);
    recognizedEffects.add("friendly Might reduction drawback");
  }
  if (tokens.opponentValue > 0) {
    costsAndDrawbacks -= Math.min(1.15, tokens.opponentValue * 0.65);
    recognizedEffects.add("opponent token liability");
  }
  if (movement.selfRestriction) {
    costsAndDrawbacks -= 0.24;
    recognizedEffects.add("self movement restriction");
  }
  if (/\benters? exhausted\b/.test(text)) costsAndDrawbacks -= 0.24;
  if (/\bas an additional cost\b/.test(text)) costsAndDrawbacks -= 0.16;
  if (accumulatedRequirement > 1) {
    costsAndDrawbacks -= Math.min(1.35, (accumulatedRequirement - 1) * 0.27);
    recognizedEffects.add("multi-event setup burden");
  }
  if (battlefieldAbilityRestrictions > 0) {
    costsAndDrawbacks -= Math.min(1.1, battlefieldAbilityRestrictions * 0.55);
    recognizedEffects.add("battlefield-only ability burden");
  }
  if (/\bopponent draws?\b|\bthey draw \d+\b/.test(text)) {
    costsAndDrawbacks -= 0.46;
  }
  if (scoring.opponentPoints > 0) {
    costsAndDrawbacks -= Math.min(
      2.2,
      scoring.opponentPoints * 4.5 * 0.55 * opponentScoreActivation,
    );
    recognizedEffects.add("opponent scoring drawback");
  }
  if (/\bexhaust me\b|\bexhaust this\b/.test(text)) {
    costsAndDrawbacks -= 0.08;
  }
  if (paymentBurden > 0) {
    costsAndDrawbacks -= activatedPaymentTax;
    recognizedEffects.add("activated payment");
  }
  if (card.type === "unit" && /\[temporary\]/.test(text)) {
    costsAndDrawbacks -= 0.38;
  }
  if (accelerateOption) {
    costsAndDrawbacks -= accelerateOption.investment;
    recognizedEffects.add("Accelerate optional investment");
  }
  if (/\bplay me only to\b/.test(text)) {
    costsAndDrawbacks -= 0.72;
    recognizedEffects.add("deployment restriction");
  }
  if (/\bcan'?t be played on your first\b/.test(text)) {
    costsAndDrawbacks -= 1.18;
    recognizedEffects.add("early-turn restriction");
  }
  if (/\bi don'?t deal combat damage unless\b/.test(text)) {
    costsAndDrawbacks -= 1.42;
    recognizedEffects.add("combat restriction");
  }
  if (/\bdetach an equipment from it\b/.test(text)) {
    costsAndDrawbacks -= 0.34;
    recognizedEffects.add("Equipment re-equip tempo");
  }
  const empowerCostMatch = text.match(
    /\[empower\]\s*(?:—\s*[^.\n]+|\[(\d+)\]((?:\[[^\]]+\])*))/,
  );
  if (empowerCostMatch) {
    const empowerEnergy = Number(empowerCostMatch[1] ?? 0);
    const empowerPower = countMatches(empowerCostMatch[2] ?? "", /\[c\]/g);
    const empowerBurden =
      empowerEnergy +
      empowerPower * 1.15 +
      0.25 * empowerPower * Math.max(0, empowerPower - 1);
    costsAndDrawbacks -= Math.min(1.25, empowerBurden * 0.16);
    recognizedEffects.add("Empower investment");
  }
  costsAndDrawbacks = clamp(costsAndDrawbacks, -2.2, 0);
  const generalCostsAndDrawbacks = costsAndDrawbacks;
  costsAndDrawbacks = clamp(
    generalCostsAndDrawbacks + structuredSemantics.costsAndDrawbacks,
    -2.2,
    0,
  );

  // Top-end finishers pay their cost once and usually decide the game.
  // A statted 7+ energy unit therefore gets a concave energy tax beyond
  // six and a softer Power quadratic: the linear-plus-quadratic burden
  // otherwise outgrows the linear Might credit and pins every big
  // dragon-class bomb to the floor, which contradicts observed play.
  const finisherPayload =
    card.type === "unit" && energy >= 7 && might >= energy - 3;
  const energyCost = playable
    ? -clamp(
        finisherPayload ? 6 * 0.55 + (energy - 6) * 0.34 : energy * 0.55,
        0,
        11,
      )
    : 0;
  const powerQuadraticFactor = finisherPayload ? 0.14 : 0.25;
  const powerCost =
    playable && power > 0
      ? -clamp(
          (power * 1.15 +
            powerQuadraticFactor * power * Math.max(0, power - 1)) *
            0.55,
          0,
          8,
        )
      : 0;
  const resourceCost = -(energyCost + powerCost);
  const powerStrain = powerCost;
  const highCostRisk = playable
    ? -Math.min(0.7, 0.08 * Math.max(0, energy - 4) ** 1.25)
    : 0;
  // Display-only diagnostic. Printed Might and the full resource burden
  // already create the neutral Might≈Energy efficiency anchor, so this value
  // is deliberately not added to `total` a second time.
  const statEfficiency =
    card.type === "unit" ? clamp((might - energy) * 0.08, -0.48, 0.48) : 0;

  if (text && recognizedEffects.size === 0) {
    const fallbackTraits = [...traits].filter(
      (trait) =>
        !["unit", "spell", "gear", "action", "reaction"].includes(trait),
    );
    if (fallbackTraits.length > 0) {
      recognizedEffects.add(
        TRAIT_LABELS[fallbackTraits[0]!] ?? fallbackTraits[0]!,
      );
    } else {
      recognizedEffects.add("situational rules-text utility");
    }
  }

  const immediateValue = clamp(
    cardAdvantage +
      boardControl +
      battlefieldControl +
      resourceValue +
      effectValue +
      expectedStrength,
    0,
    18,
  );

  const total = round(
    clamp(
      typeBaseline +
        printedStrength +
        expectedStrength +
        effectValue +
        cardAdvantage +
        boardControl +
        battlefieldControl +
        resourceValue +
        flexibility +
        roleUtility +
        reliability +
        energyCost +
        powerCost +
        highCostRisk +
        costsAndDrawbacks,
      1.5,
      9.8,
    ),
    2,
  );

  const mechanics: BaseCardMechanicContribution[] = [];
  const addMechanic = (
    label: string,
    component: BaseCardRatingComponent,
    value: number,
    detail: string,
    activation: number,
  ) => {
    if (!Number.isFinite(value) || Math.abs(value) < 0.005) return;
    mechanics.push({
      id: `${component}:${label
        .toLocaleLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-|-$/g, "")}`,
      label,
      component,
      value: round(value, 2),
      detail,
      activation: round(clamp(activation, 0, 1), 3),
    });
  };

  if (counterEffect) {
    addMechanic(
      "Counterspell tempo denial",
      "effectValue",
      (counterEffect.effectValue + counterEffect.reliabilityPenalty) *
        effectActivation,
      `One-for-one ${counterEffect.targetBreadth} interaction with its target-eligibility prior decomposed into the separately itemized reliability adjustment.`,
      effectActivation,
    );
    addMechanic(
      "Counter target eligibility",
      "reliability",
      -counterEffect.reliabilityPenalty,
      `${round(counterEffect.targetReliability * 100)}% target eligibility after timing, payment-escape, and printed target restrictions; this adjustment is applied once.`,
      counterEffect.targetReliability,
    );
  } else {
    addMechanic(
      "Rules-text utility",
      "effectValue",
      generalRulesTextEffectValue,
      "Deterministic value from non-card, non-board rules-text effects.",
      effectActivation,
    );
  }
  for (const contribution of readyEconomy?.contributions.filter(
    ({ component }) => component === "effectValue",
  ) ?? []) {
    addMechanic(
      contribution.label,
      contribution.component,
      contribution.value,
      contribution.detail,
      contribution.activation,
    );
  }
  addMechanic(
    "Weaponmaster Equipment access",
    "effectValue",
    weaponmasterValue,
    "Weaponmaster supplies one bounded on-play Equipment attachment and Energy discount; Equipment support determines the higher deck-context ceiling.",
    weaponmasterActivation,
  );
  for (const contribution of structuredSemantics.contributions) {
    addMechanic(
      contribution.label,
      contribution.component,
      contribution.value,
      contribution.detail,
      contribution.activation,
    );
  }
  if (scoreAmount > 0) {
    addMechanic(
      directScoringPaymentBurden > 0 ? "Activated scoring" : "Direct scoring",
      "battlefieldControl",
      directScoringValue,
      directScoringPaymentBurden > 0
        ? `Direct points require up to a ${round(directScoringPaymentBurden, 2)}-resource clause payment; both payoff and cost are activation-gated.`
        : "Conditional point text earns only reliability-gated standalone credit; supported upside is represented by deck synergies.",
      directScoringActivation,
    );
  }
  addMechanic(
    "Printed Might",
    "printedStrength",
    printedStrength,
    "Printed unit or Gear Might before conditional rules text.",
    1,
  );
  addMechanic(
    "Conditional Might",
    "expectedStrength",
    generalExpectedStrength,
    "Expected attacking, defending, buff, or token strength.",
    strengthActivation,
  );
  addMechanic(
    "Card advantage",
    "cardAdvantage",
    generalCardAdvantage,
    "Expected cards gained or denied at this clause's activation rate.",
    cardAdvantageActivation,
  );
  addMechanic(
    "Board control",
    "boardControl",
    generalBoardControl,
    "Removal, damage, stun, recall, or hostile Might pressure.",
    boardControlActivation,
  );
  if (scoreAmount === 0) {
    addMechanic(
      "Battlefield control",
      "battlefieldControl",
      battlefieldControl,
      "Movement, Hold, conquer, denial, or extra-turn pressure.",
      battlefieldControlActivation,
    );
  }
  addMechanic(
    "Resource conversion",
    "resourceValue",
    generalResourceValue,
    "Energy, Rune channeling or readying, and bounded cost-conversion value.",
    resourceMechanicActivation,
  );
  addMechanic(
    "Activated payment",
    "costsAndDrawbacks",
    -activatedPaymentTax,
    "Each optional payment is charged only to its own clause and activation window.",
    paymentSummary.activation,
  );
  addMechanic(
    "Other costs and drawbacks",
    "costsAndDrawbacks",
    generalCostsAndDrawbacks + activatedPaymentTax,
    "Rules-text costs, liabilities, and play restrictions.",
    1,
  );

  const tagRequirements = requiredAllTagNames(text).length;
  const conditionality = 1 - activationFactor;
  const additionalClauseRequirements = Math.max(
    0,
    ...clauses.map(({ requirementCount }) => requirementCount - 1),
  );
  const deckBuildingTax = clamp(
    conditionality * 3 +
      Math.min(1.1, conditions * 0.4) +
      Math.min(1.05, additionalClauseRequirements * 0.35) +
      Math.max(0, tagRequirements - 1) * 0.35 +
      Math.min(1, paymentBurden * 0.12) +
      Math.min(0.6, power * 0.1),
    0,
    5,
  );
  const standaloneFloor = clamp(
    ((total - 1.5) / 1.66) * (0.55 + activationFactor * 0.45),
    0,
    5,
  );
  const synergyCeiling = clamp(
    standaloneFloor +
      conditionality * 2.45 +
      (traits.has("hold-payoff") ||
      traits.has("movement-payoff") ||
      traits.has("death-payoff")
        ? 0.35
        : 0) +
      (traits.has("skip") ? 1.15 : 0),
    0,
    5,
  );
  const axes: BaseCardRatingAxes = {
    standaloneFloor: round(standaloneFloor, 2),
    synergyCeiling: round(synergyCeiling, 2),
    interactionFlexibility: round(
      clamp(
        (traits.has("interaction") ? 2.4 : 0) +
          flexibility * 3.2 +
          roleUtility * 1.5 +
          (/\[reaction\]/.test(text) ? 0.35 : 0),
        0,
        5,
      ),
      2,
    ),
    deckBuildingTax: round(deckBuildingTax, 2),
    activationReliability: round(clamp(activationFactor * 5, 0, 5), 2),
  };

  const breakdown = {
    total,
    typeBaseline: round(typeBaseline, 2),
    printedStrength: round(printedStrength, 2),
    expectedStrength: round(expectedStrength, 2),
    effectValue: round(effectValue, 2),
    cardAdvantage: round(cardAdvantage, 2),
    boardControl: round(boardControl, 2),
    battlefieldControl: round(battlefieldControl, 2),
    resourceValue: round(resourceValue, 2),
    statEfficiency: round(statEfficiency, 2),
    immediateValue: round(immediateValue, 2),
    flexibility: round(flexibility, 2),
    roleUtility: round(roleUtility, 2),
    reliability: round(reliability, 2),
    activationFactor: round(activationFactor, 3),
    resourceCost: round(resourceCost, 2),
    energyCost: round(energyCost, 2),
    powerCost: round(powerCost, 2),
    highCostRisk: round(highCostRisk, 2),
    costsAndDrawbacks: round(costsAndDrawbacks, 2),
    powerStrain: round(powerStrain, 2),
    recognizedEffects: [...recognizedEffects].sort((left, right) =>
      left.localeCompare(right),
    ),
  };
  // Keep the structured inspection fields directly accessible while
  // preserving the legacy enumerable numeric-component contract used by
  // existing deck ledgers. Callers can read `breakdown.mechanics` and
  // `breakdown.axes`; older Object.entries consumers continue to see only the
  // flat numeric ledger plus recognizedEffects.
  Object.defineProperties(breakdown, {
    mechanics: {
      value: mechanics,
      enumerable: false,
      configurable: false,
      writable: false,
    },
    axes: {
      value: axes,
      enumerable: false,
      configurable: false,
      writable: false,
    },
  });
  const resolvedBreakdown = breakdown as BaseCardRatingBreakdown;
  baseCardRatingBreakdownCache.set(card, resolvedBreakdown);
  return resolvedBreakdown;
}

export function baseCardRating(card: ScoreCard): number {
  return baseCardRatingBreakdown(card).total;
}
