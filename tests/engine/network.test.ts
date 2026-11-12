// Plan Task 5: the stored pair network on real cards (fixture rows), suppressors, rule-forbidden entries, loops.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createCardDb } from '@/engine/carddb';
import { toScoreCard } from '@/engine/mine';
import {
  SUPPRESSORS, analyzeCardPair, buildEdges, buildEdgesWithStats, deckSharing, edgeForPair, findLoops, forbiddenByPair,
  isGenericReason, isNetworkCard, judgeReason, quoteCard, sentencesWithTrait, type BuildEdgesStats, type ForbiddenInteraction,
} from '@/engine/network';
import type { Card, CardEdge } from '@/engine/types';
import { readLegalityFile, toLegalityData } from '@/server/syncdata';
import { networkCard as card, networkCards } from '../helpers/mine-cards';

const overrides = JSON.parse(readFileSync(path.join(process.cwd(), 'sync-data', 'card-overrides.json'), 'utf8')) as { forbiddenInteractions: ForbiddenInteraction[] };
const edge = (a: string, b: string, forbidden?: ForbiddenInteraction): CardEdge | null => edgeForPair(card(a), card(b), forbidden);
const labels = (e: CardEdge | null): string[] => (e?.reasons ?? []).map((r) => r.label);

describe('edges between cards that work together', () => {
  // [card, card, label of the reason, a fragment each quote must hold]
  const SYNERGY: [string, string, string, string, string][] = [
    ['OGN-136', 'RAD-043', 'Buff engine', 'buff another friendly unit', 'Spend my buff'],                       // Pit Rookie + Riven, Broken Blade
    ['OGN-008', 'OGN-182', 'Discard rewards', 'Discard 1', 'discarded'],                                        // Get Excited! + Scrapheap
    ['SFD-026', 'VEN-064', 'Mech rules-text package', 'Your Mechs', 'is a Mech'],                               // Rumble, Hotheaded + Plaza Guardian
    ['OGN-121', 'OGN-263', 'Explicit card reference', 'Teemo, Strategist', 'Put a Teemo unit you own'],        // Teemo, Strategist + Swift Scout
    ['SFD-009', 'SFD-183', 'Equipment package', 'Serrated Dirk', 'Your Equipment each give [Assault]'],        // Serrated Dirk + Purifier (legend)
    ['VEN-035', 'VEN-069', 'Empower engine', 'Empower a unit', '[Empowered]'],                                 // Sanction + Mel, Newly Awakened
    ['RAD-012', 'VEN-143', 'Banish engine', 'banish the top card', 'When you banish a card you own'],          // Runeblade Anvil + Master of Shadows
    ['UNL-115', 'UNL-201', 'Move triggers', 'Move an exhausted friendly unit', 'When I move, gain 1 XP'],      // Nilah + Voidreaver (legend)
    ['RAD-017', 'UNL-078', 'Death engine', 'kill another friendly unit or gear', '[Deathknell]'],              // Detonation Amplifier + Sprite Fountain
    ['RAD-124', 'VEN-022', 'Burn into Flow', '[Burn 2]', 'play cards from your trash'],                        // Burn Away + Endless Riches
    ['OGN-132', 'UNL-024', 'Repeatable trigger', 'ready another unit', '[Assault 2]'],                         // First Mate + Rengar, Unseen
    ['OGN-261', 'RAD-043', 'Stun lock', 'When you stun one or more enemy units', 'Stun an enemy unit'],        // Radiant Dawn + Riven
  ];
  it.each(SYNERGY)('%s + %s: %s', (a, b, label, quoteA, quoteB) => {
    const e = edge(a, b);
    expect(e, `${card(a).name} + ${card(b).name}`).not.toBeNull();
    expect(e!.net).toBeGreaterThan(0);
    const reason = e!.reasons.find((r) => r.label === label);
    expect(reason, labels(e).join(', ')).toBeDefined();
    // The reason names both cards and quotes their text.
    expect(reason!.detail).toContain(card(a).name);
    expect(reason!.detail).toContain(card(b).name);
    expect(reason!.detail).toContain(quoteA);
    expect(reason!.detail).toContain(quoteB);
    expect(reason!.kind).toBe('synergy');
  });

  it('orders a pair by id and keeps the ported totals when nothing is suppressed', () => {
    const e = edge('RAD-043', 'OGN-136')!;
    expect(e.a < e.b).toBe(true);
    const ported = analyzeCardPair(toScoreCard(card('OGN-136')), toScoreCard(card('RAD-043')));
    expect([e.synergy, e.antisynergy, e.net]).toEqual([ported.synergy, ported.antisynergy, ported.net]);
    expect(e).toEqual(edge('OGN-136', 'RAD-043'));
  });
});

