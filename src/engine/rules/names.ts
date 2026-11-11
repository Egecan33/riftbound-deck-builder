// Card-name rules. Copy limits, bans and imports all key on the rules name (CR 103.3.b, 132.4;
// docs/research/rules.md §11, legality-and-data.md §7.1). Pure: no Node, no I/O.

/** The fields of a source row that decide its rules name. */
export interface NameRow {
  name: string;
  subtitle?: string | null;
  type?: string | null;
  superTypes?: readonly string[];
}

const isChampionUnit = (row: NameRow): boolean =>
  row.type === 'unit' && (row.superTypes ?? []).some((s) => s.toLowerCase() === 'champion');

/**
 * Rules name of a gallery row. The gallery splits `name` and `subtitle`:
 * - champion units: "Ekko" + "Recurrent" -> "Ekko, Recurrent" (CR 132.4);
 * - signature cards: the subtitle is the owning champion ("Tibbers" + "Annie") -> "Tibbers";
 * - starter legends: the subtitle is "Starter" -> "Wuju Bladesman".
 */
export function rulesName(row: NameRow): string {
  const name = row.name.replace(/\s*\/\/.*$/, '').trim();
  const subtitle = (row.subtitle ?? '').trim();
  return isChampionUnit(row) && subtitle ? `${name}, ${subtitle}` : name;
}

/** Short name: the part before the comma for a champion unit, the whole name otherwise. */
export function shortName(name: string, championUnit: boolean): string {
  if (!championUnit) return name;
  const i = name.indexOf(', ');
  return i === -1 ? name : name.slice(0, i);
}

/**
 * Lookup key for a name: case, diacritics, apostrophes (straight or curly) and punctuation do not matter.
 * "Kai’Sa, Survivor" and "kaisa survivor" give the same key.
 */
export function nameKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘ʼ`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Token rows carry a region in brackets ("Recruit (NX)"); it is not part of the name. */
export function stripTokenSuffix(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Lookup key for a card code or id: "OGN-043/298", "ogn-043", "OGN-304*" and "ogn-304s-298" style
 * input all reduce to a lower-case form without the "/total" part and with "*" written as "s".
 */
export function codeKey(code: string): string {
  return code.trim().toLowerCase().replace(/\/\d+$/, '').replace(/\*/g, 's');
}

/** True when the text looks like a card code or id rather than a name. */
export function looksLikeCode(text: string): boolean {
  return /^[a-z]{2,4}-(?:sp|t|r)?\d+[abs*]?(?:[/-]\d+)?$/i.test(text.trim());
}
