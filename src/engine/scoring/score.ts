// Per-card score 0-100 (plan Task 6; spec 10; docs/research/deck-theory.md 7). New code. Pure.
//
// HEURISTIC throughout: the weights are those of spec 10; the formulas start from deck-theory.md 7.3 and use
// the stored knowledge network (ported pair analysis + measured co-play) for synergy instead of axis matching
// alone. Two different data sources feed two different parts and the reasons say which:
// - Quality  = the card's EVALUATED rating: mechanical text rating blended with measured play of the card
//              across every list that could run it (CardFeatures.evaluatedRating, any legend).
// - Meta     = per-legend inclusion: how often lists of THIS legend run the card (LegendMeta).
// The ported Riftfoundry candidate fit (scoring/bridge.ts candidateFit) scores one card with two full deck
// scores; it is too slow for the whole pool (spec 10: 150 ms), so the pool is scored from stored edges here
// and candidateFit is kept for swap proposals (plan Task 8).
import { isCoPlayReason } from '../evidence/coplay';
import { axisLabel } from '../features/axes';
import { ROLE_LABELS } from '../features/roles';
import { cardRuneReliability, type RuneRecommendation } from '../maths/hypergeo';
import { runeSplit } from '../maths/runes';
import { isGenericReason } from '../network/edges';
import { championTagOf, isSignature, isTokenCard, sameTag } from '../rules/champion';
import { copyLimit } from '../rules/copies';
import { SIGNATURE_MAX } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { cardFitsDeck } from '../rules/validate';
import { featuresFor, profileFor, qtyOf, resolveThemeWeights, summarizeDeck, withoutCopy } from '../summary';
import { bandText, targetsFor, type FullTargets } from '../targets';
import type { AxisId, Card, CardDb, CardEdge, CardFeatures, CardScore, Deck, DeckSummary, Domain, EngineContext, Format, LegendMeta, Role, ScorePart, Zone } from '../types';
import { scoreCardOf } from './bridge';

/** Spec 10 weights. */
export const SCORE_WEIGHTS = { quality: 25, synergy: 30, role: 15, curve: 15, meta: 10, fit: 5 } as const;

/** HEURISTIC constants of the card score. */
export const SCORE = {
  /** Evaluated rating mapped to 0..1: at or below `ratingFloor` 0, at or above `ratingCeil` 1 (p3 and p97 of the pool). */
  ratingFloor: 30, ratingCeil: 80,
  /** Each further partner counts this much of the one before (saturation). */
  partnerDecay: 0.75,
  /** Edge sum at which the edge half is 1 - 1/e. One typical stored edge is 1.42. */
  edgeScale: 2.5,
  extraCopy: 0.15, legendEdge: 1.5, championEdge: 1.25,
  edgeShare: 0.65, axisShare: 0.35, antiShare: 0.3, antiScale: 3,
  secondAxis: 0.15, scarceSide: 1.15, ownSignature: 0.6,
  /** Meta weight = 10 x lists / (lists + metaPrior); the rest moves to Quality and Synergy in halves. */
  metaPrior: 8, metaFullShare: 0.6,
  noBandedRole: 0.25, minorRole: 0.8,
  castShare: 0.6, curveUnder: 1, curveInside: 0.6, curveOver: 0.2,
  partners: 5,
} as const;

const CORE_ROLES: readonly Role[] = ['unit-body', 'removal', 'card-flow'];
const DOMAIN_LABEL: Record<Domain, string> = { fury: 'Fury', calm: 'Calm', mind: 'Mind', body: 'Body', chaos: 'Chaos', order: 'Order' };

const clamp01 = (x: number): number => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
const r1 = (x: number): number => Math.round(x * 10) / 10;
const pct = (x: number): string => `${Math.round(x * 100)}%`;
const isMainType = (card: Card): boolean => card.type === 'unit' || card.type === 'spell' || card.type === 'gear';
const bandKey = (role: Role): string => (role === 'unit-body' ? 'unit' : role === 'gear' ? 'gear' : `role:${role}`);
const roleCount = (s: DeckSummary, role: Role): number => (role === 'unit-body' ? s.typeCounts.unit : role === 'gear' ? s.typeCounts.gear : s.roleCounts[role]);