describe('no edge between unrelated cards', () => {
  const UNRELATED: [string, string][] = [
    ['OGN-064', 'OGN-043'], // Wind Wall + Charm
    ['OGN-095', 'RAD-041'], // Stupefy + Hush
    ['OGN-043', 'OGN-095'], // Charm + Stupefy
    ['RAD-028', 'RAD-041'], // Ki Burst + Hush
    ['OGN-046', 'OGN-064'], // En Garde + Wind Wall
    ['OGN-029', 'OGN-043'], // Falling Star + Charm
    ['OGN-104', 'RAD-041'], // Retreat + Hush
    ['OGN-029', 'SFD-009'], // Falling Star + Serrated Dirk
    ['OGN-145', 'OGN-043'], // Unyielding Spirit + Charm
    ['OGN-248', 'OGN-029'], // Icathian Rain + Falling Star
  ];
  it.each(UNRELATED)('%s + %s', (a, b) => {
    expect(edge(a, b), labels(edge(a, b)).join(', ')).toBeNull();
  });
});

describe('suppressors (interactions.md 6.2) on real cards', () => {
  const judged = (a: string, b: string): string[] => {
    const [l, r] = [toScoreCard(card(a)), toScoreCard(card(b))].sort((x, y) => x.id.localeCompare(y.id));
    return analyzeCardPair(l, r).reasons.map((reason) => `${reason.label}=${judgeReason(reason, l, r).suppressor}`);
  };
  it('S5: a card that moves only itself does not set off another card\'s "When I move"', () => {
    // Udyr, Wildman: "Give me [Ganking] this turn"; Mister Root: "When I move to a battlefield, gain 2 XP".
    expect(judged('OGN-157', 'UNL-127')).toContain('Move triggers=self-only-enabler');
    expect(labels(edge('OGN-157', 'UNL-127'))).not.toContain('Move triggers');
  });
  it('S10: moving an enemy unit does not set off a friendly unit\'s move trigger', () => {
    // Blast Cone: "you may move an enemy unit"; Apprentice Smith: "When I move, reveal the top card ...".
    expect(judged('SFD-041', 'UNL-133')).toContain('Move triggers=move-side');
    expect(edge('SFD-041', 'UNL-133')).toBeNull();
  });
  it('S6: a move to base does not set off "When I move to a battlefield"', () => {
    // Voidreaver: "Move an exhausted friendly unit from a battlefield to its base"; Mister Root needs a battlefield.
    expect(judged('UNL-127', 'UNL-201')).toContain('Move triggers=move-to-base');
    expect(labels(edge('UNL-127', 'UNL-201'))).toEqual(['XP economy']);
  });
  it('S5: "Kill this:" does not set off another card\'s Deathknell', () => {
    // Forge of the Future: "Kill this: Recycle up to 4 cards from trashes"; Soaring Scout: "[Deathknell] — Channel 1 rune exhausted".
    expect(judged('OGN-212', 'OGN-216')).toContain('Death engine=self-only-enabler');
    expect(labels(edge('OGN-212', 'OGN-216'))).not.toContain('Death engine');
  });
  it('a [Mighty] sacrifice cannot kill a 1-Might Deathknell unit', () => {
    // Sacrifice: "kill a friendly [Mighty] unit"; Soaring Scout has 1 Might, Ekko, Recurrent has 5.
    expect(judged('UNL-173', 'OGN-216')).toContain('Death engine=wrong-type-kill');
    expect(judged('UNL-173', 'OGN-110')).toContain('Death engine=null');
  });
  it('S1: a spell below the cost threshold does not feed "a spell that costs [5] or more"', () => {
    // Lux, Illuminated: "When you play a spell that costs [5] or more, give me +3 Might this turn".
    expect(judged('OGS-006', 'OGN-029')).toContain('Spellcraft package=cost-threshold'); // Falling Star costs 2
    expect(labels(edge('OGS-006', 'OGN-248'))).toContain('Spellcraft package');        // Icathian Rain costs 7
  });
  it('a Gold gear token does not feed a go-wide payoff', () => {
    // The Waters' Wage: "Play a Gold gear token exhausted"; Darius, Executioner: "Other friendly units have +1 Might here".
    expect(judged('OGN-243', 'RAD-100')).toContain('Go-wide package=token-type');
  });
  it('S2: "non-Dragon" is not a Dragon reference', () => {
    // Ocean Drake (a Dragon): "you may return a non-Dragon unit to its owner's hand".
    const drake = toScoreCard(card('VEN-115'));
    const reasons = analyzeCardPair(drake, drake).reasons.filter((r) => r.id.startsWith('tag-reference:Dragon'));
    expect(reasons.length).toBe(1);
    expect(judgeReason(reasons[0], drake, drake).suppressor).toBe('non-tag');
  });
  it('"Skip your Draw Phase" is not an extra turn; Time Warp is', () => {
    // Endless Riches + Kraken Hunter; Time Warp ("Take a turn after this one") + Sona, Harmonious.
    expect(judged('VEN-022', 'OGN-150').filter((x) => x.startsWith('Extra-turn'))).toEqual(['Extra-turn battlefield conversion=skip-not-extra-turn']);
    expect(labels(edge('OGN-122', 'OGN-073'))).toContain('Extra-turn battlefield conversion');
  });
  it('a trait removed by a reviewed mine override takes its reasons with it', () => {
    const [l, r] = [toScoreCard(card('RAD-124')), toScoreCard(card('VEN-022'))].sort((x, y) => x.id.localeCompare(y.id));
    const reason = analyzeCardPair(l, r).reasons.find((x) => x.label === 'Burn into Flow')!;
    expect(judgeReason(reason, l, r).suppressor).toBeNull();
    expect(judgeReason(reason, l, r, { [card('VEN-022').id]: ['flow'], [card('RAD-124').id]: [] }).suppressor).toBe('trait-override');
  });
  it('every suppressor the judge can return is documented', () => {
    const stats: BuildEdgesStats = { nodes: 0, pairsChecked: 0, edges: 0, suppressed: {}, forbiddenApplied: 0, genericOnlyDropped: 0 };
    for (const [a, b] of [['OGN-157', 'UNL-127'], ['SFD-041', 'UNL-133'], ['OGN-212', 'OGN-216'], ['OGS-006', 'OGN-029'], ['OGN-243', 'RAD-100']]) edgeForPair(card(a), card(b), undefined, stats);
    expect(Object.keys(stats.suppressed).length).toBeGreaterThan(3);
    for (const id of Object.keys(stats.suppressed)) expect(SUPPRESSORS[id], id).toBeTruthy();
  });
});

