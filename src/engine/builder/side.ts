// Side deck (spec 13 step 6; docs/research/matchups-and-lines.md section 5). New code: Riftfoundry has none.
//
// Jobs and their slot counts follow section 5.3 rule 6 (the measured shares of 59 lists scaled to the cap of
// 10): gear hate 2-3, removal 2, counter or hand attack 1-2, sweeper 1, protection 1, the rest free. Whether
// a job gets its larger count is decided by the FIELD (the typical lists of every synced legend, wincons/
// field.ts): the share of field lists with 4+ gear, with 22+ units, with 14+ spells. DATA where the field
// exists; with no synced lists the lower counts are used and the reason says so.
// A card is ranked inside a job by (a) how often players of this legend side it (data), (b) the copies it
// answers in the typical lists of the field legends where it is best - tested card against card with
// wincons/answers.ts, so a 3-damage spell is not counted against a 5-Might unit - and (c) its evaluated
// rating. Rule 8 of the section (a side card is one whose value varies across the field) is why (b) uses the
// best third of the field, not the mean. HEURISTIC: the weights of (a)-(c) and the thresholds.
import { copyLimit } from '../rules/copies';
import { isSignature } from '../rules/champion';
import { formatRules } from '../rules/formats';
import { legendOf } from '../rules/identity';
import { createScorer } from '../scoring';
import { featuresFor, qtyOf } from '../summary';
import { REMOVING, answerHits, answersOf, describeAnswer, type Answer } from '../wincons/answers';
import { fieldOf, typicalList, type Field } from '../wincons/field';
import type { BuildOptions, Card, CardDb, Deck, DeckEntry, EngineContext } from '../types';
import { seededBias } from './rng';
import { legalPool, qtyIn, ratingOf, roomFor, total, type BuildPick } from './state';

export type SideJob = 'gear-hate' | 'removal' | 'stack' | 'sweeper' | 'protection' | 'free';

/** HEURISTIC thresholds (matchups-and-lines.md 5.3, rules 1-6). */
export const SIDE = {
  typicalShare: 0.2,
  gearList: 4, gearHeavyList: 6, gearShare: 1 / 3, gearHeavyShare: 0.2,
  wideUnits: 22, wideShare: 0.3,
  spellList: 14, spellShare: 0.5,
  ownSideLists: 5,
  /**
   * Stage 3 review: with ownSide 12 and rating 0.05 the raw count of answered copies decided alone, so every
   * Order legend sided 2x Mordekaiser, Dominating (9 Energy) and 54% of side copies were cards the legend's own
   * lists side. `ownSide` (shrunk by the number of lists) and `fieldSide` are per share of lists (data).
   */
  weights: { ownSide: 60, fieldSide: 40, targets: 1, rating: 0.15, topUp: 1 }, ownPrior: 8,
  /** A card most of the legend's lists side at 1.5+ copies is taken at the copies they side. */
  ownCopiesShare: 0.5,
} as const;

const JOB_LABEL: Record<SideJob, string> = { 'gear-hate': 'Gear hate', removal: 'Extra removal', stack: 'Counter or hand attack', sweeper: 'Sweeper', protection: 'Protection', free: 'Free slot' };
const UNIT_KINDS: readonly Answer['kind'][] = [...REMOVING, 'displace'];

interface Exposure { lists: number; legends: number; gear: number; gearHeavy: number; wide: number; spells: number }
interface FieldView { field: Field; exposure: Exposure; typical: { legend: Card; decks: number; cards: { card: Card; copies: number }[] }[]; reach: Map<string, number[]>; sided: Map<string, { share: number; lists: number; of: number }> }
const views = new WeakMap<CardDb, FieldView>();

