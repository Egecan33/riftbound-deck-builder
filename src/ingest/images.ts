// `images` step: one WebP per gameplay card from the Riot CDN (Sanity `fm=webp`, native 744 px wide;
// legality-and-data.md §6) into data/images/{cardId}.webp. Resumable: existing files are skipped,
// downloads go to `.part` first, failures are reported and do not stop the run.
import { existsSync, statSync } from 'node:fs';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Card } from '@/engine/types';
import { loadCards } from '@/server/carddb';
import { IMAGE_DIR, writeSyncState, type Db } from '@/server/db';
import type { Log } from './cards';
import { downloadToFile, sleep, type HttpOptions } from './http';

export const imagePath = (cardId: string, dir: string = IMAGE_DIR): string => path.join(dir, `${cardId}.webp`);

export function webpUrl(imageUrl: string): string {
  const url = new URL(imageUrl);
  url.searchParams.set('fm', 'webp');
  url.searchParams.set('q', '85');
  return url.href;
}

/** True when the file starts with a RIFF....WEBP container header. */
export async function isWebp(file: string): Promise<boolean> {
  const fh = await open(file, 'r');
  try {
    const head = Buffer.alloc(12);
    const { bytesRead } = await fh.read(head, 0, 12, 0);
    return bytesRead === 12 && head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'WEBP';
  } finally {
    await fh.close();
  }
}

const present = (file: string): boolean => existsSync(file) && statSync(file).size > 0;

/** Download order: what a deck always shows first (legends, battlefields, runes), then the rest; tokens last. */
function order(card: Card): number {
  if (card.superTypes.includes('token')) return 9;
  return card.type === 'legend' ? 0 : card.type === 'battlefield' ? 1 : card.type === 'rune' ? 2 : 3;
}

export interface ImageOptions { limit?: number; concurrency?: number; dir?: string; http?: Pick<HttpOptions, 'fetchImpl' | 'timeoutMs'> }
export interface ImageInfo { cards: number; present: number; downloaded: number; skipped: number; failed: number; limit: number | null }

/** `limit` caps the number of cards considered in this run (present or not), in download order. */
export async function syncImages(db: Db, log: Log, opts: ImageOptions = {}): Promise<ImageInfo & { failures: string[] }> {
  const dir = opts.dir ?? IMAGE_DIR;
  const concurrency = opts.concurrency ?? 6;
  await mkdir(dir, { recursive: true });

  const all = loadCards(db).sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id));
  const cards = opts.limit === undefined ? all : all.slice(0, opts.limit);
  const total = cards.length;
  const failures: string[] = [];
  let done = 0;
  let downloaded = 0;
  let skipped = 0;
  const tick = () => {
    if (++done % 100 === 0 || done === total) log(`images ${done}/${total}`);
  };

  const fetchOne = async (card: Card) => {
    const dest = imagePath(card.id, dir);
    if (present(dest)) { skipped++; tick(); return; }
    const tmp = `${dest}.tmp`;
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await downloadToFile(webpUrl(card.imageUrl), tmp, opts.http); // writes tmp.part, then tmp
        if (!(await isWebp(tmp))) throw new Error('not a WebP file');
        await rename(tmp, dest);
        downloaded++;
        tick();
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        await rm(tmp, { force: true });
        await rm(`${tmp}.part`, { force: true });
        if (attempt < 3) await sleep(1000 * attempt);
      }
    }
    failures.push(`${card.code} ${card.name}: ${lastError}`);
    tick();
  };

  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, cards.length) }, async () => {
      while (next < cards.length) await fetchOne(cards[next++]);
    }),
  );

  const have = all.filter((c) => present(imagePath(c.id, dir))).length;
  const info: ImageInfo = { cards: all.length, present: have, downloaded, skipped, failed: failures.length, limit: opts.limit ?? null };
  writeSyncState(db, 'images', { ...info });
  for (const f of failures.slice(0, 30)) log(`images failed ${f}`);
  if (failures.length > 30) log(`images failed ... and ${failures.length - 30} more`);
  log(`images ${have}/${all.length} on disk (${downloaded} downloaded, ${skipped} already there, ${failures.length} failed)`);
  return { ...info, failures };
}
