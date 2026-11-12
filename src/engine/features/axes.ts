// Theme axes (spec 8.3; docs/research/deck-theory.md section 4), derived from the mined traits. New code.
//
// An axis has an enabler side (the card makes the thing happen) and a payoff side (the card rewards it).
// HEURISTIC: the trait lists and the strengths are ours. Strength 1 = the card's text does it; a structural
// enabler (any spell for "spells", any gear for "gear", a 5+ Might body for "mighty", a cheap card for
// Legion) is weaker because every deck has some.
import { REGION_TAGS, TRIBAL_TAGS } from '../network/pair';
import type { AxisId, Card } from '../types';

export interface AxisDef {
  id: AxisId;
  label: string;
  enablers: readonly string[];
  payoffs: readonly string[];
  /** Structural enabler: holds without any text. Returns a strength in (0,1] or 0. */
  structural?: (card: Card) => number;
}

const isMain = (card: Card): boolean => card.type === 'unit' || card.type === 'spell' || card.type === 'gear';

export const AXES: readonly AxisDef[] = [
  { id: 'tokens', label: 'Tokens / go wide', enablers: ['token'], payoffs: ['wide', 'token-matters'] },
  { id: 'buffs', label: 'Buffs', enablers: ['buff-producer'], payoffs: ['buff-consumer'] },
  { id: 'equipment', label: 'Equipment', enablers: ['equipment'], payoffs: ['equipment-matters', 'weaponmaster'] },
  { id: 'gear', label: 'Gear', enablers: [], payoffs: ['gear-matters', 'deploy-matters'], structural: (c) => (c.type === 'gear' ? 0.5 : 0) },
  { id: 'spells', label: 'Spells', enablers: [], payoffs: ['spell-matters'], structural: (c) => (c.type === 'spell' ? 0.5 : 0) },
  { id: 'discard', label: 'Discard', enablers: ['discard'], payoffs: ['discard-payoff'] },
  { id: 'trash', label: 'Trash / recursion', enablers: ['trash-filler', 'burn-self'], payoffs: ['trash-payoff', 'trash-retrieval', 'trash-banish', 'flow', 'burn-payoff'] },
  { id: 'banish', label: 'Banish', enablers: ['banish-enabler'], payoffs: ['banish-payoff'] },
  { id: 'death', label: 'Deathknell / sacrifice', enablers: ['death-enabler', 'temporary'], payoffs: ['death-payoff'] },
  { id: 'stun', label: 'Stun', enablers: ['stun'], payoffs: ['stun-payoff'] },
  { id: 'movement', label: 'Movement', enablers: ['movement', 'ganking'], payoffs: ['movement-payoff'] },
  { id: 'conquer', label: 'Conquer', enablers: ['assault', 'accelerate'], payoffs: ['conquer'] },
  { id: 'hold', label: 'Hold', enablers: ['hold-enabler', 'tank', 'shield'], payoffs: ['hold', 'hold-payoff'] },
  { id: 'mighty', label: 'Mighty (5+ Might)', enablers: ['might-boost'], payoffs: ['mighty'], structural: (c) => (c.type === 'unit' && (c.might ?? 0) >= 5 ? 0.6 : 0) },
  { id: 'ramp', label: 'Rune ramp / big Energy', enablers: ['energy-ramp', 'channel-rune', 'cost-reduction'], payoffs: ['rune-count-payoff', 'skip'], },
  { id: 'xp', label: 'XP / Level', enablers: ['hunt'], payoffs: ['level', 'xp-spend'] },
  { id: 'hidden', label: 'Hidden', enablers: ['hidden'], payoffs: ['hidden-matters'] },
  { id: 'empower', label: 'Empower', enablers: ['empower'], payoffs: ['empowered-payoff'] },
  { id: 'deploy', label: 'Deploy / Bombs', enablers: ['deploy', 'bomb'], payoffs: ['deploy-matters'] },
  { id: 'show-off', label: 'Show Off', enablers: [], payoffs: ['show-off'] },
  { id: 'shrink', label: 'Disarm / shrink', enablers: ['might-reduction', 'disarm'], payoffs: ['might-reduction-payoff'] },
  { id: 'legion', label: 'Legion', enablers: [], payoffs: ['legion'], structural: (c) => (isMain(c) && (c.energy ?? 99) <= 1 ? 0.4 : 0) },
  { id: 'topdeck', label: 'Top-deck', enablers: ['predict', 'vision'], payoffs: ['topdeck-payoff'] },
  { id: 'ready', label: 'Ready / exhaust', enablers: ['ready'], payoffs: ['exhaust'] },
  { id: 'solo', label: 'Alone / one on one', enablers: [], payoffs: ['solo'] },
  { id: 'damage', label: 'Damage', enablers: ['damage-provider'], payoffs: ['lethal-damage-conversion', 'bonus-damage'] },
  { id: 'units', label: 'Unit play', enablers: [], payoffs: ['unit-play-payoff'], structural: (c) => (c.type === 'unit' && (c.energy ?? 99) <= 2 ? 0.4 : 0) },
  { id: 'points', label: 'Direct points', enablers: ['point-gain'], payoffs: [] },
];

