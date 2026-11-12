// Keeps, the turn plan and power spikes (spec 14). Mulligan priorities are ported from Riftfoundry
// apps/web/src/lib/theory-decks.ts at origin/main 4b90179 (`buildStrategyIdentity`, mulliganPriorities:
// zero-Power 2-drop +8, early curve +5 / +3, package enabler +3, 0.4 per copy) and extended: the reasons name
// the deck's own partner cards instead of Riftfoundry's four fixed sentences, the odds are computed for the
// deck's copies, and both seats are covered. Keep rule, turn table and spikes follow
// docs/research/matchups-and-lines.md 3.2-3.3 (prototype: analysis/matchups-and-lines/linegen.py).
//
// Fixes of the prototype's defects (3.9): the two-card turn is chosen by value (card evaluation, the network
// edge between the two cards, then the chance of holding both), not by probability alone; ramp cards and
// cards whose cost falls during the game are named instead of being placed on the printed curve.
//
// FACT with rule numbers in each line's reason: draw 4 (CR 116), set aside up to 2 (CR 117.1), 2 runes a turn
// (CR 315.3.b), the extra rune of the last seat (CR 487.7 and its mode twins), the skipped draw of the first
// seat with more than two players (CR 489.7), the Champion Zone copy (CR 103.3.a.1).
// HEURISTIC: which hands to keep and which play is "best". The probabilities are exact hypergeometric values.
import type { Line } from '../types';
import { MULLIGAN_MAX, OPENING, RULE, type Seat } from '../wincons/facts';
import { routeFeatures } from '../wincons/features';
import { ROUTE_LABELS } from '../wincons/detect';
import { displayName, nameList, pSeen, pct, type DeckCard } from '../wincons/view';
import { copies, costText, hasKw, libCopies, line, pBoth, pHave, powerCheck, turnFor, type LineContext } from './context';

const byRating = (cards: readonly DeckCard[]): DeckCard[] => [...cards].sort((a, b) => b.rating - a.rating || b.qty - a.qty || a.card.name.localeCompare(b.card.name));
const isInteraction = (c: DeckCard): boolean => ['removal', 'stun', 'counter', 'displace', 'sweep'].some((f) => routeFeatures(c).has(f as never));
/** "I cost [1] less for each ...": the printed cost is not when the card is played. */
export const variableCost = (c: DeckCard): string | null => c.sentences.find((s) => /\b(?:i|this) costs? \[\d+\] less\b|\breduce my cost\b/i.test(s)) ?? null;
/** Ramp the curve does not show: a rune channelled, Energy added, a Gold token. */
const isRamp = (c: DeckCard): boolean => (c.features?.roles ?? []).includes('rune-ramp');

const seatRule = (seat: Seat): string => (seat.id === 'last' ? `${RULE.channel2}, ${seat.rule}` : seat.rule === RULE.channel2 ? RULE.channel2 : `${RULE.channel2}, ${seat.rule}`);