describe('rule-forbidden interactions (rulings-and-errata.md section 5)', () => {
  const pool = networkCards();
  it('every reviewed entry names two real cards, a rule and a reason', () => {
    expect(overrides.forbiddenInteractions.length).toBeGreaterThanOrEqual(10);
    for (const entry of overrides.forbiddenInteractions) {
      expect(entry.rule, entry.cards.join('+')).toBeTruthy();
      expect(entry.reason).toBeTruthy();
      expect(entry.source).toContain('rulings-and-errata.md');
      for (const code of entry.cards) expect(() => card(code)).not.toThrow();
    }
    expect(forbiddenByPair(overrides.forbiddenInteractions, pool).size).toBe(overrides.forbiddenInteractions.length);
  });
  it('a pair whose combo the rules forbid has no synergy edge', () => {
    const byPair = forbiddenByPair(overrides.forbiddenInteractions, pool);
    for (const entry of overrides.forbiddenInteractions.filter((x) => x.drop?.includes('*'))) {
      const [a, b] = entry.cards.map(card);
      const e = edgeForPair(a, b, byPair.get(a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`), undefined, { includeGeneric: true });
      expect((e?.reasons ?? []).filter((r) => r.kind === 'synergy'), entry.claim).toEqual([]);
    }
    // Portal Rescue + Possession (row 3) and Perched Grimwyrm + Dragon Roost (row 10) are among them.
    expect(byPair.has([card('OGN-102').id, card('OGN-203').id].sort().join('|'))).toBe(true);
    expect(byPair.has([card('SFD-015').id, card('VEN-157').id].sort().join('|'))).toBe(true);
  });
  it('dropping works on a pair that has an edge, and an empty drop list keeps the legal join', () => {
    // Svellsongur + Aphelios, Exalted (row 1): attaching is legal and triggers once; only the double trigger is not.
    const real = overrides.forbiddenInteractions.find((x) => x.cards.includes('SFD-059') && x.cards.includes('SFD-049'))!;
    expect(real.drop).toEqual([]);
    expect(labels(edge('SFD-059', 'SFD-049', real))).toContain('Equipment package');
    const all: ForbiddenInteraction = { ...real, drop: ['*'] };
    expect(edge('SFD-059', 'SFD-049', all)).toBeNull();
    const byPrefix: ForbiddenInteraction = { ...real, drop: ['package:equipment'] };
    expect(labels(edge('SFD-059', 'SFD-049', byPrefix))).not.toContain('Equipment package');
    const stats = buildEdgesWithStats([card('SFD-059'), card('SFD-049'), ...pool.filter((c) => c.type === 'legend')], { forbidden: [all] }).stats;
    expect(stats.forbiddenApplied).toBe(1);
  });
});

describe('buildEdges over the fixture pool', () => {
  let edges: CardEdge[] = [];
  let stats: BuildEdgesStats;
  const pool = networkCards();
  beforeAll(() => {
    ({ edges, stats } = buildEdgesWithStats(pool, { forbidden: overrides.forbiddenInteractions }));
  }, 180_000);

  it('stores only pairs that can share a deck, with a non-zero net and at least one specific reason', () => {
    const byId = new Map(pool.map((c) => [c.id, c]));
    const share = deckSharing(pool);
    expect(edges.length).toBeGreaterThan(1000);
    expect(stats.edges).toBe(edges.length);
    expect(stats.nodes).toBe(pool.filter(isNetworkCard).length);
    const seen = new Set<string>();
    for (const e of edges) {
      const a = byId.get(e.a)!;
      const b = byId.get(e.b)!;
      expect(e.a <= e.b).toBe(true);
      expect(seen.has(`${e.a}|${e.b}`)).toBe(false);
      seen.add(`${e.a}|${e.b}`);
      expect(e.net).not.toBe(0);
      expect(Number.isFinite(e.net)).toBe(true);
      expect(e.net).toBeCloseTo(e.synergy - e.antisynergy, 2);
      expect(e.reasons.some((r) => !isGenericReason(r.id))).toBe(true);
      if (e.a !== e.b) expect(share(a, b), `${a.name} + ${b.name}`).toBe(true);
      expect(isNetworkCard(a) && isNetworkCard(b)).toBe(true);
      for (const r of e.reasons) {
        expect(r.detail).toContain(a.name);
        expect(r.detail).toContain(b.name);
        expect(r.detail).toContain(' | ');
      }
    }
  });
  it('never pairs cards of two legends\' domains that no legend holds, nor two signature cards of different champions', () => {
    const share = deckSharing(pool);
    const legends = pool.filter((c) => c.type === 'legend');
    const main = pool.filter((c) => (c.type === 'unit' || c.type === 'spell') && c.domains.length === 1 && !c.superTypes.includes('signature'));
    const pairsOfDomains = new Set(legends.map((l) => [...l.domains].sort().join('+')));
    let checked = 0;
    for (let i = 0; i < main.length && checked < 400; i += 7) {
      for (let j = i + 1; j < main.length && checked < 400; j += 11) {
        const key = [main[i].domains[0], main[j].domains[0]].sort().join('+');
        if (main[i].domains[0] === main[j].domains[0]) continue;
        expect(share(main[i], main[j]), key).toBe(pairsOfDomains.has(key));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(50);
    const signatures = pool.filter((c) => c.superTypes.includes('signature') && c.type !== 'legend' && c.championTag);
    const other = signatures.find((c) => c.championTag !== signatures[0].championTag)!;
    expect(share(signatures[0], other)).toBe(false);
    expect(share(legends[0], legends[1])).toBe(false);
  });
  it('is deterministic and the plain form returns the same edges', () => {
    const subset = pool.filter((_, i) => i % 9 === 0);
    expect(buildEdges(subset)).toEqual(buildEdges([...subset].reverse()));
  });
  it('gives nothing for an empty pool, a single card or cards with incomplete data', () => {
    expect(buildEdges([])).toEqual([]);
    expect(buildEdges([card('OGN-064')])).toEqual([]);
    const broken: Card = { ...card('OGN-136'), id: 'x-incomplete', dataIncomplete: true };
    const typeless: Card = { ...card('RAD-043'), id: 'x-typeless', type: null };
    const noDomain: Card = { ...card('RAD-043'), id: 'x-unknown-domain', domains: [], noDomain: false };
    expect(buildEdges([broken, typeless, noDomain, card('OGN-136')])).toEqual([]);
  });
});

describe('quotes', () => {
  it('finds the sentence that carries a trait and prefers it to a bare keyword', () => {
    const fortune = toScoreCard(card('OGN-162'));
    expect(sentencesWithTrait(fortune, 'movement-payoff')).toEqual(["The first time I move each turn, you may ready something else that's exhausted"]);
    expect(quoteCard(fortune, ['ready'])).toBe('Miss Fortune, Captain: "The first time I move each turn, you may ready something else that\'s exhausted"');
    expect(quoteCard(toScoreCard(card('OGN-064')), ['spell'])).toBe('Wind Wall is a Spell');
  });
});

describe('findLoops', () => {
  const pool = networkCards();
  const db = createCardDb(pool, [], [], [], [], toLegalityData(readLegalityFile(path.join(process.cwd(), 'sync-data'))));
  const ids = (...codes: string[]): string[] => codes.map((c) => card(c).id);

  it('finds the mutual pair The Syren + Miss Fortune, Captain and quotes both cards', () => {
    const loops = findLoops(ids('OGN-184', 'OGN-162', 'OGN-064'), db);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toMatchObject({ kind: 'mutual', loop: true, cardIds: ids('OGN-162', 'OGN-184'), limiter: 'Miss Fortune, Captain: once per turn', heuristic: true });
    expect(loops[0].detail).toContain('Move a friendly unit at a battlefield to its base');
    expect(loops[0].detail).toContain('The first time I move each turn');
  });
  it('reports a replay engine, never as a loop, with the limiter', () => {
    // Grim Apothecary: "When you play me, you may return a friendly unit at a battlefield to its owner's hand"; Pit Rookie: "When you play me, buff another friendly unit".
    const loops = findLoops(ids('UNL-021', 'OGN-136', 'OGN-064'), db);
    const replay = loops.find((l) => l.kind === 'replay')!;
    expect(replay.cardIds).toEqual(ids('UNL-021', 'OGN-136'));
    expect(replay.loop).toBe(false);
    expect(replay.deterministic).toBe(false); // "you may"
    expect(replay.limiter).toContain('play cost');
    expect(replay.detail).toContain('Pit Rookie: "When you play me, buff another friendly unit"');
    // Ocean Drake returns "a non-Dragon unit": a Dragon is not a target (Ocean Drake itself is one).
    expect(findLoops(ids('VEN-115'), db)).toEqual([]);
  });
  it('applies the ban list: the Ekko, Recurrent refund loop exists only where Ekko is legal', () => {
    // Sacrifice kills a [Mighty] unit; Ekko, Recurrent: "[Deathknell] — Recycle me to ready your runes"; Forge of the Future recycles from trashes.
    const deck = ids('UNL-173', 'OGN-110', 'OGN-212');
    expect(db.legality().bans.some((b) => b.name === 'Ekko, Recurrent' && b.formats.includes('standard-bo1'))).toBe(true);
    expect(findLoops(deck, db, 'standard-bo1').filter((l) => l.kind === 'refund')).toEqual([]);
    const casual = findLoops(deck, db, 'casual').filter((l) => l.kind === 'refund');
    expect(casual).toHaveLength(1);
    expect(casual[0]).toMatchObject({ cardIds: ids('OGN-110', 'UNL-173'), closers: ids('OGN-212'), loop: true });
    expect(casual[0].detail).toContain('ready your runes');
    // Without the card that returns the pieces it is an engine, not a loop.
    expect(findLoops(ids('UNL-173', 'OGN-110'), db, 'casual').find((l) => l.kind === 'refund')).toMatchObject({ loop: false, closers: [] });
  });
  it('is sane for an empty deck, unknown ids and duplicates', () => {
    expect(findLoops([], db)).toEqual([]);
    expect(findLoops(['nope', 'nope'], db)).toEqual([]);
    expect(findLoops([...ids('OGN-184', 'OGN-162'), ...ids('OGN-184', 'OGN-162')], db)).toHaveLength(1);
  });
});
