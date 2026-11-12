// Matchup and side-deck lines (spec 14; docs/research/matchups-and-lines.md 3.3, 4.2-4.3 and section 5;
// prototype: analysis/matchups-and-lines/linegen.py). New code: Riftfoundry has no matchup or side-deck logic.
//
// The opponent is a legend. Its "typical list" is the synced inclusion data of that legend (`LegendMeta`):
// DATA, shares of public lists. Every answer is tested card against card with answers.ts, so a damage spell is
// only counted against units it kills and a counterspell only against spells inside its condition.
//
// Fixes of the prototype's defects (3.9):
//   - side-out also ranks cards with no opponent-dependent target (weakest evaluation and fewest network links
//     first), so a good side-in is never left without a card to take out;
//   - a sweeper is counted only against the units its damage kills;
//   - protection is read from the card's own keywords, never from a token it makes (features.ts);
//   - a legend with fewer than FIELD_MIN_LISTS synced lists gives one line that says so, not advice.
// HEURISTIC: the side-in thresholds (ratio 1.2, two expected copies), the side-out order and the whole
// matchup lean (section 4.3: hand-set weights, never fitted to results; it shows a direction, not a win rate).
import { eligibleChampions } from '../rules/champion';
import { formatRules } from '../rules/formats';
import type { Card, Deck, LegendMeta, Line } from '../types';
import { REMOVING, answerHits, answersOf, describeAnswer, type Answer } from '../wincons/answers';
import { ROUTE_LABELS, analyseRoutes } from '../wincons/detect';
import { RULE } from '../wincons/facts';
import { routeFeatures } from '../wincons/features';
import { FIELD_MIN_LISTS, fieldOf, typicalList } from '../wincons/field';
import { displayName, nameList, pct, viewDeck, type DeckCard, type DeckView } from '../wincons/view';
import { copies, hasKw, line, type LineContext } from './context';

/** A card of the opposing legend counts as typical from this share of its lists. */
const TYPICAL = 0.2;
// A stun or a Might reduction buys a turn; it is not counted as an answer to a card.
const UNIT_KINDS: readonly Answer['kind'][] = [...REMOVING, 'displace'];

interface Typical { card: Card; share: number; copies: number }
interface Reach { hit: { t: Typical; why: string; conditional: boolean }[]; miss: { t: Typical; why: string }[]; expected: number; answer: Answer | null }

/** Which typical cards of a list one of my cards answers, with expected copies answered per opposing list. */
function reach(card: Card, typical: readonly Typical[]): Reach {
  const out: Reach = { hit: [], miss: [], expected: 0, answer: null };
  const answers = answersOf(card).filter((a) => UNIT_KINDS.includes(a.kind) || a.kind === 'gear-kill' || a.kind === 'counter');
  if (answers.length === 0) return out;
  out.answer = answers[0];
  for (const t of typical) {
    let best: { why: string; conditional: boolean } | null = null;
    let miss = '';
    let relevant = false;
    for (const a of answers) {
      // "Counter an enemy spell or ability that chooses a friendly unit or gear" (Not So Fast): its targets are
      // the opposing cards that aim at one of yours, read from their own text. Conditional: they have to aim it.
      if (a.kind === 'counter' && a.counter?.onlyTargeting) {
        const aimed = aimedAt(t.card);
        if (!aimed || (t.card.type !== 'spell' && !/\bability\b/i.test(a.sentence))) continue;
        relevant = true;
        if (!best) best = { why: `it chooses your unit or gear (${aimed})`, conditional: true };
        continue;
      }
      const applies = a.kind === 'counter' ? t.card.type === 'spell' : a.kind === 'gear-kill' ? t.card.type === 'gear' : t.card.type === 'unit';
      if (!applies) continue;
      relevant = true;
      const h = answerHits(a, t.card);
      if (h.hits && (!best || (best.conditional && !h.conditional))) best = { why: h.why, conditional: h.conditional };
      else if (!h.hits && !miss) miss = h.why;
    }
    if (best) { out.hit.push({ t, ...best }); out.expected += t.copies * (best.conditional ? 0.5 : 1); }
    else if (relevant) out.miss.push({ t, why: miss });
  }
  return out;
}

/** What an opposing card aims at one of your units or gear, in words; null when it chooses nothing of yours. */
function aimedAt(card: Card): string | null {
  const a = answersOf(card).find((x) => x.kind !== 'sweep' && x.kind !== 'counter');
  return a ? describeAnswer(a) : null;
}

