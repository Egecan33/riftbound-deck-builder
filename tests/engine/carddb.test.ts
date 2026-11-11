import { describe, expect, it } from 'vitest';
import { createCardDb, reviveCard, serializeCard } from '@/engine/carddb';
import type { Card, CardEdge, LegalityData } from '@/engine/types';
import { fixtureCards, fixtureDb } from '../helpers/fixture-db';

const card = (over: Partial<Card> & Pick<Card, 'id' | 'code' | 'name'>): Card => ({
  shortName: over.name, set: over.code.split('-')[0], sets: [over.code.split('-')[0]], type: 'unit', superTypes: [], domains: ['fury'], noDomain: false,
  tags: [], championTag: null, energy: 2, power: null, powerDomains: [], might: 2, mightBonus: null, printedText: '', text: '', errata: false,
  keywords: [], copyLimit: 3, imageUrl: '', dataIncomplete: false, ...over,
});

const kaisa = card({ id: 'ogn-039-298', code: 'OGN-039', name: "Kai'Sa, Survivor", shortName: "Kai'Sa", superTypes: ['champion'], championTag: "Kai'Sa" });
const wuju = card({ id: 'ogs-019-024', code: 'OGS-019', name: 'Wuju Bladesman', type: 'legend', superTypes: ['champion'], championTag: 'Master Yi', domains: ['calm', 'body'] });
const spiderling = card({ id: 'ven-097-166', code: 'VEN-097', name: 'Spiderling', copyLimit: Infinity });
const goldToken = card({ id: 'sfd-t03', code: 'SFD-T03', name: 'Gold', type: 'gear', superTypes: ['token'], noDomain: true, domains: [] });
const goldCard = card({ id: 'unl-150-219', code: 'UNL-150', name: 'Gold', type: 'spell' });
const cards = [kaisa, wuju, spiderling, goldToken, goldCard];

describe('createCardDb', () => {
  const edge: CardEdge = { a: kaisa.id, b: spiderling.id, synergy: 2, antisynergy: 0, net: 2, reasons: [] };
  const legality: LegalityData = { asOf: '2026-11-11', sets: [], bans: [], sideboardMax: 10 };
  const db = createCardDb(cards, [], [edge], [], [], legality, { 'OGN-039a': kaisa.id, 'RAD-173': wuju.id, 'rad-173-167': wuju.id, 'Yi Legend': wuju.id, 'XXX-001': 'missing' });

  it('byName accepts the rules name in any case and with curly apostrophes', () => {
    expect(db.byName("Kai'Sa, Survivor")?.id).toBe(kaisa.id);
    expect(db.byName('kai’sa, survivor')?.id).toBe(kaisa.id);
    expect(db.byName('  KAISA SURVIVOR ')?.id).toBe(kaisa.id);
    expect(db.byName('Nobody')).toBeUndefined();
    expect(db.byName('')).toBeUndefined();
  });

  it('byName accepts a code, a gameplay id and a printing alias', () => {
    expect(db.byName('OGN-039')?.id).toBe(kaisa.id);
    expect(db.byName('ogn-039/298')?.id).toBe(kaisa.id);
    expect(db.byName('ogn-039-298')?.id).toBe(kaisa.id);
    expect(db.byName('OGN-039-298')?.id).toBe(kaisa.id);
    expect(db.byName('OGN-039a')?.id).toBe(kaisa.id);
    expect(db.byName('RAD-173')?.id).toBe(wuju.id);
    expect(db.byName('rad-173-167')?.id).toBe(wuju.id);
    expect(db.byName('yi legend')?.id).toBe(wuju.id);
    expect(db.byName('XXX-001')).toBeUndefined();
    expect(db.byName('OGN-039*')?.id).toBe(kaisa.id); // a variant printing nobody listed is the card of its base number
    expect(db.byName('OGN-039b/298')?.id).toBe(kaisa.id);
  });

  it('byName accepts a legend written as "champion, name"', () => {
    expect(db.byName('Master Yi, Wuju Bladesman')?.id).toBe(wuju.id);
  });

  it('all() leaves tokens out and a real card wins a name shared with a token', () => {
    expect(db.all().map((c) => c.id)).not.toContain(goldToken.id);
    expect(db.get(goldToken.id)?.name).toBe('Gold');
    expect(db.byName('Gold')?.id).toBe(goldCard.id);
  });

  it('serves edges in both directions and the legality it was given', () => {
    expect(db.edge(spiderling.id, kaisa.id)).toBe(edge);
    expect(db.edges(kaisa.id)).toEqual([edge]);
    expect(db.edges(wuju.id)).toEqual([]);
    expect(db.legality().sideboardMax).toBe(10);
    expect(db.features(kaisa.id)).toBeUndefined();
    expect(db.legendMeta(wuju.id)).toBeUndefined();
  });

  it('an unlimited copy limit survives JSON', () => {
    const stored = JSON.parse(JSON.stringify(serializeCard(spiderling)));
    expect(stored.copyLimit).toBeNull();
    expect(reviveCard(stored).copyLimit).toBe(Infinity);
    expect(reviveCard(JSON.parse(JSON.stringify(serializeCard(kaisa)))).copyLimit).toBe(3);
  });
});

