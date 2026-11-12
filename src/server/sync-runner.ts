import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { SyncState, SyncStep } from '@/app/lib/api';
import { HttpError, type Body } from './http';
import { onCardDataChanged } from './store';

/** The steps of `pnpm sync`, in dependency order (src/ingest/sync.ts STEPS; a test keeps the two equal). */
export const SYNC_STEPS: readonly SyncStep[] = ['cards', 'errata', 'legality', 'meta', 'features', 'images'];
/** Progress lines kept in memory; older ones are dropped, `lineCount` keeps counting. */
export const MAX_LINES = 2000;

interface Run {
  running: boolean; step: SyncStep | 'all' | null; startedAt: string | null; finishedAt: string | null;
  exitCode: number | null; dropped: number; lines: string[];
}

// On globalThis: a run must stay visible to every route bundle and survive cache resets.
const KEY = '__riftboundForgeSync';
const holder = globalThis as unknown as Record<string, Run | undefined>;
const run = (): Run =>
  (holder[KEY] ??= { running: false, step: null, startedAt: null, finishedAt: null, exitCode: null, dropped: 0, lines: [] });

export type Spawner = (args: string[]) => Pick<ChildProcess, 'stdout' | 'stderr' | 'on'>;

/**
 * Runs the ingest CLI (`pnpm sync <step>`) from the project root. A packaged build sets
 * RIFTBOUND_FORGE_SYNC_CLI to its bundled sync script, which runs on the server's own Node.
 */
const spawnCli: Spawner = (args) => {
  const bundled = process.env.RIFTBOUND_FORGE_SYNC_CLI;
  const opts = { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'] };
  return bundled
    ? spawn(process.execPath, [bundled, ...args], opts)
    : spawn(path.join(/* turbopackIgnore: true */ process.cwd(), 'node_modules', '.bin', 'tsx'), ['src/ingest/sync.ts', ...args], opts);
};

/** Progress of the current or last run; `since` skips lines the caller already has. */
export function syncState(since = 0): SyncState {
  const r = run();
  const lineCount = r.dropped + r.lines.length;
  const from = Math.max(0, Math.min(r.lines.length, Math.floor(Number.isFinite(since) ? since : 0) - r.dropped));
  return { running: r.running, step: r.step, startedAt: r.startedAt, finishedAt: r.finishedAt, exitCode: r.exitCode, lineCount, lines: r.lines.slice(from) };
}

/** CLI arguments for a request body: the step, then `--limit N` (images) and `--max N` (meta) when given. */
export function syncArgs(body: Body): { step: SyncStep | 'all'; args: string[] } {
  const step = body.step;
  if (step !== 'all' && !SYNC_STEPS.includes(step as SyncStep)) throw new HttpError(400, `step must be one of ${SYNC_STEPS.join(', ')} or all.`);
  const args = step === 'all' ? [] : [step as string];
  for (const flag of ['limit', 'max'] as const) {
    const v = body[flag];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100000) throw new HttpError(400, `${flag} must be a whole number from 0 to 100000.`);
    args.push(`--${flag}`, String(v));
  }
  return { step: step as SyncStep | 'all', args };
}

/** Starts a sync step as a child process. 400 for an unknown step, 409 while one is running. */
export function startSync(body: Body, spawner: Spawner = spawnCli): SyncState {
  const { step, args } = syncArgs(body);
  const r = run();
  if (r.running) throw new HttpError(409, `A sync is already running (${r.step}).`);
  Object.assign(r, { running: true, step, startedAt: new Date().toISOString(), finishedAt: null, exitCode: null, dropped: 0, lines: [] } satisfies Partial<Run>);

  const push = (line: string) => {
    r.lines.push(line);
    if (r.lines.length > MAX_LINES) {
      r.dropped += r.lines.length - MAX_LINES;
      r.lines.splice(0, r.lines.length - MAX_LINES);
    }
  };
  const finish = (code: number | null) => {
    if (!r.running) return;
    r.running = false;
    r.exitCode = code;
    r.finishedAt = new Date().toISOString();
    onCardDataChanged();
  };

  let child: ReturnType<Spawner>;
  try {
    child = spawner(args);
  } catch (err) {
    push(`could not start: ${err instanceof Error ? err.message : String(err)}`);
    finish(1);
    return syncState();
  }
  for (const stream of [child.stdout, child.stderr]) {
    let rest = '';
    stream?.on('data', (chunk: Buffer | string) => {
      const parts = (rest + chunk.toString()).split(/\r?\n/);
      rest = parts.pop() ?? '';
      for (const line of parts) if (line.trim()) push(line);
    });
    stream?.on('end', () => {
      if (rest.trim()) push(rest);
      rest = '';
    });
  }
  child.on('error', (err: Error) => {
    push(`could not start: ${err.message}`);
    finish(1);
  });
  child.on('close', (code: number | null) => finish(code ?? 1));
  return syncState();
}
