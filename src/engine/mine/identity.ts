// Ported from Riftfoundry apps/web/src/lib/scoring.ts at origin/main 4b90179 (lines 533-580): champion and signature identity checks.
// Port rule (spec 8.1): behaviour unchanged; top-level declarations are exported so the split files can share them.
import {
  type ScoreCard,
} from "./types";

export function normalizedChampionIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

export function championMatchesLegend(
  legend: ScoreCard,
  champion: ScoreCard,
): boolean {
  if (champion.type !== "unit") return false;
  const championName = normalizedChampionIdentity(
    champion.name.split(",")[0] ?? champion.name,
  );
  if (!championName) return false;

  return legend.tags.some((tag) => {
    const identity = normalizedChampionIdentity(tag);
    return (
      identity === championName ||
      identity.endsWith(` ${championName}`) ||
      championName.endsWith(` ${identity}`)
    );
  });
}

export function isSignatureCard(card: Pick<ScoreCard, "superTypes">): boolean {
  return (card.superTypes ?? []).some(
    (superType) =>
      normalizedChampionIdentity(superType) ===
      normalizedChampionIdentity("Signature"),
  );
}

export function signatureMatchesLegend(
  card: Pick<ScoreCard, "superTypes" | "tags">,
  legend: Pick<ScoreCard, "tags">,
): boolean {
  if (!isSignatureCard(card)) return true;
  const legendTags = new Set(legend.tags.map(normalizedChampionIdentity));
  return card.tags.some((tag) =>
    legendTags.has(normalizedChampionIdentity(tag)),
  );
}
