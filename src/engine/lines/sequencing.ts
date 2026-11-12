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
import { readyEffects, routeFeatures, soloSide } from '../wincons/features';
import { deckCard, displayName, nameList, pSeen, pct, type DeckCard } from '../wincons/view';
import { RUNES, copies, costText, hasKw, libCopies, line, orient, pBoth, pHave, turnFor, type LineContext, type Link } from './context';

const MAX_NETWORK_LINES = 6;
const MAX_PACKAGES = 5;

/** A payoff that must already be in play when the enabler happens: a permanent with a trigger or a static effect. */
const TRIGGER = /^(?:when|whenever|while|each time|your|if|once|\[[a-z ]+\]\s*(?:\[>\]|—|-))/i;
/** Network pair lines under this chance of holding both cards are left out: a 3% line is not a plan. HEURISTIC. */
const MIN_PAIR_ODDS = 0.1;
const payoffFirst = (l: Link): boolean => {
  if (l.payoff.card.type === 'spell' || /\bi cost\b/i.test(l.payoffQuote)) return false;
  // A spell is gone when it resolves: a permanent it is meant to trigger has to be in play already
  // ("Cull the Weak first, then Soaring Scout" was the wrong way round).
  if (l.enabler.card.type === 'spell' && !/^when you play (?:me|this)\b/i.test(l.payoffQuote)) return true;
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
    const [a, b] = payoffFirst(l) ? [l.payoff, l.enabler] : [l.enabler, l.payoff];
    const turn = Math.max(always(a) && !a.champion ? 1 : turnFor(a.need, first), always(b) && !b.champion ? 1 : turnFor(b.need, first), 1);
    const p = pBoth(a, b, turn + 1, first, view);
    if (p < MIN_PAIR_ODDS && !always(a) && !always(b)) continue;
    perLabel.set(l.reason.label, (perLabel.get(l.reason.label) ?? 0) + 1);
    perCard.set(l.enabler.card.id, (perCard.get(l.enabler.card.id) ?? 0) + 1);
    perCard.set(l.payoff.card.id, (perCard.get(l.payoff.card.id) ?? 0) + 1);
    taken += 1;
    const replay = l.reason.id.startsWith('package:replay-unit:');
    // The legend is never "played first": it is always there, and what matters is which side of the pair it is.
    const legendSide = l.enabler.card.type === 'legend' ? 'enabler' : l.payoff.card.type === 'legend' ? 'payoff' : null;
    const head = legendSide === 'enabler' ? `${displayName(l.enabler.card)} is always in play and sets up ${l.payoff.card.name}`
      : legendSide === 'payoff' ? `${l.enabler.card.name} feeds ${displayName(l.payoff.card)}, which is always in play`
      : replay && a === l.payoff ? `${a.card.name} on the board, then ${displayName(b.card)} to play ${a.card.name} again`
      : `${a.card.name} first, then ${displayName(b.card)}`;
    out.push(line(lc, 'sequence', `${head} (${l.reason.label}). ${l.enabler.card.name}: "${l.enablerQuote}" -> ${l.payoff.card.name}: "${l.payoffQuote}". ${always(a) && always(b) ? 'Both are always available.' : `${pct(p)} to hold ${always(a) ? b.card.name : always(b) ? a.card.name : 'both'} by turn ${turn + 1}.`}`,
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
      out.push(line(lc, 'sequence', `${nameList(legion.map((c) => c.card.name), 3)} ${legion.length === 1 ? 'has' : 'have'} Legion but the deck has no card costing 1 or less to play first: the cheapest second card is ${[...main].filter((c) => !hasKw(c, 'legion')).sort((a, b) => a.need - b.need)[0]?.card.name ?? 'missing'}.`, legion, `Legion (${RULE.legion}).`, null, false));
    }
  }

  // Ready effects on your own unit. What a ready buys depends on where the unit can go next: a Standard Move
  // from a battlefield only returns to base unless the unit has Ganking (CR 144.4), so a plain ready is haste
  // for a unit played this turn; a second battlefield needs Ganking or a card that moves the unit itself.
  const readiers = byQty(main.filter((c) => c.card.type !== 'unit' && readyEffects(c).some((e) => e.target === 'own' && e.canMove)));
  if (readiers.length > 0 && units.length > 0) {
    const r = readiers[0];
    const effect = readyEffects(r).find((e) => e.target === 'own' && e.canMove)!;
    const movesIt = /\bmove (?:an?|another|up to \w+) (?:friendly )?units?\b/i.test(effect.sentence);
    const pairNeed = (u: DeckCard): number => Math.max((u.card.energy ?? 0) + (r.card.energy ?? 0), (u.card.power ?? 0) + (r.card.power ?? 0));
    const byMight = [...units].sort((x, y) => Number(y.champion) - Number(x.champion) || (y.card.might ?? 0) - (x.card.might ?? 0) || x.card.name.localeCompare(y.card.name));
    const gankers = byMight.filter((u) => hasKw(u, 'ganking'));
    const gankGear = byQty(main.filter((c) => c.card.type !== 'unit' && c.sentences.some((x) => /\[ganking\]/i.test(x))));
    const others = readiers.length > 1 ? ` ${nameList(readiers.slice(1).map((c) => c.card.name), 2)} ${readiers.length > 2 ? 'do' : 'does'} the same job.` : '';
    const pr = pHave(r, 5, first, view);
    const held = `${pct(pr)} to hold ${r.card.name} by turn 5.`;
    const what = effect.all ? 'every unit you control' : 'it';
    if (movesIt) {
      const u = byMight[0];
      out.push(line(lc, 'sequence', `${u.card.name} takes one battlefield with its own move; ${r.card.name} (${costText(r)}) then moves it again and readies it, which is how one unit scores both battlefields in a turn. ${r.card.name}: "${effect.sentence}" ${held}${others}`, [u, ...readiers],
        `A move exhausts the unit (${RULE.moveCost}) and a Standard Move only goes base to battlefield or back (${RULE.moveDestinations}), so the second battlefield needs a card that moves the unit; the last point from a conquer needs every battlefield scored that turn (${RULE.finalPointConquer}).`, pr, false));
    } else if (gankers.length > 0 || gankGear.length > 0) {
      const u = gankers[0] ?? byMight[0];
      const via = gankers.length > 0 ? `${u.card.name} has Ganking` : `${u.card.name} with ${gankGear[0].card.name} has Ganking`;
      out.push(line(lc, 'sequence', `${via}: it conquers one battlefield, ${r.card.name} (${costText(r)}) readies ${what}, and its Standard Move then goes straight to the other battlefield. ${r.card.name}: "${effect.sentence}" ${held}${others}`, [u, ...(gankers.length > 0 ? [] : [gankGear[0]]), ...readiers],
        `A move exhausts the unit (${RULE.moveCost}); Ganking lets a Standard Move go battlefield to battlefield (${RULE.ganking}); the last point from a conquer needs every battlefield scored that turn (${RULE.finalPointConquer}).`, pr, false));
    } else {
      // No Ganking and no move on the card: the ready is haste for a unit that entered exhausted this turn.
      const u = byMight.find((x) => pairNeed(x) <= RUNES && turnFor(pairNeed(x), first) > 0);
      if (u) {
        const need = pairNeed(u);
        out.push(line(lc, 'sequence', `${r.card.name} (${costText(r)}) readies ${effect.all ? 'your units' : `${u.card.name}`} the turn ${effect.all ? 'they are' : 'it is'} played, so ${effect.all ? 'they' : 'it'} can move at once: ${u.card.name} + ${r.card.name} need ${need} runes (turn ${turnFor(need, first)} ${first.label}, ${turnFor(need, last)} ${last.label}). It does not reach a second battlefield: no unit in the deck has Ganking, and from a battlefield a Standard Move only returns to base. ${r.card.name}: "${effect.sentence}" ${held}${others}`, [u, ...readiers],
          `Units enter exhausted (${RULE.entersExhausted}); a move exhausts the unit (${RULE.moveCost}); Standard Move destinations (${RULE.moveDestinations}).`, pr, false));
      }
    }
  }

  // Units that ready themselves or another unit by their own text, when the deck also has Ganking for them.
  if (readiers.length === 0) {
    const selfReady = byQty(units.filter((c) => readyEffects(c).some((e) => e.target === 'own' && e.canMove)));
    const gankGear = byQty(main.filter((c) => c.card.type !== 'unit' && c.sentences.some((x) => /\[ganking\]/i.test(x))));
    const u = selfReady.find((c) => hasKw(c, 'ganking')) ?? (gankGear.length > 0 ? selfReady[0] : undefined);
    if (u) {
      const effect = readyEffects(u).find((e) => e.target === 'own' && e.canMove)!;
      const gear = hasKw(u, 'ganking') ? null : gankGear[0];
      const p = gear ? pBoth(u, gear, 5, first, view) : pHave(u, 5, first, view);
      out.push(line(lc, 'sequence', `${u.card.name} ${gear ? `carrying ${gear.card.name} (Ganking)` : 'has Ganking and'} can take both battlefields in one turn: it conquers one, its own text readies it, and the Standard Move then goes battlefield to battlefield. ${u.card.name}: "${effect.sentence}"${gear ? ` ${pct(p)} to have ${u.champion ? gear.card.name : 'both'} by turn 5.` : ''}`, [u, ...(gear ? [gear] : [])],
        `A move exhausts the unit (${RULE.moveCost}); Ganking lets a Standard Move go battlefield to battlefield (${RULE.ganking}); the last point from a conquer needs every battlefield scored that turn (${RULE.finalPointConquer}).`, p, false));
    }
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

  // "Alone" texts: whose unit is alone decides the advice (soloSide).
  const soloAll = [...main.filter((c) => routeFeatures(c).has('solo')), ...(view.legend && view.legend.traits.has('solo') ? [view.legend] : [])];
  const aloneQuote = (c: DeckCard): string => c.sentences.find((s) => /\balone\b|\bone on one\b|\bonly unit\b/i.test(s)) ?? c.sentences[0] ?? '';
  const solo = byQty(soloAll.filter((c) => soloSide(c) === 'own'));
  if (solo.length > 0) {
    out.push(line(lc, 'sequence', `Send units to different battlefields: ${nameList(solo.map((c) => c.card.name), 3)} ${solo.length > 1 ? 'care' : 'cares'} about your unit being alone. ${solo[0].card.name}: "${aloneQuote(solo[0])}"`, solo,
      `Card text; ${view.facts.battlefieldsOnBoard} battlefields are in play in this format (${view.facts.battlefieldRule}).`, null, false));
  }
  const lone = byQty(soloAll.filter((c) => soloSide(c) === 'enemy'));
  if (lone.length > 0) {
    out.push(line(lc, 'sequence', `${nameList(lone.map((c) => c.card.name), 3)} ${lone.length > 1 ? 'look' : 'looks'} for a battlefield where exactly one enemy unit stands: attack there, and leave your removal for the second unit that would spoil it. ${lone[0].card.name}: "${aloneQuote(lone[0])}"`, lone,
      `Card text; ${view.facts.battlefieldsOnBoard} battlefields are in play in this format (${view.facts.battlefieldRule}). The advice is a heuristic.`, null, true));
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

  // Exhaust payoffs: a Standard Move exhausts the unit, and some cards exhaust one as a cost. A card that
  // triggers on its own exhaustion and a card that counts other units' exhaustion want opposite orders.
  const exhaustQuote = (c: DeckCard): string => c.sentences.find((x) => /\bbecomes? exhausted\b/i.test(x)) ?? '';
  const exhaustPay = byQty(main.filter((c) => exhaustQuote(c) !== ''));
  const watchers = exhaustPay.filter((c) => /\b(?:another|a|other) friendly units? becomes? exhausted\b|\bwhen a unit you control becomes exhausted\b/i.test(exhaustQuote(c)));
  const selfers = exhaustPay.filter((c) => !watchers.includes(c) && /\bwhen i become exhausted\b/i.test(exhaustQuote(c)));
  const sources = byQty(main.filter((c) => c.sentences.some((x) => /\bexhaust (?:a|another) friendly unit\b/i.test(x))));
  if (watchers.length > 0) {
    const p = watchers[0];
    out.push(line(lc, 'sequence', `${nameList(watchers.map((c) => c.card.name), 3)} ${watchers.length > 1 ? 'count' : 'counts'} your other units becoming exhausted. Every move exhausts the unit that moves${sources.length ? `, and ${nameList(sources.filter((c) => c !== p).map((c) => c.card.name), 3) || p.card.name} ${sources.filter((c) => c !== p).length > 1 ? 'exhaust' : 'exhausts'} one on demand` : ''}: move the other units first, ${p.card.name} last. ${p.card.name}: "${exhaustQuote(p)}"`, [...watchers, ...sources],
      `Exhausting the unit is the cost of a Standard Move (${RULE.moveCost}); the trigger is card text.`, null, false));
  }
  if (selfers.length > 0) {
    const p = selfers[0];
    const feeders = sources.filter((c) => !selfers.includes(c));
    out.push(line(lc, 'sequence', `${nameList(selfers.map((c) => c.card.name), 3)} ${selfers.length > 1 ? 'trigger' : 'triggers'} each time ${selfers.length > 1 ? 'they are' : 'it is'} exhausted: ${selfers.length > 1 ? "their" : "its"} own move does it${feeders.length ? `, and so does paying ${nameList(feeders.map((c) => c.card.name), 3)} with it` : ''}. ${p.card.name}: "${exhaustQuote(p)}"`, [...selfers, ...feeders],
      `Exhausting the unit is the cost of a Standard Move (${RULE.moveCost}); the trigger is card text.`, null, false));
  }

  const deathknell = withKw('deathknell');
  if (deathknell.length > 0) {
    const d = deathknell[0];
    out.push(line(lc, 'sequence', `Trade or defend alone with ${nameList(deathknell.map((c) => c.card.name), 3)} before your other units: ${d.card.name}: "${d.sentences.find((s) => /deathknell/i.test(s)) ?? ''}"`, deathknell,
      `Deathknell triggers when the unit dies (${RULE.deathknell}).`, null, false));
  }

  const tanks = withKw('tank');
  if (tanks.length > 0) {
    // The unit worth guarding: a closer of the deck's first route, else the Chosen Champion, else the largest body.
    const open = [...units].filter((c) => !hasKw(c, 'tank'));
    const closerIds = new Set((lc.win.routes[0]?.closers ?? []).map((c) => c.card.id));
    const guarded = open.filter((c) => closerIds.has(c.card.id) && (c.card.might ?? 0) >= 4).sort((a, b) => (b.card.might ?? 0) - (a.card.might ?? 0) || a.card.name.localeCompare(b.card.name))[0]
      ?? open.find((c) => c.champion)
      ?? open.sort((a, b) => (b.card.might ?? 0) - (a.card.might ?? 0) || b.rating - a.rating || a.card.name.localeCompare(b.card.name))[0];
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
  // Only pairs measured mostly under this deck's own legend: "An Offer You Can't Refuse and Baron Nashor, most
  // in Ziggs" says nothing about a Riven list.
  const tag = lc.view.legend?.card.championTag ?? '';
  const ownLegend = (detail: string): boolean => !!tag && (detail.includes(`most in ${tag}:`) || new RegExp(`\\bof \\d+ ${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} lists\\b`).test(detail.split('most in')[0]));
  for (const l of lc.coPlay.filter((x) => lc.view.byId.has(x.enabler.card.id) && lc.view.byId.has(x.payoff.card.id) && ownLegend(x.reason.detail)).slice(0, 3)) {
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
  const sideCards = (have: { enablers: Set<string>; payoffs: Set<string> } | undefined, side: 'enabler' | 'payoff'): DeckCard[] =>
    [...(side === 'enabler' ? have?.enablers ?? [] : have?.payoffs ?? [])].map((id) => view.byId.get(id)).filter((x): x is DeckCard => !!x && x.card.type !== 'legend');
  const sideCopies = (have: { enablers: Set<string>; payoffs: Set<string> } | undefined, side: 'enabler' | 'payoff'): number => {
    const ids = side === 'enabler' ? have?.enablers : have?.payoffs;
    if (!ids) return 0;
    let n = 0;
    for (const id of ids) n += id === view.legend?.card.id || view.byId.get(id)?.champion ? 2 : view.byId.get(id)?.qty ?? 0; // a legend or Chosen Champion is always there
    return n;
  };
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
    // One away: the deck holds at least two cards of the other side and at most ONE COPY doing this card's job.
    // (The first version counted cards, so three copies of Temporal Breach were "almost nothing that feeds them"
    // right under the package line that named Temporal Breach as the enabler.)
    return unique(c.partners).length >= 2 && copies(unique(c.partners)) >= 4 && sideCopies(have, c.side) <= 1 && !packages.slice(0, MAX_PACKAGES).some((p) => p.label === c.label);
  }).sort((a, b) => b.value * (b.card.rating / 100) - a.value * (a.card.rating / 100) || a.card.card.id.localeCompare(b.card.card.id));
  const out: Line[] = [];
  const seenLabels = new Set<string>();
  const seenCards = new Set<string>();
  const seenPartners = new Set<string>();
  for (const c of ranked) {
    // Two families over the same deck cards ("Token rewards" and "Go-wide package") are one suggestion, not two.
    const partnerKey = unique(c.partners).map((x) => x.card.id).sort().join('|');
    if (seenLabels.has(c.label) || seenCards.has(c.card.card.id) || seenPartners.has(partnerKey)) continue;
    seenPartners.add(partnerKey);
    seenLabels.add(c.label);
    seenCards.add(c.card.card.id);
    const partners = byQty(unique(c.partners));
    const mine = sideCards(sides.get(c.label), c.side);
    const lack = mine.length === 0 ? `no card that ${c.side === 'enabler' ? 'feeds' : 'rewards'} them` : `only ${copyNames(mine, 2)} to ${c.side === 'enabler' ? 'feed' : 'reward'} them`;
    out.push(line(lc, 'package', `One card away from ${c.label}: the deck has ${copyNames(partners, 4)} (${copies(partners)} copies) as ${c.side === 'enabler' ? 'payoffs' : 'enablers'} but ${lack}. ${c.card.card.name} (not in the deck; costs ${costText(c.card)}) would: "${c.quote}"`, partners,
      `Network edges from ${c.card.card.name} to ${partners.length} deck cards (total strength ${c.value.toFixed(2)}); e.g. ${c.partnerName}: "${c.partnerQuote}". Inside the legend's domains and legal in ${view.deck.format}. Heuristic.`, null, true, [c.card.card.id]));
    if (out.length >= 3) break;
  }
  return out;
}
