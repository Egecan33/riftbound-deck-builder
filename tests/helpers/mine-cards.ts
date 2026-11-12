// Cards for the card-mine tests: the committed fixture plus tests/fixtures/mine-cards.json (real synced
// rows the mine tests quote that the main fixture does not hold).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { reviveCard, type StoredCard } from '@/engine/carddb';
import { mineOverridesById, type MineOverride, type MineOverrideEntry } from '@/engine/mine';
import type { Card } from '@/engine/types';
import { fixtureCards } from './fixture-db';

let cached: { all: Card[]; byCode: Map<string, Card> } | null = null;

function load() {
  if (!cached) {
    const file = JSON.parse(readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'mine-cards.json'), 'utf8')) as { cards: StoredCard[] };
    const base = fixtureCards();
    const have = new Set(base.map((c) => c.id));
    const all = [...base, ...file.cards.map(reviveCard).filter((c) => !have.has(c.id))];
    cached = { all, byCode: new Map(all.map((c) => [c.code, c])) };
  }
  return cached;
}

export const mineCards = (): Card[] => load().all;

export function cardByCode(code: string): Card {
  const card = load().byCode.get(code);
  if (!card) throw new Error(`mine test card ${code} is in neither fixture`);
  return card;
}

/** The reviewed `mine` overrides of sync-data/card-overrides.json, keyed by card id. */
export function mineOverrides(): Record<string, MineOverride> {
  const file = JSON.parse(readFileSync(path.join(process.cwd(), 'sync-data', 'card-overrides.json'), 'utf8')) as { mine?: MineOverrideEntry[] };
  return mineOverridesById(file.mine, mineCards());
}
