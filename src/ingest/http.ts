// Outgoing HTTP for the sync steps. Generic User-Agent, no personal data, serial per host with a
// minimum gap (AGENTS.md hard rule 8). Image downloads use `downloadToFile` without the gap.
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const USER_AGENT = 'RiftboundForge/0.1';
const HEADERS = { 'User-Agent': USER_AGENT, Accept: '*/*' };

export interface HttpOptions {
  /** Minimum time between two requests to the same host. Community sites: at least 1500. */
  minGapMs?: number;
  /** Total attempts for 429 / 5xx / network errors. Waits 5 s, then 10 s, ... between attempts. */
  maxAttempts?: number;
  backoffMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const lastRequestAt = new Map<string, number>();
const hostQueue = new Map<string, Promise<unknown>>();

/** Runs `task` after every earlier task for the same host has finished and `minGapMs` has passed. */
function serialPerHost<T>(url: string, minGapMs: number, task: () => Promise<T>): Promise<T> {
  const host = new URL(url).host;
  const run = async () => {
    const wait = (lastRequestAt.get(host) ?? 0) + minGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      lastRequestAt.set(host, Date.now());
    }
  };
  const next = (hostQueue.get(host) ?? Promise.resolve()).then(run, run);
  hostQueue.set(host, next.catch(() => undefined));
  return next;
}

/** GET with retries on 429, 5xx and network errors. Other statuses are returned as they are. */
export async function httpGet(url: string, opts: HttpOptions = {}): Promise<Response> {
  const { minGapMs = 1000, maxAttempts = 3, backoffMs = 5000, timeoutMs = 60_000, fetchImpl = fetch } = opts;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await serialPerHost(url, minGapMs, () =>
        fetchImpl(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) }),
      );
      if (res.status !== 429 && res.status < 500) return res;
      await res.body?.cancel().catch(() => undefined);
      lastError = new Error(`GET ${url} -> HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < maxAttempts) await sleep(backoffMs * attempt);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function getJson<T = unknown>(url: string, opts?: HttpOptions): Promise<T> {
  const res = await httpGet(url, opts);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Returns the body text, or null on 404. */
export async function getText(url: string, opts?: HttpOptions): Promise<string | null> {
  const res = await httpGet(url, opts);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.text();
}

/** Streams a URL to `dest` through `dest.part`, renaming only when the body completed. Returns the byte count. */
export async function downloadToFile(url: string, dest: string, opts: Pick<HttpOptions, 'fetchImpl' | 'timeoutMs'> = {}): Promise<number> {
  const { fetchImpl = fetch, timeoutMs = 60_000 } = opts;
  const res = await fetchImpl(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok || !res.body) {
    await res.body?.cancel().catch(() => undefined);
    throw new Error(`HTTP ${res.status}`);
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  const out = createWriteStream(part);
  try {
    await pipeline(Readable.fromWeb(res.body as import('node:stream/web').ReadableStream<Uint8Array>), out);
  } catch (err) {
    await rm(part, { force: true });
    throw err;
  }
  await rename(part, dest);
  return out.bytesWritten;
}
