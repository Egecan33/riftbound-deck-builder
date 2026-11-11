// The reviewed snapshots under sync-data/: ban list and set legality, errata, per-card overrides.
// These are data, never code (AGENTS.md hard rule 2). The sync steps load them into the `sync_data` table.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CardType, Domain, Format, LegalityData, Zone } from '@/engine/types';

export const SYNC_DATA_DIR = process.env.RIFTBOUND_FORGE_SYNC_DATA ?? path.join(/* turbopackIgnore: true */ process.cwd(), 'sync-data');

export interface LegalitySet { code: string; name: string; legalFrom: string | null; collectorNumberMax?: number; confirmed?: boolean; rule?: string; note?: string }
export interface LegalityBan { name: string; zone: Zone; code: string; formats: Format[]; effectiveFrom: string; sourceUrl: string; listedAs?: string }
export interface LegalityFile {
  schemaVersion: number;
  asOf: string;
  hub: { url: string; banListUpdated: string; rulesUpdated: string };
  sets: LegalitySet[];
  sideboardMax: number;
  ffa: { useStandardBans: boolean; heuristic: boolean; note: string };
  bans: LegalityBan[];
}

export interface ErrataEntry {
  id: string;
  cardName: string;
  codes: string[];            // card codes of the printings the errata applies to, e.g. ["SFD-020"]
  printedText: string;
  currentText: string;
  effective: string;
  source: string;
  status: 'official' | 'faq-only' | 'superseded';
}
export interface ErrataFile { schemaVersion: number; snapshotDate: string; sources: { key: string; url: string; published: string }[]; errata: ErrataEntry[] }

export interface CardOverride {
  name: string;               // rules name the override applies to
  code?: string;              // first printing; checked against the synced card
  type?: CardType;
  domains?: Domain[];
  noDomain?: boolean;
  tags?: string[];
  championTag?: string;
  copyLimit?: number | 'unlimited';
  reason: string;
  source: string;
}
export interface OverridesFile {
  schemaVersion: number;
  asOf: string;
  cards: CardOverride[];
  aliases: { alias: string; name: string; reason: string }[];
}

const readJson = <T>(file: string, dir: string): T => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as T;

export const readLegalityFile = (dir: string = SYNC_DATA_DIR): LegalityFile => readJson('legality.json', dir);
export const readErrataFile = (dir: string = SYNC_DATA_DIR): ErrataFile => readJson('errata.json', dir);
export const readOverridesFile = (dir: string = SYNC_DATA_DIR): OverridesFile => readJson('card-overrides.json', dir);

const STANDARD: readonly Format[] = ['standard-bo1', 'standard-bo3'];
const FFA: readonly Format[] = ['ffa3', 'ffa4'];

/**
 * The engine's view of the legality file. No official free-for-all ban list exists; when the file's
 * `ffa.useStandardBans` is on (or the caller forces it), every Standard ban also applies to ffa3 and ffa4.
 * That is a heuristic (rules.md §9) and the caller may switch it off.
 */
export function toLegalityData(file: LegalityFile, opts: { ffaUsesStandardBans?: boolean } = {}): LegalityData {
  const ffa = opts.ffaUsesStandardBans ?? file.ffa.useStandardBans;
  return {
    asOf: file.asOf,
    sets: file.sets.map((s) => ({ code: s.code, name: s.name, legalFrom: s.legalFrom })),
    bans: file.bans.map((b) => {
      const formats = [...b.formats];
      if (ffa && STANDARD.some((f) => formats.includes(f))) for (const f of FFA) if (!formats.includes(f)) formats.push(f);
      return { name: b.name, zone: b.zone, formats, effectiveFrom: b.effectiveFrom, sourceUrl: b.sourceUrl };
    }),
    sideboardMax: file.sideboardMax,
  };
}

/** Sets in release order (ties by code): the order used to pick a card's first printing. */
export const setOrderOf = (file: LegalityFile): string[] =>
  [...file.sets]
    .sort((a, b) => (a.legalFrom ?? '9999').localeCompare(b.legalFrom ?? '9999') || a.code.localeCompare(b.code))
    .map((s) => s.code);