export function keepLines(lc: LineContext): Line[] {
  const { view } = lc;
  const out: Line[] = [];
  if (view.library === 0) return out;
  const units = view.main.filter((c) => c.card.type === 'unit');
  const draws = `${RULE.draw4}, ${RULE.mulligan}`;

  for (const seat of view.facts.seats) {
    let turn = 1;
    let early = units.filter((c) => !c.champion && c.need <= seat.runes(1));
    if (libCopies(early) < 3) { turn = 2; early = units.filter((c) => !c.champion && c.need <= seat.runes(2)); }
    if (early.length === 0) continue;
    const board = copies(units) >= 16 && libCopies(early) >= 5;
    const extra = board ? [] : view.main.filter((c) => c.card.type !== 'unit' && isInteraction(c) && c.need <= seat.runes(turn));
    const set = byRating([...early, ...extra]);
    const k = libCopies(set);
    const opening = seat.seen(0);
    const natural = pSeen(k, opening, view.library);
    const mulligan = pSeen(k, opening + MULLIGAN_MAX, view.library);
    out.push(line(lc, 'keep',
      `${seat.label[0].toUpperCase()}${seat.label.slice(1)} (${seat.runes(turn)} runes on turn ${turn}): keep a hand with ${nameList(set.map((c) => c.card.name), 5)}${board ? '' : ` - a turn-${turn} unit or cheap interaction, because only ${copies(units)} of the main deck are units`}. ${k} of ${view.library} library cards: ${pct(natural)} in the opening ${opening}, ${pct(mulligan)} after setting aside ${MULLIGAN_MAX}.`,
      set,
      `Opening hand of ${OPENING} (${RULE.draw4}); one mulligan of up to ${MULLIGAN_MAX} cards that cannot be redrawn (${RULE.mulligan}), so it sees ${opening + MULLIGAN_MAX} different cards; runes per turn ${seatRule(seat)}. The keep rule itself is a heuristic.`,
      natural, true));
  }

  // Cards to send back: too expensive for the first turns, and spare copies of the Chosen Champion.
  // Too expensive for the first three turns: 7 or more runes means turn 4 at the earliest for the first seat.
  const heavy = view.main.filter((c) => !c.champion && c.need >= 7 && !variableCost(c)).sort((a, b) => b.need - a.need || a.card.name.localeCompare(b.card.name)).slice(0, 4);
  const champion = view.champion && view.champion.lib > 0 ? view.champion : null;
  if (heavy.length > 0 || champion) {
    const first = view.facts.seats[0];
    const parts: string[] = [];
    if (heavy.length > 0) parts.push(`set aside ${nameList(heavy.map((c) => `${c.card.name} (needs ${c.need} runes, turn ${turnFor(c.need, first) || '12+'} ${first.label})`), 4)} from an opening hand`);
    if (champion) parts.push(`${heavy.length ? 'and ' : 'set aside '}the ${champion.lib} library ${champion.lib === 1 ? 'copy' : 'copies'} of ${champion.card.name}: one already waits in the Champion Zone`);
    const cards = [...heavy, ...(champion ? [champion] : [])];
    out.push(line(lc, 'keep', `Mulligan: ${parts.join(' ')}.`, cards,
      `A set-aside card goes to the bottom and is not redrawn (${RULE.mulligan}); the Chosen Champion starts outside the library (${RULE.championZone}).`,
      pSeen(libCopies(cards), OPENING, view.library), true));
  }
  for (const c of view.main.filter((x) => variableCost(x) && x.need >= 5).slice(0, 2)) {
    const feeders = [...new Map(lc.links.filter((l) => l.payoff.card.id === c.card.id && l.directed && l.enabler.card.type !== 'battlefield').map((l) => [l.enabler.card.id, l.enabler] as const)).values()];
    if (feeders.length === 0) continue;
    const drawn = feeders.filter((f) => view.byId.has(f.card.id) && !f.champion);
    const fixed = feeders.filter((f) => !drawn.includes(f));
    const p = drawn.length ? pBoth(c, drawn[0], 3, view.facts.seats[0], view) : pSeen(c.lib, OPENING, view.library);
    out.push(line(lc, 'keep', `${c.card.name} is printed at ${c.card.energy} Energy but: "${variableCost(c)}" ${fixed.length ? `${nameList(fixed.map((f) => f.card.name), 2)} ${fixed.length > 1 ? 'are' : 'is'} always available to bring that down. ` : ''}${drawn.length ? `Keep it in a hand with ${nameList(drawn.map((f) => f.card.name), 3)}; otherwise it is a card to set aside.` : 'Keep one copy, set aside a second.'}`, [c, ...feeders],
      `Network edges into ${c.card.name}; the reduced cost is not on the printed curve. Set-aside rule ${RULE.mulligan}.`, p, true));
  }

  // Ported priority order (Riftfoundry mulliganPriorities), with the deck's own reasons.
  const enablerOf = new Map<string, { label: string; payoff: DeckCard }>();
  for (const l of lc.links) if (l.directed && !enablerOf.has(l.enabler.card.id) && view.byId.has(l.enabler.card.id)) enablerOf.set(l.enabler.card.id, { label: l.reason.label, payoff: l.payoff });
  const ranked = view.main.filter((c) => !c.champion).map((c) => {
    const zeroPowerTwo = c.card.type === 'unit' && c.card.energy === 2 && (c.card.power ?? 0) === 0;
    const pack = enablerOf.get(c.card.id);
    return { c, pack, zeroPowerTwo, score: (zeroPowerTwo ? 8 : 0) + (c.need <= 2 ? 5 : c.need === 3 ? 3 : 0) + (pack ? 3 : 0) + c.qty * 0.4 };
  }).sort((a, b) => b.score - a.score || a.c.card.name.localeCompare(b.c.card.name)).slice(0, 3);
  if (ranked.length > 0) {
    const describe = ({ c, pack, zeroPowerTwo }: (typeof ranked)[number]): string => {
      const quote = c.sentences.find((x) => !/^\[[^\]]+\]$/.test(x.trim())) ?? '';
      const why = pack ? `starts ${pack.label} with ${pack.payoff.card.name}` : zeroPowerTwo ? 'no Power cost' : `costs ${costText(c)}`;
      return `${c.card.name} x${c.qty} (${costText(c)}; ${why}${quote ? `; "${quote}"` : ''}) ${pct(pSeen(c.lib, OPENING, view.library))}`;
    };
    const any = pSeen(libCopies(ranked.map((r) => r.c)), OPENING, view.library);
    out.push(line(lc, 'keep', `Keep priority, with the chance of each in the opening ${OPENING}: ${ranked.map(describe).join('; ')}. At least one of them: ${pct(any)}.`, ranked.flatMap((r) => [r.c, r.pack?.payoff]),
      `Priority order ported from Riftfoundry's mulligan priorities (zero-Power 2-drop +8, early curve +5 or +3, package enabler +3, 0.4 per copy); heuristic. Odds over the ${view.library}-card library (${RULE.draw4}).`, any, true));
  }
  return out;
}

