// pnpm sync [cards|errata|legality|images|meta|features|fixtures|all]... [--limit N] [--max N] [--allow-shrink]
// Each step is resumable and idempotent, writes `sync_state` and prints `step done/total`.
import { pathToFileURL } from 'node:url';
import { invalidateCardDb } from '@/server/carddb';
import { openDb, type Db } from '@/server/db';
import { syncCards, type Log } from './cards';
import { syncErrata } from './errata';
import { syncFeatures } from './features';
import { syncImages } from './images';
import { syncLegality } from './legality';
import { syncMeta } from './meta';

/** Dependency order. `all` runs these; `fixtures` (test fixture export) runs only when named. */
export const STEPS = ['cards', 'errata', 'legality', 'meta', 'features', 'images'] as const;
export type Step = (typeof STEPS)[number] | 'fixtures';
const ORDER: readonly Step[] = [...STEPS, 'fixtures'];

export interface Flags { limit?: number; max?: number; allowShrink: boolean }

export async function runStep(step: Step, db: Db, log: Log, flags: Flags = { allowShrink: false }): Promise<void> {
  switch (step) {
    case 'cards': await syncCards(db, log, { allowShrink: flags.allowShrink }); break;
    case 'errata': syncErrata(db, log); break;
    case 'legality': await syncLegality(db, log); break;
    case 'meta': await syncMeta(db, log, { max: flags.max }); break;
    case 'features': syncFeatures(db, log); break;
    case 'images': await syncImages(db, log, { limit: flags.limit }); break;
    case 'fixtures': (await import('./fixtures')).writeFixtures(db, log); break;
  }
  invalidateCardDb();
}

const USAGE = `Usage: pnpm sync [${ORDER.join('|')}|all]... [--limit N] [--max N] [--allow-shrink]`;

export function parseArgs(argv: string[]): { steps: Step[]; flags: Flags } {
  const flags: Flags = { allowShrink: false };
  const steps: Step[] = [];
  const int = (name: string, raw: string | undefined): number => {
    const n = Number(raw);
    if (raw === undefined || !Number.isInteger(n) || n < 0) throw new Error(`${name} needs a non-negative integer`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--limit') flags.limit = int('--limit', argv[++i]);
    else if (arg === '--max') flags.max = int('--max', argv[++i]);
    else if (arg === '--allow-shrink') flags.allowShrink = true;
    else if (arg === 'all') steps.push(...STEPS);
    else if ((ORDER as readonly string[]).includes(arg)) steps.push(arg as Step);
    else throw new Error(`unknown argument "${arg}". ${USAGE}`);
  }
  if (steps.length === 0) steps.push(...STEPS);
  // Run in dependency order whatever order was typed, each step once.
  return { steps: ORDER.filter((s) => steps.includes(s)), flags };
}

async function main(): Promise<void> {
  if (process.argv.includes('--help')) { console.log(USAGE); return; }
  const { steps, flags } = parseArgs(process.argv.slice(2));
  const db = openDb();
  const log: Log = (line) => console.log(line);
  try {
    for (const step of steps) {
      const started = Date.now();
      await runStep(step, db, log, flags);
      log(`${step} took ${((Date.now() - started) / 1000).toFixed(1)} s`);
    }
  } finally {
    db.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
