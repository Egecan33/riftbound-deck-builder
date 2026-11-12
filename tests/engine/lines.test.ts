// Lines (plan Task 7, spec 14): deck-specific, rule-cited, never the same text for different decks.
import { describe, expect, it } from 'vitest';
import type { Card, Deck, DeckEntry, Line, LineReport } from '@/engine/types';
import { buildContext, falsePair, generateLines, packagesOf, sharedLineShare, turnFor } from '@/engine/lines';
import { answersOf, formatFacts } from '@/engine/wincons';
import { theoryDb } from '../helpers/theory-db';

const { db, decks } = theoryDb();
const card = (name: string): Card => {
  const c = db.byName(name);
  if (!c) throw new Error(`fixture has no card named ${name}`);
  return c;
};
const deckOf = (prefix: string): Deck => {
  const d = decks.find((x) => x.file.startsWith(prefix));
  if (!d) throw new Error(`no reference deck ${prefix}`);
  return structuredClone(d.deck);
};
const lines = (deck: Deck, opponent: string | null = null): LineReport => generateLines(deck, { db, opponentLegend: opponent ? card(opponent).id : null });
const all = (r: LineReport): Line[] => Object.values(r).flat();
const texts = (ls: readonly Line[]): string => ls.map((l) => l.text).join('\n');
const reasons = (ls: readonly Line[]): string => ls.map((l) => l.reason).join('\n');
const allowed = (deck: Deck): Set<string> => new Set([...deck.main.map((e) => e.id), ...deck.side.map((e) => e.id), ...deck.battlefields, ...(deck.legend ? [deck.legend] : [])]);
const entry = (name: string, qty: number): DeckEntry => ({ id: card(name).id, qty, locked: false });
const LEGENDS = ['Heart of the Tempest', 'Daughter of the Void', 'The Exile', 'Void Burrower', 'Blade Dancer', 'Voidreaver'];

