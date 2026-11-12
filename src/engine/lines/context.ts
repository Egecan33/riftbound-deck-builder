// Shared working set of the line generator: the resolved deck, its win-route analysis, the network links
// between its cards and the probability helpers. New code.
//
// FACT used here (docs/research/matchups-and-lines.md 3.2 and section 2, rule numbers of 2026-10-09): the
// library is the main deck without the Champion Zone copy (CR 103.3.a.1); a card costing E Energy and P Power
// needs max(E, P) runes on board (CR 164.2: a rune is exhausted for Energy and recycled for Power).
import { hypergeometricAtLeast } from '../maths/hypergeo';
import { RUNE_DECK_SIZE } from '../rules/formats';
import { isCoPlayReason } from '../evidence/coplay';
import { isGenericReason } from '../network/edges';
import type { CardEdge, Domain, EdgeReason, EngineContext, Deck, Line } from '../types';
import { analyseRoutes, type WinAnalysis } from '../wincons/detect';
import type { Seat } from '../wincons/facts';
import { pSeen, viewDeck, type DeckCard, type DeckView } from '../wincons/view';

/** One network reason between two cards of the deck, oriented. */
export interface Link {
  edge: CardEdge;
  reason: EdgeReason;
  /** The card whose text makes the thing happen (enabler); for undirected reasons, the first by id. */
  enabler: DeckCard;
  payoff: DeckCard;
  enablerQuote: string;
  payoffQuote: string;
  directed: boolean;
  measured: boolean;
}

export interface LineContext {
  deck: Deck;
  ctx: EngineContext;
  view: DeckView;
  win: WinAnalysis;
  /** Mechanical links (synergy, not generic), strongest first. */
  links: Link[];
  /** Measured co-play links. */
  coPlay: Link[];
  /** Deck card ids a line may name: main, legend, battlefields, side. */
  allowed: ReadonlySet<string>;
}

const quoteOf = (chunk: string, name: string): string | null => {
  const at = chunk.lastIndexOf(`${name}: "`);
  if (at < 0) return null;
  const start = at + name.length + 3;
  const end = chunk.lastIndexOf('"');
  return end > start ? chunk.slice(start, end) : null;
};

/** Reads the two quoted sentences of an edge reason; the stored detail lists the enabler's quote first. */
export function orient(edge: CardEdge, reason: EdgeReason, a: DeckCard, b: DeckCard): Link {
  const measured = isCoPlayReason(reason);
  const cut = reason.detail.lastIndexOf(' | ');
  if (!measured && cut > 0) {
    const left = reason.detail.slice(0, cut);
    const right = reason.detail.slice(cut + 3);
    const second = right.startsWith(`${a.card.name}:`) ? a : right.startsWith(`${b.card.name}:`) ? b : null;
    if (second) {
      const first = second === a ? b : a;
      const q1 = quoteOf(left, first.card.name);
      const q2 = quoteOf(right, second.card.name);
      if (q1 && q2) return { edge, reason, enabler: first, payoff: second, enablerQuote: q1, payoffQuote: q2, directed: reason.id.startsWith('package:'), measured };
    }
  }
  return { edge, reason, enabler: a, payoff: b, enablerQuote: '', payoffQuote: '', directed: false, measured };
}

/**
 * A stored edge whose two quoted sentences do not meet. The network joins "your unit dies" enablers (Temporary,
 * sacrifice) to every death payoff, including the ones that only count enemy deaths (Pyke, Returned: "when an
 * enemy unit dies"); a line built on that pair would be false, so the link is dropped here.
 */
export function falseLink(l: Link): boolean {
  return l.directed && falsePair(l.reason.id, l.enablerQuote, l.payoffQuote);
}

/** The same test on the raw quotes (the builder's package phase uses it on stored edges). */
export function falsePair(reasonId: string, enablerQuote: string, payoffQuote: string): boolean {
  // "Play two Sprite unit tokens with [Temporary]" kills those tokens, not the payoff: a card whose reward is its
  // own [Deathknell] (Carrion Dredger) or more Deathknell triggers (Karthus) gets nothing from them.
  if (/^package:temporary[^:]*:/.test(reasonId) && /\bplay\b[^.]*\btokens?\b[^.]*\[temporary\]/i.test(enablerQuote) && /\[deathknell\]/i.test(payoffQuote)) return true;
  const ownDeath = /^package:(?:temporary|death-enabler|sacrifice)[^:]*:/.test(reasonId) || /\[temporary\]|\bkill (?:a|one of (?:your|their)) (?:friendly )?units?\b|\bkills? one of their units\b/i.test(enablerQuote);
  return ownDeath && /\bwhen an? (?:stunned |damaged |exhausted )?enemy unit (?:here )?dies\b/i.test(payoffQuote) && !/\bfriendly\b|\ba unit dies\b|\banother unit\b/i.test(payoffQuote);
}

/** A stored reason whose detail is `Enabler: "..." | Payoff: "..."` and whose two sentences do not meet. */
export function falseReason(reason: EdgeReason): boolean {
  const cut = reason.detail.lastIndexOf(' | ');
  if (cut <= 0 || !reason.id.startsWith('package:')) return false;
  const q = (chunk: string): string => { const at = chunk.indexOf(': "'); const end = chunk.lastIndexOf('"'); return at >= 0 && end > at + 3 ? chunk.slice(at + 3, end) : ''; };
  return falsePair(reason.id, q(reason.detail.slice(0, cut)), q(reason.detail.slice(cut + 3)));
}

