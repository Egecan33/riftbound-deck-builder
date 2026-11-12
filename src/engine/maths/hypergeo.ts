// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 127-131, 440-441, 5196-5375): hypergeometric and reliability maths.
// Port rule (spec 8.2): behaviour unchanged; top-level declarations are exported so the split files can share them.
import { clamp, finiteOr, round, type ScoreCard } from "../mine";

export interface RuneRecommendation {
  domain: string;
  count: number;
  demand: number;
}

export const STANDARD_OPENING_HAND = 4;
export const DEFAULT_EARLY_DRAWS = 3;

export function probabilityOfNoHits(
  population: number,
  successes: number,
  draws: number,
): number {
  const safePopulation = Math.max(0, Math.floor(population));
  const safeSuccesses = clamp(Math.floor(successes), 0, safePopulation);
  const safeDraws = clamp(Math.floor(draws), 0, safePopulation);
  if (safeSuccesses === 0 || safeDraws === 0) return 1;
  if (safeDraws > safePopulation - safeSuccesses) return 0;

  let probability = 1;
  for (let draw = 0; draw < safeDraws; draw += 1) {
    probability *=
      (safePopulation - safeSuccesses - draw) / (safePopulation - draw);
  }
  return clamp(probability, 0, 1);
}

export function combinationCount(population: number, selections: number): number {
  if (selections < 0 || selections > population) return 0;
  const k = Math.min(selections, population - selections);
  let value = 1;
  for (let index = 1; index <= k; index += 1) {
    value *= (population - k + index) / index;
  }
  return value;
}

export function hypergeometricAtLeast(
  population: number,
  successes: number,
  draws: number,
  required: number,
): number {
  const safePopulation = Math.max(0, Math.floor(population));
  const safeSuccesses = clamp(Math.floor(successes), 0, safePopulation);
  const safeDraws = clamp(Math.floor(draws), 0, safePopulation);
  const safeRequired = Math.max(0, Math.floor(required));
  if (safeRequired === 0) return 1;
  if (
    safeRequired > safeSuccesses ||
    safeRequired > safeDraws ||
    safePopulation === 0
  ) {
    return 0;
  }
  const denominator = combinationCount(safePopulation, safeDraws);
  if (denominator === 0) return 0;
  let probability = 0;
  const maximum = Math.min(safeSuccesses, safeDraws);
  for (let hits = safeRequired; hits <= maximum; hits += 1) {
    probability +=
      (combinationCount(safeSuccesses, hits) *
        combinationCount(safePopulation - safeSuccesses, safeDraws - hits)) /
      denominator;
  }
  return round(clamp(probability, 0, 1), 4);
}

export function cardRuneReliability(
  card: ScoreCard,
  runes: readonly RuneRecommendation[],
): number {
  const power = Math.max(0, Math.floor(finiteOr(card.power, 0)));
  if (power === 0) return 1;
  const coloredDomains = card.domains.filter(
    (domain) => domain !== "colorless",
  );
  if (coloredDomains.length === 0) return 1;
  const totalRunes = runes.reduce((sum, rune) => sum + rune.count, 0);
  if (totalRunes === 0) return 0;
  const available = coloredDomains.reduce(
    (sum, domain) =>
      sum + (runes.find((rune) => rune.domain === domain)?.count ?? 0),
    0,
  );
  const channels = Math.min(
    totalRunes,
    Math.max(2, Math.ceil(finiteOr(card.energy, 2))),
  );
  return hypergeometricAtLeast(totalRunes, available, channels, power);
}

/**
 * Probability that an opening-hand-plus-early-draw window contains at least
 * one enabler and at least one payoff. Inclusion-exclusion handles cards that
 * satisfy both roles without pretending they are two cards.
 */
export function earlyPackageReliability(
  deckSize: number,
  enablerCopies: number,
  payoffCopies: number,
  overlapCopies = 0,
  openingHand = STANDARD_OPENING_HAND,
  earlyDraws = DEFAULT_EARLY_DRAWS,
): number {
  const population = Math.max(0, Math.floor(deckSize));
  if (population === 0) return 0;
  const enablers = clamp(Math.floor(enablerCopies), 0, population);
  const payoffs = clamp(Math.floor(payoffCopies), 0, population);
  const overlap = clamp(
    Math.floor(overlapCopies),
    0,
    Math.min(enablers, payoffs),
  );
  if (enablers === 0 || payoffs === 0) return 0;

  const draws = clamp(
    Math.floor(openingHand) + Math.floor(earlyDraws),
    0,
    population,
  );
  const union = clamp(enablers + payoffs - overlap, 0, population);
  const probability =
    1 -
    probabilityOfNoHits(population, enablers, draws) -
    probabilityOfNoHits(population, payoffs, draws) +
    probabilityOfNoHits(population, union, draws);
  return round(clamp(probability, 0, 1), 4);
}

export function earlyCombinationReliability(
  deckSize: number,
  groups: ReadonlyArray<{ copies: number; required: number }>,
  openingHand: number,
  earlyDraws: number,
): number {
  const population = Math.max(0, Math.floor(deckSize));
  if (population === 0) return 0;
  const draws = clamp(
    Math.floor(openingHand) + Math.floor(earlyDraws),
    0,
    population,
  );
  const normalized = groups.map(({ copies, required }) => ({
    copies: clamp(Math.floor(copies), 0, population),
    required: Math.max(0, Math.floor(required)),
  }));
  if (
    normalized.length === 0 ||
    normalized.some(
      ({ copies, required }) => required > copies || required > draws,
    )
  ) {
    return 0;
  }
  const selectedCopies = normalized.reduce(
    (sum, group) => sum + group.copies,
    0,
  );
  if (selectedCopies > population) return 0;
  const otherCopies = population - selectedCopies;
  const denominator = combinationCount(population, draws);
  if (denominator === 0) return 0;

  let successfulHands = 0;
  const visit = (index: number, selected: number, combinations: number) => {
    if (index === normalized.length) {
      const otherDraws = draws - selected;
      if (otherDraws < 0 || otherDraws > otherCopies) return;
      successfulHands +=
        combinations * combinationCount(otherCopies, otherDraws);
      return;
    }

    const group = normalized[index]!;
    const maximum = Math.min(group.copies, draws - selected);
    for (let hits = group.required; hits <= maximum; hits += 1) {
      visit(
        index + 1,
        selected + hits,
        combinations * combinationCount(group.copies, hits),
      );
    }
  };
  visit(0, 0, 1);
  return round(clamp(successfulHands / denominator, 0, 1), 4);
}

