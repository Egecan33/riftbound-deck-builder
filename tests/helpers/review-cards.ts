// Real synced rows for the stage 3 review tests (tests/fixtures/review-cards.json), by public code.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { reviveCard, type StoredCard } from '@/engine/carddb';
import type { Card } from '@/engine/types';

let cached: Map<string, Card> | null = null;

export function reviewCard(code: string): Card {
  if (!cached) {
    const file = JSON.parse(readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'review-cards.json'), 'utf8')) as { cards: StoredCard[] };
    cached = new Map(file.cards.map(reviveCard).map((c) => [c.code, c]));
  }
  const card = cached.get(code);
  if (!card) throw new Error(`review test card ${code} is not in tests/fixtures/review-cards.json`);
  return card;
}
