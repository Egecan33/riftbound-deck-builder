// Seeded randomness of the builder (spec 13.8). Pure.
//
// `stableBias` is ported from Riftfoundry apps/web/src/lib/theory-decks.ts (origin/main 4b90179): an FNV-1a
// hash of a string mapped to 0..1. The generator there used it as a per-card tie-break salted by the variant;
// here the salt is the user's seed, so "Reroll" moves close calls and the same seed gives the same deck.
// `mulberry32` is the plan's seeded generator, used where a sequence is needed.

export function stableBias(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

/** mulberry32: a 32-bit seeded generator, values in [0, 1). A non-finite seed reads as 0. */
export function mulberry32(seed: number): () => number {
  let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One number per (seed, key) in [0, 1): the same for a seed, different across seeds. */
export function seededBias(seed: number, key: string): number {
  const salt = mulberry32(seed)();
  return stableBias(`${Math.floor(salt * 1e9)}:${key}`);
}
