// Plan Task 5: roles, axes, computeFeatures and legend profiles on real fixture cards.
import { describe, expect, it } from 'vitest';
import { createCardDb } from '@/engine/carddb';
import { AXES, DEFAULT_AXIS_TAGS, ROLES, axesOf, axisTagsOf, computeFeatures, legendProfile, legendProfiles, rolesOf, speedOf } from '@/engine/features';
import { TRAIT_LABELS, deriveTraits, toScoreCard } from '@/engine/mine';
import { REGION_TAGS } from '@/engine/network';
import type { Role } from '@/engine/types';
import { ingestFeatures } from '../helpers/ingest-features';
import { networkCard as card, networkCards } from '../helpers/mine-cards';

const pool = networkCards();
const traits = (code: string): Set<string> => deriveTraits(toScoreCard(card(code)));
const roles = (code: string): Role[] => rolesOf(card(code), traits(code));

describe('traits the roles needed and the mine lacked', () => {
  it('sweeper: damage, kill or bounce over all units; not friendly-only, not the trash', () => {
    expect(traits('OGS-002').has('sweeper')).toBe(true);  // Firestorm: "Deal 3 to all enemy units at a battlefield."
    expect(traits('OGN-123').has('sweeper')).toBe(true);  // Unchecked Power: "... deal 12 to all units at battlefields."
    expect(traits('OGN-159').has('sweeper')).toBe(true);  // Warwick, Hunter: "kill all damaged enemy units here"
    expect(traits('UNL-132').has('sweeper')).toBe(true);  // Angler Beast: "return all units with 2 Might or less ..."
    expect(traits('UNL-148').has('sweeper')).toBe(false); // Cursed Sarcophagus: "banish all units from your trash"
    expect(traits('VEN-133').has('sweeper')).toBe(false); // Glowstone: "deal 5 to all units you control"
    expect(traits('OGN-227').has('sweeper')).toBe(false); // Symbol of the Solari: "recall all units at that battlefield instead"
    expect(traits('OGN-029').has('sweeper')).toBe(false); // Falling Star: "Deal 3 to a unit."
  });
  it('gear-removal: kills a gear that may be an enemy\'s', () => {
    expect(traits('OGN-224').has('gear-removal')).toBe(true);  // Salvage: "You may kill up to one gear."
    expect(traits('OGN-022').has('gear-removal')).toBe(true);  // Thermo Beam: "Kill all gear."
    expect(traits('OGN-056').has('gear-removal')).toBe(true);  // Adaptatron: "you may kill a gear"
    expect(traits('VEN-089').has('gear-removal')).toBe(false); // Wild Claw: "banish a unit or gear from among them and play it"
    expect(traits('OGN-113').has('gear-removal')).toBe(false); // Malzahar, Fanatic: "Kill a friendly unit or gear" (a cost)
  });
  it('point-gain: the card scores points for its controller', () => {
    expect(traits('OGN-066').has('point-gain')).toBe(true);  // Ahri, Alluring: "When I hold, you score 1 point."
    expect(traits('VEN-067').has('point-gain')).toBe(true);  // Bottled Constellation: "... to score 1 point."
    expect(traits('SFD-060').has('point-gain')).toBe(false); // Tianna Crownguard: "opponents can't gain points"
    expect(traits('OGN-064').has('point-gain')).toBe(false);
  });
});

