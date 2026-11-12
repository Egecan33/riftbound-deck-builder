// Pool-wide coverage report of the card mine. New code on top of the ported mine.
import type { Card } from '../types';
import { toScoreCard } from './adapter';
import { TYPE_TRAITS, isStructuralSentence, mineCard, mineSentences, type MineOverride } from './mine-card';

export interface CoverageReport {
  cards: number;
  /** Ids of cards with rules text whose traits only restate the card type (or with no trait at all). */
  noTraits: string[];
  unparsedSentences: { text: string; count: number; cards: string[] }[];
  unparsedTotal: number;
  /** Target declarations, cost riders and debris (isStructuralSentence): not counted as unparsed. */
  structuralTotal: number;
  sentenceTotal: number;
  /** Number of cards by number of mined traits. */
  traitsPerCard: Record<number, number>;
}

/** Pool-wide coverage: which cards the mine got nothing from, and which sentences no family matched. */
export function coverage(cards: readonly Card[], overrides: Readonly<Record<string, MineOverride>> = {}): CoverageReport {
  const noTraits: string[] = [];
  const sentences = new Map<string, { count: number; cards: string[] }>();
  const traitsPerCard: Record<number, number> = {};
  let unparsedTotal = 0;
  let sentenceTotal = 0;
  let structuralTotal = 0;
  for (const card of cards) {
    const override = overrides[card.id];
    const mined = mineCard(card, override);
    traitsPerCard[mined.traits.length] = (traitsPerCard[mined.traits.length] ?? 0) + 1;
    // Reminder text alone (a token's "(I become a copy ...)") is not rules text to mine.
    const hasText = card.text.replaceAll(/\([^)]*\)/g, ' ').trim().length > 0;
    if (hasText && !override?.noMechanic && !mined.traits.some((t) => !TYPE_TRAITS.has(t))) noTraits.push(card.id);
    const all = mineSentences(toScoreCard(card).rulesText);
    sentenceTotal += all.length;
    structuralTotal += all.filter(isStructuralSentence).length;
    for (const s of mined.unparsed) {
      unparsedTotal += 1;
      const key = s.toLocaleLowerCase();
      const row = sentences.get(key) ?? { count: 0, cards: [] };
      row.count += 1;
      if (row.cards.length < 5) row.cards.push(card.id);
      sentences.set(key, row);
    }
  }
  return {
    cards: cards.length,
    noTraits,
    unparsedSentences: [...sentences.entries()]
      .map(([text, v]) => ({ text, count: v.count, cards: v.cards }))
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)),
    unparsedTotal,
    structuralTotal,
    sentenceTotal,
    traitsPerCard,
  };
}

/** One entry of the `mine` list in sync-data/card-overrides.json. */
export interface MineOverrideEntry extends MineOverride { code: string; name: string; source?: string }

/** The reviewed mine corrections keyed by gameplay id; entries whose code is not in the pool are dropped. */
export function mineOverridesById(entries: readonly MineOverrideEntry[] | undefined, cards: readonly Card[]): Record<string, MineOverride> {
  const byCode = new Map(cards.map((card) => [card.code, card.id]));
  const out: Record<string, MineOverride> = {};
  for (const entry of entries ?? []) {
    const id = byCode.get(entry.code);
    if (id) out[id] = { addTraits: entry.addTraits, removeTraits: entry.removeTraits, noMechanic: entry.noMechanic, reason: entry.reason };
  }
  return out;
}