const typicalOf = (meta: LegendMeta, lc: LineContext): Typical[] => typicalList(meta, lc.ctx.db).filter((t) => t.share >= TYPICAL);
const shown = (t: Typical): string => `${t.card.name} (${t.card.type === 'unit' ? `${t.card.might ?? 0} Might, ` : ''}${pct(t.share)} of lists)`;

/** A stand-in deck for a legend: its most played cards up to 40, the most played champion. */
export function typicalDeck(meta: LegendMeta, lc: LineContext): Deck {
  const list = typicalList(meta, lc.ctx.db);
  const main: Deck['main'] = [];
  let n = 0;
  for (const t of list) {
    if (n >= 40) break;
    const qty = Math.max(1, Math.min(3, Math.round(meta.main[t.card.id]?.avgCopies ?? 1), 40 - n));
    main.push({ id: t.card.id, qty, locked: false });
    n += qty;
  }
  const champion = Object.entries(meta.champions).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  // The Chosen Champion is one of the 40 even when the lists store it outside the main zone.
  if (champion && lc.ctx.db.get(champion) && !main.some((e) => e.id === champion)) main.unshift({ id: champion, qty: 1, locked: false });
  const battlefields = Object.entries(meta.battlefields).sort((a, b) => b[1].share - a[1].share || a[0].localeCompare(b[0])).slice(0, 3).map(([id]) => id);
  return { id: null, name: 'typical', format: lc.deck.format, power: lc.deck.power, legend: meta.legendId, champion: champion && main.some((e) => e.id === champion) ? champion : null, main, side: [], runes: {}, battlefields, extraLegends: [], themeWeights: null, teammate: null };
}

interface Opponent { legend: Card; meta: LegendMeta; typical: Typical[] }

function opponentOf(lc: LineContext): { opp: Opponent | null; note: Line | null } {
  const id = lc.ctx.opponentLegend;
  if (!id) return { opp: null, note: null };
  const legend = lc.ctx.db.get(id);
  if (!legend || legend.type !== 'legend') return { opp: null, note: null };
  const meta = lc.ctx.db.legendMeta(id);
  const anchor = lc.view.legend ?? lc.view.champion ?? lc.view.main[0] ?? null;
  if (!meta || meta.decks < FIELD_MIN_LISTS) {
    return { opp: null, note: anchor ? line(lc, 'matchup', `No matchup lines against ${displayName(legend)}: ${meta?.decks ?? 0} synced ${meta?.decks === 1 ? 'list' : 'lists'}, and ${FIELD_MIN_LISTS} are needed before its typical cards mean anything. ${anchor.card.name} is compared with the whole field in the win-route report instead.`, [anchor], 'Sample size of the synced lists for the opposing legend (data).', null, false, [legend.id]) : null };
  }
  return { opp: { legend, meta, typical: typicalOf(meta, lc) }, note: null };
}

interface Profile { speed: number; spot: number; sweep: number; counter: number; wide: number; tall: number; reach: number; protect: number; spellrel: number; names: Record<string, string[]> }

/** matchups-and-lines.md 4.2 features, scaled to 0..1 by fixed divisors (HEURISTIC; the research used percentiles). */
function profileOf(view: DeckView): Profile {
  const names: Record<string, string[]> = {};
  const count = (key: string, test: (c: DeckCard) => number): number => {
    let n = 0;
    const hits: DeckCard[] = [];
    for (const c of view.main) { const w = test(c); if (w > 0) { n += w * c.qty; hits.push(c); } }
    names[key] = hits.sort((a, b) => b.qty - a.qty || a.card.name.localeCompare(b.card.name)).slice(0, 3).map((c) => c.card.name);
    return n;
  };
  const has = (c: DeckCard, f: string): boolean => routeFeatures(c).has(f as never);
  const unit = (c: DeckCard): boolean => c.card.type === 'unit';
  const top = view.main.filter(unit).flatMap((c) => Array.from({ length: c.qty }, () => c.card.might ?? 0)).sort((a, b) => b - a).slice(0, 6);
  const clamp = (x: number): number => Math.max(0, Math.min(1, x));
  return {
    speed: clamp(count('speed', (c) => (unit(c) ? (c.need <= 2 ? 1 : c.need === 3 ? 0.5 : 0) + (has(c, 'haste') ? 1 : 0) : 0)) / 14),
    spot: clamp(count('spot', (c) => (has(c, 'removal') || has(c, 'displace') || has(c, 'stun') ? 1 : 0)) / 10),
    sweep: clamp(count('sweep', (c) => (has(c, 'sweep') ? 1 : 0)) / 3),
    counter: clamp(count('counter', (c) => (has(c, 'counter') ? 1 : 0)) / 4),
    wide: clamp(count('wide', (c) => (unit(c) || has(c, 'token') ? 1 : 0)) / 26),
    tall: clamp((top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0) / 8 + count('pump', (c) => (has(c, 'pump') || has(c, 'buff') ? 1 : 0)) / 40),
    reach: clamp(count('reach', (c) => (has(c, 'gank') || has(c, 'haste') || has(c, 'ready') || has(c, 'ambush') ? 1 : 0)) / 10),
    protect: clamp(count('protect', (c) => (has(c, 'prot') || has(c, 'shield') ? 1 : 0)) / 8),
    spellrel: clamp(count('spellrel', (c) => (c.card.type === 'spell' && c.need >= 3 ? 1 : 0)) / 10),
    names,
  };
}