/** Value of playing two cards in one turn: their evaluations, the network edge between them, the chance of both. */
function pairValue(lc: LineContext, a: DeckCard, b: DeckCard, p: number): number {
  const edge = lc.ctx.db.edge(a.card.id, b.card.id);
  return ((a.rating + b.rating) / 200 + Math.max(-0.3, Math.min(0.6, (edge?.net ?? 0) * 0.15))) * (0.4 + 0.6 * p);
}

export function turnLines(lc: LineContext): Line[] {
  const { view } = lc;
  const out: Line[] = [];
  if (view.library === 0) return out;
  const playable = view.main.filter((c) => !variableCost(c));
  for (const seat of view.facts.seats) {
    let championDown = false;
    for (let t = 1; t <= 6; t += 1) {
      const runes = seat.runes(t);
      const seen = seat.seen(t);
      // On curve: permanents that use this turn's runes or all but one.
      const curve = byRating(playable.filter((c) => c.card.type !== 'spell' && (c.need === runes || c.need === runes - 1 || (t === 1 && c.need <= runes)) && c.need >= 1));
      const champion = !championDown ? playable.find((c) => c.champion && c.need <= runes && c.need >= 1) ?? null : null;
      const drawn = curve.filter((c) => !c.champion || c.lib > 0);
      let p = champion ? 1 : pSeen(libCopies(drawn), seen, view.library);
      const parts: string[] = [];
      const cards: DeckCard[] = [];
      if (champion) { parts.push(`${champion.card.name} from the Champion Zone (always there)`); cards.push(champion); championDown = true; }
      const named = drawn.filter((c) => c !== champion).slice(0, 3);
      if (named.length > 0) {
        parts.push(`${nameList(named.map((c) => c.card.name), 3)} (${libCopies(drawn.filter((c) => c !== champion))} copies on curve, ${pct(pSeen(libCopies(drawn.filter((c) => c !== champion)), seen, view.library))} to hold one)`);
        cards.push(...named);
      }
      // Best two-card turn: spends the runes (Energy summed, Power summed), chosen by value.
      let best: { a: DeckCard; b: DeckCard; p: number; v: number } | null = null;
      if (runes >= 3) {
        // A champion already played on an earlier turn is not part of a later turn's pair.
        const pool = playable.filter((c) => c.need >= 1 && (!c.champion || c.lib > 0 || !championDown || c === champion));
        for (let i = 0; i < pool.length; i += 1) {
          for (let j = i + 1; j < pool.length; j += 1) {
            const a = pool[i];
            const b = pool[j];
            if (a.card.type !== 'unit' && b.card.type !== 'unit') continue;
            const need = Math.max((a.card.energy ?? 0) + (b.card.energy ?? 0), (a.card.power ?? 0) + (b.card.power ?? 0));
            if (need !== runes) continue;
            const guaranteed = (c: DeckCard): boolean => c.champion && (c === champion || !championDown);
            const pp = guaranteed(a) ? pHave({ ...b, champion: false }, t, seat, view) : guaranteed(b) ? pHave({ ...a, champion: false }, t, seat, view) : pBoth({ ...a, champion: false }, { ...b, champion: false }, t, seat, view);
            const v = pairValue(lc, a, b, pp);
            if (!best || v > best.v + 1e-9) best = { a, b, p: pp, v };
          }
        }
      }
      if (best) {
        const edge = lc.ctx.db.edge(best.a.card.id, best.b.card.id);
        const why = edge?.reasons.find((r) => r.kind === 'synergy')?.label;
        parts.push(`two-card turn: ${best.a.card.name} + ${best.b.card.name} (${costText(best.a)} and ${costText(best.b)}${why ? `; ${why}` : ''}; ${pct(best.p)} to hold both)`);
        cards.push(best.a, best.b);
        if (!champion && drawn.length === 0) p = best.p;
      }
      if (parts.length === 0) continue;
      // Power check on the named card that asks for the most Power.
      const demanding = [...cards].sort((a, b) => (b.card.power ?? 0) - (a.card.power ?? 0))[0];
      const power = demanding ? powerCheck(demanding, runes, view) : null;
      const powerText = power && power.p < 0.995 ? ` ${demanding.card.name} needs ${power.text}: ${pct(power.p)} with ${runes} runes.` : '';
      out.push(line(lc, 'turn', `Turn ${t} ${seat.label}, ${runes} runes, ${seen} cards seen: ${parts.join('; ')}.${powerText}`, cards,
        `Runes: 2 a turn (${RULE.channel2})${seat.id === 'last' ? `, plus 1 on the first turn for the last seat (${seat.rule})` : ''}, 12 in the Rune Deck; cards seen ${seen}${seat.seen(1) === OPENING ? ` (4 + ${t} - 1: the first player skips the first draw, ${seat.rule})` : ` (4 + ${t}: ${RULE.draw4}, ${RULE.draw1})`}; a card needs max(Energy, Power) runes (${RULE.basicRune}). The choice of pair is a heuristic.`,
        p, true));
    }
  }

  // What the printed curve does not show.
  const ramp = view.main.filter(isRamp);
  if (ramp.length > 0) {
    const first = view.facts.seats[0];
    const p = pSeen(libCopies(ramp), first.seen(2), view.library);
    const quotes = ramp.slice(0, 2).map((c) => `${c.card.name}: "${c.sentences.find((x) => /\[add\]|\bchannel|\bgold\b|\brunes?\b/i.test(x)) ?? c.sentences[c.sentences.length - 1] ?? ''}"`);
    out.push(line(lc, 'turn', `Extra resources the table above does not count: ${nameList(ramp.map((c) => `${c.card.name} x${c.qty}`), 3)}. ${quotes.join(' ')} ${pct(p)} to hold one by turn 2.`, ramp,
      `The table counts only the 2 runes channelled each turn (${RULE.channel2}). When and how much the card adds depends on play, so its text is quoted instead of moving cards to earlier turns.`, p, true));
  }
  const variable = view.main.filter((c) => variableCost(c));
  if (variable.length > 0) {
    out.push(line(lc, 'turn', `Not on the printed curve: ${nameList(variable.map((c) => `${c.card.name} (printed ${c.card.energy})`), 3)}. ${variable.map((c) => `${c.card.name}: "${variableCost(c)}"`).slice(0, 2).join(' ')}`, variable,
      'A cost that falls during the game cannot be placed on a turn; the card text is quoted instead of guessing a turn.', null, true));
  }
  return out;
}

