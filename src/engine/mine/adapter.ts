// Forge `Card` -> Riftfoundry `ScoreCard` (the shape the ported mine reads). New code, not a port.
//
// What changes on the way, and why:
// - Symbols. Card.text writes [Might], [Exhaust], [Any] and [Fury]...[Order]; the mine's patterns were
//   written against Riftfoundry's [S], [T], [A] and [C] (a rune of the card's own domain).
// - List bullets "- " become "* " (Riftfoundry's form; the clause splitter accepts both).
// - An Equipment's attached-effect lines ("Effect: ...") lose the "Effect: " label so that they parse as
//   ordinary ability sentences. Riftfoundry's data did not carry these lines at all; keeping them lets the
//   mine see what the Equipment grants.
// - A keyword printed without brackets at the head of a line ("Action (Play on your turn ...)", "Equip
//   [Body] (...)": five gallery rows on 2026-11-12) gets its brackets, as every other printing has them.
// - The game actions [Stun] and [Buff] (CR 424, 427; not keywords, glossary section 3) lose their brackets.
//   Sets from Unleashed on print them bracketed; the mine's value patterns ("stun a unit", "buff a
//   friendly unit") were written for the older plain spelling and gave a bracketed Stun or Buff no value
//   (measured 2026-11-12: "[Stun] a unit." rated 0.78 below "Stun a unit."). Newer sets must not rate
//   lower for a typographic change.
// - superTypes are capitalised ("Champion", "Signature", "Token", "Basic") as in Riftfoundry's data.
// - A card with no domain is ["colorless"], as Riftfoundry stored battlefields and tokens.
// - copyLimit Infinity (basic runes) becomes 99: the mine only asks whether it is <= 1 or == 2.
// - type null (an incomplete gallery row) becomes "": such a card is not scored.
import type { Card } from '../types';
import type { ScoreCard } from './types';

const DOMAIN_SYMBOL = /\[(?:Fury|Calm|Mind|Body|Chaos|Order)\]/g;
const BARE_KEYWORD_HEAD =
  /^(Accelerate|Action|Ambush|Backline|Deploy|Equip|Ganking|Hidden|Quick-Draw|Reaction|Tank|Temporary|Unique|Vision|Weaponmaster)(?= \(| \[|$)/;
const capital = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

const TYPE_LABEL: Record<string, string> = {
  unit: 'Unit', spell: 'Spell', gear: 'Gear', rune: 'Rune', battlefield: 'Battlefield', legend: 'Legend',
};

/** Card.text in the symbol set of the ported mine. */
export function toMineText(text: string): string {
  return text
    .replace(/\[Might\]/g, '[S]')
    .replace(/\[Exhaust\]/g, '[T]')
    .replace(/\[Any\]/g, '[A]')
    .replace(DOMAIN_SYMBOL, '[C]')
    .replace(/\[(Stun|Buff)\]/g, '$1')
    .split('\n')
    .map((line) => line.replace(/^Effect:\s*/, '').replace(/^- /, '* ').replace(BARE_KEYWORD_HEAD, '[$1]'))
    .join('\n');
}

const cache = new WeakMap<Card, ScoreCard>();

/** One ScoreCard object per Card object, so the mine's per-card caches (WeakMap on the ScoreCard) hold. */
export function toScoreCard(card: Card): ScoreCard {
  const held = cache.get(card);
  if (held) return held;
  const rulesText = toMineText(card.text);
  const type = card.type ?? '';
  const domains: string[] = card.domains.length ? [...card.domains] : ['colorless'];
  const out: ScoreCard = {
    id: card.id,
    name: card.name,
    setId: card.set,
    type,
    accessibilityText: `Riftbound ${TYPE_LABEL[type] ?? 'Card'}: ${card.name}. ${rulesText}`,
    superTypes: card.superTypes.map(capital),
    domains,
    domainNames: domains.map(capital),
    rulesText,
    energy: card.energy,
    power: card.power,
    might: card.might,
    mightBonus: card.mightBonus,
    tags: [...card.tags],
    copyLimit: Number.isFinite(card.copyLimit) ? card.copyLimit : 99,
  };
  cache.set(card, out);
  return out;
}
