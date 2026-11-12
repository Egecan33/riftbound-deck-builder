// Which sentence of a card carries a mined trait, for reasons that must quote card text. New code.
//
// The mine derives traits from a card's whole text. To quote "the relevant text" a reason needs the sentence:
// each sentence is mined on its own (the same probe the coverage report uses) and kept when it alone yields
// the trait. Type traits (unit, spell, gear, equipment) come from the type line, not from a sentence.
import { deriveTraits, mineSentences, type ScoreCard, type Trait } from '../mine';

const cache = new WeakMap<ScoreCard, Map<string, string[]>>();
const sentenceTraits = new WeakMap<ScoreCard, { sentence: string; traits: Set<Trait> }[]>();

function minedSentences(card: ScoreCard): { sentence: string; traits: Set<Trait> }[] {
  let held = sentenceTraits.get(card);
  if (!held) {
    const probe = (rulesText: string): ScoreCard => ({ ...card, id: `${card.id}#quote`, rulesText, accessibilityText: undefined, power: 0 });
    const blank = deriveTraits(probe(''));
    held = mineSentences(card.rulesText).map((sentence) => {
      const traits = new Set<Trait>();
      for (const t of deriveTraits(probe(sentence.replace(/^[*•-]\s+/, '')))) if (!blank.has(t)) traits.add(t);
      return { sentence, traits };
    });
    sentenceTraits.set(card, held);
  }
  return held;
}

/** Sentences of the card (mine symbols, reminder text removed) that yield the trait on their own. */
export function sentencesWithTrait(card: ScoreCard, trait: Trait): string[] {
  let byTrait = cache.get(card);
  if (!byTrait) cache.set(card, (byTrait = new Map()));
  let held = byTrait.get(trait);
  if (!held) {
    held = minedSentences(card).filter((s) => s.traits.has(trait)).map((s) => s.sentence);
    byTrait.set(trait, held);
  }
  return held;
}

/** Sentences matching a pattern (case-insensitive patterns are the caller's business). */
export function sentencesMatching(card: ScoreCard, pattern: RegExp): string[] {
  return mineSentences(card.rulesText).filter((s) => pattern.test(s));
}

const TYPE_LINE: Partial<Record<string, string>> = { unit: 'Unit', spell: 'Spell', gear: 'Gear', equipment: 'Equipment', 'unit-gear': 'Unit, Gear' };

/** Card text as people read it: the mine's [S]/[T]/[A]/[C] written out again. */
export const readable = (text: string): string =>
  text.replace(/\[S\]/g, 'Might').replace(/\[T\]/g, '[Exhaust]').replace(/\[A\]/g, '[Any rune]').replace(/\[C\]/g, '[Power]');

const clip = (text: string, max = 150): string => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/**
 * `Name: "sentence"` for the first sentence carrying one of the traits; the type line for a type trait;
 * the first sentence of the card when nothing matches (a whole-text pattern); `Name (no rules text)` last.
 */
export function quoteCard(card: ScoreCard, traits: readonly Trait[], pattern?: RegExp): string {
  for (const trait of traits) {
    // A sentence that says something is preferred to a bare keyword line ("[Accelerate]").
    const hits = sentencesWithTrait(card, trait);
    const hit = hits.find((s) => !/^\[[^\]]+\]$/.test(s)) ?? hits[0];
    if (hit) return `${card.name}: "${clip(readable(hit))}"`;
  }
  if (pattern) {
    const hit = sentencesMatching(card, pattern)[0];
    if (hit) return `${card.name}: "${clip(readable(hit))}"`;
  }
  for (const trait of traits) {
    const line = TYPE_LINE[trait];
    if (line && deriveTraits(card).has(trait)) return `${card.name} is ${/^[AEIOU]/.test(line) ? 'an' : 'a'} ${line}`;
  }
  const first = mineSentences(card.rulesText).find((s) => !/^\[[^\]]+\]$/.test(s));
  return first ? `${card.name}: "${clip(readable(first))}"` : `${card.name} (no rules text)`;
}