export function spikeLines(lc: LineContext): Line[] {
  const { view, win } = lc;
  const out: Line[] = [];
  const [first, last] = view.facts.seats;
  const champion = view.champion;
  if (champion) {
    const t1 = turnFor(champion.need, first);
    const t2 = turnFor(champion.need, last);
    const power = powerCheck(champion, first.runes(t1), view);
    const accel = hasKw(champion, 'accelerate') ? ` Ready with Accelerate (1 Energy and 1 Power more, ${RULE.accelerate}): turn ${turnFor(Math.max((champion.card.energy ?? 0) + 1, (champion.card.power ?? 0) + 1), first)} ${first.label}.` : '';
    out.push(line(lc, 'spike', `${champion.card.name} (${costText(champion)}) is your first guaranteed play: turn ${t1} ${first.label}, turn ${t2} ${last.label}.${power && power.p < 0.995 ? ` Its ${power.text}: ${pct(power.p)} on that turn.` : ''}${accel}`, [champion],
      `The Chosen Champion starts in the Champion Zone and is never drawn (${RULE.championZone}); runes ${RULE.channel2}, ${last.rule}.`, 1, false));
    // Champion with the cheapest Reaction still payable.
    const reactions = view.main.filter((c) => c.features?.speed === 'reaction' && c.card.type === 'spell').sort((a, b) => a.need - b.need || b.rating - a.rating);
    if (reactions.length > 0) {
      const r = reactions[0];
      const need = Math.max((champion.card.energy ?? 0) + (r.card.energy ?? 0), (champion.card.power ?? 0) + (r.card.power ?? 0));
      const t = turnFor(need, first);
      if (t > 0) out.push(line(lc, 'spike', `From turn ${t} ${first.label} (${turnFor(need, last)} ${last.label}) you can play ${champion.card.name} and still hold ${r.card.name} (${costText(r)}): ${need} runes. ${pct(pHave(r, t, first, view))} to have ${r.card.name} by then.`, [champion, r],
        `Reactions can be played while a chain is open (${RULE.closedTiming}); runes left unexhausted pay for them, the pool does not carry over (${RULE.runePool}).`, pHave(r, t, first, view), true));
    }
  }
  if (win.feed && view.legend) {
    const feeder = [...win.feed.feeders].sort((a, b) => a.need - b.need || b.qty - a.qty)[0];
    const t = Math.max(1, turnFor(feeder.need, first));
    const fixed = win.feed.feeders.find((c) => c.champion);
    const p = fixed ? 1 : pSeen(libCopies(win.feed.feeders), first.seen(t + 1), view.library);
    out.push(line(lc, 'spike', `${displayName(view.legend.card)} comes online with ${win.feed.label}: earliest with ${feeder.card.name} (${costText(feeder)}) on turn ${t}; ${win.feed.copies} such ${win.feed.copies === 1 ? 'copy' : 'copies'}, ${fixed ? `and ${fixed.card.name} is always available from the Champion Zone` : `${pct(p)} to hold one by turn ${t + 1}`}.`, [view.legend, ...win.feed.feeders.slice(0, 4)],
      `"${view.legend.sentences[0] ?? ''}"`, p, true));
  }
  const primary = win.routes[0];
  if (primary) {
    const closer = primary.closers.find((c) => !c.champion && !variableCost(c));
    if (closer) {
      const t = turnFor(closer.need, first);
      if (t > 0) out.push(line(lc, 'spike', `${ROUTE_LABELS[primary.id]} closer ${closer.card.name} (${costText(closer)}, x${closer.qty}): turn ${t} ${first.label}, turn ${turnFor(closer.need, last)} ${last.label}; ${pct(pHave(closer, t, first, view))} to have drawn it by then, ${pct(pHave(closer, t + 2, first, view))} two turns later.`, [closer],
        `Closer of the deck's first win route (heuristic); odds over the ${view.library}-card library, ${first.seen(t)} cards seen by turn ${t}.`, pHave(closer, t, first, view), true));
    }
  }
  const top = view.main.filter((c) => !c.champion && c.need >= 5 && !variableCost(c) && c.card.id !== primary?.closers.find((x) => !x.champion)?.card.id)
    .sort((a, b) => b.need - a.need || b.rating - a.rating).slice(0, 2);
  for (const c of top) {
    const t = turnFor(c.need, first);
    if (t === 0) continue;
    out.push(line(lc, 'spike', `Top end: ${c.card.name} (${costText(c)}, x${c.qty}) is castable from turn ${t} ${first.label} (${turnFor(c.need, last)} ${last.label}); ${pct(pHave(c, t, first, view))} to hold it by then.`, [c],
      `Needs ${c.need} runes; 2 a turn (${RULE.channel2}).`, pHave(c, t, first, view), false));
  }
  return out;
}
