// "Folds to" lines of a win route. New code (wincons.md 4.5, rebuilt as its verification asks in V6 item 4).
//
// Each line tests the field's real answer cards against this deck's real cards: damage size against Might,
// Might caps, domain limits, location, counterspell conditions against the spell's cost. An answer that does
// not work is named as not working; a line with nothing deck-specific to say is not printed.
// DATA: the rate is the share of synced lists (every legend) that main-deck at least one named answer.
// HEURISTIC: which weaknesses are checked for which route.
import type { CardDb, WinRoute } from '../types';
import { REMOVING, answerHits, describeAnswer, type Answer } from './answers';
import { RULE } from './facts';
import { routeFeatures } from './features';
import { fieldOf, type FieldCard } from './field';
import type { RouteDetail, WinAnalysis } from './detect';
import { nameList, pct, type DeckCard } from './view';

type Fold = WinRoute['foldsTo'][number];

/** A field card needs this share of lists before it is named. */
const NAMED_RATE = 0.02;
const MAX_NAMED = 3;

interface Working { field: FieldCard; answer: Answer; why: string; conditional: boolean }

function test(field: readonly FieldCard[], target: DeckCard, kinds: readonly Answer['kind'][]): { working: Working[]; failing: { field: FieldCard; why: string }[] } {
  const working: Working[] = [];
  const failing: { field: FieldCard; why: string }[] = [];
  for (const fc of field) {
    if (fc.rate < NAMED_RATE) continue;
    const candidates = fc.answers.filter((a) => kinds.includes(a.kind));
    if (candidates.length === 0) continue;
    let hit: Working | null = null;
    let miss = '';
    for (const a of candidates) {
      const h = answerHits(a, target.card);
      if (h.hits && (!hit || (hit.conditional && !h.conditional))) hit = { field: fc, answer: a, why: h.why, conditional: h.conditional };
      else if (!h.hits && !miss) miss = h.why;
    }
    if (hit) working.push(hit);
    else failing.push({ field: fc, why: miss });
  }
  return { working, failing };
}

const sample = (db: CardDb): string => {
  const f = fieldOf(db);
  return `${f.lists} synced lists of ${f.legends.length} legends`;
};

const stat = (c: DeckCard): string => (c.card.type === 'unit' ? `${c.card.might ?? 0} Might${c.card.keywords.some((k) => k.toLowerCase() === 'deflect') ? ', Deflect' : ''}` : `${c.card.type}, ${c.card.energy ?? 0} Energy`);