describe('generateLines on the six reference decks', () => {
  const reports = decks.map((d) => ({ d, r: lines(d.deck), vs: lines(d.deck, d.legend === card('Daughter of the Void').id ? 'Heart of the Tempest' : 'Daughter of the Void') }));

  it('every line names cards of the deck, carries a reason and a sane probability', () => {
    for (const { d, r, vs } of reports) {
      const mine = allowed(d.deck);
      for (const report of [r, vs]) {
        const list = all(report);
        expect(list.length, d.file).toBeGreaterThan(25);
        for (const l of list) {
          expect(l.cardIds.length, l.text).toBeGreaterThan(0);
          for (const id of l.cardIds) expect(mine.has(id), `${d.file}: ${l.text}`).toBe(true);
          for (const id of l.otherIds ?? []) expect(db.get(id), id).toBeDefined();
          if (l.kind !== 'matchup' && l.kind !== 'side' && l.kind !== 'format') for (const id of l.otherIds ?? []) expect(mine.has(id), l.text).toBe(false);
          // The text names at least one of the cards it lists.
          expect(l.cardIds.some((id) => l.text.includes(db.get(id)!.name)), l.text).toBe(true);
          expect(l.reason.length, l.text).toBeGreaterThan(10);
          expect(l.text).not.toMatch(/undefined|NaN|\bnull\b/);
          if (l.probability !== null) { expect(l.probability).toBeGreaterThanOrEqual(0); expect(l.probability).toBeLessThanOrEqual(1); }
        }
        expect(new Set(list.map((l) => l.text)).size).toBe(list.length);
      }
    }
  });
  it('fills every section a complete deck can have', () => {
    for (const { d, r, vs } of reports) {
      for (const key of ['keeps', 'turns', 'sequencing', 'spikes', 'format'] as const) expect(r[key].length, `${d.file} ${key}`).toBeGreaterThan(0);
      expect(r.matchup, d.file).toEqual([]);
      expect(vs.matchup.length, d.file).toBeGreaterThan(2);
      expect(r.side.length, d.file).toBeGreaterThan(0);
      for (const [key, list] of Object.entries(r)) for (const l of list) expect(l.kind, key).toBe({ keeps: 'keep', turns: 'turn', sequencing: 'sequence', packages: 'package', oneAway: 'package', spikes: 'spike', matchup: 'matchup', side: 'side', format: 'format' }[key]);
    }
  });
  it('packages are found where the network has them, and never invented', () => {
    // The fixture network gives the Riven list no enabler-payoff family; it gets the exhaust detector instead.
    expect(reports.filter(({ r }) => r.packages.length > 0).length).toBeGreaterThanOrEqual(5);
    const riven = reports.find(({ d }) => d.file.startsWith('riven'))!.r;
    expect(texts(riven.sequencing)).toMatch(/Riven, Deserter counts your other units becoming exhausted\. Every move exhausts the unit that moves/);
    expect(reasons(riven.sequencing)).toMatch(/CR 144\.2/);
  });
  it('decks of different legends share fewer than 15% of their line texts', () => {
    let worst = 0;
    for (let i = 0; i < reports.length; i += 1) {
      for (let j = i + 1; j < reports.length; j += 1) {
        worst = Math.max(worst, sharedLineShare(reports[i].r, reports[j].r), sharedLineShare(reports[i].vs, reports[j].vs));
      }
    }
    expect(worst).toBeLessThan(0.15);
    // The three decks named in the commit message.
    const [kennen, kaisa, riven] = ['kennen', 'kaisa', 'riven'].map((p) => lines(deckOf(p)));
    expect(Math.max(sharedLineShare(kennen, kaisa), sharedLineShare(kennen, riven), sharedLineShare(kaisa, riven))).toBeLessThan(0.15);
    expect(sharedLineShare(kennen, kennen)).toBe(1);
  });
  it('is deterministic and fast', () => {
    for (const { d, r } of reports) {
      const started = Date.now();
      expect(generateLines(structuredClone(d.deck), { db, opponentLegend: null })).toEqual(r);
      expect(Date.now() - started).toBeLessThan(1000);
    }
  });
  it('marks heuristics and leaves rule facts unmarked', () => {
    for (const { r } of reports) {
      expect(r.keeps.every((l) => l.heuristic)).toBe(true);
      expect(r.spikes[0].heuristic).toBe(false); // the champion's turn is a rule fact
      expect(all(r).some((l) => !l.heuristic)).toBe(true);
    }
  });
});