/** HEURISTIC (deck-theory.md 5.2): value multipliers of a card outside 1v1, as [ffa3, ffa4, 2v2]. */
const MODE_RULES: readonly { label: string; when: (card: Card, f: CardFeatures) => boolean; x: readonly [number, number, number] }[] = [
  { label: 'sweepers hit more units', when: (_, f) => f.roles.includes('sweeper'), x: [1.25, 1.4, 1.1] },
  { label: 'one-for-one removal covers fewer of the threats', when: (_, f) => f.roles.includes('removal') && !f.roles.includes('sweeper'), x: [0.85, 0.8, 1] },
  { label: 'more spells than one counter can stop', when: (_, f) => f.roles.includes('counter'), x: [0.85, 0.8, 1] },
  { label: 'a hold must survive more enemy turns', when: (_, f) => f.roles.includes('protection') || f.traits.some((t) => t === 'hold' || t === 'hold-payoff' || t === 'shield' || t === 'tank' || t === 'deflect'), x: [1.15, 1.25, 1.15] },
  { label: 'direct points skip the final-point rule', when: (_, f) => f.roles.includes('point-source') || f.traits.includes('skip'), x: [1.3, 1.3, 1.2] },
  { label: 'friendly effects reach a teammate', when: (_, f) => f.roles.includes('buff-source'), x: [1, 1, 1.3] },
  { label: 'longer games reward top-end', when: (c) => (c.energy ?? 0) >= 6, x: [1.1, 1.15, 1.15] },
  { label: 'early tempo is diluted', when: (c) => c.type === 'unit' && (c.energy ?? 99) <= 1, x: [0.9, 0.85, 0.95] },
  { label: 'a third battlefield is more often open', when: (_, f) => f.roles.includes('mobility') || f.traits.includes('conquer'), x: [1.1, 1.1, 1] },
];
const modeIndex = (format: Format): number => (format === 'ffa3' ? 0 : format === 'ffa4' ? 1 : format === '2v2' ? 2 : -1);

interface DeckCard { card: Card; qty: number; f: CardFeatures }

interface Frame {
  deck: Deck;
  summary: DeckSummary;
  targets: FullTargets;
  theme: Record<AxisId, number>;
  cards: DeckCard[];
  copies: Map<string, number>;          // main + side, by id
  signatures: number;                   // main + side
  runes: RuneRecommendation[];
  runesAreRecommended: boolean;
  legend: Card | null;
  champion: Card | null;
  meta: LegendMeta | undefined;
  max: Record<ScorePart['key'], number>;
}

