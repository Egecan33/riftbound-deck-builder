// Deck-specific lines (spec 14). `generateLines` is deterministic: the same deck, card data and opponent give
// the same report. Every line names cards of the deck and carries its reason; a line that names no deck card,
// or repeats another line's text, is dropped here (AGENTS.md hard rule 6: generic advice is a bug).
import type { Deck, EngineContext, Line, LineReport } from '../types';
import { buildContext } from './context';
import { formatLines } from './format';
import { matchupLines, sideLines } from './matchup';
import { keepLines, spikeLines, turnLines } from './opening';
import { oneAwayLines, packageLines, sequencingLines } from './sequencing';

export * from './context';
export { keepLines, spikeLines, turnLines } from './opening';
export { oneAwayLines, packageLines, packagesOf, sequencingLines } from './sequencing';
export { matchupLines, sideLines, typicalDeck } from './matchup';
export { formatLines } from './format';

export const EMPTY_LINES: LineReport = { keeps: [], turns: [], sequencing: [], packages: [], oneAway: [], spikes: [], matchup: [], side: [], format: [] };

/** Share of line texts two reports have in common: |A ∩ B| / min(|A|, |B|). The "rinse and repeat" measure. */
export function sharedLineShare(a: LineReport, b: LineReport): number {
  const texts = (r: LineReport): Set<string> => new Set(Object.values(r).flat().map((l: Line) => l.text));
  const A = texts(a);
  const B = texts(b);
  const smaller = Math.min(A.size, B.size);
  if (smaller === 0) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared += 1;
  return shared / smaller;
}

export function generateLines(deck: Deck, ctx: EngineContext): LineReport {
  const lc = buildContext(deck, ctx);
  if (lc.view.main.length === 0) return { ...EMPTY_LINES };
  const seen = new Set<string>();
  const clean = (lines: Line[]): Line[] => lines.filter((l) => {
    if (l.cardIds.length === 0 || !l.text || seen.has(l.text)) return false;
    seen.add(l.text);
    return true;
  });
  return {
    keeps: clean(keepLines(lc)),
    turns: clean(turnLines(lc)),
    sequencing: clean(sequencingLines(lc)),
    packages: clean(packageLines(lc)),
    oneAway: clean(oneAwayLines(lc)),
    spikes: clean(spikeLines(lc)),
    matchup: clean(matchupLines(lc)),
    side: clean(sideLines(lc)),
    format: clean(formatLines(lc)),
  };
}