describe('rolesOf', () => {
  // [code, name, roles the card must have, roles it must not have]
  const CARDS: [string, string, Role[], Role[]][] = [
    ['OGN-123', 'Unchecked Power', ['removal', 'sweeper'], ['unit-body']],
    ['OGS-002', 'Firestorm', ['removal', 'sweeper'], []],
    ['OGN-022', 'Thermo Beam', ['sweeper', 'hate'], []],
    ['OGN-064', 'Wind Wall', ['counter'], ['removal', 'combat-trick']],
    ['UNL-131', 'Abandon', ['counter'], ['removal']],
    ['RAD-041', 'Hush', ['counter'], []],
    ['OGN-043', 'Charm', ['mobility'], ['removal']],
    ['OGN-122', 'Time Warp', ['finisher'], []],
    ['OGN-212', 'Forge of the Future', ['token-maker', 'gear'], ['unit-body']],
    ['SFD-168', 'Vanguard Armory', ['token-maker', 'gear'], []],
    ['OGN-246', 'Viktor, Leader', ['unit-body', 'token-maker'], []],
    ['OGN-184', 'The Syren', ['mobility', 'gear'], []],
    ['OGN-162', 'Miss Fortune, Captain', ['unit-body', 'mobility'], ['finisher']],
    ['OGN-110', 'Ekko, Recurrent', ['unit-body', 'rune-ramp'], []],
    ['OGN-073', 'Sona, Harmonious', ['unit-body', 'rune-ramp'], []],
    ['OGN-104', 'Retreat', ['rune-ramp'], []],
    ['OGN-095', 'Stupefy', ['combat-trick', 'card-flow'], ['counter']],
    ['OGN-046', 'En Garde', ['combat-trick'], ['removal']],
    ['OGN-056', 'Adaptatron', ['unit-body', 'buff-source', 'hate'], []],
    ['OGN-224', 'Salvage', ['hate', 'card-flow'], []],
    ['SFD-148', 'Draven, Audacious', ['unit-body', 'finisher', 'point-source'], []],
    ['OGN-066', 'Ahri, Alluring', ['unit-body', 'point-source'], []],
    ['VEN-067', 'Bottled Constellation', ['point-source', 'gear'], []],
    ['SFD-009', 'Serrated Dirk', ['gear'], ['removal', 'unit-body', 'protection']],
    ['SFD-064', 'Cloth Armor', ['gear', 'protection'], []],
    ['OGN-145', 'Unyielding Spirit', ['protection'], []],
    ['OGN-026', 'Brynhir Thundersong', ['unit-body', 'disruption'], []],
    ['RAD-028', 'Ki Burst', ['disruption'], []],
    ['UNL-196', 'Daisy!', ['unit-body', 'disruption', 'finisher'], []],
    ['OGN-008', 'Get Excited!', ['removal'], ['sweeper']],
    ['OGN-248', 'Icathian Rain', ['removal'], ['sweeper']],
    ['OGN-029', 'Falling Star', ['removal'], ['sweeper', 'hate']],
    ['VEN-049', 'Dredge Up', ['card-flow', 'recursion'], []],
    ['UNL-088', 'Gutter Palace', ['token-maker', 'gear'], ['protection']],
  ];
  it.each(CARDS)('%s %s', (code, name, must, mustNot) => {
    expect(card(code).name).toBe(name);
    const got = roles(code);
    for (const r of must) expect(got, `${name}: ${got.join(', ')}`).toContain(r);
    for (const r of mustNot) expect(got, `${name}: ${got.join(', ')}`).not.toContain(r);
  });
  it('covers at least 30 named cards and every role of the contract', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(30);
    const seen = new Set(CARDS.flatMap(([, , must]) => must));
    for (const role of ROLES) expect(seen.has(role), role).toBe(true);
  });
  it('gives exact, ordered lists and no role to a legend, battlefield or typeless row', () => {
    expect(roles('OGN-064')).toEqual(['counter']);
    expect(roles('SFD-009')).toEqual(['gear']);
    expect(roles('SFD-148')).toEqual(['unit-body', 'finisher', 'point-source']);
    expect(roles('SFD-183')).toEqual([]); // Purifier (legend)
    expect(roles('OGN-286')).toEqual([]); // Reckoner's Arena (battlefield)
    expect(rolesOf({ ...card('OGN-064'), type: null }, traits('OGN-064'))).toEqual([]);
    expect(rolesOf(card('OGN-064'), [])).toEqual([]);
  });
});

describe('axesOf', () => {
  it('reads enabler and payoff sides from traits', () => {
    const axes = (code: string) => axesOf(card(code), traits(code));
    expect(axes('OGN-136').buffs).toEqual({ e: 1, p: 0 });           // Pit Rookie: "buff another friendly unit"
    expect(axes('RAD-043').buffs.p).toBe(1);                        // Riven, Broken Blade: "Spend my buff"
    expect(axes('OGN-261').stun.p).toBe(1);                          // Radiant Dawn: "When you stun one or more enemy units"
    expect(axes('RAD-028').stun.e).toBe(1);                          // Ki Burst: "Stun a unit."
    expect(axes('OGN-212').tokens).toEqual({ e: 1, p: 0 });          // Forge of the Future
    expect(axes('SFD-148').points).toEqual({ e: 1, p: 0 });          // Draven, Audacious
    expect(axes('OGN-162').movement).toEqual({ e: 1, p: 1 });        // Miss Fortune, Captain: Ganking and "The first time I move"
  });
  it('marks structural enablers weaker than text ones, and only in [0,1]', () => {
    expect(axesOf(card('OGN-064'), traits('OGN-064')).spells).toEqual({ e: 0.5, p: 0 }); // any spell
    expect(axesOf(card('SFD-009'), traits('SFD-009')).gear).toEqual({ e: 0.5, p: 0 });   // any gear
    expect(axesOf(card('OGN-162'), traits('OGN-162')).mighty.e).toBe(0.6);               // 5 Might body
    for (const c of pool) for (const v of Object.values(axesOf(c, deriveTraits(toScoreCard(c))))) {
      expect(v.e >= 0 && v.e <= 1 && v.p >= 0 && v.p <= 1 && v.e + v.p > 0).toBe(true);
    }
  });
  it('builds tag axes from tags and from text that names the tag, but not from "non-<Tag>"', () => {
    expect(axesOf(card('VEN-064'), traits('VEN-064'))['tag:Mech']).toEqual({ e: 1, p: 0 }); // Plaza Guardian is a Mech
    expect(axesOf(card('SFD-026'), traits('SFD-026'))['tag:Mech'].p).toBe(1);               // Rumble, Hotheaded: "Your Mechs each have [Assault]"
    expect(axesOf(card('VEN-115'), traits('VEN-115'))['tag:Dragon']).toEqual({ e: 1, p: 0 }); // Ocean Drake: "non-Dragon unit"
    const tags = axisTagsOf(pool);
    expect(tags).toContain('Mech');
    for (const tag of tags) expect(REGION_TAGS.has(tag)).toBe(false);
    expect(tags).not.toContain('Teemo');
    expect(DEFAULT_AXIS_TAGS).not.toContain('Equipment');
  });
  it('has unique axis ids and only known trait names', () => {
    expect(new Set(AXES.map((a) => a.id)).size).toBe(AXES.length);
    const known = new Set<string>(Object.keys(TRAIT_LABELS));
    const unused = AXES.flatMap((a) => [...a.enablers, ...a.payoffs]).filter((t) => !known.has(t));
    expect(unused).toEqual([]);
  });
});