function buildFrame(deck: Deck, db: CardDb): Frame {
  const summary = summarizeDeck(deck, db);
  const cards: DeckCard[] = [];
  const copies = new Map<string, number>();
  let signatures = 0;
  for (const entry of deck.main) {
    const card = db.get(entry.id);
    const qty = qtyOf(entry);
    if (!card || qty === 0) continue;
    cards.push({ card, qty, f: featuresFor(db, card) });
  }
  for (const entry of [...deck.main, ...deck.side]) {
    const card = db.get(entry.id);
    const qty = qtyOf(entry);
    if (!card || qty === 0) continue;
    copies.set(card.id, (copies.get(card.id) ?? 0) + qty);
    if (isSignature(card)) signatures += qty;
  }
  const legend = legendOf(deck, db);
  const own = Object.entries(deck.runes).filter(([, n]) => Number.isFinite(n) && (n ?? 0) > 0) as [Domain, number][];
  const split = own.length ? own : (Object.entries(runeSplit(deck, db)) as [Domain, number][]);
  const meta = legend ? db.legendMeta(legend.id) : undefined;
  const lists = meta?.decks ?? 0;
  const metaMax = r1(SCORE_WEIGHTS.meta * (lists / (lists + SCORE.metaPrior)));
  const moved = (SCORE_WEIGHTS.meta - metaMax) / 2;
  return {
    deck, summary, targets: targetsFor(deck, db, summary), theme: resolveThemeWeights(deck, db, summary), cards, copies, signatures,
    runes: split.map(([domain, count]) => ({ domain, count, demand: summary.powerDemand[domain] ?? 0 })),
    runesAreRecommended: own.length === 0,
    legend, champion: deck.champion ? db.get(deck.champion) ?? null : null, meta,
    max: { quality: r1(SCORE_WEIGHTS.quality + moved), synergy: r1(SCORE_WEIGHTS.synergy + SCORE_WEIGHTS.quality + SCORE_WEIGHTS.meta - metaMax - r1(SCORE_WEIGHTS.quality + moved)), role: SCORE_WEIGHTS.role, curve: SCORE_WEIGHTS.curve, meta: metaMax, fit: SCORE_WEIGHTS.fit },
  };
}

/** Net of an edge without the reasons that hold for any two cards of a deck (curve collisions and the like). */
function edgeValue(edge: CardEdge): { net: number; label: string; measuredOnly: boolean } {
  let net = 0;
  let best: { value: number; label: string } | null = null;
  let mechanical = false;
  for (const reason of edge.reasons) {
    if (isGenericReason(reason.id)) continue;
    const v = Math.abs(reason.value);
    net += reason.kind === 'synergy' ? v : -v;
    if (!isCoPlayReason(reason)) mechanical = true;
    if (!best || v > best.value) best = { value: v, label: reason.label };
  }
  return { net, label: best?.label ?? '', measuredOnly: !mechanical && best !== null };
}

const gated = (card: Card, code: string, message: string): CardScore => ({ id: card.id, score: 0, parts: [], reasons: [message], partners: [], gate: { code, message } });

function gateOf(card: Card, zone: Zone, frame: Frame, db: CardDb): { code: string; message: string } | null {
  if (isTokenCard(card)) return { code: 'TOKEN_IN_DECK', message: `${card.name} is a token; tokens are not deck cards.` };
  const issue = cardFitsDeck(card, zone, frame.deck, db);
  if (issue && (issue.severity === 'error' || issue.code === 'DATA_STALE')) return { code: issue.code, message: issue.message };
  if (card.dataIncomplete) return { code: 'DATA_STALE', message: `${card.name} (${card.code}) has incomplete card data in the official gallery; it is not scored or built with until the row is complete.` };
  if (zone === 'main' || zone === 'side') {
    const held = frame.copies.get(card.id) ?? 0;
    const limit = copyLimit(card);
    if (held >= limit) return { code: limit === 1 ? 'UNIQUE_LIMIT_EXCEEDED' : 'COPY_LIMIT_EXCEEDED', message: `${card.name}: the deck already has ${held} of ${limit} allowed ${limit === 1 ? 'copy' : 'copies'} (main and side deck together).` };
    if (isSignature(card) && frame.signatures >= SIGNATURE_MAX) return { code: 'SIGNATURE_TOTAL_EXCEEDED', message: `${card.name} would be signature card ${frame.signatures + 1}; a deck may hold ${SIGNATURE_MAX}.` };
  }
  return null;
}