function viewOf(db: CardDb): FieldView {
  let held = views.get(db);
  if (held) return held;
  const field = fieldOf(db);
  const typical = field.legends.map(({ legend, meta }) => ({ legend, decks: meta.decks, cards: typicalList(meta, db).filter((t) => t.share >= SIDE.typicalShare).map((t) => ({ card: t.card, copies: t.copies })) }));
  const exposure: Exposure = { lists: field.lists, legends: field.legends.length, gear: 0, gearHeavy: 0, wide: 0, spells: 0 };
  for (const { meta } of field.legends) {
    const sum = { unit: 0, spell: 0, gear: 0 };
    for (const t of typicalList(meta, db)) if (t.card.type === 'unit' || t.card.type === 'spell' || t.card.type === 'gear') sum[t.card.type] += t.copies;
    const w = field.lists > 0 ? meta.decks / field.lists : 0;
    if (sum.gear >= SIDE.gearList) exposure.gear += w;
    if (sum.gear >= SIDE.gearHeavyList) exposure.gearHeavy += w;
    if (sum.unit >= SIDE.wideUnits) exposure.wide += w;
    if (sum.spell >= SIDE.spellList) exposure.spells += w;
  }
  views.set(db, (held = { field, exposure, typical, reach: new Map(), sided: new Map() }));
  return held;
}

/** Expected copies a card answers in each field legend's typical list (a conditional hit counts half). */
function reachOf(card: Card, view: FieldView): number[] {
  const held = view.reach.get(card.id);
  if (held) return held;
  const answers = answersOf(card).filter((a) => UNIT_KINDS.includes(a.kind) || a.kind === 'gear-kill' || (a.kind === 'counter' && !a.counter?.onlyTargeting));
  const out = view.typical.map((t) => {
    if (answers.length === 0) return 0;
    let expected = 0;
    for (const target of t.cards) {
      let best = 0;
      for (const a of answers) {
        const applies = a.kind === 'counter' ? target.card.type === 'spell' : a.kind === 'gear-kill' ? target.card.type === 'gear' : target.card.type === 'unit';
        if (!applies) continue;
        const h = answerHits(a, target.card);
        if (h.hits) best = Math.max(best, h.conditional ? 0.5 : 1);
      }
      expected += best * target.copies;
    }
    return expected;
  });
  view.reach.set(card.id, out);
  return out;
}

/** Share of the field's lists that could side the card (its domains inside the legend's) and do (data). */
function fieldSided(card: Card, view: FieldView): { share: number; lists: number; of: number } {
  const held = view.sided.get(card.id);
  if (held) return held;
  let of = 0;
  let lists = 0;
  for (const { legend, meta } of view.field.legends) {
    if (!card.domains.every((d) => legend.domains.includes(d))) continue;
    of += meta.decks;
    lists += meta.decks * (meta.side[card.id]?.share ?? 0);
  }
  const out = { share: of > 0 ? lists / of : 0, lists: Math.round(lists), of };
  view.sided.set(card.id, out);
  return out;
}

/** Mean expected targets over the third of the field where the card is best, and the legend where it peaks. */
function bestThird(card: Card, view: FieldView): { value: number; peak: { legend: Card; expected: number } | null } {
  const r = reachOf(card, view);
  if (r.length === 0) return { value: 0, peak: null };
  const order = r.map((x, i) => ({ x, i })).sort((a, b) => b.x - a.x || a.i - b.i);
  const top = order.slice(0, Math.max(1, Math.ceil(order.length / 3)));
  const value = top.reduce((n, o) => n + o.x, 0) / top.length;
  return { value, peak: order[0].x > 0 ? { legend: view.typical[order[0].i].legend, expected: order[0].x } : null };
}

