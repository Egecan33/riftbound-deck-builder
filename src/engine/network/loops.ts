// Loops and repeatable engines inside one deck (docs/research/interactions.md section 4.1). New code.
//
// Three structures, each named with the cards and their text:
//   replay  a unit whose when-played ability returns a friendly unit to hand, next to units with a when-played
//           ability of their own (the returned unit is played again). Limiter: the play cost of every
//           iteration, so this is an engine, never a loop.
//   mutual  card A readies card B and B is what sets off A's ready (The Syren moves Miss Fortune, Captain,
//           whose first move each turn readies The Syren).
//   refund  a payoff whose trigger gives resources back (readies runes, adds Energy, channels) together with
//           the card that sets it off. It closes only with a card that returns the spent pieces.
// HEURISTIC (4.1): a structure is called a loop only when it is `mutual`, or a `refund` with a closer in the
// deck. TR 505.2 wants identical, deterministic iterations: a structure whose text has a "may", a reveal or
// an opponent's choice is marked non-deterministic. The ban filter is not optional: a structure holding a
// card banned in the format is not reported.
import { deriveTraits, hasTargetedReadyPackage, mineSentences, toScoreCard, type ScoreCard, type Trait } from '../mine';
import { nameKey } from '../rules/names';
import type { Card, CardDb, Format } from '../types';
import { PACKAGE_PAIRS } from './packages';
import { readable, sentencesWithTrait } from './quote';
import { judgeReason } from './suppress';
import type { CombinationReason } from './types';

export interface Loop {
  kind: 'replay' | 'mutual' | 'refund';
  /** The cards of the structure, the engine piece first. */
  cardIds: string[];
  /** Deck cards that return the spent pieces (refund only). */
  closers: string[];
  label: string;
  /** Names the cards and quotes the sentences the structure rests on. */
  detail: string;
  limiter: string;
  /** True only for `mutual`, or `refund` with a closer in the deck. Everything else is an engine. */
  loop: boolean;
  deterministic: boolean;
  heuristic: true;
}

