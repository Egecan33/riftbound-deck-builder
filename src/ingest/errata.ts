// `errata` step: loads the reviewed sync-data/errata.json and re-applies it to the cards.
// The gallery shows pre-errata text for most errata'd cards (rulings-and-errata.md §1), so the overlay
// decides Card.text. No network: the file is a reviewed snapshot.
import { existsSync } from 'node:fs';
import { writeSyncData, writeSyncState, type Db } from '@/server/db';
import { readErrataFile, readOverridesFile } from '@/server/syncdata';
import { RAW_GALLERY_FILE, rebuildCards, type Log } from './cards';

export function validateErrata(file: ReturnType<typeof readErrataFile>): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const sources = new Set(file.sources.map((s) => s.key));
  for (const e of file.errata) {
    if (seen.has(e.id)) problems.push(`duplicate errata id ${e.id}`);
    seen.add(e.id);
    if (!e.cardName || !e.currentText.trim()) problems.push(`errata ${e.id} has no card name or text`);
    if (!sources.has(e.source)) problems.push(`errata ${e.id} cites unknown source ${e.source}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.effective)) problems.push(`errata ${e.id} has a bad effective date`);
  }
  return problems;
}

export function syncErrata(db: Db, log: Log, opts: { rawFile?: string; syncDataDir?: string } = {}): { entries: number; applied: number } {
  const file = readErrataFile(opts.syncDataDir);
  const problems = validateErrata(file);
  if (problems.length) throw new Error(`sync-data/errata.json is invalid:\n${problems.join('\n')}`);
  writeSyncData(db, 'errata', file);
  writeSyncData(db, 'overrides', readOverridesFile(opts.syncDataDir));

  let applied = 0;
  if (existsSync(opts.rawFile ?? RAW_GALLERY_FILE)) {
    applied = rebuildCards(db, log, { rawFile: opts.rawFile, syncDataDir: opts.syncDataDir }).errata;
  } else {
    log('errata loaded; cards are not synced yet, so nothing to apply (run `pnpm sync cards`)');
  }
  const live = file.errata.filter((e) => e.status !== 'superseded').length;
  writeSyncState(db, 'errata', { entries: file.errata.length, applied, snapshotDate: file.snapshotDate, faqOnly: file.errata.filter((e) => e.status === 'faq-only').length });
  log(`errata ${applied}/${live} entries applied (snapshot ${file.snapshotDate})`);
  return { entries: file.errata.length, applied };
}