function scoreMain(card: Card, zone: Zone, frame: Frame, db: CardDb): CardScore {
  const f = featuresFor(db, card);
  const reasons: string[] = [];
  const legendName = frame.legend?.name ?? 'this legend';

  // Quality: the evaluated rating (mechanical rating blended with the card's measured play in all lists).
  const q = clamp01((f.evaluatedRating - SCORE.ratingFloor) / (SCORE.ratingCeil - SCORE.ratingFloor));
  const quality = r1(frame.max.quality * q);
  const ev = f.evidence;
  reasons.push(
    `Quality ${quality}/${frame.max.quality}: evaluated rating ${f.evaluatedRating} = mechanical text rating ${f.baseRating}` +
    (ev && ev.eligibleLists > 0
      ? ` blended with measured play across all legends (in ${ev.lists} of ${ev.eligibleLists} lists that could run it, share ${pct(ev.share)}${ev.banned ? ', from before its ban' : ''}).`
      : ' (no play data for this card, so the text rating stands).'),
  );

  // Synergy: stored edges into the deck, the legend and the Chosen Champion; then theme axes.
  const positives: { id: string; name: string; v: number; label: string; measuredOnly: boolean }[] = [];
  const negatives: { id: string; name: string; v: number; label: string }[] = [];
  const consider = (other: Card, weight: number): void => {
    if (other.id === card.id) return;
    const edge = db.edge(card.id, other.id);
    if (!edge) return;
    const { net, label, measuredOnly } = edgeValue(edge);
    if (net > 0) positives.push({ id: other.id, name: other.name, v: net * weight, label, measuredOnly });
    else if (net < 0) negatives.push({ id: other.id, name: other.name, v: -net * weight, label });
  };
  const seen = new Set<string>();
  for (const d of frame.cards) {
    seen.add(d.card.id);
    consider(d.card, (1 + SCORE.extraCopy * (Math.min(3, d.qty) - 1)) * (frame.champion?.id === d.card.id ? SCORE.championEdge : 1));
  }
  if (frame.legend) consider(frame.legend, SCORE.legendEdge);
  if (frame.champion && !seen.has(frame.champion.id)) consider(frame.champion, SCORE.championEdge);
  for (const id of frame.deck.battlefields) { const bf = db.get(id); if (bf) consider(bf, 1); }
  positives.sort((a, b) => b.v - a.v || a.id.localeCompare(b.id));
  negatives.sort((a, b) => b.v - a.v || a.id.localeCompare(b.id));
  let raw = 0;
  positives.forEach((p, i) => { raw += p.v * SCORE.partnerDecay ** i; });
  const edgePart = 1 - Math.exp(-raw / SCORE.edgeScale);
  const anti = Math.min(1, negatives.reduce((n, x) => n + x.v, 0) / SCORE.antiScale);

  let bestAxis: { id: AxisId; value: number; side: 'enabler' | 'payoff' } | null = null;
  let second = false;
  for (const [axis, v] of Object.entries(f.axes)) {
    const w = frame.theme[axis] ?? 0;
    if (w <= 0) continue;
    const totals = frame.summary.axisTotals[axis] ?? { e: 0, p: 0 };
    const side: 'enabler' | 'payoff' = v.p >= v.e ? 'payoff' : 'enabler';
    // The scarcer side of an axis is worth more: a payoff where the deck has enablers but few payoffs, and the reverse.
    const scarce = side === 'payoff' ? totals.p < totals.e : totals.e < totals.p;
    const value = Math.min(1, w * Math.max(v.e, v.p) * (scarce ? SCORE.scarceSide : 1));
    if (!bestAxis || value > bestAxis.value) { if (bestAxis && (frame.theme[bestAxis.id] ?? 0) >= 0.5) second = true; bestAxis = { id: axis, value, side }; }
    else if (w >= 0.5) second = true;
  }
  let axisPart = bestAxis ? Math.min(1, bestAxis.value + (second ? SCORE.secondAxis : 0)) : 0;
  const ownSignature = isSignature(card) && frame.legend !== null && sameTag(championTagOf(card), championTagOf(frame.legend));
  if (ownSignature) axisPart = Math.max(axisPart, SCORE.ownSignature);
  const synergy = r1(frame.max.synergy * clamp01(SCORE.edgeShare * edgePart + SCORE.axisShare * axisPart - SCORE.antiShare * anti));
  const partnerText = positives.slice(0, 3).map((p) => `${p.name} (${p.label}${p.measuredOnly ? ', measured co-play only' : ''})`).join(', ');
  const synergyBits: string[] = [];
  if (positives.length) synergyBits.push(`works with ${partnerText}${positives.length > 3 ? ` and ${positives.length - 3} more` : ''}`);
  if (bestAxis) synergyBits.push(`${bestAxis.side} on the deck's ${axisLabel(bestAxis.id)} theme (weight ${(frame.theme[bestAxis.id] ?? 0).toFixed(2)})`);
  if (ownSignature) synergyBits.push(`signature card of ${legendName}'s champion`);
  if (negatives.length) synergyBits.push(`clashes with ${negatives.slice(0, 2).map((n) => `${n.name} (${n.label})`).join(', ')}`);
  reasons.push(`Synergy ${synergy}/${frame.max.synergy}: ${synergyBits.length ? synergyBits.join('; ') : `no stored interaction with ${frame.cards.length ? 'the cards in the deck' : legendName} and no match with its themes`}.`);

  // Role need against the bands of a full deck.
  let need: number = SCORE.noBandedRole;
  let needText = `${card.name} has no role the bands track`;
  let banded = false;
  for (const role of f.roles) {
    const band = frame.targets.full[bandKey(role)];
    if (!band) continue;
    const count = roleCount(frame.summary, role);
    const base = count >= band.hi ? 0 : count < band.lo ? 0.5 + 0.5 * ((band.lo - count) / Math.max(1, band.lo)) : 0.5 * ((band.hi - count) / Math.max(1, band.hi - band.lo));
    const value = base * (CORE_ROLES.includes(role) ? 1 : SCORE.minorRole);
    if (!banded || value > need) {
      need = value;
      needText = count >= band.hi
        ? `${ROLE_LABELS[role]} is full (${count}, band ${bandText(band)} for ${frame.targets.archetype})`
        : `${ROLE_LABELS[role]} ${count < band.lo ? 'is short' : 'has room'} (${count}, band ${bandText(band)} for ${frame.targets.archetype})`;
    }
    banded = true;
  }
  const role = r1(frame.max.role * clamp01(need));
  reasons.push(`Role need ${role}/${frame.max.role}: ${needText}.`);

  // Curve slot and castability with the deck's runes.
  const slot = frame.targets.full[`e${f.costBucket}`];
  const inSlot = frame.summary.curve[f.costBucket] ?? 0;
  const curveFit = !slot ? SCORE.curveInside : inSlot < slot.lo ? SCORE.curveUnder : inSlot < slot.hi ? SCORE.curveInside : SCORE.curveOver;
  const power = card.power ?? 0;
  const cast = power > 0 ? cardRuneReliability(scoreCardOf(card), frame.runes) : 1;
  const curve = r1(frame.max.curve * clamp01(SCORE.castShare * cast + (1 - SCORE.castShare) * curveFit));
  const slotName = `${f.costBucket >= 7 ? '7+' : f.costBucket}-Energy slot`;
  const slotText = !slot ? `${slotName} has no band` : `${slotName} ${inSlot < slot.lo ? 'is under' : inSlot < slot.hi ? 'is inside' : 'is at or over'} its band (${inSlot}, band ${bandText(slot)})`;
  const payable = (card.powerDomains.length ? card.powerDomains : card.domains);
  const have = frame.runes.filter((r) => (payable as string[]).includes(r.domain)).reduce((n, r) => n + r.count, 0);
  const castText = power > 0
    ? `; its ${power} ${payable.map((d) => DOMAIN_LABEL[d]).join('/')} Power is paid on time in ${pct(cast)} of games with ${have} of ${frame.runes.reduce((n, r) => n + r.count, 0)} runes${frame.runesAreRecommended ? ' (recommended split, the deck has no runes yet)' : ''}`
    : '; no Power cost';
  reasons.push(`Curve and runes ${curve}/${frame.max.curve}: ${slotText}${castText}.`);

  // Meta: per-legend inclusion.
  let meta = 0;
  if (frame.max.meta > 0 && frame.meta) {
    const stat = (zone === 'side' ? frame.meta.side : frame.meta.main)[card.id];
    if (stat && stat.share > 0) {
      const overall = Math.max(0.01, ev?.share ?? stat.share);
      const lift = Math.max(0, Math.min(1.5, Math.log2(stat.share / overall))) / 1.5;
      meta = r1(frame.max.meta * clamp01(0.6 * Math.min(1, stat.share / SCORE.metaFullShare) + 0.4 * lift));
      reasons.push(`Meta ${meta}/${frame.max.meta}: per-legend inclusion data - ${stat.decks} of ${frame.meta.decks} ${legendName} lists run it${zone === 'side' ? ' in the side deck' : ''} (${pct(stat.share)}, ${stat.avgCopies.toFixed(1)} copies)${frame.meta.quality !== 'ok' ? `; sample is ${frame.meta.quality}, so this part weighs ${frame.max.meta} instead of ${SCORE_WEIGHTS.meta}` : ''}.`);
    } else {
      reasons.push(`Meta 0/${frame.max.meta}: per-legend inclusion data - none of ${frame.meta.decks} ${legendName} lists run it${zone === 'side' ? ' in the side deck' : ''}.`);
    }
  } else {
    reasons.push(`Meta 0/0: no public lists of ${legendName}; this part's weight moved to Quality and Synergy.`);
  }

  // Format and power fit.
  const mi = modeIndex(frame.deck.format);
  let product = 1;
  const modeNotes: string[] = [];
  if (mi >= 0) for (const rule of MODE_RULES) if (rule.x[mi] !== 1 && rule.when(card, f)) { product *= rule.x[mi]; modeNotes.push(`${rule.label} (x${rule.x[mi]})`); }
  const modeTerm = clamp01(0.75 * product);
  const powerTerm = frame.deck.power === 'casual' ? 0.7 : clamp01((f.evaluatedRating - (frame.deck.power === 'competitive' ? 45 : 40)) / 30);
  const fit = r1(frame.max.fit * clamp01(0.5 * modeTerm + 0.5 * powerTerm));
  reasons.push(`Format and power fit ${fit}/${frame.max.fit} (heuristic): ${modeNotes.length ? modeNotes.join(', ') : mi >= 0 ? 'no multiplayer adjustment applies' : '1v1 baseline'}; rating ${f.evaluatedRating} against the ${frame.deck.power} power target.`);

  const parts: ScorePart[] = [
    { key: 'quality', points: quality, max: frame.max.quality }, { key: 'synergy', points: synergy, max: frame.max.synergy },
    { key: 'role', points: role, max: frame.max.role }, { key: 'curve', points: curve, max: frame.max.curve },
    { key: 'meta', points: meta, max: frame.max.meta }, { key: 'fit', points: fit, max: frame.max.fit },
  ];
  const partners = [
    ...positives.slice(0, SCORE.partners).map((p) => ({ id: p.id, net: Math.round(p.v * 100) / 100, reason: p.measuredOnly ? `${p.label} (measured co-play, not a rules interaction)` : p.label })),
    ...negatives.slice(0, 2).map((n) => ({ id: n.id, net: -Math.round(n.v * 100) / 100, reason: n.label })),
  ];
  return { id: card.id, score: Math.max(0, Math.min(100, Math.round(parts.reduce((n, p) => n + p.points, 0)))), parts, reasons, partners, gate: null };
}

