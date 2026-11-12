// The `features` sync step's pure part, for engine tests (keeps the ingest import out of every test file).
import { computeFeatures } from '@/ingest/features';
import type { Card, CardFeatures } from '@/engine/types';

export const ingestFeatures = (cards: readonly Card[]): CardFeatures[] => computeFeatures(cards);
