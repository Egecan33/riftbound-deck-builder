// The stored pair network (spec 8.2). New code on top of the ported analyzeCardPair.
//
// buildEdges runs the ported pair analysis over every pair of cards that can share a deck, removes reasons a
// suppressor or a reviewed rule-forbidden entry rejects, quotes both cards' text in each reason and returns
// the pairs that are left with a non-zero net.
import { toScoreCard, deriveTraits, round, clamp, type ScoreCard, type Trait } from '../mine';
import { championTagOf, isSignature, isTokenCard, sameTag } from '../rules/champion';
import type { Card, CardEdge, Domain, EdgeReason } from '../types';
import { analyzeCardPair, cardNameStem, escapeRegExp, hasAnyTrait } from './pair';
import { quoteCard } from './quote';
import { judgeReason, type PackageSides } from './suppress';
import type { CombinationReason } from './types';

/** A reviewed entry of sync-data/card-overrides.json (`forbiddenInteractions`): the rules say this pair does not work. */
export interface ForbiddenInteraction {
  /** Public codes or rules names of the two cards. */
  cards: [string, string];
  rule: string;
  reason: string;
  source: string;
  /** The supposed combo, in words. */
  claim?: string;
  /**
   * Synergy reasons to drop, by id prefix ("package:", "reference:"); "*" or an absent list = every synergy
   * reason of the pair; an empty list = the pair's ordinary joins are legal and stay (only the claimed line
   * is illegal).
   */
  drop?: string[];
}

export interface BuildEdgesOptions {
  forbidden?: readonly ForbiddenInteraction[];
  /** Traits a reviewed mine override removed, per card id: reasons resting on them are dropped. */
  removedTraits?: Readonly<Record<string, readonly string[]>>;
  /** Called for every reason a suppressor rejects (reports and audits). */
  onSuppress?: (suppressor: string, reason: CombinationReason, left: ScoreCard, right: ScoreCard) => void;
  /** Keep pairs whose only reasons are generic resource/curve notes (see GENERIC_REASONS). Default false. */
  includeGeneric?: boolean;
}

export interface BuildEdgesStats {
  nodes: number; pairsChecked: number; edges: number;
  suppressed: Record<string, number>; forbiddenApplied: number; genericOnlyDropped: number;
}

const DOMAIN_BIT: Record<Domain, number> = { fury: 1, calm: 2, mind: 4, body: 8, chaos: 16, order: 32 };
const mask = (domains: readonly Domain[]): number => domains.reduce((m, d) => m | DOMAIN_BIT[d], 0);

/** Cards the network has a node for: complete, non-token units, spells, gear, legends and battlefields. */
export const isNetworkCard = (card: Card): boolean =>
  !card.dataIncomplete && !isTokenCard(card) &&
  (card.type === 'unit' || card.type === 'spell' || card.type === 'gear' || card.type === 'legend' || card.type === 'battlefield');

const isMain = (card: Card): boolean => card.type === 'unit' || card.type === 'spell' || card.type === 'gear';

/**
 * Can the two cards be in one legal deck? Domain Identity (CR 103.2.b): some legend's domains hold both;
 * a signature card needs the legend of its champion tag (CR 103.2.d). Bans are per format and not applied.
 * A card with unknown domains (empty list, no no-domain mark) never pairs.
 */
export function deckSharing(cards: readonly Card[]): (a: Card, b: Card) => boolean {
  const legends = cards.filter((c) => c.type === 'legend' && !isTokenCard(c) && !c.dataIncomplete).map((c) => ({ mask: mask(c.domains), tag: championTagOf(c) }));
  const known = (c: Card): boolean => c.noDomain || c.domains.length > 0;
  const fits = (c: Card, legend: { mask: number; tag: string | null }): boolean =>
    (mask(c.domains) & ~legend.mask) === 0 && (!isSignature(c) || sameTag(championTagOf(c), legend.tag));
  const memo = new Map<string, boolean>();
  return (a, b) => {
    if (!known(a) || !known(b)) return false;
    if (a.type === 'legend' && b.type === 'legend') return false;
    if (a.type === 'battlefield' && b.type === 'battlefield') return false;
    if (a.type === 'legend') return fits(b, { mask: mask(a.domains), tag: championTagOf(a) });
    if (b.type === 'legend') return fits(a, { mask: mask(b.domains), tag: championTagOf(b) });
    const sigA = isSignature(a) ? championTagOf(a) ?? '?' : '';
    const sigB = isSignature(b) ? championTagOf(b) ?? '?' : '';
    const key = `${mask(a.domains) | mask(b.domains)}|${sigA}|${sigB}`;
    let held = memo.get(key);
    if (held === undefined) {
      held = legends.some((l) => fits(a, l) && fits(b, l));
      memo.set(key, held);
    }
    return held;
  };
}