describe('keeps and the turn plan', () => {
  const kennen = lines(deckOf('kennen'));
  it('quotes draw 4, the mulligan of 2 and the runes per seat with their rule numbers', () => {
    const [play, draw] = kennen.keeps;
    expect(play.text).toMatch(/^On the play \(2 runes on turn 1\)/);
    expect(draw.text).toMatch(/^On the draw \(3 runes on turn 1\)/);
    expect(play.reason).toMatch(/CR 116/);
    expect(play.reason).toMatch(/CR 117\.1/);
    expect(play.reason).toMatch(/CR 315\.3\.b/);
    expect(draw.reason).toMatch(/CR 488\.7/);
    expect(lines({ ...deckOf('kennen'), format: 'standard-bo1' }).keeps[1].reason).toMatch(/CR 487\.7/);
    // 9 turn-1 units in the 39-card library: 1 - C(30,4)/C(39,4) and, after setting aside 2, 1 - C(30,6)/C(39,6).
    expect(play.text).toMatch(/9 of 39 library cards: 67% in the opening 4, 82% after setting aside 2/);
    expect(play.probability).toBeCloseTo(0.667, 3);
  });
  it('keep odds lie in (0,1) and change when copies change', () => {
    for (const d of decks) {
      for (const l of lines(d.deck).keeps) { expect(l.probability).toBeGreaterThan(0); expect(l.probability).toBeLessThan(1); }
    }
    const fewer = deckOf('kennen');
    const merchant = fewer.main.find((e) => e.id === card('Traveling Merchant').id)!;
    merchant.qty = 1;
    const changed = lines(fewer).keeps[0];
    expect(changed.probability).toBeLessThan(kennen.keeps[0].probability!);
    expect(changed.text).toMatch(/7 of 37 library cards/);
  });
  it('the turn table follows the real curve, both seats, and the Champion Zone', () => {
    const turn = (prefix: string): Line => kennen.turns.find((l) => l.text.startsWith(prefix))!;
    expect(turn('Turn 1 on the play').text).toMatch(/2 runes, 5 cards seen/);
    expect(turn('Turn 1 on the draw').text).toMatch(/3 runes, 5 cards seen/);
    // Kennen, Storm of Shuriken needs 3 Energy and 1 Power: turn 2 on the play, turn 1 on the draw, always there.
    expect(turn('Turn 2 on the play').text).toMatch(/Kennen, Storm of Shuriken from the Champion Zone \(always there\)/);
    expect(turn('Turn 1 on the draw').text).toMatch(/Kennen, Storm of Shuriken from the Champion Zone/);
    expect(turn('Turn 2 on the play').probability).toBe(1);
    expect(turn('Turn 1 on the play').reason).toMatch(/CR 315\.3\.b.*CR 164\.2/);
    expect(kennen.spikes[0].text).toMatch(/turn 2 on the play, turn 1 on the draw/);
    expect(kennen.spikes[0].reason).toMatch(/CR 103\.3\.a\.1/);
    expect(turnFor(7, formatFacts('standard-bo3').seats[0])).toBe(4);
    expect(turnFor(7, formatFacts('standard-bo3').seats[1])).toBe(3);
    expect(turnFor(13, formatFacts('standard-bo3').seats[0])).toBe(0); // 12 runes in the Rune Deck
  });
  it('3.9: the two-card turn always has a unit and spends the runes; variable costs and ramp are named, not placed', () => {
    for (const d of decks) {
      for (const l of lines(d.deck).turns) {
        const m = /two-card turn: (.+?) \+ (.+?) \((\d+)(?:\+(\d+)P)? and (\d+)(?:\+(\d+)P)?/.exec(l.text);
        if (!m) continue;
        const [a, b] = [card(m[1]), card(m[2])];
        expect(a.type === 'unit' || b.type === 'unit', l.text).toBe(true);
        const runes = Number(/, (\d+) runes,/.exec(l.text)![1]);
        expect(Math.max(Number(m[3]) + Number(m[5]), Number(m[4] ?? 0) + Number(m[6] ?? 0)), l.text).toBe(runes);
      }
    }
    expect(texts(kennen.turns)).toMatch(/Not on the printed curve: Rhasa the Sunderer \(printed 10\)\. Rhasa the Sunderer: "I cost \[1\] less for each card in your trash\."/);
    expect(texts(kennen.turns)).toMatch(/Extra resources the table above does not count: Seal of Discord x3/);
    // Rhasa never appears on a turn as if it cost 10.
    expect(kennen.turns.filter((l) => l.text.startsWith('Turn ')).some((l) => l.text.includes('Rhasa'))).toBe(false);
  });
  it('the Power check uses the deck\'s own rune split', () => {
    const base = lines(deckOf('reksai'));
    const check = (r: LineReport): string => /Long Sword needs 1 Fury Power from (\d+) of 12 runes: (\d+)%/.exec(texts(r.turns))?.[0] ?? '';
    expect(check(base)).not.toBe('');
    const swapped = deckOf('reksai');
    swapped.runes = { fury: 4, order: 8 };
    expect(check(lines(swapped))).not.toBe(check(base));
    expect(texts(lines({ ...deckOf('reksai'), runes: {} }).turns)).not.toMatch(/Power from/);
  });
});

describe('sequencing and packages come from the network and from rule-backed detectors', () => {
  const kennen = lines(deckOf('kennen'));
  const reksai = lines(deckOf('reksai'));
  it('network pairs quote both cards and put them in the order they work', () => {
    const network = kennen.sequencing.filter((l) => l.reason.startsWith('Network edge'));
    expect(network.length).toBeGreaterThanOrEqual(3);
    for (const l of network) { expect(l.cardIds.length).toBe(2); expect(l.text).toMatch(/: ".+" -> .+: ".+"/); }
    // A "When I move" unit has to be in play before the move; a replayed unit is on the board before the bounce.
    expect(texts(network)).toMatch(/Traveling Merchant first, then Ride the Wind \(Move triggers\)/);
    expect(texts(network)).toMatch(/Trifarian Captain on the board, then Star-Crossed to play Trifarian Captain again \(Replay play effects\)/);
    // Stage 3 review: a spell is gone when it resolves, so the permanent it triggers is named first.
    expect(texts(reksai.sequencing)).not.toMatch(/Cull the Weak first, then/);
    expect(texts(reksai.sequencing)).toMatch(/Carrion Dredger first, then (?:Cull the Weak|Shimmering Swimmer) \(Death engine\)/);
  });
  it('detectors fire only for cards the deck holds, each with its rule', () => {
    const seq = texts(kennen.sequencing);
    const why = reasons(kennen.sequencing);
    expect(seq).toMatch(/Leave 1 rune ready on the opponent's turn for Gust/);
    expect(why).toMatch(/CR 309\.1\.a.*CR 167/);
    expect(seq).toMatch(/Hide Bedeviling Stranger, Switcheroo, Tideturner and Edge of Night/);
    expect(why).toMatch(/CR 811\.1\.b/);
    expect(seq).toMatch(/Kennen, Storm of Shuriken takes one battlefield with its own move; Ride the Wind \(2\+1P\) then moves it again and readies it/);
    expect(why).toMatch(/CR 144\.2.*CR 144\.4/);
    expect(seq).toMatch(/Switcheroo costs 2 Power/);
    expect(seq).toMatch(/Reckless Innovator: pay 1 Energy and 1 Power more to enter ready/);
    expect(why).toMatch(/CR 805\.1\.b/);
    // No Legion, Ambush or Deathknell card in the Kennen list; Rek'Sai has all three.
    expect(seq).not.toMatch(/Legion|Ambush|Deathknell/);
    const other = texts(reksai.sequencing);
    expect(other).toMatch(/Play Concert Poster before Noxus Hopeful: Legion only counts/);
    expect(other).toMatch(/with the Legion discount of 2/);
    expect(other).toMatch(/Ambush plays the unit as a Reaction/);
    expect(reasons(reksai.sequencing)).toMatch(/CR 812\.1\.c/);
    expect(reasons(reksai.sequencing)).toMatch(/CR 822\.1\.b/);
    expect(other).not.toMatch(/Hide /);
  });
  it('packages hold every enabler and payoff, with the chance of both sides', () => {
    const packs = packagesOf(buildContext(deckOf('reksai'), { db, opponentLegend: null }));
    const death = packs.find((p) => p.label === 'Death engine')!;
    expect(death.enablers.map((c) => c.card.name).sort()).toEqual(['Cull the Weak', 'Shimmering Swimmer']);
    expect(death.payoffs.map((c) => c.card.name)).toContain('Carrion Dredger');
    expect(death.reliability).toBeGreaterThan(0);
    expect(death.reliability).toBeLessThan(1);
    expect(texts(reksai.packages)).toMatch(/Death engine: (?:Cull the Weak x3 and Shimmering Swimmer x3|Shimmering Swimmer x3 and Cull the Weak x3) -> Carrion Dredger x3/);
    expect(texts(kennen.packages)).toMatch(/Trash threshold: .*Rhasa the Sunderer x3/);
    for (const l of [...kennen.packages, ...reksai.packages]) { expect(l.probability).toBeGreaterThan(0); expect(l.reason).toMatch(/".+"|Measured/); }
    // More copies of one side raise the chance.
    const fewer = deckOf('reksai');
    fewer.main.find((e) => e.id === card('Cull the Weak').id)!.qty = 1;
    const less = packagesOf(buildContext(fewer, { db, opponentLegend: null })).find((p) => p.label === 'Death engine')!;
    expect(less.reliability).toBeLessThan(death.reliability);
  });
  it('one-away lines name a legal card that is not in the deck', () => {
    for (const d of decks) {
      const legend = db.get(d.deck.legend!)!;
      for (const l of lines(d.deck).oneAway) {
        expect(l.otherIds?.length, l.text).toBe(1);
        const missing = db.get(l.otherIds![0])!;
        expect(allowed(d.deck).has(missing.id)).toBe(false);
        expect(missing.domains.every((x) => legend.domains.includes(x)), `${missing.name} in ${legend.name}`).toBe(true);
        expect(l.text).toContain(`${missing.name} (not in the deck`);
        expect(l.cardIds.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('matchup and side deck', () => {
  it('setting the opposing legend changes matchup and side lines', () => {
    const deck = deckOf('kennen');
    const none = lines(deck);
    const kaisa = lines(deck, 'Daughter of the Void');
    const riven = lines(deck, 'The Exile');
    expect(none.matchup).toEqual([]);
    expect(kaisa.matchup.length).toBeGreaterThan(3);
    expect(texts(kaisa.matchup)).not.toBe(texts(riven.matchup));
    expect(texts(kaisa.side)).not.toBe(texts(none.side));
    expect(texts(kaisa.side)).not.toBe(texts(riven.side));
    // Everything outside matchup and side is the same deck analysis.
    for (const key of ['keeps', 'turns', 'sequencing', 'packages', 'oneAway', 'spikes', 'format'] as const) expect(kaisa[key]).toEqual(none[key]);
    for (const l of kaisa.matchup) expect(l.otherIds).toContain(card('Daughter of the Void').id);
  });
  it('answers are tested card against card: a capped or undersized effect is named as a miss', () => {
    const vs = texts(lines(deckOf('kennen'), 'Daughter of the Void').matchup);
    expect(vs).toMatch(/Gust x2 \(return to hand; 3 Might or less, at a battlefield\) answers /);
    expect(vs).toMatch(/No effect on .*Thousand-Tailed Watcher \(7 Might is over its 3 limit\)/);
    // The gear-only kill is matched with their gear and never with a unit.
    const offer = lines(deckOf('kennen'), 'Daughter of the Void').matchup.find((l) => l.text.startsWith("An Offer You Can't Refuse"))!;
    expect(offer.text).toMatch(/\(kill a gear\) answers /);
    for (const id of offer.otherIds ?? []) expect(['gear', 'legend']).toContain(db.get(id)!.type);
    // An answer with no legal target says so: Decree of Rage only hits Calm units, Kennen lists are Chaos and Order.
    const calm = deckOf('kaisa');
    calm.main.push(entry('Decree of Rage', 3));
    expect(texts(lines(calm, 'Heart of the Tempest').matchup)).toMatch(/Weak against Kennen, Heart of the Tempest: .*Decree of Rage x3 \(deal 4; Calm only; .+: only calm units\)/);
    expect(vs).toMatch(/Typical Kai'Sa, Daughter of the Void lists score by attrition with Thousand-Tailed Watcher/);
    expect(vs).toMatch(/Heuristic lean: /);
    const lean = lines(deckOf('kennen'), 'Daughter of the Void').matchup.find((l) => l.text.startsWith('Heuristic lean'))!;
    expect(lean.heuristic).toBe(true);
    expect(lean.reason).toMatch(/never fitted to results/);
  });
  it('3.9: every side-in has a side-out, 1 for 1, including cards with no opponent-dependent target', () => {
    let swaps = 0;
    let plainOuts = 0;
    for (const d of decks) {
      for (const opponent of LEGENDS) {
        if (card(opponent).id === d.deck.legend) continue;
        for (const l of lines(d.deck, opponent).side) {
          const m = /IN (\d+) (.+?) \(.*\. OUT (.+)\.$/.exec(l.text);
          if (!m) continue;
          swaps += 1;
          const outs = [...m[3].matchAll(/(\d+) ([^()]+?) \((?:lowest evaluation|\d)/g)];
          expect(outs.reduce((n, o) => n + Number(o[1]), 0), l.text).toBe(Number(m[1]));
          expect(d.deck.side.some((e) => e.id === card(m[2]).id), l.text).toBe(true);
          for (const o of outs) {
            const out = card(o[2]);
            expect(d.deck.main.some((e) => e.id === out.id), l.text).toBe(true);
            expect(out.id).not.toBe(d.deck.champion);
            if (answersOf(out).length === 0) plainOuts += 1;
          }
          expect(l.reason).toMatch(/TR 403\.4/);
        }
      }
    }
    expect(swaps).toBeGreaterThan(5);
    expect(plainOuts).toBeGreaterThan(0);
  });
  it('a deck with no side deck yields no side lines; a format without one says the cards are unused', () => {
    const bare = { ...deckOf('kennen'), side: [] };
    expect(lines(bare).side).toEqual([]);
    expect(lines(bare, 'Daughter of the Void').side).toEqual([]);
    const ffa = lines({ ...deckOf('kennen'), format: 'ffa4' }).side;
    expect(ffa.length).toBe(1);
    expect(ffa[0].text).toMatch(/^ffa4 is played without a side deck/);
  });
  it('without an opponent, side lines say which legends each card is for and quote the side-deck rules', () => {
    const side = lines(deckOf('kaisa')).side;
    expect(side[0].text).toMatch(/^Side deck: 10 of 10 cards/);
    expect(side[0].reason).toMatch(/TR 601\.1\.c\.1.*TR 403\.4.*TR 403\.5/);
    expect(texts(side)).toMatch(/Decree of Rage x3 \(deal 4; Calm only\) comes in against /);
  });
  it('an opposing legend with too few synced lists gives one line that says so', () => {
    const r = lines(deckOf('kennen'), 'Wuju Bladesman');
    expect(r.matchup.length).toBe(1);
    expect(r.matchup[0].text).toMatch(/^No matchup lines against Master Yi, Wuju Bladesman: 0 synced lists/);
    expect(generateLines(deckOf('kennen'), { db, opponentLegend: 'not-a-card' }).matchup).toEqual([]);
    expect(generateLines(deckOf('kennen'), { db, opponentLegend: card('Gust').id }).matchup).toEqual([]);
  });
});

describe('format notes', () => {
  it('differ between standard-bo3 and ffa4, each with its own rule numbers', () => {
    const bo3 = lines(deckOf('riven')).format;
    const ffa = lines({ ...deckOf('riven'), format: 'ffa4' }).format;
    expect(texts(bo3)).not.toBe(texts(ffa));
    expect(bo3.filter((l) => ffa.some((x) => x.text === l.text))).toEqual([]);
    expect(texts(bo3)).toMatch(/standard-bo3: first to 8 with 2 battlefields in play/);
    expect(texts(bo3)).toMatch(/Best of three: game 1 is the registered 40 with Riven, Broken Blade/);
    expect(reasons(bo3)).toMatch(/CR 488\.3.*CR 488\.4.*CR 472.*CR 473\.1\.a\.1.*CR 473\.1\.b\.1/);
    expect(reasons(bo3)).toMatch(/CR 488\.5/);
    expect(texts(ffa)).toMatch(/ffa4: first to 8 with 3 battlefields in play/);
    expect(texts(ffa)).toMatch(/going first you skip your first draw and have 2 runes, going last you draw and have 3/);
    expect(texts(ffa)).toMatch(/If you take the first turn, Emperor's Dais, Hunters' Circle and Star Spring are removed/);
    expect(texts(ffa)).toMatch(/The last point by conquest needs all three battlefields in one turn/);
    expect(reasons(ffa)).toMatch(/CR 490\.3/);
    expect(reasons(ffa)).toMatch(/CR 490\.7/);
    expect(reasons(ffa)).toMatch(/CR 490\.4\.b/);
    expect(reasons(ffa)).toMatch(/CR 347\.2\.b/);
    // The first seat of a multiplayer game sees one card fewer on every turn.
    expect(texts(lines({ ...deckOf('riven'), format: 'ffa4' }).turns)).toMatch(/Turn 1 going first, 2 runes, 4 cards seen/);
  });
  it('2v2 quotes the shared score of 11 and what "friendly" means', () => {
    const team = lines({ ...deckOf('riven'), format: '2v2' }).format;
    expect(texts(team)).toMatch(/2v2: first to 11 as a team with 3 battlefields in play/);
    expect(texts(team)).toMatch(/say "friendly": in 2v2 that includes your teammate's units and gear/);
    expect(reasons(team)).toMatch(/CR 491\.3/);
    expect(reasons(team)).toMatch(/CR 491\.8\.e/);
    expect(reasons(team)).toMatch(/CR 491\.8\.d.*CR 491\.8\.b.*CR 449\.2\.b/);
    expect(reasons(team)).toMatch(/CR 491\.8\.g\.1/);
  });
  it('each battlefield line quotes the battlefield and names the deck cards linked to it', () => {
    const format = lines(deckOf('kennen')).format;
    const minefield = format.find((l) => l.text.startsWith('Minefield'))!;
    expect(minefield.text).toMatch(/It works with .*Rhasa the Sunderer/);
    expect(minefield.text).toMatch(/you choose it game by game \(CR 488\.5\)/);
    expect(lines({ ...deckOf('kennen'), format: 'standard-bo1' }).format.find((l) => l.text.startsWith('Minefield'))!.text).toMatch(/one game of three, picked at random \(CR 487\.5\)/);
  });
});

describe('partial and broken decks never throw', () => {
  const base = deckOf('kennen');
  const cases: Record<string, Deck> = {
    empty: { ...base, legend: null, champion: null, main: [], side: [], runes: {}, battlefields: [] },
    'legend only': { ...base, champion: null, main: [], side: [], runes: {}, battlefields: [] },
    'no legend, no champion, 7 cards': { ...base, legend: null, champion: null, main: base.main.slice(0, 3), side: [], runes: {}, battlefields: [] },
    '43 cards': { ...base, main: [...base.main, entry('Falling Star', 3)] },
    '0 runes': { ...base, runes: {} },
    'no battlefields, 2v2': { ...base, battlefields: [], format: '2v2' },
    'bad quantities': { ...base, main: [...base.main.slice(0, 4), { id: 'nope', qty: 3, locked: false }, { id: base.main[5].id, qty: Number.NaN, locked: false }, { id: base.main[6].id, qty: -2, locked: false }] },
    'spells only': { ...base, champion: null, main: [entry('Gust', 3), entry('Falling Star', 3), entry('Ride the Wind', 3)] },
  };
  for (const [name, deck] of Object.entries(cases)) {
    for (const opponent of [null, 'Daughter of the Void']) {
      it(`${name}${opponent ? ' against a legend' : ''}`, () => {
        const r = lines(deck, opponent);
        const mine = allowed(deck);
        expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
        for (const l of all(r)) {
          expect(l.cardIds.length).toBeGreaterThan(0);
          for (const id of l.cardIds) expect(mine.has(id), l.text).toBe(true);
          if (l.probability !== null) { expect(l.probability).toBeGreaterThanOrEqual(0); expect(l.probability).toBeLessThanOrEqual(1); }
        }
      });
    }
  }
  it('an empty deck has no lines', () => {
    expect(all(lines(cases.empty))).toEqual([]);
    expect(all(lines(cases['legend only'], 'Daughter of the Void'))).toEqual([]);
  });
  it('a banned card is in no line', () => {
    const deck = deckOf('kennen');
    deck.main.push(entry('Fight or Flight', 3));
    const banned = card('Fight or Flight').id;
    for (const l of all(lines(deck, 'Daughter of the Void'))) expect(l.cardIds).not.toContain(banned);
  });
});

describe('stage 3 review of the lines', () => {
  const reports = decks.map((d) => ({ d, r: lines(d.deck) }));
  it('a pair whose two sentences do not meet is not a line', () => {
    // Temporary tokens die, not the card whose reward is its own Deathknell.
    expect(falsePair('package:temporary:death-payoff:a:b', 'Play two ready 3 Might Sprite unit tokens with [Temporary]', '[Deathknell][>] Play a 1 Might Bird unit token with [Deflect] to your base')).toBe(true);
    expect(falsePair('package:temporary:death-payoff:a:b', 'Play two ready 3 Might Sprite unit tokens with [Temporary]', 'Your [Deathknell] effects trigger an additional time')).toBe(true);
    // A card that watches any other friendly unit die does get them.
    expect(falsePair('package:temporary:death-payoff:a:b', 'Play two ready 3 Might Sprite unit tokens with [Temporary]', 'When another non-Recruit unit you control dies, play a 1 Might Recruit unit token into your base')).toBe(false);
    // Giving Temporary to the Deathknell unit itself is the real interaction.
    expect(falsePair('package:temporary:death-payoff:a:b', 'Choose a friendly unit without [Temporary]', '[Deathknell][>] Play a 1 Might Bird unit token with [Deflect] to your base')).toBe(false);
    // Your own unit dying is not "an enemy unit dies", stunned or not.
    expect(falsePair('package:temporary:death-payoff:a:b', 'play a ready 3 Might Sprite unit token with [Temporary] here', 'When a stunned enemy unit here dies, draw 1')).toBe(true);
    expect(falsePair('package:death-enabler:death-payoff:a:b', 'Kill a friendly unit', 'When an enemy unit dies while I am at a battlefield, draw 1')).toBe(true);
    expect(falsePair('package:stun:stun-payoff:a:b', 'Stun a unit', 'When a stunned enemy unit here dies, draw 1')).toBe(false);
  });
  it('battlefield lines say what the deck does with the battlefield, never that all three are "the last one to choose"', () => {
    for (const { d, r } of reports) {
      const fields = r.format.filter((l) => d.deck.battlefields.includes(l.cardIds[0]));
      expect(fields.length, d.file).toBe(d.deck.battlefields.length);
      for (const l of fields) expect(l.text, d.file).not.toMatch(/last one to choose|is linked to it/);
    }
    // A Bonus Damage battlefield in a list with damage spells names them (Void Gate with Falling Star, Hextech Ray).
    const kaisa = deckOf('kaisa');
    const gate = card('Void Gate');
    const r = lines({ ...kaisa, battlefields: [gate.id, ...kaisa.battlefields.filter((id) => id !== gate.id).slice(0, 2)] });
    const line = r.format.find((l) => l.cardIds[0] === gate.id)!;
    expect(line.text).toMatch(/copies in the deck deal damage with a spell or ability: .*(Falling Star|Hextech Ray)/);
    expect(line.cardIds.length).toBeGreaterThan(1);
  });
  it('one-card-away lines are only for a side the deck has at most one copy of, and never repeat a family the deck already has as a package', () => {
    for (const { d, r } of reports) {
      const packageLabels = r.packages.map((l) => l.text.split(':')[0]);
      for (const l of r.oneAway) {
        expect(l.text, d.file).not.toMatch(/almost nothing/);
        expect(l.text, d.file).toMatch(/but (?:no card that (?:feeds|rewards) them|only .+ to (?:feed|reward) them)\./);
        const label = /^One card away from ([^:]+):/.exec(l.text)?.[1];
        expect(packageLabels, `${d.file}: ${l.text}`).not.toContain(label);
      }
      // Two families over the same deck cards are one suggestion.
      const keys = r.oneAway.map((l) => [...l.cardIds].sort().join('|'));
      expect(new Set(keys).size, d.file).toBe(keys.length);
    }
  });
  it('a network pair line is left out when both cards are held under 10% of the time', () => {
    for (const { d, r } of reports) for (const l of r.sequencing.filter((x) => x.reason.startsWith('Network edge'))) {
      if (/always/.test(l.text)) continue;
      expect(l.probability ?? 1, `${d.file}: ${l.text}`).toBeGreaterThanOrEqual(0.1 - 1e-9);
    }
  });
  it('the Tank line guards a closer or the champion, and legend pairs read as a sentence', () => {
    for (const { d, r } of reports) {
      for (const l of r.sequencing) expect(l.text, d.file).not.toMatch(/is always in play, so [A-Z]/);
    }
    const riven = reports.find(({ d }) => d.file.startsWith('riven'))!.r;
    expect(texts(riven.sequencing)).toMatch(/Put Blitzcrank, Impassive at the same battlefield as Riven, Deserter/);
  });
});