const AXIS_BY_ID = new Map(AXES.map((a) => [a.id, a]));

/** Tags that make a `tag:<Name>` axis: the ported tribal list without Equipment (an axis of its own). */
export const DEFAULT_AXIS_TAGS: readonly string[] = [...TRIBAL_TAGS].filter((t) => t !== 'Equipment');

export const axisLabel = (id: AxisId): string => AXIS_BY_ID.get(id)?.label ?? (id.startsWith('tag:') ? `${id.slice(4)} tribe` : id);

const names = (text: string, tag: string): boolean =>
  new RegExp(`(?<!non-)\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'i').test(text.replace(/\([^)]*\)/g, ' '));

/**
 * Sparse axis strengths of a card: `e` enabler, `p` payoff, both in [0,1].
 * @param traits mined trait ids
 * @param tags tribe tags that get a `tag:` axis (the sync passes every non-region, non-champion tag of the pool)
 * Tag axes: a card carrying the tag enables it; a card whose text names the tag (not "non-<Tag>") pays it off.
 */
export function axesOf(card: Card, traits: Iterable<string>, tags: readonly string[] = DEFAULT_AXIS_TAGS): Record<AxisId, { e: number; p: number }> {
  const t = traits instanceof Set ? (traits as Set<string>) : new Set(traits);
  const out: Record<AxisId, { e: number; p: number }> = {};
  for (const axis of AXES) {
    const e = axis.enablers.some((id) => t.has(id)) ? 1 : axis.structural?.(card) ?? 0;
    const p = axis.payoffs.some((id) => t.has(id)) ? 1 : 0;
    if (e > 0 || p > 0) out[axis.id] = { e, p };
  }
  for (const tag of tags) {
    if (REGION_TAGS.has(tag)) continue;
    const e = card.tags.includes(tag) && isMain(card) ? 1 : 0;
    const p = names(card.text, tag) ? 1 : 0;
    if (e > 0 || p > 0) out[`tag:${tag}`] = { e, p };
  }
  return out;
}

/** Tribe tags of a pool: every tag that is not a region and not a champion's name. */
export function axisTagsOf(cards: readonly Card[]): string[] {
  const champion = new Set<string>();
  for (const c of cards) { if (c.championTag) champion.add(c.championTag); if (c.superTypes.includes('champion')) champion.add(c.shortName); }
  const tags = new Set<string>();
  for (const c of cards) for (const tag of c.tags) if (!REGION_TAGS.has(tag) && !champion.has(tag) && tag !== 'Equipment' && tag.length >= 3) tags.add(tag);
  return [...tags].sort();
}
