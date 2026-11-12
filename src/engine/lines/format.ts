// Format notes (spec 14, spec 9): what the deck's format changes for this deck's own cards. New code.
//
// FACT: every rule statement carries its rule number (docs/research/rules.md section 10; Core Rules
// 2026-10-09). HEURISTIC: the reading of what that means for a card (marked per line).
import type { Line } from '../types';
import { REMOVING, answerHits, answersOf } from '../wincons/answers';
import { RULE } from '../wincons/facts';
import { routeFeatures } from '../wincons/features';
import { fieldOf } from '../wincons/field';
import { nameList, pSeen, pct, type DeckCard } from '../wincons/view';
import { copies, libCopies, line, type LineContext } from './context';

const byQty = (cards: readonly DeckCard[]): DeckCard[] => [...cards].sort((a, b) => b.qty - a.qty || b.rating - a.rating || a.card.name.localeCompare(b.card.name));
/** Ready or move copies this tool takes as enough to conquer three battlefields in one turn (wincons.md 4.4). HEURISTIC. */
const TRIPLE_CONQUER_COPIES = 18;

export function formatLines(lc: LineContext): Line[] {
  const { view, win } = lc;
  const facts = view.facts;
  const out: Line[] = [];
  const main = view.main;
  if (main.length === 0) return out;
  const anchor = view.champion ?? view.legend ?? main[0];
  const movers = win.reach.movers;
  const holders = win.reach.holders;
  const format = facts.format;

  // Battlefields: how the game's battlefield is picked, and what each of the deck's three does with its cards.
  for (const b of view.battlefields) {
    const partners = byQty([...new Map(lc.links
      .filter((l) => l.enabler.card.id === b.card.id || l.payoff.card.id === b.card.id)
      .map((l) => (l.enabler.card.id === b.card.id ? l.payoff : l.enabler))
      .filter((c) => c.card.type !== 'battlefield')
      .map((c) => [c.card.id, c] as const)).values()]);
    const pick = facts.battlefieldPick.chosen ? `you choose it game by game (${facts.battlefieldPick.rule})` : `it is yours in one game of three, picked at random (${facts.battlefieldPick.rule})`;
    // No stored edge: read the battlefield's own sentence for the three things a deck list can answer directly
    // (stage 3 review: Void Gate was "linked to no card" in a list with 11 damage spells, Bandle Scouts' Academy
    // in a list with 16 Hidden copies, and all three battlefields were "the last one to choose").
    const text = b.sentences.join(' ');
    let direct: DeckCard[] = [];
    let directWhy = '';
    if (partners.length === 0) {
      if (/\bbonus damage\b/i.test(text)) { direct = byQty(main.filter((c) => answersOf(c.card).some((a) => a.kind === 'damage' || a.kind === 'sweep'))); directWhy = 'deal damage with a spell or ability'; }
      else if (/\bhide a card here\b|\bfacedown\b|\bface down\b/i.test(text)) { direct = byQty(main.filter((c) => routeFeatures(c).has('hidden'))); directWhy = 'have Hidden'; }
      else if (/\bwhen you hold here\b/i.test(text)) { direct = holders; directWhy = 'are built to hold'; }
    }
    const meta = view.legend ? lc.ctx.db.legendMeta(view.legend.card.id) : undefined;
    const stat = meta?.battlefields[b.card.id];
    const brought = meta && meta.decks >= 4 && stat ? ` ${stat.decks} of ${meta.decks} public ${view.legend!.card.name} lists bring it (data).` : '';
    const use = partners.length > 0 ? `It works with ${nameList(partners.map((c) => c.card.name), 4)}.`
      : direct.length > 0 ? `${copies(direct)} ${copies(direct) === 1 ? 'copy' : 'copies'} in the deck ${directWhy}: ${nameList(direct.map((c) => c.card.name), 4)}.`
      : 'No card in the deck is tied to it by its text.';
    out.push(line(lc, 'format', `${b.card.name}: "${b.sentences[0] ?? ''}" ${use}${brought} In ${format} ${pick}.`, [b, ...partners.slice(0, 4), ...direct.slice(0, 4)],
      `${partners.length > 0 ? 'Network edges between the battlefield and deck cards (heuristic). ' : direct.length > 0 ? "Read from the battlefield's own sentence and the deck's card texts. " : ''}${facts.battlefieldsOnBoard} battlefields are in play (${facts.battlefieldRule}).`, facts.battlefieldPick.chosen ? null : 1 / 3, partners.length > 0));
  }

  const conquerRule = facts.team ? RULE.teamFinalPoint : RULE.finalPointConquer;
  const target = facts.victoryScore;
  out.push(line(lc, 'format', `${format}: first to ${target}${facts.team ? ' as a team' : ''} with ${facts.battlefieldsOnBoard} battlefields in play. From ${target - 1}, a hold ends the game (${holders.length ? `${nameList(holders.map((c) => c.card.name), 3)} can sit on one` : 'the deck has no unit built to hold'}); a conquer ends it only if you scored all ${facts.battlefieldsOnBoard} that turn (${movers.length ? `${copies(movers)} ready or move ${copies(movers) === 1 ? 'copy' : 'copies'}: ${nameList(movers.map((c) => c.card.name), 3)}` : 'the deck has no ready or move effect for that'}).`,
    [...holders.slice(0, 3), ...movers.slice(0, 3), anchor],
    `Victory Score (${facts.victoryRule}); battlefield count (${facts.battlefieldRule}); one score per battlefield per turn (${RULE.oncePerBattlefield}); last point from a hold (${RULE.finalPointOther}) and from a conquer (${conquerRule}).`, null, false));

  if (format === 'standard-bo3') {
    out.push(line(lc, 'format', `Best of three: game 1 is the registered 40 with ${anchor.card.name}; side cards come in from game 2, one in for one out. The battlefields used in a game that someone won are removed for the rest of the match, so each of ${nameList(view.battlefields.map((b) => b.card.name), 3) || 'your battlefields'} is played in one decided game at most.`, [anchor, ...view.battlefields],
      `No side cards in game 1 (${RULE.sideGameOne}); 1-for-1 (${RULE.sideOneForOne}); battlefield selection and removal (${facts.battlefieldPick.rule}).`, null, false));
  }
  if (facts.opponents <= 1) return out;

  // More than two players.
  const [first, last] = facts.seats;
  const early = byQty(main.filter((c) => c.card.type === 'unit' && !c.champion && c.need <= last.runes(1)));
  if (early.length > 0) {
    const k = libCopies(early);
    out.push(line(lc, 'format', `Seat matters more here: going first you skip your first draw and have ${first.runes(1)} runes, going last you draw and have ${last.runes(1)}. ${nameList(early.map((c) => c.card.name), 3)} (${k} copies): in hand on turn 1 ${pct(pSeen(k, first.seen(1), view.library))} going first, ${pct(pSeen(k, last.seen(1), view.library))} going last.`, early,
      `First Turn Process (${facts.firstTurnRule}).`, pSeen(k, first.seen(1), view.library), false));
  }
  if ((format === 'ffa4' || format === '2v2') && view.battlefields.length > 0) {
    out.push(line(lc, 'format', `If you take the first turn, ${nameList(view.battlefields.map((b) => b.card.name), 3)} are removed and not used: none of your battlefield plans exist in that game.`, view.battlefields,
      `The first player's battlefields are not used (${format === '2v2' ? 'CR 491.5.b' : 'CR 490.4.b'}).`, null, false));
  }
  const gank = byQty(main.filter((c) => routeFeatures(c).has('gank')));
  if (gank.length > 0) {
    out.push(line(lc, 'format', `${nameList(gank.map((c) => c.card.name), 3)} (Ganking) ${gank.length > 1 ? 'have' : 'has'} two other battlefields to hop to instead of one, but a battlefield where two other players are in combat cannot be entered.`, gank,
      `Ganking (${RULE.ganking}); ${facts.battlefieldsOnBoard} battlefields (${facts.battlefieldRule}); staged or ongoing combat blocks the destination (${RULE.thirdPartyCombat}).`, null, true));
  }
  const tricks = byQty(main.filter((c) => c.card.type === 'spell' && (c.features?.speed === 'action' || c.features?.speed === 'reaction')));
  if (tricks.length > 0) {
    out.push(line(lc, 'format', `Focus passes to every player in a showdown, so ${nameList(tricks.map((c) => c.card.name), 4)} can be played into a fight between two other players, and theirs into yours: count ${facts.opponents} opponents' open runes before you commit ${anchor.card.name}.`, [...tricks, anchor],
      `Focus passes to the next player in turn order (${RULE.focusAround}); Action and Reaction timing (${RULE.showdownTiming}).`, null, true));
  }
  // The closer against several opponents' removal (field data).
  const closer = win.routes[0]?.closers.find((c) => c.card.type === 'unit');
  const field = fieldOf(lc.ctx.db);
  if (closer && field.lists > 0) {
    const reaching = field.cards.filter((f) => f.rate >= 0.02 && f.answers.some((a) => REMOVING.includes(a.kind) && a.kind !== 'sweep' && answerHits(a, closer.card).hits));
    const one = field.rateOfAny(reaching.map((f) => f.card.id));
    if (reaching.length > 0) {
      const any = 1 - (1 - one) ** facts.opponents;
      out.push(line(lc, 'format', `${closer.card.name} faces ${facts.opponents} decks: if each is a typical synced list, at least one main-decks a card that removes it ${pct(any)} of the time (${pct(one)} for a single opponent; ${nameList(reaching.slice(0, 3).map((f) => f.card.name), 3)}).`, [closer],
        `Share of ${field.lists} synced lists that run an answer that works on this card, treated as independent opponents (heuristic).`, any, true, reaching.slice(0, 3).map((f) => f.card.id)));
    }
  }
  const mass = byQty(main.filter((c) => answersOf(c.card).some((a) => a.kind === 'sweep') || c.sentences.some((s) => /\beach opponent\b|\ball enemy\b|\beach enemy\b/i.test(s))));
  if (mass.length > 0) {
    out.push(line(lc, 'format', `${nameList(mass.map((c) => c.card.name), 3)} ${mass.length > 1 ? 'hit' : 'hits'} every enemy at once: with ${facts.opponents} opponents ${mass.length > 1 ? 'they are' : 'it is'} worth more than in a duel.`, mass,
      'Card text ("all enemy", "each enemy", "each opponent"); the value judgement is a heuristic.', null, true));
  }

  if (facts.team) {
    const friendly = byQty(main.filter((c) => c.sentences.some((s) => /\bfriendly\b/i.test(s))));
    if (friendly.length > 0) {
      out.push(line(lc, 'format', `${nameList(friendly.map((c) => c.card.name), 4)} say "friendly": in 2v2 that includes your teammate's units and gear. ${friendly[0].card.name}: "${friendly[0].sentences.find((s) => /\bfriendly\b/i.test(s)) ?? ''}"`, friendly,
        `"Friendly" covers a teammate's objects (${RULE.teamFriendly}).`, null, false));
    }
    out.push(line(lc, 'format', `Points are shared and a battlefield scores once per team per turn: ${holders.length ? nameList(holders.map((c) => c.card.name), 3) : anchor.card.name} holding one battlefield uses it up for your teammate that turn, and you cannot move to a battlefield your teammate occupies${movers.length ? ` (${nameList(movers.map((c) => c.card.name), 2)} need a different target)` : ''}.`, [...holders.slice(0, 3), ...movers.slice(0, 2), anchor],
      `Shared points (${RULE.teamPoints}); once per team per turn (${RULE.teamOncePerTurn}); teammate-occupied battlefields are invalid destinations (${RULE.teammateBattlefield}).`, null, false));
  } else {
    out.push(line(lc, 'format', `The last point by conquest needs all three battlefields in one turn: ${movers.length ? `${copies(movers)} ready or move copies (${nameList(movers.map((c) => c.card.name), 3)})` : `${anchor.card.name} and no ready or move effect`} against the ${TRIPLE_CONQUER_COPIES} this tool takes as enough for three. Plan the last point as a hold${holders.length ? ` with ${holders[0].card.name}` : ''}.`, [...movers.slice(0, 4), ...holders.slice(0, 1), anchor],
      `Last point from a conquer (${RULE.finalPointConquer}) with ${facts.battlefieldsOnBoard} battlefields (${facts.battlefieldRule}); the threshold of ${TRIPLE_CONQUER_COPIES} is a heuristic (wincons.md 4.4).`, null, true));
  }
  return out;
}