/** Battlefields: how often this legend's lists bring it (data) and whether its text fits the legend (heuristic). */
function scoreBattlefield(card: Card, frame: Frame, db: CardDb): CardScore {
  const legendName = frame.legend?.name ?? 'this legend';
  const stat = frame.meta?.battlefields[card.id];
  const lists = frame.meta?.decks ?? 0;
  const metaMax = r1(60 * (lists / (lists + SCORE.metaPrior)));
  const fitMax = r1(100 - metaMax);
  const meta = stat ? r1(metaMax * Math.min(1, stat.share / 0.5)) : 0;
  const text = profileFor(frame.deck, db)?.battlefieldFit.find((b) => b.id === card.id);
  let raw = text ? 0.7 : 0.3;
  const partners: CardScore['partners'] = [];
  for (const d of frame.cards) {
    const edge = db.edge(card.id, d.card.id);
    if (!edge) continue;
    const { net, label } = edgeValue(edge);
    if (net > 0) { raw += 0.1; partners.push({ id: d.card.id, net: Math.round(net * 100) / 100, reason: label }); }
  }
  partners.sort((a, b) => b.net - a.net || a.id.localeCompare(b.id));
  const fit = r1(fitMax * clamp01(raw));
  const reasons = [
    lists > 0
      ? `Meta ${meta}/${metaMax}: per-legend data - ${stat?.decks ?? 0} of ${lists} ${legendName} lists bring ${card.name}${stat ? ` (${pct(stat.share)})` : ''}.`
      : `Meta 0/0: no public lists of ${legendName}.`,
    `Synergy ${fit}/${fitMax} (heuristic): ${text ? text.reason : `the text of ${card.name} does not meet what ${legendName} rewards or produces`}${partners.length ? `; interacts with ${partners.slice(0, 3).map((p) => db.get(p.id)?.name ?? p.id).join(', ')}` : ''}.`,
  ];
  return {
    id: card.id, score: Math.round(meta + fit),
    parts: [{ key: 'meta', points: meta, max: metaMax }, { key: 'synergy', points: fit, max: fitMax }],
    reasons, partners: partners.slice(0, SCORE.partners), gate: null,
  };
}

