import type { Settings } from '@/app/lib/api';
import type { Format, PowerTarget } from '@/engine/types';
import { HttpError } from './http';
import { cacheSlot, dropCaches, serverState } from './state';
import { getDb } from './store';

export type { Settings };

export const FORMATS: readonly Format[] = ['standard-bo1', 'standard-bo3', '2v2', 'ffa3', 'ffa4', 'casual'];
export const POWERS: readonly PowerTarget[] = ['casual', 'focused', 'competitive'];

export const DEFAULT_SETTINGS: Readonly<Settings> = { ownedOnly: false, ffaUsesStandardBans: null, defaultFormat: 'standard-bo3', defaultPower: 'focused' };

const KEYS = ['ownedOnly', 'ffaUsesStandardBans', 'defaultFormat', 'defaultPower'] as const;
type Key = (typeof KEYS)[number];

function check(key: Key, value: unknown): Settings[Key] {
  switch (key) {
    case 'ownedOnly':
      if (typeof value !== 'boolean') throw new HttpError(400, 'ownedOnly must be true or false.');
      return value;
    case 'ffaUsesStandardBans':
      if (value !== null && typeof value !== 'boolean') throw new HttpError(400, 'ffaUsesStandardBans must be true, false or null.');
      return value;
    case 'defaultFormat':
      if (!FORMATS.includes(value as Format)) throw new HttpError(400, `defaultFormat must be one of ${FORMATS.join(', ')}.`);
      return value as Format;
    case 'defaultPower':
      if (!POWERS.includes(value as PowerTarget)) throw new HttpError(400, `defaultPower must be one of ${POWERS.join(', ')}.`);
      return value as PowerTarget;
  }
}

/** The saved settings over the defaults; a damaged row falls back to its default. */
export function getSettings(): Settings {
  return cacheSlot('settings', () => {
    const out: Settings = { ...DEFAULT_SETTINGS };
    const rows = getDb().prepare('SELECT key, json FROM settings').all() as { key: string; json: string }[];
    for (const row of rows) {
      const key = KEYS.find((k) => k === row.key);
      if (!key) continue;
      try {
        (out as unknown as Record<string, unknown>)[key] = check(key, JSON.parse(row.json));
      } catch {
        // keep the default
      }
    }
    return out;
  });
}

/** Merges the given keys into the saved settings. Unknown keys and wrong types are a 400. */
export function updateSettings(patch: Record<string, unknown>): Settings {
  const before = getSettings();
  const next: Settings = { ...before };
  const changed: Key[] = [];
  for (const [k, v] of Object.entries(patch)) {
    const key = KEYS.find((x) => x === k);
    if (!key) throw new HttpError(400, `Unknown setting "${k}".`);
    (next as unknown as Record<string, unknown>)[key] = check(key, v);
    changed.push(key);
  }
  const db = getDb();
  const put = db.prepare('INSERT INTO settings(key, json) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json');
  db.transaction(() => {
    for (const key of changed) put.run(key, JSON.stringify(next[key]));
  })();
  // The free-for-all switch changes which cards are banned: every analysis and deck tile is stale.
  if (next.ffaUsesStandardBans !== before.ffaUsesStandardBans) dropCaches();
  else serverState().caches.delete('settings');
  return getSettings();
}
