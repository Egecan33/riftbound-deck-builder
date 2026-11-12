// Sequencing, packages and one-card-away packages (spec 14).
//
// Packages are the port of Riftfoundry apps/web/src/lib/theory-decks.ts at origin/main 4b90179
// (`directionalPackageCandidates`, `strategyPackages`): a provider and a consumer joined by a pair reason,
// ranked by net x (0.55 + reliability), kept when reliability >= 0.08 and one side is guaranteed or the two
// sides hold four copies, one package per family. Differences: the pairs come from the stored network
// (`CardDb.edge`) instead of being recomputed, a package holds every card of each side instead of one pair,
// and it is not limited to packages that touch a requested anchor (a hand-built deck has none).
// Riftfoundry's linked strategy lines were five fixed summaries with card lists attached ("Use the linked
// primary threats ..."); they are replaced by lines derived from the edges and from rule-backed detectors.
//
// Sequencing detectors follow docs/research/matchups-and-lines.md 3.4 (prototype: linegen.py), each bound to
// a rule of the 2026-10-09 Core Rules and printed only when the deck holds the cards it names.
// HEURISTIC: which order is "right" and which pairs matter. The quoted card sentences and rule numbers are facts.
import { earlyPackageReliability } from '../maths/hypergeo';
import { findLoops } from '../network/loops';
import { formatRules } from '../rules/formats';
import { identityFit } from '../rules/identity';
import { nameKey } from '../rules/names';
import { isSignature, sameTag } from '../rules/champion';
import type { Line } from '../types';
import { answersOf } from '../wincons/answers';
import { RULE } from '../wincons/facts';
import { routeFeatures } from '../wincons/features';
import { deckCard, displayName, nameList, pSeen, pct, type DeckCard } from '../wincons/view';
import { copies, costText, hasKw, libCopies, line, orient, pBoth, pHave, turnFor, type LineContext, type Link } from './context';

const MAX_NETWORK_LINES = 6;
const MAX_PACKAGES = 5;

/** A payoff that must already be in play when the enabler happens: a permanent with a trigger or a static effect. */
const TRIGGER = /^(?:when|whenever|while|each time|your|if|once|\[[a-z ]+\]\[>\])/i;
const payoffFirst = (l: Link): boolean => {
  if (l.payoff.card.type === 'spell' || /\bi cost\b/i.test(l.payoffQuote)) return false;
  // A "When you play me" unit is replayed: it is on the board first, then the card that returns it.
  if (/^when you play (?:me|this)\b/i.test(l.payoffQuote)) return l.reason.id.startsWith('package:replay-unit:');
  return TRIGGER.test(l.payoffQuote);
};

const byQty = (cards: readonly DeckCard[]): DeckCard[] => [...cards].sort((a, b) => Number(b.champion) - Number(a.champion) || b.qty - a.qty || b.rating - a.rating || a.card.name.localeCompare(b.card.name));
const unique = (cards: readonly DeckCard[]): DeckCard[] => [...new Map(cards.map((c) => [c.card.id, c])).values()];
const always = (c: DeckCard): boolean => c.champion || c.card.type === 'legend';