function jobsOf(card: Card, db: CardDb): SideJob[] {
  const f = featuresFor(db, card);
  const answers = answersOf(card);
  const jobs: SideJob[] = [];
  if (f.roles.includes('hate') || answers.some((a) => a.kind === 'gear-kill')) jobs.push('gear-hate');
  if (f.roles.includes('sweeper')) jobs.push('sweeper');
  if (f.roles.includes('removal') && !f.roles.includes('sweeper')) jobs.push('removal');
  if (f.roles.includes('counter') || f.traits.includes('hand-disruption') || /\bdiscards?\b/i.test(card.text) && /\b(opponent|enemy|each player)\b/i.test(card.text)) jobs.push('stack');
  if (f.roles.includes('protection')) jobs.push('protection');
  return jobs;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

export interface SidePlan { entries: DeckEntry[]; picks: BuildPick[]; notes: string[] }

/**
 * Builds the side deck of `deck`. Locked side entries stay; everything else is chosen new. Copies in main and
 * side together never pass a card's copy limit, signature cards are left out (their three-card total is a
 * main-deck count), and `ownedOnly` is respected. Empty where the format has no side deck.
 */
export function planSideDeck(deck: Deck, ctx: EngineContext, opts: BuildOptions): SidePlan {
  const db = ctx.db;
  const rules = formatRules(deck.format, db.legality());
  const legend = legendOf(deck, db);
  if (!rules.sideAllowed || rules.sideMax <= 0) return { entries: [], picks: [], notes: [`${deck.format} has no side deck (TR 601.1.c covers best-of-three Constructed).`] };
  const kept = deck.side.filter((e) => e.locked && qtyOf(e) > 0).map((e) => ({ ...e, qty: qtyOf(e) }));
  if (!legend) return { entries: kept, picks: [], notes: ['No legend: no side deck can be chosen.'] };
  const cap = rules.sideMax;
  const view = viewOf(db);
  const ex = view.exposure;
  const hasField = ex.lists > 0;
  const meta = db.legendMeta(legend.id);
  const ownSide = meta && meta.decks >= SIDE.ownSideLists ? meta.side : null;
  let work: Deck = { ...deck, side: kept };
  const picks: BuildPick[] = [];
  const notes: string[] = [];
  const scale = cap / 10;
  const n = (x: number): number => Math.max(0, Math.round(x * scale));
  const quotas: { job: SideJob; slots: number; why: string }[] = [
    { job: 'gear-hate', slots: n(hasField && ex.gearHeavy >= SIDE.gearHeavyShare ? 3 : !hasField || ex.gear >= SIDE.gearShare / 2 ? 2 : 1),
      why: hasField ? `${pct(ex.gear)} of the synced field's lists run ${SIDE.gearList}+ gear, ${pct(ex.gearHeavy)} run ${SIDE.gearHeavyList}+ (data)` : 'no synced field; 86% of measured side decks carried gear hate' },
    { job: 'removal', slots: n(2), why: '69% of measured side decks top up single-target removal, 2 copies on average' },
    { job: 'stack', slots: n(hasField && ex.spells >= SIDE.spellShare ? 2 : 1), why: hasField ? `${pct(ex.spells)} of the field's lists run ${SIDE.spellList}+ spells (data)` : 'no synced field; 37% of measured side decks carried a counter or hand attack' },
    { job: 'sweeper', slots: n(!hasField || ex.wide >= SIDE.wideShare ? 1 : 0), why: hasField ? `${pct(ex.wide)} of the field's lists run ${SIDE.wideUnits}+ units (data)` : 'no synced field; 36% of measured side decks carried a sweeper' },
    { job: 'protection', slots: n(1), why: '29% of measured side decks carried protection against removal' },
  ];

  const candidates = legalPool(work, db, 'side').filter((c) => !isSignature(c));
  const jobs = new Map(candidates.map((c) => [c.id, jobsOf(c, db)]));
  const room = (card: Card): number => Math.min(roomFor(card, work, opts), cap - total(work.side), (Number.isFinite(copyLimit(card)) ? copyLimit(card) : 3));
  const value = (card: Card): { v: number; own: number; best: ReturnType<typeof bestThird> } => {
    const own = ownSide?.[card.id]?.share ?? 0;
    const best = bestThird(card, view);
    const topUp = qtyIn(work.main, card.id) > 0 ? SIDE.weights.topUp : 0;
    const conf = meta ? meta.decks / (meta.decks + SIDE.ownPrior) : 0;
    return { own, best, v: own * conf * SIDE.weights.ownSide + fieldSided(card, view).share * SIDE.weights.fieldSide + best.value * SIDE.weights.targets + ratingOf(db, card) * SIDE.weights.rating + topUp + seededBias(opts.seed, `side:${card.id}`) * 0.5 };
  };
  const take = (card: Card, qty: number, job: SideJob, why: string): void => {
    const { own, best } = value(card);
    work = { ...work, side: [...work.side.filter((e) => e.id !== card.id), { id: card.id, qty: qtyIn(work.side, card.id) + qty, locked: work.side.some((e) => e.id === card.id && e.locked) }] };
    const answer = answersOf(card)[0];
    const parts = [`${JOB_LABEL[job]}: ${why}`];
    if (answer) parts.push(describeAnswer(answer));
    if (best.peak) parts.push(`answers ${best.peak.expected.toFixed(1)} expected copies of a typical ${best.peak.legend.championTag ?? best.peak.legend.name} list, its best matchup in the field (card-against-card test, data)`);
    if (own > 0 && meta) parts.push(`${ownSide?.[card.id]?.decks ?? 0} of ${meta.decks} public ${legend.name} lists side it (data)`);
    const fs = fieldSided(card, view);
    if (fs.lists > 0) parts.push(`${fs.lists} of the ${fs.of} public lists of all legends that could side it do (data)`);
    if (qtyIn(work.main, card.id) > 0) parts.push(`an extra copy of a main-deck card (${qtyIn(work.main, card.id)} in the main deck)`);
    const held = picks.find((p) => p.id === card.id);
    if (held) held.qty += qty;
    else picks.push({ zone: 'side', id: card.id, qty, phase: `side:${job}`, reason: `${parts.join('; ')}.` });
  };

  for (const q of quotas) {
    let left = Math.min(q.slots, cap - total(work.side));
    // Locked side cards already doing the job count toward it.
    for (const e of kept) if ((jobs.get(e.id) ?? (db.get(e.id) ? jobsOf(db.get(e.id) as Card, db) : [])).includes(q.job)) left -= e.qty;
    let first = true;
    for (let guard = 0; guard < 6 && left > 0; guard += 1) {
      const ranked = candidates
        .filter((c) => (jobs.get(c.id) ?? []).includes(q.job) && qtyIn(work.side, c.id) === 0 && room(c) > 0)
        .map((c) => ({ c, ...value(c) }))
        .sort((a, b) => b.v - a.v || a.c.id.localeCompare(b.c.id));
      const best = ranked[0];
      if (!best) { if (first) notes.push(`No legal ${JOB_LABEL[q.job].toLowerCase()} card for the side deck in ${legend.name}'s domains${opts.ownedOnly ? ' in the collection' : ''}.`); break; }
      // Rule 7: one-ofs by default; the main gear answer is the one job played as a two-of.
      const stat = ownSide?.[best.c.id];
      const sidedCopies = stat && stat.share >= SIDE.ownCopiesShare ? Math.round(stat.avgCopies) : 1;
      const qty = Math.min(left, room(best.c), Math.max(sidedCopies, q.job === 'gear-hate' && first ? 2 : 1));
      take(best.c, qty, q.job, q.why);
      left -= qty;
      first = false;
    }
  }

  // Free slots: what players of this legend side most (data), else the best card score for the side zone.
  const scorer = createScorer(work, ctx);
  for (let guard = 0; guard < cap && total(work.side) < cap; guard += 1) {
    const ranked = candidates
      .filter((c) => qtyIn(work.side, c.id) === 0 && room(c) > 0)
      .map((c) => { const s = scorer.score(c, 'side'); return { c, s, v: (ownSide?.[c.id]?.share ?? 0) * 100 + fieldSided(c, view).share * SIDE.weights.fieldSide + (s.gate ? -1000 : s.score) + seededBias(opts.seed, `side:${c.id}`) * 2 }; })
      .filter((x) => !x.s.gate)
      .sort((a, b) => b.v - a.v || a.c.id.localeCompare(b.c.id));
    const best = ranked[0];
    if (!best) { notes.push(`The side deck stops at ${total(work.side)} of ${cap}: no other legal card${opts.ownedOnly ? ' in the collection' : ''}.`); break; }
    const stat = ownSide?.[best.c.id];
    const qty = Math.max(1, Math.min(room(best.c), stat && stat.share >= SIDE.ownCopiesShare ? Math.round(stat.avgCopies) : 1));
    take(best.c, qty, 'free', (ownSide?.[best.c.id]?.share ?? 0) > 0 ? 'sided by players of this legend' : `best remaining card score for the side deck (${best.s.score})`);
  }
  return { entries: work.side.map((e) => ({ ...e })), picks, notes };
}

export const buildSideDeck = (deck: Deck, ctx: EngineContext, opts: BuildOptions): DeckEntry[] => planSideDeck(deck, ctx, opts).entries;