/**
 * Reasons that hold for almost any two cards of the right cost or keyword and say nothing about how the two
 * cards work together: curve and Power collisions, "protection next to an engine", cheap card next to
 * Legion, ramp next to any expensive card. HEURISTIC choice: a pair with only such reasons is not stored
 * (measured 2026-11-12: they are the large majority of non-zero pairs and would bury a card's real
 * partners). Deck scoring (plan Task 6) still gets them from analyzeCardPair directly.
 */
export const GENERIC_REASONS: readonly string[] = ['curve-collision:', 'early-power-collision:', 'protect-engine:', 'legion-sequencing:', 'top-end-support:'];
export const isGenericReason = (id: string): boolean => GENERIC_REASONS.some((p) => id.startsWith(p));

const SIDE_TRAITS: Record<string, [Trait[], Trait[]]> = {
  'counter-protection': [['counter'], ['skip', 'scoring']],
  'extra-turn-value': [['skip'], ['hold', 'scoring', 'ready']],
  'extra-turn-ramp': [['skip'], ['energy-ramp', 'cost-reduction']],
  'top-end-support': [['energy-ramp', 'cost-reduction', 'channel-rune'], []],
  'ready-trigger': [['ready'], ['assault', 'exhaust', 'ready']],
  'protect-engine': [['tank', 'deflect', 'backline', 'damage-prevention'], ['hold', 'draw', 'energy-ramp', 'spell-matters', 'token-matters', 'death-payoff', 'trash-payoff']],
  'legion-sequencing': [['legion'], []],
  'equipment-assault': [['assault'], ['equipment', 'equip']],
  'trash-contention': [['flow', 'trash-banish', 'trash-retrieval'], ['flow', 'trash-banish', 'trash-retrieval']],
};

const costLine = (c: ScoreCard): string => `${c.name} costs ${c.energy ?? 0} Energy${(c.power ?? 0) > 0 ? ` and ${c.power} Power` : ''}`;

/** The ported detail plus a quote from each card: the sentence that carries the trait the reason rests on. */
export function quoteReason(reason: CombinationReason, left: ScoreCard, right: ScoreCard, sides?: PackageSides | null): string {
  const kind = reason.id.slice(0, reason.id.indexOf(':'));
  const lt = deriveTraits(left);
  const rt = deriveTraits(right);
  let quotes: [string, string];
  if (kind === 'package') {
    const [x, y] = reason.traits as [Trait, Trait];
    // Which card holds which side of the package: the orientation the suppressors accepted, else by traits.
    const enabler = sides ? sides.enabler : lt.has(x) && rt.has(y) ? left : right;
    const payoff = sides ? sides.payoff : enabler === left ? right : left;
    quotes = [quoteCard(enabler, [x]), quoteCard(payoff, [y])];
  } else if (kind === 'tag-reference') {
    const tag = reason.id.split(':')[1] ?? '';
    const pattern = new RegExp(`\\b${escapeRegExp(tag)}(?:s|es)?\\b`, 'i');
    const side = (c: ScoreCard) => (pattern.test(c.rulesText.replace(/\([^)]*\)/g, ' ')) ? quoteCard(c, [], pattern) : `${c.name} is ${/^[AEIOU]/i.test(tag) ? 'an' : 'a'} ${tag}`);
    quotes = [side(left), side(right)];
  } else if (kind === 'reference') {
    const side = (c: ScoreCard, other: ScoreCard) => {
      const pattern = new RegExp(`\\b${escapeRegExp(cardNameStem(other))}\\b`, 'i');
      return pattern.test(c.rulesText.replace(/\([^)]*\)/g, ' ')) ? quoteCard(c, [], pattern) : `${c.name} is the card named`;
    };
    quotes = [side(left, right), side(right, left)];
  } else if (kind === 'top-end-support') {
    // The ramp card and the expensive card it helps (both cards may hold a ramp trait).
    const ramp: Trait[] = ['energy-ramp', 'cost-reduction', 'channel-rune'];
    const leftHelps = hasAnyTrait(lt, ramp) && (right.energy ?? 0) >= 6 && !rt.has('skip');
    quotes = leftHelps ? [quoteCard(left, ramp), costLine(right)] : [costLine(left), quoteCard(right, ramp)];
  } else if (kind === 'curve-collision' || kind === 'early-power-collision') {
    quotes = [costLine(left), costLine(right)];
  } else {
    const [first, second] = SIDE_TRAITS[kind] ?? [[], []];
    const forward = hasAnyTrait(lt, first) && (second.length === 0 || hasAnyTrait(rt, second));
    // A side with no trait is there for its cost (the cheap card next to Legion, the expensive card next to ramp).
    const side = (c: ScoreCard, traits: Trait[]): string => (traits.length ? quoteCard(c, traits) : costLine(c));
    quotes = forward ? [side(left, first), side(right, second)] : [side(left, second), side(right, first)];
  }
  return `${reason.detail} ${quotes[0]} | ${quotes[1]}`;
}