export function sequencingLines(lc: LineContext): Line[] {
  const { view } = lc;
  const out: Line[] = [];
  const [first, last] = view.facts.seats;
  const main = view.main;
  const units = main.filter((c) => c.card.type === 'unit');
  const withKw = (k: string): DeckCard[] => byQty(main.filter((c) => hasKw(c, k)));

  // 1. Network edges: the strongest directed pairs, at most two per family and per card.
  const perLabel = new Map<string, number>();
  const perCard = new Map<string, number>();
  let taken = 0;
  for (const l of lc.links) {
    if (taken >= MAX_NETWORK_LINES) break;
    if (!l.directed || !l.enablerQuote || !l.payoffQuote) continue;
    if (l.enabler.card.type === 'battlefield' || l.payoff.card.type === 'battlefield') continue;
    if ((perLabel.get(l.reason.label) ?? 0) >= 2) continue;
    if ((perCard.get(l.enabler.card.id) ?? 0) >= 2 || (perCard.get(l.payoff.card.id) ?? 0) >= 2) continue;
    perLabel.set(l.reason.label, (perLabel.get(l.reason.label) ?? 0) + 1);
    perCard.set(l.enabler.card.id, (perCard.get(l.enabler.card.id) ?? 0) + 1);
    perCard.set(l.payoff.card.id, (perCard.get(l.payoff.card.id) ?? 0) + 1);
    taken += 1;
    const [a, b] = payoffFirst(l) ? [l.payoff, l.enabler] : [l.enabler, l.payoff];
    const turn = Math.max(always(a) && !a.champion ? 1 : turnFor(a.need, first), always(b) && !b.champion ? 1 : turnFor(b.need, first), 1);
    const p = pBoth(a, b, turn + 1, first, view);
    const replay = l.reason.id.startsWith('package:replay-unit:');
    const lead = a.card.type === 'legend' ? `${displayName(a.card)} is always in play, so` : b.card.type === 'legend' ? `${a.card.name} feeds` : replay && a === l.payoff ? `${a.card.name} on the board, then` : `${a.card.name} first, then`;
    out.push(line(lc, 'sequence', `${lead} ${displayName(b.card)}${replay && a === l.payoff ? ` to play ${a.card.name} again` : ''} (${l.reason.label}). ${l.enabler.card.name}: "${l.enablerQuote}" -> ${l.payoff.card.name}: "${l.payoffQuote}". ${always(a) && always(b) ? 'Both are always available.' : `${pct(p)} to hold ${always(a) ? b.card.name : always(b) ? a.card.name : 'both'} by turn ${turn + 1}.`}`,
      [a, b], `Network edge "${l.reason.label}" (strength ${l.reason.value.toFixed(2)}, heuristic); ${payoffFirst(l) ? 'the payoff is a permanent that has to be in play when the other card is played' : 'the enabler has to happen before the payoff counts it'}.`, p, true));
  }

  // 2. Loops and engines found by the network (replay, mutual, refund).
  for (const loop of findLoops(main.map((c) => c.card.id), lc.ctx.db, view.deck.format).slice(0, 2)) {
    out.push(line(lc, 'sequence', `${loop.loop ? 'Loop' : 'Engine'}: ${loop.label}. ${loop.detail}. Limit: ${loop.limiter}.`, [...loop.cardIds, ...loop.closers],
      `Structure found in the card network (${loop.kind}); ${loop.deterministic ? 'deterministic' : 'depends on a choice or a reveal'}; heuristic.`, null, true));
  }

  // 3. Rule-backed detectors (matchups-and-lines.md 3.4).
  const legion = withKw('legion');
  if (legion.length > 0) {
    const cheap = [...main].filter((c) => !hasKw(c, 'legion') && c.need <= 1).sort((a, b) => a.need - b.need || b.qty - a.qty).slice(0, 3);
    const target = legion[0];
    if (cheap.length > 0) {
      // "[Legion] - I cost [2] less": the discount applies once the first card is played.
      const discount = Number(/\[legion\][^.]*\bcost \[(\d+)\] less/i.exec(target.sentences.join(' '))?.[1] ?? 0);
      const need = Math.max((cheap[0].card.energy ?? 0) + Math.max(0, (target.card.energy ?? 0) - discount), (cheap[0].card.power ?? 0) + (target.card.power ?? 0));
      out.push(line(lc, 'sequence', `Play ${nameList(cheap.map((c) => c.card.name), 3)} before ${nameList(legion.map((c) => c.card.name), 3)}: Legion only counts if you finalized another card this turn. ${cheap[0].card.name} + ${target.card.name} need ${need} runes${discount ? ` with the Legion discount of ${discount}` : ''}: turn ${turnFor(need, first)} ${first.label}, ${turnFor(need, last)} ${last.label}.`, [...cheap, ...legion],
        `Legion (${RULE.legion}).`, pBoth(cheap[0], target, Math.max(1, turnFor(need, first)), first, view), false));
    } else {
      out.push(line(lc, 'sequence', `${nameList(legion.map((c) => c.card.name), 3)} have Legion but the deck has no card costing 1 or less to play first: the cheapest second card is ${[...main].filter((c) => !hasKw(c, 'legion')).sort((a, b) => a.need - b.need)[0]?.card.name ?? 'missing'}.`, legion, `Legion (${RULE.legion}).`, null, false));
    }
  }

  const readiers = byQty(main.filter((c) => c.card.type !== 'unit' && routeFeatures(c).has('ready')));
  const attacker = view.champion?.card.type === 'unit' ? view.champion : [...units].sort((a, b) => (b.card.might ?? 0) - (a.card.might ?? 0))[0];
  if (readiers.length > 0 && attacker) {
    const r = readiers[0];
    const need = Math.max((attacker.card.energy ?? 0) + (r.card.energy ?? 0), (attacker.card.power ?? 0) + (r.card.power ?? 0));
    out.push(line(lc, 'sequence', `${attacker.card.name} moves and conquers first; ${nameList(readiers.map((c) => c.card.name), 2)} then readies it for the second battlefield. Played in the same turn the pair needs ${need} runes (turn ${turnFor(need, first)} ${first.label}, ${turnFor(need, last)} ${last.label}); with ${attacker.card.name} already down it is ${r.need}. ${pct(pHave(r, 5, first, view))} to hold ${r.card.name} by turn 5.`, [attacker, ...readiers],
      `A unit enters exhausted (${RULE.entersExhausted}) and a move exhausts it (${RULE.moveCost}); a ready effect is what lets one unit score two battlefields in a turn, which the last point from a conquer requires (${RULE.finalPointConquer}).`, pHave(r, 5, first, view), false));
  }

  const slow = byQty(main.filter((c) => c.card.type === 'spell' && c.features?.speed === 'normal' && !hasKw(c, 'hidden') && (answersOf(c.card).length > 0 || routeFeatures(c).has('pump') || routeFeatures(c).has('move'))));
  if (slow.length > 0) {
    out.push(line(lc, 'sequence', `${nameList(slow.map((c) => c.card.name), 4)} ${slow.length > 1 ? 'have' : 'has'} neither Action nor Reaction: cast ${slow.length > 1 ? 'them' : 'it'} before the move that starts the showdown, not during it.`, slow,
      `Only Action and Reaction cards can be played in a showdown (${RULE.showdownTiming}).`, null, false));
  }

  const actions = byQty(main.filter((c) => c.card.type === 'spell' && c.features?.speed === 'action'));
  if (actions.length > 0) {
    out.push(line(lc, 'sequence', `When you attack you get Focus first: that is the window for ${nameList(actions.map((c) => `${c.card.name} (${costText(c)})`), 3)}. If you pass and the defender passes, the showdown ends with ${actions.length > 1 ? 'them' : 'it'} still in hand; when you defend, you act after the attacker's first play.`, actions,
      `The attacker gains Focus when a showdown opens in combat (${RULE.focusAttacker}); Action timing (${RULE.showdownTiming}).`, null, false));
  }

  const reactions = [...main.filter((c) => c.card.type === 'spell' && c.features?.speed === 'reaction')].sort((a, b) => a.need - b.need || b.qty - a.qty);
  if (reactions.length > 0) {
    const cheapest = reactions[0];
    out.push(line(lc, 'sequence', `Leave ${cheapest.need} ${cheapest.need === 1 ? 'rune' : 'runes'} ready on the opponent's turn for ${cheapest.card.name}${reactions.length > 1 ? `; ${nameList(reactions.slice(1).map((c) => `${c.card.name} needs ${c.need}`), 3)}` : ''}. ${copies(reactions)} Reaction copies in the deck: ${pct(pHave({ ...cheapest, lib: libCopies(reactions), champion: false }, 4, first, view))} to hold one by turn 4.`, reactions,
      `A Reaction can be played while a chain is open (${RULE.closedTiming}); the rune pool empties at the start of each Main Phase and at end of turn (${RULE.runePool}), so the cost is paid with runes left unexhausted.`, pHave({ ...cheapest, lib: libCopies(reactions), champion: false }, 4, first, view), false));
  }

  const hidden = withKw('hidden');
  if (hidden.length > 0) {
    out.push(line(lc, 'sequence', `Hide ${nameList(hidden.map((c) => c.card.name), 4)} the turn before you want ${hidden.length > 1 ? 'them' : 'it'}: hiding costs 1 Power on your own turn, at a battlefield you control that has no facedown card yet, and from the next turn the card is a Reaction played without its base cost. ${copies(hidden)} Hidden copies; a hidden ${hidden.find((c) => c.card.type === 'spell') ? `${hidden.find((c) => c.card.type === 'spell')!.card.name} can only choose things at that battlefield` : 'unit is played to that battlefield'}.`, hidden,
      `Hidden (${RULE.hidden}); a hidden permanent is played to that battlefield (${RULE.hiddenPermanent}) and a hidden spell chooses targets there (${RULE.hiddenTargets}); the Power is a recycled rune, one fewer on board next turn (${RULE.basicRune}).`, null, false));
  }

  const ambush = withKw('ambush');
  if (ambush.length > 0) {
    const scout = [...units].filter((c) => !hasKw(c, 'ambush')).sort((a, b) => a.need - b.need || b.qty - a.qty)[0];
    const a = ambush[0];
    out.push(line(lc, 'sequence', `${scout ? `Move ${scout.card.name} in first, then keep` : 'Keep'} ${a.need} runes ready for ${nameList(ambush.map((c) => c.card.name), 3)}: Ambush plays the unit as a Reaction to a battlefield where you already have a unit, after blockers and tricks are committed.`, [...(scout ? [scout] : []), ...ambush],
      `Ambush (${RULE.ambush}).`, null, false));
  }

  const solo = byQty([...main.filter((c) => routeFeatures(c).has('solo')), ...(view.legend && view.legend.traits.has('solo') ? [view.legend] : [])]);
  if (solo.length > 0) {
    const sentence = solo[0].sentences.find((s) => /\balone\b|\bone on one\b|\bonly unit\b/i.test(s)) ?? solo[0].sentences[0] ?? '';
    out.push(line(lc, 'sequence', `Send units to different battlefields: ${nameList(solo.map((c) => c.card.name), 3)} ${solo.length > 1 ? 'care' : 'cares'} about a unit that is alone. ${solo[0].card.name}: "${sentence}"`, solo,
      `Card text; ${view.facts.battlefieldsOnBoard} battlefields are in play in this format (${view.facts.battlefieldRule}).`, null, false));
  }

  const heavyPower = byQty(main.filter((c) => (c.card.power ?? 0) >= 2));
  if (heavyPower.length > 0) {
    const c = heavyPower[0];
    const t = Math.max(1, turnFor(c.need, first));
    const left = first.runes(t + 1) - (c.card.power ?? 0);
    const slips = [...main].filter((x) => x.card.id !== c.card.id && x.need === first.runes(t + 1)).sort((a, b) => b.rating - a.rating)[0];
    out.push(line(lc, 'sequence', `${c.card.name} costs ${c.card.power} Power: the ${c.card.power} runes you recycle go back to the Rune Deck, so the turn after (turn ${t + 1} ${first.label}) you have ${left} runes, not ${first.runes(t + 1)}.${slips ? ` ${slips.card.name} (needs ${slips.need}) slips a turn if you planned it there.` : ''}${heavyPower.length > 1 ? ` Same for ${nameList(heavyPower.slice(1).map((x) => x.card.name), 2)}.` : ''}`, [...heavyPower, ...(slips ? [slips] : [])],
      `Power is paid by recycling runes, which leave the board (${RULE.basicRune}); 2 new runes a turn (${RULE.channel2}).`, null, false));
  }

  const accelerate = withKw('accelerate');
  if (accelerate.length > 0) {
    const c = accelerate[0];
    const need = Math.max((c.card.energy ?? 0) + 1, (c.card.power ?? 0) + 1);
    out.push(line(lc, 'sequence', `${nameList(accelerate.map((x) => x.card.name), 3)}: pay 1 Energy and 1 Power more to enter ready. ${c.card.name} ready needs ${need} runes: turn ${turnFor(need, first)} ${first.label}, turn ${turnFor(need, last)} ${last.label}; without it the unit cannot move the turn it is played.`, accelerate,
      `Accelerate (${RULE.accelerate}); units enter exhausted (${RULE.entersExhausted}).`, null, false));
  }

  const damage = main.map((c) => ({ c, a: answersOf(c.card).find((x) => (x.kind === 'damage' || x.kind === 'sweep') && x.amount !== null && x.amount !== Infinity) })).filter((x) => x.a && x.c.card.type === 'spell');
  if (damage.length > 0) {
    const d = damage.sort((x, y) => y.c.qty - x.c.qty || x.c.card.name.localeCompare(y.c.card.name));
    out.push(line(lc, 'sequence', `${nameList(d.map((x) => `${x.c.card.name} (${x.a!.amount})`), 4)}: damage is healed after every combat and at end of turn, so use ${d.length > 1 ? 'them' : 'it'} to kill outright (a unit with that much Might or less) or inside the showdown where combat damage finishes the job.`, d.map((x) => x.c),
      `All units heal in the combat cleanup and at end of turn (${RULE.healAfterCombat}).`, null, false));
  }

  const equipment = byQty(main.filter((c) => hasKw(c, 'equip')));
  if (equipment.length > 0) {
    const partner = lc.links.find((l) => equipment.some((e) => e.card.id === l.enabler.card.id) && l.payoff.card.type === 'unit' && view.byId.has(l.payoff.card.id))?.payoff
      ?? (view.champion?.card.type === 'unit' ? view.champion : [...units].sort((a, b) => b.rating - a.rating)[0]);
    if (partner) {
      const e = equipment[0];
      out.push(line(lc, 'sequence', `${partner.card.name} first, then ${nameList(equipment.map((x) => x.card.name), 3)}: Equip attaches to a unit you control, and gear left unattached at a battlefield is recalled to base. ${e.card.name}: "${e.sentences.find((s) => /equip/i.test(s)) ?? e.sentences[0] ?? ''}"`, [partner, ...equipment],
        `Equip (${RULE.equip}); unattached gear at a battlefield (${RULE.gearRecall}).`, pBoth(partner, e, 4, first, view), false));
    }
  }

  // Exhaust payoffs: a Standard Move exhausts the unit, and some cards exhaust one as a cost.
  const exhaustPay = byQty(main.filter((c) => c.sentences.some((x) => /\bbecomes? exhausted\b/i.test(x))));
  if (exhaustPay.length > 0) {
    const sources = byQty(main.filter((c) => c.sentences.some((x) => /\bexhaust (?:a|another) friendly unit\b/i.test(x))));
    const p = exhaustPay[0];
    out.push(line(lc, 'sequence', `${nameList(exhaustPay.map((c) => c.card.name), 3)} ${exhaustPay.length > 1 ? 'trigger' : 'triggers'} when a unit becomes exhausted. Every move exhausts the unit that moves${sources.length ? `, and ${nameList(sources.map((c) => c.card.name), 3)} ${sources.length > 1 ? 'exhaust' : 'exhausts'} one on demand` : ''}: move the other units first, ${p.card.name} last. ${p.card.name}: "${p.sentences.find((x) => /\bbecomes? exhausted\b/i.test(x)) ?? ''}"`, [...exhaustPay, ...sources],
      `Exhausting the unit is the cost of a Standard Move (${RULE.moveCost}); the triggers are card text.`, null, false));
  }

  const deathknell = withKw('deathknell');
  if (deathknell.length > 0) {
    const d = deathknell[0];
    out.push(line(lc, 'sequence', `Trade or defend alone with ${nameList(deathknell.map((c) => c.card.name), 3)} before your other units: ${d.card.name}: "${d.sentences.find((s) => /deathknell/i.test(s)) ?? ''}"`, deathknell,
      `Deathknell triggers when the unit dies (${RULE.deathknell}).`, null, false));
  }

  const tanks = withKw('tank');
  if (tanks.length > 0) {
    const guarded = [...units].filter((c) => !hasKw(c, 'tank')).sort((a, b) => b.rating - a.rating)[0];
    if (guarded) out.push(line(lc, 'sequence', `Put ${nameList(tanks.map((c) => c.card.name), 2)} at the same battlefield as ${guarded.card.name}: a Tank must be assigned lethal damage before any other unit there, so ${guarded.card.name} survives a combat that would otherwise kill it.`, [...tanks, guarded],
      `Tank (${RULE.tankFirst}).`, null, false));
  }
  return out;
}

