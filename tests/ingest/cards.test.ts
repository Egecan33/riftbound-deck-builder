import { describe, expect, it } from 'vitest';
import { buildCards, domainOrderBreaks, parsePublicCode, printingIdOf, cardCodeOf, toCard, variantOf, EFFECT_PREFIX, type GalleryItem } from '@/ingest/cards';
import { copyLimitFromText, letterSymbolsToCanonical, ownKeywords, richToPlain } from '@/ingest/text';
import type { CardOverride, ErrataEntry } from '@/server/syncdata';

// Gallery-shaped rows, trimmed from the live gallery JSON of 2026-11-12.
interface Opts { subtitle?: string; type?: string | null; superTypes?: string[]; domains?: string[]; text?: string; effect?: string; energy?: number; might?: number; power?: number; mightBonus?: number; tags?: string[]; alt?: string }
function row(publicCode: string, name: string, o: Opts = {}): GalleryItem {
  const value = (id: number | undefined) => (id === undefined ? undefined : { value: { id } });
  return {
    id: publicCode.toLowerCase().replace('/', '-').replace('*', '-star'),
    name,
    subtitle: o.subtitle,
    publicCode,
    set: { value: { id: publicCode.split('-')[0] } },
    cardType: { type: o.type ? [{ id: o.type }] : [], superType: (o.superTypes ?? []).map((id) => ({ id })) },
    domain: { values: (o.domains ?? []).map((id) => ({ id })) },
    cardImage: { url: `https://cmsassets.rgpub.io/sanity/images/x/${publicCode}-744x1039.png?accountingTag=RB`, accessibilityText: o.alt ?? '' },
    text: o.text === undefined ? undefined : { richText: { body: o.text } },
    effect: o.effect === undefined ? undefined : { richText: { body: o.effect } },
    energy: value(o.energy), might: value(o.might), power: value(o.power), mightBonus: value(o.mightBonus),
    tags: o.tags ? { tags: o.tags } : undefined,
  };
}
const ctx = { setOrder: ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD'] };

const ekko = row('OGN-110/298', 'Ekko', {
  subtitle: 'Recurrent', type: 'unit', superTypes: ['champion'], domains: ['mind'], energy: 5, might: 5, power: 1, tags: ['Ekko', 'Zaun'],
  text: '<p>[Accelerate] (You may pay :rb_energy_1::rb_rune_mind: as an additional cost to have me enter ready.)<br />[Deathknell] — Recycle me to ready your runes. (When I die, get the effect.)</p>',
});
const tibbers = row('OGS-018/024', 'Tibbers', { subtitle: 'Annie', type: 'unit', superTypes: ['signature'], domains: ['fury', 'chaos'], energy: 8, might: 7, power: 2, tags: ['Annie'], text: '<p>When you play me, deal 3 to all units at battlefields.</p>' });
const wuju = row('OGS-019/024', 'Wuju Bladesman', { subtitle: 'Starter', type: 'legend', superTypes: ['champion'], domains: ['calm', 'body'], tags: ['Master Yi'], text: '<p>While a friendly unit defends alone, it gets +2 :rb_might:.</p>' });
const yi = row('OGS-004/024', 'Master Yi', { subtitle: 'Meditative', type: 'unit', superTypes: ['champion'], domains: ['calm'], energy: 4, might: 3, tags: ['Master Yi', 'Ionia'], text: '<p>[Shield]</p>' });
const annie = row('OGN-001/298', 'Annie', { subtitle: 'Fiery', type: 'unit', superTypes: ['champion'], domains: ['fury'], energy: 3, might: 3, tags: ['Annie'], text: '<p>x</p>' });
const spiderling = row('VEN-097/166', 'Spiderling', {
  type: 'unit', domains: ['chaos'], energy: 3, might: 1, tags: ['Shadow Isles', 'Spider'],
  text: '<p>[Hidden] (Hide now for :rb_rune_rainbow: to react with later for :rb_energy_0:.)<br />I have +1 :rb_might: for each other unit you control here with my name.<br />Your deck can have any number of cards named Spiderling.</p>',
});
const cape = row('SFD-190/221', 'Forgefire Cape', {
  type: 'gear', superTypes: ['signature'], domains: ['calm', 'mind'], energy: 4, might: 3, power: 2, mightBonus: 3, tags: ['Ornn', 'Equipment'],
  text: '<p>[Unique] (Your deck can have only 1 card with this name.)<br />[Equip] :rb_rune_rainbow: (:rb_rune_rainbow:: Attach this to a unit you control.)</p>',
  effect: '<p>When I attack or defend, deal 2 to all enemy units here.</p>',
});
const draven = row('SFD-020/221', 'Draven', {
  subtitle: 'Vanquisher', type: 'unit', superTypes: ['champion'], domains: ['fury'], energy: 4, might: 4, tags: ['Draven', 'Noxus'],
  text: '<p>When I win a combat, play a Gold gear token exhausted.<br />When I attack or defend, you may pay :rb_rune_fury:. If you do, give me +2 :rb_might: this turn.</p>',
});
const dravenErrata: ErrataEntry = {
  id: 'vendetta-errata-1', cardName: 'Draven, Vanquisher', codes: ['SFD-020', 'SFD-020a'], effective: '2026-07-23', source: 'ERR-VEN', status: 'official',
  printedText: 'old', currentText: 'When I win a combat, play a Gold gear token exhausted.\nWhen I attack or defend, you may pay [C] to give me +2 [M] this turn.',
};

describe('rules name', () => {
  it('joins name and subtitle for a champion unit', () => {
    const card = toCard([ekko], [], [], ctx);
    expect(card.name).toBe('Ekko, Recurrent');
    expect(card.shortName).toBe('Ekko');
    expect(card.championTag).toBe('Ekko');
    expect(card.id).toBe('ogn-110-298');
    expect(card.code).toBe('OGN-110');
  });

  it('does not join the subtitle of a signature card or a starter legend', () => {
    expect(toCard([tibbers], [], [], ctx).name).toBe('Tibbers');
    expect(toCard([tibbers], [], [], ctx).shortName).toBe('Tibbers');
    expect(toCard([wuju], [], [], ctx).name).toBe('Wuju Bladesman');
  });
});

describe('printings', () => {
  it('collapse to one card with every set and the first printing as id', () => {
    const alt = { ...ekko, id: 'ogn-110a-298', publicCode: 'OGN-110a/298' };
    const promo = { ...ekko, id: 'rad-sp1-005', publicCode: 'RAD-SP1/005', set: { value: { id: 'RAD' } } };
    const { cards, printings } = buildCards([promo, alt, ekko], [], [], ctx);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('ogn-110-298');
    expect(cards[0].set).toBe('OGN');
    expect(cards[0].sets).toEqual(['OGN', 'RAD']);
    expect(printings.map((p) => p.code).sort()).toEqual(['OGN-110', 'OGN-110a', 'RAD-SP1']);
    expect(printings.every((p) => p.cardId === 'ogn-110-298')).toBe(true);
  });

  it('parses codes of every shape', () => {
    const shapes: [string, string, string, string][] = [
      ['OGN-110/298', 'base', 'ogn-110-298', 'OGN-110'],
      ['SFD-020a/221', 'alt', 'sfd-020a-221', 'SFD-020a'],
      ['OGN-304*/298', 'signature', 'ogn-304s-298', 'OGN-304s'],
      ['RAD-172/167', 'overnumbered', 'rad-172-167', 'RAD-172'],
      ['RAD-SP1/005', 'special', 'rad-sp1-005', 'RAD-SP1'],
      ['RAD-R01a', 'rune', 'rad-r01a', 'RAD-R01a'],
      ['UNL-T04', 'token', 'unl-t04', 'UNL-T04'],
    ];
    for (const [code, variant, id, deckCode] of shapes) {
      const p = parsePublicCode(code);
      expect(variantOf(p)).toBe(variant);
      expect(printingIdOf(p)).toBe(id);
      expect(cardCodeOf(p)).toBe(deckCode);
    }
    expect(() => parsePublicCode('nonsense')).toThrow();
  });

  it('tokens merge by name without their region and never with a real card', () => {
    const tokens = [
      row('VEN-T04', 'Recruit', { type: 'unit', superTypes: ['token'], domains: ['colorless'], might: 1 }),
      row('OGN-272/298', 'Recruit (NX)', { type: 'unit', superTypes: ['token'], domains: ['colorless'], might: 1 }),
      row('SFD-T03', 'Gold', { type: 'gear', superTypes: ['token'], domains: ['colorless'] }),
      row('UNL-150/219', 'Gold', { type: 'spell', domains: ['chaos'], energy: 1, text: '<p>Draw 1.</p>' }),
    ];
    const { cards } = buildCards(tokens, [], [], ctx);
    expect(cards.map((c) => `${c.name}:${c.superTypes.includes('token')}`).sort()).toEqual(['Gold:false', 'Gold:true', 'Recruit:true']);
  });
});

describe('incomplete gallery rows', () => {
  it('an empty type gives dataIncomplete and type null', () => {
    const card = toCard([row('RAD-034/167', 'Hunker Down', { type: null, domains: ['calm'], energy: 2, text: '<p>[Reaction]</p>', alt: 'Riftbound Spell: Hunker Down. [Reaction]' })], [], [], ctx);
    expect(card.type).toBeNull();
    expect(card.dataIncomplete).toBe(true);
  });

  it('an empty domain list gives dataIncomplete, never "no domain"', () => {
    const card = toCard([row('RAD-009/167', 'Antagonistic Apparatus', { type: 'unit', domains: [], energy: 6, might: 3, power: 1, text: '<p>I enter ready.</p>' })], [], [], ctx);
    expect(card.dataIncomplete).toBe(true);
    expect(card.noDomain).toBe(false);
    expect(card.domains).toEqual([]);
  });

  it('a spell with Might, a unit without Might, or a type the image text contradicts is incomplete', () => {
    const armorer = row('RAD-130/167', 'Battlefield Armorer', { type: 'spell', domains: ['order'], energy: 3, might: 3, text: '<p>x</p>', alt: 'Riftbound Unit: Battlefield Armorer. When' });
    const spellWithMight = row('RAD-900/167', 'Odd', { type: 'spell', domains: ['order'], might: 2 });
    const unitNoMight = row('RAD-901/167', 'Odder', { type: 'unit', domains: ['order'] });
    for (const r of [armorer, spellWithMight, unitNoMight]) {
      const card = toCard([r], [], [], ctx);
      expect(card.type).toBeNull();
      expect(card.dataIncomplete).toBe(true);
    }
  });

  it('a reviewed override supplies the missing type and domain', () => {
    const override: CardOverride = { name: 'Antagonistic Apparatus', code: 'RAD-009', type: 'unit', domains: ['fury'], reason: 'r', source: 's' };
    const card = toCard([row('RAD-009/167', 'Antagonistic Apparatus', { type: null, domains: [], energy: 6, might: 3 })], [], [override], ctx);
    expect(card.type).toBe('unit');
    expect(card.domains).toEqual(['fury']);
    expect(card.dataIncomplete).toBe(false);
  });

  it('colorless gives noDomain', () => {
    const tree = toCard([row('OGN-292/298', 'The Dreaming Tree', { type: 'battlefield', domains: ['colorless'], text: '<p>x</p>' })], [], [], ctx);
    expect(tree.noDomain).toBe(true);
    expect(tree.domains).toEqual([]);
    expect(tree.dataIncomplete).toBe(false);
  });

  it('flags a card whose domain breaks the collector-number order of its set', () => {
    const rows = [
      ...[1, 2, 3, 4, 5].map((n) => row(`RAD-00${n}/167`, `Fury ${n}`, { type: 'spell', domains: [n === 3 ? 'chaos' : 'fury'] })),
      ...[6, 7, 8, 9].map((n) => row(`RAD-00${n}/167`, `Calm ${n}`, { type: 'spell', domains: ['calm'] })),
      ...[10, 11, 12, 13].map((n) => row(`RAD-0${n}/167`, `Chaos ${n}`, { type: 'spell', domains: ['chaos'] })),
    ];
    const { cards, printings, warnings } = buildCards(rows, [], [], ctx);
    expect(cards.filter((c) => c.dataIncomplete).map((c) => c.name)).toEqual(['Fury 3']);
    expect(warnings.some((w) => w.includes('Fury 3') && w.includes('collector-number order'))).toBe(true);
    const fixed = buildCards(rows, [], [{ name: 'Fury 3', domains: ['fury'], reason: 'r', source: 's' }], ctx);
    expect(fixed.cards.filter((c) => c.dataIncomplete)).toEqual([]);
    expect(domainOrderBreaks(cards.map((c) => ({ ...c, dataIncomplete: false })), printings)).toHaveLength(1);
  });
});

describe('text', () => {
  it('errata text replaces the printed text and sets errata', () => {
    const card = toCard([draven], [dravenErrata], [], ctx);
    expect(card.errata).toBe(true);
    expect(card.text).toBe('When I win a combat, play a Gold gear token exhausted.\nWhen I attack or defend, you may pay [Fury] to give me +2 [Might] this turn.');
    expect(card.printedText).toContain('If you do, give me +2 [Might] this turn.');
    expect(toCard([draven], [], [], ctx).errata).toBe(false);
    expect(toCard([draven], [{ ...dravenErrata, status: 'superseded' }], [], ctx).errata).toBe(false);
  });

  it('appends the equipment effect text and keeps the Might bonus apart from Might', () => {
    const card = toCard([cape], [], [], ctx);
    expect(card.text.split('\n').at(-1)).toBe(`${EFFECT_PREFIX}When I attack or defend, deal 2 to all enemy units here.`);
    expect(card.mightBonus).toBe(3);
    expect(card.might).toBeNull();
    expect(card.dataIncomplete).toBe(false);
  });

  it('converts icons, entities and line breaks', () => {
    expect(richToPlain('<p>[Empower] :rb_energy_2::rb_rune_fury:<br />[Empowered][&gt;] I have +1 :rb_might:. :rb_exhaust:: Pay :rb_rune_rainbow:.</p>'))
      .toBe('[Empower] [2][Fury]\n[Empowered][>] I have +1 [Might]. [Exhaust]: Pay [Any].');
    expect(() => richToPlain('<p>:rb_unknown_icon:</p>')).toThrow(/Unknown icon/);
    expect(letterSymbolsToCanonical('Pay [C] and [A]: +2 [S]. [T]: x', ['calm', 'mind'])).toBe('Pay [C] and [Any]: +2 [Might]. [Exhaust]: x');
  });

  it('reads the keywords a card has from its own text', () => {
    expect(toCard([ekko], [], [], ctx).keywords).toEqual(['Accelerate', 'Deathknell']);
    expect(toCard([cape], [], [], ctx).keywords).toEqual(['Unique', 'Equip']);
    expect(ownKeywords('[Assault 2] [Tank]\n[Empowered][>] I have +1 [Might].\n[Exhaust]: Draw 1.')).toEqual(['Assault', 'Tank']);
    expect(ownKeywords('[Stun] an enemy unit. (It does not deal combat damage this turn.)\n[Legion] — Draw 1.')).toEqual(['Legion']);
    expect(letterSymbolsToCanonical('Attach it to a unit you control _(here)_.', [])).toBe('Attach it to a unit you control (here).');
  });
});

describe('copy limit', () => {
  it('Spiderling is unlimited from its text; Unique is 1; the default is 3', () => {
    expect(toCard([spiderling], [], [], ctx).copyLimit).toBe(Infinity);
    expect(toCard([cape], [], [], ctx).copyLimit).toBe(1);
    expect(toCard([ekko], [], [], ctx).copyLimit).toBe(3);
    expect(copyLimitFromText('Draw 1.', [])).toBeNull();
  });

  it('an override sets the limit when the text does not', () => {
    const plain = { ...spiderling, text: { richText: { body: '<p>[Hidden]</p>' } } };
    expect(toCard([plain], [], [{ name: 'Spiderling', copyLimit: 'unlimited', reason: 'r', source: 's' }], ctx).copyLimit).toBe(Infinity);
  });
});

describe('champion tags', () => {
  const karma = (code: string, tags: string[]) => row(code, 'Karma', { subtitle: 'Channeler', type: 'unit', superTypes: ['champion'], domains: ['order'], energy: 6, might: 6, tags, text: '<p>[Vision]</p>' });

  it('link legends and signature cards to the champion; tags are the union of all printings', () => {
    const { cards, warnings } = buildCards([wuju, yi, tibbers, annie, karma('OGN-235/298', ['Vi', 'Ionia']), karma('SFD-237/221', ['Karma'])], [], [], ctx);
    const by = (name: string) => cards.find((c) => c.name === name)!;
    expect(by('Wuju Bladesman').championTag).toBe('Master Yi');
    expect(by('Tibbers').championTag).toBe('Annie');
    expect(by('Master Yi, Meditative').championTag).toBe('Master Yi');
    expect(by('Karma, Channeler').tags).toEqual(['Vi', 'Ionia', 'Karma']);
    expect(warnings).toEqual([]);
  });

  it('report a champion unit whose tags lack its short name, and take the override', () => {
    const broken = buildCards([karma('OGN-235/298', ['Vi', 'Ionia'])], [], [], ctx);
    expect(broken.warnings.join('\n')).toMatch(/lack its short name "Karma"/);
    const fixed = buildCards([karma('OGN-235/298', ['Vi', 'Ionia'])], [], [{ name: 'Karma, Channeler', code: 'OGN-235', tags: ['Ionia', 'Karma'], championTag: 'Karma', reason: 'r', source: 's' }], ctx);
    expect(fixed.cards[0].tags).toEqual(['Ionia', 'Karma']);
    expect(fixed.warnings).toEqual([]);
  });
});