export function buildContext(deck: Deck, ctx: EngineContext): LineContext {
  const view = viewDeck(deck, ctx.db);
  const win = analyseRoutes(view);
  const nodes: DeckCard[] = [...view.main, ...(view.legend ? [view.legend] : []), ...view.battlefields];
  const links: Link[] = [];
  const coPlay: Link[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const edge = ctx.db.edge(nodes[i].card.id, nodes[j].card.id);
      if (!edge) continue;
      for (const reason of edge.reasons) {
        if (reason.kind !== 'synergy' || isGenericReason(reason.id)) continue;
        const link = orient(edge, reason, nodes[i], nodes[j]);
        if (falseLink(link)) continue;
        (link.measured ? coPlay : links).push(link);
      }
    }
  }
  const order = (x: Link, y: Link): number => y.reason.value * Math.min(y.enabler.qty, y.payoff.qty) - x.reason.value * Math.min(x.enabler.qty, x.payoff.qty) || x.reason.id.localeCompare(y.reason.id);
  links.sort(order);
  coPlay.sort(order);
  const allowed = new Set<string>([...view.main, ...view.side, ...view.battlefields].map((c) => c.card.id));
  if (view.legend) allowed.add(view.legend.card.id);
  return { deck, ctx, view, win, links, coPlay, allowed };
}

/** First own turn on which `need` runes are on board for this seat; 0 when the Rune Deck never gets there. */
export function turnFor(need: number, seat: Seat, bonus = 0): number {
  if (need <= 0) return 1;
  for (let t = 1; t <= 12; t += 1) if (seat.runes(t) + bonus >= need) return t;
  return 0;
}

/** P(at least one copy by this seat's turn `t`); 1 for the Chosen Champion (Champion Zone) and for the legend. */
export function pHave(c: DeckCard, turn: number, seat: Seat, view: DeckView): number {
  if (c.champion || c.card.type === 'legend' || c.card.type === 'battlefield') return 1;
  return pSeen(c.lib, seat.seen(turn), view.library);
}

/** P(at least one of each of two different cards by turn `t`). */
export function pBoth(a: DeckCard, b: DeckCard, turn: number, seat: Seat, view: DeckView): number {
  const pa = pHave(a, turn, seat, view);
  const pb = pHave(b, turn, seat, view);
  if (pa === 1) return pb;
  if (pb === 1) return pa;
  const n = seat.seen(turn);
  const missA = 1 - pSeen(a.lib, n, view.library);
  const missB = 1 - pSeen(b.lib, n, view.library);
  const missBoth = 1 - pSeen(a.lib + b.lib, n, view.library);
  return Math.max(0, Math.min(1, 1 - missA - missB + missBoth));
}

export interface PowerCheck { p: number; domains: Domain[]; have: number; text: string }

/**
 * Chance that the card's Power can be paid with `runes` runes channelled from this deck's Rune Deck
 * (matchups-and-lines.md 3.2). null when the card costs no Power, any domain pays it, or the deck has no runes.
 */
export function powerCheck(c: DeckCard, runes: number, view: DeckView): PowerCheck | null {
  const power = c.card.power ?? 0;
  if (power <= 0 || view.runes.total === 0) return null;
  const domains = c.card.powerDomains;
  if (domains.length === 0) return null;
  const have = domains.reduce((n, d) => n + (view.runes.byDomain[d] ?? 0), 0);
  if (have >= view.runes.total) return null;
  const total = Math.max(view.runes.total, 1);
  const p = hypergeometricAtLeast(total, have, Math.min(total, runes), power);
  const label = domains.map((d) => `${d[0].toUpperCase()}${d.slice(1)}`).join(' or ');
  return { p, domains, have, text: `${power} ${label} Power from ${have} of ${view.runes.total} runes` };
}

export const RUNES = RUNE_DECK_SIZE;

/** Line constructor: drops ids that are not in the deck into `otherIds`, rounds the probability. */
export function line(lc: LineContext, kind: Line['kind'], text: string, cards: readonly (DeckCard | string | null | undefined)[], reason: string, probability: number | null, heuristic: boolean, others: readonly string[] = []): Line {
  const ids = cards.map((c) => (typeof c === 'string' ? c : c?.card.id)).filter((id): id is string => !!id);
  const own = [...new Set(ids.filter((id) => lc.allowed.has(id)))];
  const other = [...new Set([...ids.filter((id) => !lc.allowed.has(id)), ...others])];
  const p = probability === null || !Number.isFinite(probability) ? null : Math.round(Math.max(0, Math.min(1, probability)) * 1000) / 1000;
  const out: Line = { kind, text: text.replace(/\s+/g, ' ').trim(), cardIds: own, reason, probability: p, heuristic };
  if (other.length > 0) out.otherIds = other;
  return out;
}

export const copies = (cards: readonly DeckCard[]): number => cards.reduce((n, c) => n + c.qty, 0);
export const libCopies = (cards: readonly DeckCard[]): number => cards.reduce((n, c) => n + c.lib, 0);
export const hasKw = (c: DeckCard, keyword: string): boolean => c.card.keywords.some((k) => k.toLowerCase() === keyword);
export const costText = (c: DeckCard): string => `${c.card.energy ?? 0}${(c.card.power ?? 0) > 0 ? `+${c.card.power}P` : ''}`;