describe('fixture database', () => {
  const db = fixtureDb();

  it('holds the cards the rules need', () => {
    const all = db.all();
    expect(all.filter((c) => c.type === 'legend')).toHaveLength(58);
    expect(all.filter((c) => c.type === 'rune')).toHaveLength(6);
    expect(all.filter((c) => c.type === 'unit' && c.superTypes.includes('champion')).length).toBeGreaterThanOrEqual(177);
    expect(all.filter((c) => c.set === 'RAD' && c.type !== 'legend' && c.type !== 'battlefield').length).toBeGreaterThanOrEqual(40);
    expect(fixtureCards().length).toBeGreaterThan(450);
  });

  it('resolves names the way the rules write them', () => {
    expect(db.byName('Ekko, Recurrent')?.code).toBe('OGN-110');
    expect(db.byName('Tibbers')?.championTag).toBe('Annie');
    expect(db.byName('Master Yi, Wuju Bladesman')?.code).toBe('OGS-019');
    expect(db.byName('Yi, Meditative')?.name).toBe('Master Yi, Meditative');
    expect(db.byName('Dreaming Tree')?.name).toBe('The Dreaming Tree');
    expect(db.byName('Spiderling')?.copyLimit).toBe(Infinity);
    expect(db.byName('Forgefire Cape')?.copyLimit).toBe(1);
    expect(db.byName('Karma, Channeler')?.tags).not.toContain('Vi');
  });

  it('every ban names a card in the fixture, under the code the legality file records', () => {
    const bans = db.legality().bans;
    expect(bans.filter((b) => b.formats.includes('standard-bo3'))).toHaveLength(12);
    expect(bans.filter((b) => b.formats.includes('2v2'))).toHaveLength(13);
    expect(db.legality().sideboardMax).toBe(10);
    expect(db.legality().sets).toHaveLength(6);
    for (const ban of bans) expect(db.byName(ban.name), ban.name).toBeDefined();
  });

  it('every legend has exactly one champion tag that some champion unit carries', () => {
    const champions = new Set(db.all().filter((c) => c.type === 'unit' && c.superTypes.includes('champion')).map((c) => c.championTag));
    for (const legend of db.all().filter((c) => c.type === 'legend')) expect(champions.has(legend.championTag), legend.name).toBe(true);
  });

  it('has meta for the fixture legends and every reference deck resolves', () => {
    const { metaLegends, decks } = fixtureDb.extras();
    expect(metaLegends).toHaveLength(6);
    for (const id of metaLegends) {
      const meta = db.legendMeta(id);
      expect(meta, id).toBeDefined();
      expect(Object.keys(meta!.main).length).toBeGreaterThan(10);
      for (const cardId of Object.keys(meta!.main)) expect(db.get(cardId), `${id} ${cardId}`).toBeDefined();
    }
    expect(decks).toHaveLength(6);
    for (const deck of decks) {
      expect(deck.unresolved, deck.file).toEqual([]);
      expect(db.get(deck.legend)?.type, deck.file).toBe('legend');
      expect(deck.mainCount, deck.file).toBe(40);
      expect(deck.runeCount, deck.file).toBe(12);
      expect(deck.battlefields, deck.file).toHaveLength(3);
      expect(deck.sideCount, deck.file).toBeLessThanOrEqual(10);
    }
  });
});