const keyOf = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Forbidden entries resolved to card-id pairs. An entry naming a card the pool lacks is skipped. */
export function forbiddenByPair(entries: readonly ForbiddenInteraction[] | undefined, cards: readonly Card[]): Map<string, ForbiddenInteraction> {
  const byKey = new Map<string, Card>();
  for (const c of cards) { byKey.set(c.code.toLowerCase(), c); byKey.set(c.name.toLowerCase(), c); }
  const out = new Map<string, ForbiddenInteraction>();
  for (const entry of entries ?? []) {
    const [a, b] = entry.cards.map((k) => byKey.get(k.toLowerCase()));
    if (a && b) out.set(keyOf(a.id, b.id), entry);
  }
  return out;
}

/**
 * One pair -> edge, or null when nothing is left. Totals are recomputed from the reasons that survive with
 * the ported clamps (synergy 0..10, antisynergy 0..5).
 */
export function edgeForPair(a: Card, b: Card, forbidden?: ForbiddenInteraction, stats?: BuildEdgesStats, options: BuildEdgesOptions = {}): CardEdge | null {
  const left = toScoreCard(a);
  const right = toScoreCard(b);
  const analysis = analyzeCardPair(left, right);
  if (analysis.reasons.length === 0) return null;
  const [l, r] = analysis.cardIds[0] === left.id ? [left, right] : [right, left];
  const kept: { reason: CombinationReason; sides: PackageSides | null }[] = [];
  let droppedByRule = false;
  for (const reason of analysis.reasons) {
    if (forbidden && reason.kind === 'synergy' && (!forbidden.drop || forbidden.drop.some((p) => p === '*' || reason.id.startsWith(p)))) { droppedByRule = true; continue; }
    const { suppressor, sides } = judgeReason(reason, l, r, options.removedTraits);
    if (suppressor) { if (stats) stats.suppressed[suppressor] = (stats.suppressed[suppressor] ?? 0) + 1; options.onSuppress?.(suppressor, reason, l, r); continue; }
    kept.push({ reason, sides });
  }
  if (droppedByRule && stats) stats.forbiddenApplied += 1;
  if (kept.length === 0) return null;
  if (!options.includeGeneric && kept.every((x) => isGenericReason(x.reason.id))) { if (stats) stats.genericOnlyDropped += 1; return null; }
  const synergy = round(clamp(kept.filter((x) => x.reason.kind === 'synergy').reduce((s, x) => s + x.reason.value, 0), 0, 10), 2);
  const antisynergy = round(clamp(kept.filter((x) => x.reason.kind === 'antisynergy').reduce((s, x) => s - x.reason.value, 0), 0, 5), 2);
  const net = round(synergy - antisynergy, 2);
  if (net === 0) return null;
  const reasons: EdgeReason[] = kept.map(({ reason: x, sides }) => ({ id: x.id, kind: x.kind, scope: x.scope, label: x.label, detail: quoteReason(x, l, r, sides), value: x.value }));
  return { a: l.id, b: r.id, synergy, antisynergy, net, reasons };
}

export function buildEdgesWithStats(cards: readonly Card[], options: BuildEdgesOptions = {}): { edges: CardEdge[]; stats: BuildEdgesStats } {
  const nodes = cards.filter(isNetworkCard).sort((x, y) => x.id.localeCompare(y.id));
  const share = deckSharing(cards);
  const forbidden = forbiddenByPair(options.forbidden, cards);
  const stats: BuildEdgesStats = { nodes: nodes.length, pairsChecked: 0, edges: 0, suppressed: {}, forbiddenApplied: 0, genericOnlyDropped: 0 };
  const edges: CardEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    // A second copy of the same card is a pair too ("another Dragon"), for main-deck cards that allow copies.
    for (let j = isMain(a) && a.copyLimit > 1 ? i : i + 1; j < nodes.length; j += 1) {
      const b = nodes[j];
      if (i !== j && !share(a, b)) continue;
      stats.pairsChecked += 1;
      const edge = edgeForPair(a, b, forbidden.get(keyOf(a.id, b.id)), stats, options);
      if (edge) edges.push(edge);
    }
  }
  stats.edges = edges.length;
  return { edges, stats };
}

/** Every stored pair of the pool: cards that can share a deck, net != 0, suppressors and forbidden entries applied. */
export const buildEdges = (cards: readonly Card[], options: BuildEdgesOptions = {}): CardEdge[] => buildEdgesWithStats(cards, options).edges;

/** The `removeTraits` of the reviewed mine overrides, in the shape BuildEdgesOptions.removedTraits takes. */
export function removedTraitsOf(overrides: Readonly<Record<string, { removeTraits?: string[] }>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [id, o] of Object.entries(overrides)) if (o.removeTraits?.length) out[id] = [...o.removeTraits];
  return out;
}
