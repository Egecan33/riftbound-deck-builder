// `features` step. Stub until plan Task 4 (card mine) and Task 5 (network, roles, axes, legend profiles):
// those tasks fill `card_features`, `card_edges` and `legend_profiles` here.
import { writeSyncState, type Db } from '@/server/db';
import type { Log } from './cards';

export function syncFeatures(db: Db, log: Log): void {
  writeSyncState(db, 'features', { implemented: false });
  log('features 0/0 (not implemented until plan Task 4)');
}