export function foldsFor(a: WinAnalysis, d: RouteDetail, db: CardDb, primary: boolean): Fold[] {
  const field = fieldOf(db);
  const view = a.view;
  const out: Fold[] = [];
  const push = (text: string, cards: readonly DeckCard[], answers: readonly FieldCard[], rate: number | null): void => {
    out.push({ text, cardIds: [...new Set(cards.map((c) => c.card.id))], fieldRate: rate === null ? null : Math.round(rate * 1000) / 1000, answerIds: [...new Set(answers.map((f) => f.card.id))] });
  };
  const units = view.main.filter((c) => c.card.type === 'unit');

  // 1. Removal aimed at the closers this route needs (Chosen Champion first).
  const unitClosers = d.closers.filter((c) => c.card.type === 'unit').slice(0, primary ? 3 : 1);
  const groups = new Map<string, { closers: DeckCard[]; working: Working[]; failing: { field: FieldCard; why: string }[] }>();
  for (const closer of unitClosers) {
    const { working, failing } = test(field.cards, closer, REMOVING.filter((k) => k !== 'sweep'));
    // Closers the same cards reach are one line: the answer set is what the reader acts on.
    const key = working.length ? working.map((w) => w.field.card.id).join('|') : `none:${failing.map((f) => f.field.card.id).join('|')}`;
    const g = groups.get(key) ?? { closers: [], working, failing };
    g.closers.push(closer);
    groups.set(key, g);
  }
  for (const { closers, working, failing } of groups.values()) {
    const who = nameList(closers.map((c) => `${c.card.name} (${stat(c)})`), 3);
    const verb = closers.length > 1 ? 'are' : 'is';
    if (working.length === 0) {
      if (failing.length > 0 && primary) {
        const named = failing.slice(0, MAX_NAMED);
        push(`${who} ${verb} out of reach of the most played removal: ${named.map((f) => `${f.field.card.name} (${f.why})`).join('; ')}.`, closers, named.map((f) => f.field), 0);
      }
      continue;
    }
    const firm = working.filter((w) => !w.conditional);
    const named = (firm.length ? firm : working).slice(0, MAX_NAMED);
    const rate = field.rateOfAny(working.map((w) => w.field.card.id));
    const misses = failing.slice(0, 2).map((f) => `${f.field.card.name} (${f.why})`);
    push(
      `${who} ${verb} answered by ${named.map((w) => `${w.field.card.name} (${describeAnswer(w.answer)})`).join(', ')}: about ${pct(rate)} of ${sample(db)} main-deck at least one of the ${working.length} cards that reach ${closers.length > 1 ? 'them' : 'it'}.${misses.length ? ` Not an answer: ${misses.join('; ')}.` : ''}`,
      closers, named.map((w) => w.field), rate,
    );
  }

  // 2. Counterspells against the spells the route leans on.
  const spells = [...d.closers, ...d.enablers].filter((c) => c.card.type === 'spell').slice(0, 6);
  if (spells.length > 0) {
    const counters = field.cards.filter((f) => f.rate >= NAMED_RATE && f.answers.some((x) => x.kind === 'counter' && !x.counter?.onlyTargeting));
    const lines: string[] = [];
    const hitCards = new Set<DeckCard>();
    const used: FieldCard[] = [];
    for (const fc of counters.slice(0, 2)) {
      const answer = fc.answers.find((x) => x.kind === 'counter')!;
      const stopped = spells.filter((s) => answerHits(answer, s.card).hits);
      const safe = spells.filter((s) => !answerHits(answer, s.card).hits);
      if (stopped.length === 0) continue;
      for (const s of stopped) hitCards.add(s);
      used.push(fc);
      lines.push(`${fc.card.name} (${describeAnswer(answer)}) stops ${nameList(stopped.map((s) => s.card.name), 3)}${safe.length ? `, not ${nameList(safe.map((s) => `${s.card.name} (${answerHits(answer, s.card).why})`), 2)}` : ''}`);
    }
    if (lines.length > 0) push(`${lines.join('. ')}. About ${pct(field.rateOfAny(used.map((f) => f.card.id)))} of ${sample(db)} run one.`, [...hitCards], used, field.rateOfAny(used.map((f) => f.card.id)));
  }

  // 3. Mass damage against the deck's own bodies.
  if (primary || d.id === 'wide') {
    const sweeps = field.cards.filter((f) => f.rate >= NAMED_RATE && f.answers.some((x) => x.kind === 'sweep'));
    const copies = units.reduce((n, c) => n + c.qty, 0);
    let best: { fc: FieldCard; answer: Answer; victims: DeckCard[] } | null = null;
    for (const fc of sweeps) {
      const answer = fc.answers.find((x) => x.kind === 'sweep')!;
      if (answer.amount === null) continue;
      const victims = units.filter((u) => answerHits(answer, u.card).hits);
      const n = victims.reduce((s, c) => s + c.qty, 0);
      if (n >= Math.max(4, copies * 0.4) && (!best || n * fc.rate > best.victims.reduce((s, c) => s + c.qty, 0) * best.fc.rate)) best = { fc, answer, victims };
    }
    if (best) {
      const n = best.victims.reduce((s, c) => s + c.qty, 0);
      const rate = field.rateOfAny(sweeps.map((f) => f.card.id));
      push(`${best.fc.card.name} (${describeAnswer(best.answer)}) kills ${n} of your ${copies} unit copies at printed Might: ${nameList(best.victims.sort((x, y) => y.qty - x.qty).map((c) => c.card.name), 4)}. About ${pct(rate)} of ${sample(db)} main-deck a mass-damage card.`, best.victims, [best.fc], rate);
    }
  }

  // 4. A stun on the attacker of a burst or tall plan; a move or bounce on the holder of a hold plan.
  if ((d.id === 'burst' || d.id === 'tall') && unitClosers.length > 0) {
    const stuns = field.cards.filter((f) => f.rate >= NAMED_RATE && f.answers.some((x) => x.kind === 'stun'));
    if (stuns.length > 0) {
      const rate = field.rateOfAny(stuns.map((f) => f.card.id));
      push(`A stun blanks ${unitClosers[0].card.name}'s combat damage on the turn it attacks: ${nameList(stuns.slice(0, MAX_NAMED).map((f) => f.card.name))}. About ${pct(rate)} of ${sample(db)} run one.`, [unitClosers[0]], stuns.slice(0, MAX_NAMED), rate);
    }
  }
  if (d.id === 'hold' && unitClosers.length > 0) {
    const holder = unitClosers[0];
    const { working, failing } = test(field.cards, holder, ['bounce', 'displace']);
    if (working.length > 0) {
      const rate = field.rateOfAny(working.map((w) => w.field.card.id));
      const misses = failing.slice(0, 2).map((f) => `${f.field.card.name} (${f.why})`);
      push(`${holder.card.name} is moved or returned before your hold step (${RULE.holdStep}) by ${working.slice(0, MAX_NAMED).map((w) => `${w.field.card.name} (${describeAnswer(w.answer)})`).join(', ')}: about ${pct(rate)} of ${sample(db)}.${misses.length ? ` Not an answer: ${misses.join('; ')}.` : ''}`, [holder], working.slice(0, MAX_NAMED).map((w) => w.field), rate);
    }
  }

  if (!primary) return sort(out);

  // 5. Gear removal against the deck's gear.
  const gear = view.main.filter((c) => c.card.type === 'gear');
  const gearCopies = gear.reduce((n, c) => n + c.qty, 0);
  if (gearCopies >= 3) {
    const hate = field.cards.filter((f) => f.rate >= NAMED_RATE && f.answers.some((x) => x.kind === 'gear-kill' && gear.some((g) => answerHits(x, g.card).hits)));
    if (hate.length > 0) {
      const rate = field.rateOfAny(hate.map((f) => f.card.id));
      push(`Your ${gearCopies} gear copies (${nameList(gear.sort((x, y) => y.qty - x.qty).map((c) => c.card.name), 3)}) are hit by ${nameList(hate.slice(0, MAX_NAMED).map((f) => f.card.name))}: about ${pct(rate)} of ${sample(db)} main-deck gear removal.`, gear, hate.slice(0, MAX_NAMED), rate);
    }
  }

  // 6. Point denial, when the plan includes a point card.
  if (a.reach.pointCards.length > 0) {
    const denial = field.cards.filter((f) => f.rate > 0 && /opponents can't gain points/i.test(f.card.text));
    if (denial.length > 0) push(`${nameList(a.reach.pointCards.map((c) => c.card.name), 2)} cannot score while ${nameList(denial.map((f) => f.card.name), 2)} is at a battlefield ("opponents can't gain points").`, a.reach.pointCards, denial, field.rateOfAny(denial.map((f) => f.card.id)));
  }

  // 7. FACT: Temporary tokens never hold.
  const temp = view.main.filter((c) => routeFeatures(c).has('temp-token'));
  if (temp.reduce((n, c) => n + c.qty, 0) >= 2) {
    push(`Tokens from ${nameList(temp.map((c) => c.card.name), 3)} have Temporary: they are killed at the start of your Beginning Phase, before scoring (${RULE.temporary}), so they conquer once and never hold. With them the last point has to be a conquer of all ${view.facts.battlefieldsOnBoard} battlefields in one turn (${RULE.finalPointConquer}).`, temp, [], null);
  }

  // 8. Little interaction of its own.
  const interaction = view.main.filter((c) => ['removal', 'sweep', 'counter', 'stun', 'displace'].some((f) => routeFeatures(c).has(f as never)));
  const interactionCopies = interaction.reduce((n, c) => n + c.qty, 0);
  if (interactionCopies < 8 && interaction.length > 0) {
    push(`Only ${interactionCopies} interaction copies (${nameList(interaction.sort((x, y) => y.qty - x.qty).map((c) => c.card.name), 4)}): a deck with a faster clock than turn ${a.clock} is raced, not stopped.`, interaction, [], null);
  }
  return sort(out);
}

/** Most common weakness first; rule-fact lines (no rate) last. */
const sort = (lines: Fold[]): Fold[] => [...lines].sort((x, y) => (y.fieldRate ?? -1) - (x.fieldRate ?? -1));