interface Package { label: string; enablers: DeckCard[]; payoffs: DeckCard[]; value: number; reliability: number; guaranteed: boolean; best: Link }

/** Complete packages of the deck: every enabler and payoff of one network family. */
export function packagesOf(lc: LineContext): Package[] {
  const groups = new Map<string, Link[]>();
  for (const l of lc.links) {
    // A battlefield is in play in some games only; its links are in the format notes, not in a package.
    if (!l.directed || l.enabler.card.type === 'battlefield' || l.payoff.card.type === 'battlefield') continue;
    const list = groups.get(l.reason.label) ?? [];
    list.push(l);
    groups.set(l.reason.label, list);
  }
  const out: Package[] = [];
  for (const [label, links] of groups) {
    const enablers = byQty(unique(links.map((l) => l.enabler)));
    const payoffs = byQty(unique(links.map((l) => l.payoff)));
    const eGuaranteed = enablers.some(always);
    const pGuaranteed = payoffs.some(always);
    const both = enablers.filter((e) => payoffs.some((p) => p.card.id === e.card.id));
    // Opening hand plus three draws, as in the port; a guaranteed side leaves only the other one to draw.
    const draws = 7;
    const reliability = eGuaranteed && pGuaranteed ? 1
      : eGuaranteed ? pSeen(libCopies(payoffs), draws, lc.view.library)
        : pGuaranteed ? pSeen(libCopies(enablers), draws, lc.view.library)
          : earlyPackageReliability(lc.view.library, libCopies(enablers), libCopies(payoffs), libCopies(both));
    const net = links.reduce((n, l) => n + l.reason.value, 0);
    // Ported filter: reliability >= 0.08 and (a guaranteed side or four copies across the two sides).
    if (reliability < 0.08 || !(eGuaranteed || pGuaranteed || copies(enablers) + copies(payoffs) >= 4)) continue;
    out.push({ label, enablers, payoffs, value: net * (0.55 + reliability), reliability, guaranteed: eGuaranteed || pGuaranteed, best: links[0] });
  }
  return out.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

const copyNames = (cards: readonly DeckCard[], max = 3): string => nameList(cards.map((c) => (c.qty > 1 && !always(c) ? `${c.card.name} x${c.qty}` : c.card.name)), max);

export function packageLines(lc: LineContext): Line[] {
  const out: Line[] = [];
  for (const p of packagesOf(lc).slice(0, MAX_PACKAGES)) {
    const fixedCards = [...p.enablers, ...p.payoffs].filter(always);
    const drawnPayoffs = p.payoffs.filter((c) => !always(c));
    const access = p.reliability >= 0.9995
      ? `${nameList([...new Set(fixedCards.map((c) => c.card.name))], 3)} ${fixedCards.length > 1 ? 'cover' : 'covers'} both sides without a draw${drawnPayoffs.length ? `; the drawn payoffs (${libCopies(drawnPayoffs)} copies) appear in the opening hand plus three draws ${pct(pSeen(libCopies(drawnPayoffs), 7, lc.view.library))}` : ''}.`
      : p.guaranteed ? `${fixedCards[0].card.name} is always available, so only the other side is drawn: ${pct(p.reliability)} in the opening hand plus three draws.`
        : `${libCopies(p.enablers)} enabler and ${libCopies(p.payoffs)} payoff copies in the ${lc.view.library}-card library: both sides in the opening hand plus three draws ${pct(p.reliability)}.`;
    out.push(line(lc, 'package', `${p.label}: ${copyNames(p.enablers)} -> ${copyNames(p.payoffs)}. ${access}`, [...p.enablers, ...p.payoffs],
      `${p.best.enabler.card.name}: "${p.best.enablerQuote}" | ${p.best.payoff.card.name}: "${p.best.payoffQuote}". Package rule ported from Riftfoundry; heuristic.`, p.reliability, true));
  }
  // Measured co-play: pairs that public lists run together more often than chance.
  for (const l of lc.coPlay.filter((x) => lc.view.byId.has(x.enabler.card.id) && lc.view.byId.has(x.payoff.card.id)).slice(0, 3)) {
    out.push(line(lc, 'package', `Run together in public lists: ${l.reason.detail}`, [l.enabler, l.payoff], 'Measured co-play in synced lists (data, not a rules interaction).', pBoth(l.enabler, l.payoff, 4, lc.view.facts.seats[0], lc.view), false));
  }
  return out;
}

/** Packages the deck holds one side of: the single card outside the deck that would complete them. */
export function oneAwayLines(lc: LineContext): Line[] {
  const { view } = lc;
  const db = lc.ctx.db;
  if (!view.legend) return [];
  const identity = new Set(view.legend.card.domains);
  const packages = packagesOf(lc);
  // Sides the deck already fills, per family.
  const sides = new Map<string, { enablers: Set<string>; payoffs: Set<string> }>();
  for (const l of lc.links) {
    if (!l.directed || l.enabler.card.type === 'battlefield' || l.payoff.card.type === 'battlefield') continue;
    const s = sides.get(l.reason.label) ?? { enablers: new Set(), payoffs: new Set() };
    s.enablers.add(l.enabler.card.id);
    s.payoffs.add(l.payoff.card.id);
    sides.set(l.reason.label, s);
  }
  interface Candidate { label: string; card: DeckCard; side: 'enabler' | 'payoff'; partners: DeckCard[]; value: number; quote: string; partnerQuote: string; partnerName: string }
  const found = new Map<string, Candidate>();
  for (const mine of view.main) {
    for (const edge of db.edges(mine.card.id)) {
      const otherId = edge.a === mine.card.id ? edge.b : edge.a;
      if (lc.allowed.has(otherId)) continue;
      const other = db.get(otherId);
      if (!other || other.dataIncomplete || (other.type !== 'unit' && other.type !== 'spell' && other.type !== 'gear')) continue;
      if (identityFit(other, identity) !== 'ok') continue;
      if (isSignature(other) && !sameTag(other.championTag, view.legend.card.championTag)) continue;
      if (view.excluded.some((e) => e.card.id === other.id)) continue;
      const oc = deckCard(other, db, 0);
      for (const reason of edge.reasons) {
        if (reason.kind !== 'synergy' || !reason.id.startsWith('package:')) continue;
        const link = orient(edge, reason, mine, oc);
        if (!link.enablerQuote) continue;
        const side: Candidate['side'] = link.enabler === oc ? 'enabler' : 'payoff';
        const key = `${reason.label}|${other.id}|${side}`;
        const c = found.get(key) ?? { label: reason.label, card: oc, side, partners: [], value: 0, quote: side === 'enabler' ? link.enablerQuote : link.payoffQuote, partnerQuote: side === 'enabler' ? link.payoffQuote : link.enablerQuote, partnerName: mine.card.name };
        c.partners.push(mine);
        c.value += reason.value * mine.qty;
        found.set(key, c);
      }
    }
  }
  const banList = formatRules(view.deck.format, db.legality()).banListOf;
  const banned = new Set(db.legality().bans.filter((b) => b.formats.includes(banList)).map((b) => nameKey(b.name)));
  const ranked = [...found.values()].filter((c) => {
    if (banned.has(nameKey(c.card.card.name))) return false;
    const have = sides.get(c.label);
    const mySide = c.side === 'enabler' ? have?.enablers.size ?? 0 : have?.payoffs.size ?? 0;
    // One away: the deck holds at least two cards of the other side and at most one card doing this card's job.
    return unique(c.partners).length >= 2 && copies(unique(c.partners)) >= 4 && mySide <= 1 && !packages.slice(0, MAX_PACKAGES).some((p) => p.label === c.label && p.reliability >= 0.5);
  }).sort((a, b) => b.value * (b.card.rating / 100) - a.value * (a.card.rating / 100) || a.card.card.id.localeCompare(b.card.card.id));
  const out: Line[] = [];
  const seenLabels = new Set<string>();
  const seenCards = new Set<string>();
  for (const c of ranked) {
    if (seenLabels.has(c.label) || seenCards.has(c.card.card.id)) continue;
    seenLabels.add(c.label);
    seenCards.add(c.card.card.id);
    const partners = byQty(unique(c.partners));
    out.push(line(lc, 'package', `One card away from ${c.label}: the deck has ${copyNames(partners, 4)} (${copies(partners)} copies) as ${c.side === 'enabler' ? 'payoffs' : 'enablers'} but ${c.side === 'enabler' ? 'almost nothing that feeds them' : 'almost nothing that rewards them'}. ${c.card.card.name} (not in the deck; costs ${costText(c.card)}) would: "${c.quote}"`, partners,
      `Network edges from ${c.card.card.name} to ${partners.length} deck cards (total strength ${c.value.toFixed(2)}); e.g. ${c.partnerName}: "${c.partnerQuote}". Inside the legend's domains and legal in ${view.deck.format}. Heuristic.`, null, true, [c.card.card.id]));
    if (out.length >= 3) break;
  }
  return out;
}
