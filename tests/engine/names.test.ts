import { describe, expect, it } from 'vitest';
import { codeKey, looksLikeCode, nameKey, rulesName, shortName, stripTokenSuffix } from '@/engine/rules/names';

describe('rulesName', () => {
  it('is "name, subtitle" for a champion unit only', () => {
    expect(rulesName({ name: 'Ekko', subtitle: 'Recurrent', type: 'unit', superTypes: ['champion'] })).toBe('Ekko, Recurrent');
    expect(rulesName({ name: 'Master Yi', subtitle: 'Honed', type: 'unit', superTypes: ['Champion'] })).toBe('Master Yi, Honed');
  });

  it('is the name alone for signature cards, starter legends and everything else', () => {
    expect(rulesName({ name: 'Tibbers', subtitle: 'Annie', type: 'unit', superTypes: ['signature'] })).toBe('Tibbers');
    expect(rulesName({ name: 'Bullet Time', subtitle: 'Miss Fortune', type: 'spell', superTypes: ['signature'] })).toBe('Bullet Time');
    expect(rulesName({ name: 'Wuju Bladesman', subtitle: 'Starter', type: 'legend', superTypes: ['champion'] })).toBe('Wuju Bladesman');
    expect(rulesName({ name: 'Loose Cannon', type: 'legend', superTypes: [] })).toBe('Loose Cannon');
    expect(rulesName({ name: 'Recruit (273) // Buff', type: 'unit', superTypes: ['token'] })).toBe('Recruit (273)');
  });
});

describe('name helpers', () => {
  it('shortName is the part before the comma for champion units', () => {
    expect(shortName('Ekko, Recurrent', true)).toBe('Ekko');
    expect(shortName("Kai'Sa, Survivor", true)).toBe("Kai'Sa");
    expect(shortName('Ready, Aim, Fire', false)).toBe('Ready, Aim, Fire');
  });

  it('nameKey ignores case, diacritics, apostrophes and punctuation', () => {
    const key = nameKey("Kai'Sa, Survivor");
    expect(nameKey('kai’sa, survivor')).toBe(key);
    expect(nameKey('KAISA  SURVIVOR')).toBe(key);
    expect(nameKey('Séance!')).toBe('seance');
    expect(nameKey("Reaver's Row")).toBe(nameKey('Reaver’s Row'));
  });

  it('codeKey and looksLikeCode handle every code shape', () => {
    expect(codeKey('OGN-043/298')).toBe('ogn-043');
    expect(codeKey(' OGN-304*/298 ')).toBe('ogn-304s');
    for (const code of ['OGN-043', 'ogn-043/298', 'OGN-066a', 'SFD-227s', 'VEN-SP3', 'UNL-T01', 'RAD-R01a', 'ogn-043-298', 'OGN-304*']) expect(looksLikeCode(code)).toBe(true);
    for (const name of ['Ekko, Recurrent', 'B.F. Sword', 'Mega-Mech', 'T-Hex']) expect(looksLikeCode(name)).toBe(false);
    expect(stripTokenSuffix('Recruit (NX)')).toBe('Recruit');
  });
});