describe('computeFeatures', () => {
  it('fills the whole CardFeatures contract for a real card', () => {
    const f = computeFeatures(card('OGN-095')); // Stupefy
    expect(f).toMatchObject({ id: card('OGN-095').id, speed: 'reaction', costBucket: 1, roles: ['combat-trick', 'card-flow'] });
    expect(f.traits).toContain('draw');
    expect(f.baseRating).toBeGreaterThan(0);
    expect(f.grade).not.toBe('');
    expect(f.axes.shrink).toEqual({ e: 1, p: 0 });
    expect(speedOf(card('OGN-029'))).toBe('normal');
  });
  it('honours a reviewed mine override and never throws on an incomplete row', () => {
    const f = computeFeatures(card('OGN-095'), { removeTraits: ['draw'], reason: 'test' });
    expect(f.roles).not.toContain('card-flow');
    const broken = computeFeatures({ ...card('OGN-095'), type: null, energy: null, text: '' });
    expect(broken).toMatchObject({ roles: [], baseRating: 0, grade: '', costBucket: 0 });
    expect(computeFeatures({ ...card('OGN-248'), energy: 12 }).costBucket).toBe(7);
  });
  it('the sync step computes the same rows for the pool', () => {
    const rows = ingestFeatures(pool);
    expect(rows).toHaveLength(pool.length);
    const tags = axisTagsOf(pool);
    expect(rows.find((r) => r.id === card('SFD-026').id)).toEqual(computeFeatures(card('SFD-026'), undefined, tags));
  });
});

describe('legendProfile', () => {
  const features = ingestFeatures(pool);
  const db = createCardDb(pool, features);
  const profiles = legendProfiles(db);

  it('gives each of the 58 legends a champion tag, at least one eligible champion and at least one axis', () => {
    expect(profiles).toHaveLength(58);
    for (const p of profiles) {
      const legend = db.get(p.legendId)!;
      expect(p.championTag, legend.name).toBeTruthy();
      expect(p.champions.length, legend.name).toBeGreaterThanOrEqual(1);
      expect(Object.keys(p.axisWeights).length, legend.name).toBeGreaterThanOrEqual(1);
      expect(p.domains).toEqual(legend.domains);
      for (const id of p.champions) {
        const champion = db.get(id)!;
        expect(champion.superTypes).toContain('champion');
        expect(champion.domains.every((d) => legend.domains.includes(d))).toBe(true);
      }
      for (const id of p.signatures) expect(db.get(id)!.superTypes).toContain('signature');
      for (const w of Object.values(p.axisWeights)) expect(w > 0 && w <= 1).toBe(true);
      expect(p.battlefieldFit.length).toBeLessThanOrEqual(8);
      for (const fit of p.battlefieldFit) {
        expect(db.get(fit.id)!.type).toBe('battlefield');
        expect(fit.reason).toContain(legend.name);
        expect(fit.reason).toContain(db.get(fit.id)!.name);
      }
    }
  });
  it('reads a legend\'s own text: Radiant Dawn rewards Stun, Purifier rewards Equipment', () => {
    const dawn = legendProfile(card('OGN-261'), db); // "When you stun one or more enemy units, buff a friendly unit"
    expect(dawn.championTag).toBe('Leona');
    expect(dawn.axisWeights.stun).toBe(1);
    expect(dawn.axisWeights.buffs).toBeGreaterThanOrEqual(0.6);
    const purifier = legendProfile(card('SFD-183'), db); // "Your Equipment each give [Assault]"
    expect(purifier.championTag).toBe('Lucian');
    expect(purifier.axisWeights.equipment).toBe(1);
    // A weight that only the champions carry stays at or below 0.5 (legend-profiles.md 4.3).
    for (const p of profiles) {
      const own = axesOf(db.get(p.legendId)!, db.features(p.legendId)!.traits, axisTagsOf(pool));
      for (const [axis, w] of Object.entries(p.axisWeights)) if (!own[axis]) expect(w).toBeLessThanOrEqual(0.5);
    }
  });
  it('returns an empty, harmless profile for a card that is not a legend', () => {
    expect(legendProfile(card('OGN-064'), db)).toEqual({ legendId: card('OGN-064').id, championTag: '', domains: ['calm'], champions: [], signatures: [], axisWeights: {}, battlefieldFit: [] });
    expect(legendProfile(card('SFD-183'), createCardDb([card('SFD-183')])).champions).toEqual([]);
  });
});