const WHEN_PLAYED = /\bwhen you play (?:me|this)\b|\bwhen i(?:'m| am) played\b/i;
const RETURN_FRIENDLY = /\bwhen you play (?:me|this),? (?:you may )?return\b[^.]*\bunits?\b[^.]*\bto (?:its|their) owner['’]?s['’]? hands?\b/i;
const REFUND = /\bready (?:your|all(?: of)? your|\d+|up to \w+|two|three) (?:friendly |exhausted )?runes?\b|\[add\]|\badd \d+ energy\b|\bchannel \d+ runes?\b/i;
const NON_DETERMINISTIC = /\bmay\b|\breveal|\bopponent|\bthey choose\b|\brandom/i;
const MAX_TARGETS = 6;

const quote = (card: ScoreCard, sentence: string): string => `${card.name}: "${readable(sentence)}"`;

function bannedNames(db: CardDb, format: Format): Set<string> {
  const out = new Set<string>();
  for (const ban of db.legality().bans) if (ban.formats.includes(format) && (ban.zone === 'main' || ban.zone === 'legend')) out.add(nameKey(ban.name));
  return out;
}

/** A stand-in pair reason so that the suppressors can be asked "does this enabler really feed this payoff?". */
const packageReason = (x: Trait, y: Trait, a: ScoreCard, b: ScoreCard): CombinationReason =>
  ({ id: `package:${x}:${y}:${a.id}:${b.id}`, label: '', kind: 'synergy', scope: 'mechanic-package', value: 0, detail: '', cardIds: [a.id, b.id], traits: [x, y] });

function feeds(enabler: ScoreCard, payoff: ScoreCard, x: Trait, y: Trait): boolean {
  if (!deriveTraits(enabler).has(x) || !deriveTraits(payoff).has(y)) return false;
  const [l, r] = enabler.id.localeCompare(payoff.id) <= 0 ? [enabler, payoff] : [payoff, enabler];
  const verdict = judgeReason(packageReason(x, y, l, r), l, r);
  return verdict.suppressor === null && verdict.sides?.enabler.id === enabler.id;
}

/**
 * @param deckIds card ids of the deck (any zone; duplicates and unknown ids are ignored)
 * @param format bans of this format are applied (default Standard)
 */
export function findLoops(deckIds: readonly string[], db: CardDb, format: Format = 'standard-bo1'): Loop[] {
  const banned = bannedNames(db, format);
  const cards: Card[] = [];
  const seen = new Set<string>();
  for (const id of deckIds) {
    const card = db.get(id);
    if (!card || seen.has(card.id) || card.dataIncomplete || banned.has(nameKey(card.name))) continue;
    seen.add(card.id);
    cards.push(card);
  }
  cards.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const score = new Map(cards.map((c) => [c.id, toScoreCard(c)]));
  const sc = (c: Card): ScoreCard => score.get(c.id)!;
  const loops: Loop[] = [];

  // replay ---------------------------------------------------------------------------------------------------
  for (const bouncer of cards) {
    if (bouncer.type !== 'unit') continue;
    const sentence = mineSentences(sc(bouncer).rulesText).find((s) => RETURN_FRIENDLY.test(s) && (!/\benemy\b/i.test(s) || /\bfriendly\b/i.test(s)));
    if (!sentence) continue;
    const maxMight = /\bwith (\d+) \[S\] or less\b/i.exec(sentence);
    const nonTag = /\bnon-([A-Za-z' ]+?) unit\b/i.exec(sentence)?.[1];
    const targets = cards.filter((t) => {
      if (t.type !== 'unit') return false;
      // "another unit": a second copy of the bouncer is a legal target when the deck may hold one.
      if (t.id === bouncer.id && bouncer.copyLimit < 2) return false;
      if (maxMight && (t.might ?? 0) > Number(maxMight[1])) return false;
      if (nonTag && t.tags.some((tag) => tag.toLowerCase() === nonTag.toLowerCase())) return false;
      return mineSentences(sc(t).rulesText).some((s) => WHEN_PLAYED.test(s));
    });
    if (targets.length === 0) continue;
    const shown = targets.slice(0, MAX_TARGETS);
    loops.push({
      kind: 'replay',
      cardIds: [bouncer.id, ...shown.filter((t) => t.id !== bouncer.id).map((t) => t.id)],
      closers: [],
      label: `${bouncer.name} replays when-played abilities`,
      detail: `${quote(sc(bouncer), sentence)} returns a unit you then play again: ${shown.map((t) => quote(sc(t), mineSentences(sc(t).rulesText).find((s) => WHEN_PLAYED.test(s)) ?? '')).join('; ')}`,
      limiter: 'the play cost of both cards every time',
      loop: false,
      deterministic: !NON_DETERMINISTIC.test(sentence),
      heuristic: true,
    });
  }

  // mutual ---------------------------------------------------------------------------------------------------
  for (const a of cards) {
    const A = sc(a);
    const readySentences = sentencesWithTrait(A, 'ready');
    if (readySentences.length === 0) continue;
    for (const pair of PACKAGE_PAIRS) {
      const trigger = sentencesWithTrait(A, pair.right).find((s) => readySentences.includes(s));
      if (!trigger) continue;
      for (const b of cards) {
        if (b.id === a.id) continue;
        const B = sc(b);
        if (!feeds(B, A, pair.left, pair.right) || !hasTargetedReadyPackage(A, B, deriveTraits(B))) continue;
        const how = sentencesWithTrait(B, pair.left)[0];
        loops.push({
          kind: 'mutual',
          cardIds: [a.id, b.id],
          closers: [],
          label: `${b.name} sets off ${a.name}, which readies ${b.name}`,
          detail: `${how ? quote(B, how) : `${B.name} (${pair.label})`} | ${quote(A, trigger)}`,
          limiter: /\b(?:first time|once)\b[^.]*\b(?:each|per|a) turn\b/i.test(trigger) ? `${a.name}: once per turn` : `the cost of ${b.name}'s ability every time`,
          loop: true,
          deterministic: !/\breveal|\bopponent|\brandom/i.test(`${trigger} ${how ?? ''}`),
          heuristic: true,
        });
      }
    }
  }

  // refund ---------------------------------------------------------------------------------------------------
  const retrievers = cards.filter((c) => deriveTraits(sc(c)).has('trash-retrieval') || /\brecycle\b[^.]*\bfrom (?:your |a |any )?trash/i.test(sc(c).rulesText));
  for (const p of cards) {
    const P = sc(p);
    for (const pair of PACKAGE_PAIRS) {
      const refund = sentencesWithTrait(P, pair.right).find((s) => REFUND.test(s));
      if (!refund) continue;
      for (const e of cards) {
        if (e.id === p.id) continue;
        const E = sc(e);
        if (!feeds(E, P, pair.left, pair.right)) continue;
        const closers = retrievers.filter((c) => c.id !== p.id && c.id !== e.id).map((c) => c.id);
        const how = sentencesWithTrait(E, pair.left)[0];
        loops.push({
          kind: 'refund',
          cardIds: [p.id, e.id],
          closers,
          label: `${e.name} sets off ${p.name}'s refund`,
          detail: `${how ? quote(E, how) : `${E.name} (${pair.label})`} | ${quote(P, refund)}`,
          limiter: closers.length ? `needs ${closers.map((id) => db.get(id)?.name).join(' or ')} to get ${p.name} and ${e.name} back` : `no card in the deck gets ${p.name} or ${e.name} back`,
          loop: closers.length > 0,
          deterministic: !/\breveal|\bopponent|\brandom/i.test(`${refund} ${how ?? ''}`),
          heuristic: true,
        });
      }
    }
  }

  const key = (l: Loop): string => `${l.kind}|${l.cardIds.join('|')}`;
  const unique = new Map<string, Loop>();
  for (const l of loops) if (!unique.has(key(l))) unique.set(key(l), l);
  return [...unique.values()];
}
