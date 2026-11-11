// `legality` step: loads the reviewed sync-data/legality.json, checks every ban against the synced cards,
// and warns when the official Rules Hub shows a newer "last updated" date than the file knows.
import { loadCardDb } from '@/server/carddb';
import { writeSyncData, writeSyncState, type Db } from '@/server/db';
import { readLegalityFile, type LegalityFile } from '@/server/syncdata';
import type { Log } from './cards';
import { getText, type HttpOptions } from './http';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Every "Last updated: Month D, YYYY" date on the Rules Hub page, as ISO dates, newest first. */
export function hubDates(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\\u003c[^\\]*\\u003e/g, ' ');
  const out = new Set<string>();
  for (const m of text.matchAll(/last updated:?\s*([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/gi)) {
    const month = MONTHS.indexOf(m[1].toLowerCase());
    if (month >= 0) out.add(`${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`);
  }
  return [...out].sort().reverse();
}

export function validateLegality(file: LegalityFile): string[] {
  const problems: string[] = [];
  if (!file.sets.length) problems.push('no sets');
  if (!Number.isInteger(file.sideboardMax) || file.sideboardMax < 0) problems.push('sideboardMax missing');
  for (const b of file.bans) {
    if (!b.name || !b.code || !b.zone || !b.formats?.length) problems.push(`ban "${b.name}" is missing a field`);
    if (!/^https:\/\//.test(b.sourceUrl ?? '')) problems.push(`ban "${b.name}" has no source URL`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.effectiveFrom ?? '')) problems.push(`ban "${b.name}" has no effective date`);
  }
  return problems;
}

export interface LegalityInfo { sets: number; bans: number; asOf: string; hubChecked: boolean; hubNewest: string | null; stale: boolean; mismatches: string[] }

export async function syncLegality(db: Db, log: Log, opts: { syncDataDir?: string; http?: HttpOptions; skipHub?: boolean } = {}): Promise<LegalityInfo> {
  const file = readLegalityFile(opts.syncDataDir);
  const problems = validateLegality(file);
  if (problems.length) throw new Error(`sync-data/legality.json is invalid:\n${problems.join('\n')}`);

  // An id drift must fail loudly: the card a ban names must exist under the code the file records
  // (legality-and-data.md §7.1). Skipped when cards are not synced yet.
  const mismatches: string[] = [];
  const cards = loadCardDb(db);
  if (cards.all().length > 0) {
    for (const b of file.bans) {
      const byName = cards.byName(b.name);
      const byCode = cards.byName(b.code);
      if (!byName) mismatches.push(`ban "${b.name}" matches no card name`);
      else if (!byCode || byCode.id !== byName.id) mismatches.push(`ban "${b.name}" is ${byName.code} in the cards, the file says ${b.code}`);
    }
    if (mismatches.length) throw new Error(`sync-data/legality.json does not match the synced cards:\n${mismatches.join('\n')}`);
  }
  writeSyncData(db, 'legality', file);

  let hubNewest: string | null = null;
  let hubChecked = false;
  if (!opts.skipHub) {
    try {
      const html = await getText(file.hub.url, { minGapMs: 1000, maxAttempts: 2, ...opts.http });
      hubNewest = html ? hubDates(html)[0] ?? null : null;
      hubChecked = hubNewest !== null;
      if (!hubChecked) log('legality warning: no "last updated" date found on the Rules Hub; check the page by hand');
    } catch (err) {
      log(`legality warning: Rules Hub unreachable (${err instanceof Error ? err.message : String(err)}); staleness not checked`);
    }
  }
  const known = [file.hub.banListUpdated, file.hub.rulesUpdated].sort().reverse()[0];
  const stale = hubNewest !== null && hubNewest > known;
  if (stale) log(`legality warning: the Rules Hub was updated ${hubNewest}, sync-data/legality.json knows ${known}. Review the ban list and rules.`);

  const info: LegalityInfo = { sets: file.sets.length, bans: file.bans.length, asOf: file.asOf, hubChecked, hubNewest, stale, mismatches };
  writeSyncState(db, 'legality', { ...info });
  log(`legality ${file.bans.length}/${file.bans.length} bans, ${file.sets.length} sets, as of ${file.asOf}${hubChecked ? `, hub newest ${hubNewest}` : ''}`);
  return info;
}