export function matchupLines(lc: LineContext): Line[] {
  const { opp, note } = opponentOf(lc);
  if (!opp) return note ? [note] : [];
  const { view } = lc;
  const out: Line[] = [];
  const name = displayName(opp.legend);
  const sample = `${opp.meta.decks} synced ${name} lists`;
  const reason = (extra: string): string => `${extra} Typical cards: main-deck inclusion in ${sample} (data, ${opp.meta.quality} sample).`;

  // a. What my interaction answers, card against card.
  const mine = view.main.map((c) => ({ c, r: reach(c.card, opp.typical) })).filter((x) => x.r.answer);
  const live = mine.filter((x) => x.r.hit.length > 0).sort((a, b) => b.r.expected * b.c.qty - a.r.expected * a.c.qty || a.c.card.name.localeCompare(b.c.card.name));
  // Cards that reach the same typical cards share a line.
  const groups = new Map<string, typeof live>();
  for (const x of live) {
    const key = x.r.hit.map((h) => h.t.card.id).sort().join('|');
    groups.set(key, [...(groups.get(key) ?? []), x]);
  }
  for (const group of [...groups.values()].slice(0, 4)) {
    const r = group[0].r;
    const hits = [...r.hit].sort((a, b) => b.t.copies - a.t.copies).slice(0, 3);
    const misses = [...r.miss].sort((a, b) => b.t.copies - a.t.copies).slice(0, 2);
    const who = nameList(group.map(({ c, r: gr }) => `${c.card.name} x${c.qty} (${describeAnswer(gr.answer!)})`), 3);
    out.push(line(lc, 'matchup', `${who} ${group.length > 1 ? 'answer' : 'answers'} ${hits.map((h) => shown(h.t)).join(', ')}: ${r.hit.reduce((n, h) => n + h.t.copies, 0).toFixed(1)} expected copies of legal targets in a typical ${name} list.${misses.length ? ` No effect on ${misses.map((m) => `${m.t.card.name} (${m.why})`).join(' or ')}.` : ''}`, group.map((g) => g.c),
      reason(group.slice(0, 2).map(({ c, r: gr }) => `${c.card.name}: "${gr.answer!.sentence}"`).join(' ')), null, false, [...hits.map((h) => h.t.card.id), ...misses.map((m) => m.t.card.id), opp.legend.id]));
  }
  const dead = mine.filter((x) => x.r.hit.length === 0);
  if (dead.length > 0) {
    out.push(line(lc, 'matchup', `Weak against ${name}: ${dead.slice(0, 4).map(({ c, r }) => `${c.card.name} x${c.qty} (${describeAnswer(r.answer!)}; ${r.miss.length ? `${r.miss[0].t.card.name}: ${r.miss[0].why}` : `no ${r.answer!.kind === 'gear-kill' ? 'gear' : r.answer!.kind === 'counter' ? 'spell' : 'unit'} in ${pct(TYPICAL)} or more of their lists`})`).join('; ')}.`, dead.map((x) => x.c),
      reason('No typical card of the opposing legend is a legal, effective target.'), null, false, [opp.legend.id]));
  }

  // b. Their plan, and which of my cards reach its closers.
  const theirView = viewDeck(typicalDeck(opp.meta, lc), lc.ctx.db);
  const their = analyseRoutes(theirView);
  const route = their.routes[0];
  if (route && route.closers.length > 0) {
    const closers = route.closers.slice(0, 3);
    const answersTo = closers.map((cl) => ({ cl, by: view.main.filter((c) => answersOf(c.card).some((a) => UNIT_KINDS.includes(a.kind) && answerHits(a, cl.card).hits)) }));
    const covered = answersTo.filter((x) => x.by.length > 0);
    const open = answersTo.filter((x) => x.by.length === 0 && x.cl.card.type === 'unit');
    const mineNamed = [...new Set(covered.flatMap((x) => x.by))];
    // What falls short of the closers nothing removes: my own interaction with the reason it misses.
    const short = open.length ? view.main.map((c) => ({ c, a: answersOf(c.card).find((a) => UNIT_KINDS.includes(a.kind)) })).filter((x) => x.a).map((x) => ({ c: x.c, why: answerHits(x.a!, open[0].cl.card).why })).slice(0, 3) : [];
    const racer = view.champion ?? view.main[0];
    const openText = open.length
      ? ` Nothing in your 40 removes ${nameList(open.map((x) => `${x.cl.card.name} (${x.cl.card.might ?? 0} Might)`), 2)}: ${short.length ? short.map((x) => `${x.c.card.name} (${x.why})`).join('; ') : `the deck has no removal, so ${racer.card.name} has to win the race`}.`
      : '';
    if (covered.length > 0 || open.length > 0) out.push(line(lc, 'matchup', `Typical ${name} lists score by ${ROUTE_LABELS[route.id].toLowerCase()} with ${nameList(closers.map((c) => c.card.name), 3)}. ${covered.length ? `Your answers - ${covered.map((x) => `${x.cl.card.name} (${x.cl.card.might ?? 0} Might): ${nameList(x.by.map((c) => c.card.name), 3)}`).join('; ')}.` : ''}${openText}`, [...mineNamed, ...short.map((x) => x.c), ...(mineNamed.length + short.length === 0 ? [racer] : [])],
      reason('Win route of a stand-in list built from the legend\'s most played cards (heuristic).'), null, true, [...closers.map((c) => c.card.id), opp.legend.id]));
  }

  // c. What to play around.
  const myUnits = view.main.filter((c) => c.card.type === 'unit');
  const unitCopies = copies(myUnits);
  for (const t of opp.typical) {
    const sweep = answersOf(t.card).find((a) => a.kind === 'sweep' && a.amount !== null);
    if (!sweep) continue;
    const victims = myUnits.filter((u) => answerHits(sweep, u.card).hits).sort((a, b) => b.qty - a.qty);
    if (copies(victims) < 3) continue;
    out.push(line(lc, 'matchup', `Play around ${shown(t)} - ${describeAnswer(sweep)}: it kills ${copies(victims)} of your ${unitCopies} unit copies (${nameList(victims.map((c) => c.card.name), 4)}). Split them across battlefields or lead with ${myUnits.filter((u) => !victims.includes(u)).sort((a, b) => b.qty - a.qty)[0]?.card.name ?? 'spells'}.`, victims,
      reason(`${t.card.name}: "${sweep.sentence}"`), t.share, false, [t.card.id, opp.legend.id]));
    break;
  }
  const mySpells = view.main.filter((c) => c.card.type === 'spell');
  for (const t of opp.typical) {
    const counter = answersOf(t.card).find((a) => a.kind === 'counter' && !a.counter?.onlyTargeting);
    if (!counter) continue;
    const stopped = mySpells.filter((s) => answerHits(counter, s.card).hits).sort((a, b) => b.rating - a.rating);
    const safe = mySpells.filter((s) => !answerHits(counter, s.card).hits).sort((a, b) => b.rating - a.rating);
    if (stopped.length === 0) continue;
    out.push(line(lc, 'matchup', `${shown(t)} - ${describeAnswer(counter)}: it stops ${nameList(stopped.map((c) => c.card.name), 4)}${safe.length ? `; ${nameList(safe.map((c) => `${c.card.name} (${answerHits(counter, c.card).why})`), 2)} ${safe.length > 1 ? 'are' : 'is'} outside it` : ''}. Bait it with ${stopped[stopped.length - 1].card.name} before ${stopped[0].card.name}.`, [...stopped, ...safe.slice(0, 2)],
      reason(`${t.card.name}: "${counter.sentence}"`), t.share, false, [t.card.id, opp.legend.id]));
    break;
  }
  const primary = lc.win.routes[0];
  const myClosers = (primary?.closers ?? []).filter((c) => c.card.type === 'unit').slice(0, 3);
  const theirRemoval = opp.typical.map((t) => ({ t, a: answersOf(t.card).filter((a) => REMOVING.includes(a.kind) && a.kind !== 'sweep') })).filter((x) => x.a.length > 0);
  const closerGroups = new Map<string, DeckCard[]>();
  for (const closer of myClosers) {
    const key = theirRemoval.filter((x) => x.a.some((a) => answerHits(a, closer.card).hits)).map((x) => x.t.card.id).join('|');
    closerGroups.set(key, [...(closerGroups.get(key) ?? []), closer]);
  }
  for (const closers of theirRemoval.length ? [...closerGroups.values()].slice(0, 2) : []) {
    const closer = closers[0];
    const hits = theirRemoval.filter((x) => x.a.some((a) => answerHits(a, closer.card).hits));
    const misses = theirRemoval.filter((x) => !x.a.some((a) => answerHits(a, closer.card).hits));
    const who = nameList(closers.map((c) => `${c.card.name} (${c.card.might ?? 0} Might${hasKw(c, 'deflect') ? ', Deflect' : ''})`), 3);
    const text = hits.length
      ? `Their answers to ${who}: ${hits.slice(0, 3).map((x) => `${shown(x.t)} - ${describeAnswer(x.a.find((a) => answerHits(a, closer.card).hits)!)}`).join('; ')}.${misses.length ? ` ${nameList(misses.slice(0, 2).map((x) => `${x.t.card.name} (${answerHits(x.a[0], closer.card).why})`), 2)} cannot.` : ''}`
      : `${who} ${closers.length > 1 ? 'are' : 'is'} out of reach of ${name}'s typical removal: ${misses.slice(0, 3).map((x) => `${x.t.card.name} (${answerHits(x.a[0], closer.card).why})`).join('; ')}.`;
    out.push(line(lc, 'matchup', text, closers, reason('Your first win route\'s closers against their typical removal.'), hits.length ? Math.max(...hits.map((x) => x.t.share)) : 0, false, [...hits.slice(0, 3).map((x) => x.t.card.id), ...misses.slice(0, 2).map((x) => x.t.card.id), opp.legend.id]));
  }
  const tricks = opp.typical.filter((t) => t.card.keywords.some((k) => /^(hidden|ambush)$/i.test(k)));
  if (tricks.length > 0 && myUnits.length > 0) {
    const attacker = view.champion?.card.type === 'unit' ? view.champion : [...myUnits].sort((a, b) => (b.card.might ?? 0) - (a.card.might ?? 0))[0];
    out.push(line(lc, 'matchup', `${name} lists hide or ambush ${nameList(tricks.slice(0, 4).map(shown), 4)}. A battlefield they control with a facedown card can answer at Reaction speed without paying the card's base cost: attack it with ${attacker.card.name} only when losing that combat costs you little.`, [attacker],
      reason(`Hidden (${RULE.hidden}); Ambush (${RULE.ambush}).`), Math.max(...tricks.map((t) => t.share)), false, [...tricks.slice(0, 4).map((t) => t.card.id), opp.legend.id]));
  }
  const myGear = view.main.filter((c) => c.card.type === 'gear');
  const gearHate = opp.typical.filter((t) => answersOf(t.card).some((a) => a.kind === 'gear-kill' && myGear.some((g) => answerHits(a, g.card).hits)));
  if (gearHate.length > 0 && myGear.length > 0) {
    out.push(line(lc, 'matchup', `They main-deck gear removal: ${nameList(gearHate.slice(0, 3).map(shown), 3)}. Your ${copies(myGear)} gear copies (${nameList(myGear.map((c) => c.card.name), 3)}) are the targets; do not put two on one unit.`, myGear,
      reason('Gear removal read from their cards\' text.'), Math.max(...gearHate.map((t) => t.share)), false, [...gearHate.slice(0, 3).map((t) => t.card.id), opp.legend.id]));
  }

  // d. The lean (HEURISTIC, section 4.3).
  const A = profileOf(view);
  const B = profileOf(theirView);
  const interA = (A.spot + A.sweep) / 2;
  const interB = (B.spot + B.sweep) / 2;
  const terms = [
    { v: -6 * (A.wide * B.sweep - B.wide * A.sweep), text: A.wide * B.sweep >= B.wide * A.sweep ? `their mass damage (${nameList(B.names.sweep, 2) || 'none'}) against your ${copies(myUnits)} unit copies` : `your mass damage (${nameList(A.names.sweep, 2)}) against their board` },
    { v: -6 * (A.tall * B.spot - B.tall * A.spot), text: A.tall * B.spot >= B.tall * A.spot ? `their single-target removal (${nameList(B.names.spot, 2) || 'none'}) against your largest units` : `your removal (${nameList(A.names.spot, 2)}) against their largest units` },
    { v: 4 * (A.protect * B.spot - B.protect * A.spot), text: `protection (${nameList(A.names.protect, 2) || 'none of yours'} against ${nameList(B.names.protect, 2) || 'none of theirs'})` },
    { v: 5 * (A.speed * (1 - interB) - B.speed * (1 - interA)), text: `early units (${nameList(A.names.speed, 2) || 'none of yours'} against ${nameList(B.names.speed, 2) || 'none of theirs'}) into the other side's interaction` },
    { v: 3 * (A.reach - B.reach), text: `ready, Ganking and Ambush pieces (${nameList(A.names.reach, 2) || 'none of yours'} against ${nameList(B.names.reach, 2) || 'none of theirs'})` },
    { v: 4 * (A.counter * B.spellrel - B.counter * A.spellrel), text: `counterspells (${nameList(A.names.counter, 2) || 'none of yours'} against ${nameList(B.names.counter, 2) || 'none of theirs'}) into 3+ rune spells` },
  ].sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
  const edge = Math.max(-20, Math.min(20, terms.reduce((n, t) => n + t.v, 0)));
  const anchor = lc.view.legend ?? lc.view.main[0];
  if (anchor) {
    const lean = edge >= 1.5 ? 'leans your way' : edge <= -1.5 ? `leans toward ${name}` : 'is close to even';
    out.push(line(lc, 'matchup', `Heuristic lean: ${displayName(anchor.card)} against a typical ${name} list ${lean} (${edge >= 0 ? '+' : ''}${edge.toFixed(1)} on a -20..+20 scale). Largest terms: ${terms.slice(0, 2).filter((t) => Math.abs(t.v) >= 0.2).map((t) => `${t.v >= 0 ? '+' : ''}${t.v.toFixed(1)} ${t.text}`).join('; ') || 'none above 0.2'}.`, [anchor],
      'Computed from deck properties with hand-set weights (matchups-and-lines.md 4.3). It was never fitted to results and is a direction, not a win rate.', null, true, [opp.legend.id]));
  }
  return out;
}