export interface Scorer {
  /** Score of one more copy of `card` in `zone` (default main). A card already in the main deck is scored leave-one-out. */
  score(card: Card, zone?: Zone): CardScore;
  /** Every main-deck card of the pool that passes `filter`, best first; gated cards (score 0) come last. */
  scoreAll(filter?: (c: Card) => boolean): CardScore[];
}

/**
 * Builds the scorer of one deck state. Deck-dependent work (summary, targets, themes, runes) is done once
 * here and once per in-deck card for its leave-one-out view; per-card work is edge lookups.
 * Never throws: an empty deck, a deck with no legend, unknown ids and non-finite quantities all score.
 */
export function createScorer(deck: Deck, ctx: EngineContext): Scorer {
  const db = ctx.db;
  const base = buildFrame(deck, db);
  const inMain = new Set(base.cards.map((d) => d.card.id));
  const without = new Map<string, Frame>();
  const frameFor = (card: Card, zone: Zone): Frame => {
    if (zone !== 'main' || !inMain.has(card.id)) return base;
    let frame = without.get(card.id);
    if (!frame) without.set(card.id, (frame = buildFrame(withoutCopy(deck, card.id), db)));
    return frame;
  };
  const score = (card: Card, zone: Zone = 'main'): CardScore => {
    const frame = frameFor(card, zone);
    const gate = gateOf(card, zone, frame, db);
    if (gate) return gated(card, gate.code, gate.message);
    if (zone === 'battlefields') return scoreBattlefield(card, frame, db);
    if (zone === 'main' || zone === 'side') return scoreMain(card, zone, frame, db);
    return { id: card.id, score: 0, parts: [], reasons: [`${card.name} is a ${card.type ?? 'card'}; legends and runes are chosen, not scored.`], partners: [], gate: null };
  };
  return {
    score,
    scoreAll: (filter) => {
      const out: CardScore[] = [];
      for (const card of db.all()) {
        if (!isMainType(card) || (filter && !filter(card))) continue;
        out.push(score(card, 'main'));
      }
      return out.sort((a, b) => b.score - a.score || Number(a.gate !== null) - Number(b.gate !== null) || a.id.localeCompare(b.id));
    },
  };
}