export function sideLines(lc: LineContext): Line[] {
  const { view } = lc;
  const out: Line[] = [];
  if (view.side.length === 0) return out;
  const rules = formatRules(view.deck.format, lc.ctx.db.legality());
  const sideCopies = copies(view.side);
  if (!rules.sideAllowed) {
    return [line(lc, 'side', `${view.deck.format} is played without a side deck: ${nameList(view.side.map((c) => c.card.name), 4)} (${sideCopies} cards) are not used.`, view.side, 'Side decks exist only in the Tournament Rules for Constructed (TR 601.1.c); no rule gives this format one.', null, false)];
  }
  // A side deck is only played from game 2 of a match (TR 403.5); every format but best-of-three is one game.
  if (view.deck.format !== 'standard-bo3') {
    return [line(lc, 'side', `${view.deck.format} is a single game, so the ${sideCopies} side cards (${nameList(view.side.map((c) => c.card.name), 4)}) are never played: side cards come in from game 2 of a match, and there is none. Anything you want from them has to be in the 40.`, view.side,
      `Best of 1 (${view.facts.firstTurnRule.replace(/\.7$/, ".6")}); no side cards in game 1 (${RULE.sideGameOne}).`, null, false)];
  }
  const field = fieldOf(lc.ctx.db);
  const perLegend = (card: Card): { legend: Card; expected: number; hits: Typical[] }[] => field.legends.map(({ legend, meta }) => {
    const r = reach(card, typicalList(meta, lc.ctx.db).filter((t) => t.share >= TYPICAL));
    return { legend, expected: r.expected, hits: r.hit.map((h) => h.t) };
  });
  const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const { opp } = opponentOf(lc);

  if (!opp) {
    out.push(line(lc, 'side', `Side deck: ${sideCopies} of ${rules.sideMax} cards (${nameList(view.side.map((c) => (c.qty > 1 ? `${c.card.name} x${c.qty}` : c.card.name)), 6)}). Swaps are one card in for one card out, from game 2.`, view.side,
      `Side deck size (${RULE.sideSize}); 1-for-1 exchange (${RULE.sideOneForOne}); no side cards in game 1 (${RULE.sideGameOne}).`, null, false));
    // Side cards with the same effect and limits share a line.
    const jobs = new Map<string, DeckCard[]>();
    // The effect a side card is rated by: the one `reach` tests (removal, gear removal, a counterspell). A stun
    // or a Might reduction works on any unit and buys a turn, so no best matchup can be named for it.
    const rated = (c: DeckCard): Answer | null => reach(c.card, []).answer;
    const unrated: DeckCard[] = [];
    for (const c of [...view.side].sort((a, b) => b.qty - a.qty || a.card.name.localeCompare(b.card.name))) {
      const answer = rated(c);
      if (!answer) { if (answersOf(c.card).length > 0) unrated.push(c); continue; }
      const key = describeAnswer(answer);
      jobs.set(key, [...(jobs.get(key) ?? []), c]);
    }
    if (unrated.length > 0) {
      out.push(line(lc, 'side', `${nameList(unrated.map((x) => `${x.card.name} x${x.qty} (${describeAnswer(answersOf(x.card)[0])})`), 3)} ${unrated.length > 1 ? 'are' : 'is'} not rated by targets: the effect works on any unit and only buys the turn, so it has no best matchup in this data. ${unrated[0].card.name}: "${answersOf(unrated[0].card)[0].sentence}"`, unrated,
        'Only removal, gear removal and counterspells are tested card against card; a stun or a Might reduction is not counted as an answer (heuristic).', null, true));
    }
    for (const [job, cards] of jobs) {
      const c = cards[0];
      const answer = rated(c)!;
      const who = nameList(cards.map((x) => `${x.card.name} x${x.qty}`), 3);
      const scores = perLegend(c.card).sort((a, b) => b.expected - a.expected || a.legend.id.localeCompare(b.legend.id));
      const best = scores.filter((x) => x.expected >= 1).slice(0, 2);
      const m = mean(scores.map((x) => x.expected));
      if (best.length === 0) {
        out.push(line(lc, 'side', `${who} (${job}) ${cards.length > 1 ? 'find' : 'finds'} less than one expected target in the typical list of every synced legend: the weakest side slot against this field.`, cards, `Tested against the typical lists of ${field.legends.length} legends (data); "${answer.sentence}"`, null, false));
        continue;
      }
      out.push(line(lc, 'side', `${who} (${job}) ${cards.length > 1 ? 'come' : 'comes'} in against ${best.map((x) => `${displayName(x.legend)} (${x.expected.toFixed(1)} expected target copies: ${nameList(x.hits.sort((p, q) => q.copies - p.copies).map((h) => h.card.name), 2)})`).join(' and ')}; the average legend offers ${m.toFixed(1)}.`, cards,
        `Card-against-card test with the typical lists of ${field.legends.length} synced legends (data); "${answer.sentence}"`, null, false, best.flatMap((x) => [x.legend.id, ...x.hits.slice(0, 2).map((h) => h.card.id)])));
    }
  } else {
    const name = displayName(opp.legend);
    const others = field.legends.filter((l) => l.legend.id !== opp.legend.id);
    const fieldMean = (card: Card): number => mean(others.map(({ meta }) => reach(card, typicalList(meta, lc.ctx.db).filter((t) => t.share >= TYPICAL)).expected));
    const score = (c: DeckCard) => { const r = reach(c.card, opp.typical); const m = fieldMean(c.card); return { c, r, mean: m, ratio: m > 0 ? r.expected / m : r.expected > 0 ? 9 : 0 }; };
    const ins = view.side.map(score).filter((x) => x.r.answer && x.ratio >= 1.2 && x.r.expected >= 2).sort((a, b) => b.r.expected - a.r.expected || a.c.card.name.localeCompare(b.c.card.name));
    // Side-out order: main-deck answers that are worse here than against the field, then the cards with the
    // weakest evaluation and fewest network links. Closers, the champion and locked cards stay.
    const closerIds = new Set((lc.win.routes[0]?.closers ?? []).map((c) => c.card.id));
    const linkCount = new Map<string, number>();
    for (const l of lc.links) for (const c of [l.enabler, l.payoff]) linkCount.set(c.card.id, (linkCount.get(c.card.id) ?? 0) + 1);
    const locked = new Set(view.deck.main.filter((e) => e.locked).map((e) => e.id));
    const outs = view.main.filter((c) => !c.champion && !closerIds.has(c.card.id) && !locked.has(c.card.id)).map((c) => {
      const s = score(c);
      const deadAnswer = !!s.r.answer && s.ratio <= 0.8;
      return { c, s, deadAnswer, keep: deadAnswer ? s.r.expected : 100 + c.rating + 3 * (linkCount.get(c.card.id) ?? 0) };
    }).sort((a, b) => a.keep - b.keep || a.c.card.name.localeCompare(b.c.card.name));
    const pool: { c: DeckCard; why: string }[] = [];
    for (const o of outs) for (let i = 0; i < o.c.qty; i += 1) pool.push({ c: o.c, why: o.deadAnswer ? `${o.s.r.expected.toFixed(1)} expected target copies here against ${o.s.mean.toFixed(1)} for the average legend` : `lowest evaluation (${o.c.rating}) with ${linkCount.get(o.c.card.id) ?? 0} network links in the deck` });
    let at = 0;
    for (const x of ins) {
      const taken = pool.slice(at, at + x.c.qty);
      at += taken.length;
      if (taken.length === 0) break;
      const grouped = [...new Map(taken.map((t) => [t.c.card.id, { t, n: taken.filter((y) => y.c.card.id === t.c.card.id).length }])).values()];
      const hits = x.r.hit.sort((a, b) => b.t.copies - a.t.copies).slice(0, 3);
      out.push(line(lc, 'side', `Against ${name}: IN ${taken.length} ${x.c.card.name} (${describeAnswer(x.r.answer!)}) for ${hits.map((h) => shown(h.t)).join(', ')} - ${x.r.expected.toFixed(1)} expected target copies against ${x.mean.toFixed(1)} for the average legend. OUT ${grouped.map((g) => `${g.n} ${g.t.c.card.name} (${g.t.why})`).join(', ')}.`, [x.c, ...grouped.map((g) => g.t.c)],
        `1-for-1 exchange (${RULE.sideOneForOne}), from game 2 (${RULE.sideGameOne}). Side-in needs 1.2x the mean over the other legends and 2 expected target copies; the side-out order is a heuristic. Typical cards: ${opp.meta.decks} synced ${name} lists.`, null, true, [...hits.map((h) => h.t.card.id), opp.legend.id]));
    }
    if (ins.length === 0) {
      const scored = view.side.map(score).filter((x) => x.r.answer).sort((a, b) => b.r.expected - a.r.expected);
      const rest = view.side.filter((c) => !answersOf(c.card).length);
      out.push(line(lc, 'side', `Against ${name} no side card clears the bar (1.2x its average over the other legends and 2 expected target copies): ${scored.slice(0, 3).map((x) => `${x.c.card.name} ${x.r.expected.toFixed(1)} against ${x.mean.toFixed(1)}`).join(', ') || 'none of them has an opponent-dependent effect'}.${rest.length ? ` ${nameList(rest.map((c) => c.card.name), 3)} ${rest.length > 1 ? 'have' : 'has'} no effect aimed at an opposing card, so nothing here can rate ${rest.length > 1 ? 'them' : 'it'}.` : ''} Keep the registered 40.`, view.side,
        `Card-against-card test with ${opp.meta.decks} synced ${name} lists and ${others.length} other legends (data); thresholds are a heuristic.`, null, true, [opp.legend.id]));
    }
  }

  // Champion swap (TR 403.4.a): another champion unit of the legend among the 50.
  if (view.legend && view.champion) {
    const eligible = new Set(eligibleChampions(view.legend.card, lc.ctx.db).map((c) => c.id));
    const alt = [...view.side, ...view.main].find((c) => eligible.has(c.card.id) && c.card.id !== view.champion!.card.id);
    if (alt) out.push(line(lc, 'side', `${alt.card.name} can replace ${view.champion.card.name} as Chosen Champion between games: it then starts in the Champion Zone (needs ${alt.need} runes against ${view.champion.need}).`, [alt, view.champion], `Champion change while sideboarding (${RULE.sideChampion}).`, null, false));
  }
  return out;
}
