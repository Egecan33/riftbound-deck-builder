// Deck list export. The text it writes is the format of tests/fixtures/decks/*.txt and reads back
// through parseDecklist to the same deck. Pure: no Node, no I/O.
import type { CardDb, Deck, Domain } from '../types';
import { runeCardForDomain } from './deck-code';

const DOMAIN_ORDER: Domain[] = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];

/** A card's name, or its code when the name would read back as another card. Unknown ids are kept as ids. */
function label(id: string, db: CardDb): string {
  const card = db.get(id);
  if (!card) return id;
  return db.byName(card.name)?.id === card.id ? card.name : card.code;
}

export function exportDecklist(deck: Deck, db: CardDb): string {
  const sections: string[] = [];
  const push = (title: string, rows: string[]) => { if (rows.length) sections.push(`${title}:\n${rows.join('\n')}`); };
  const sorted = (pairs: [string, number][]): string[] =>
    pairs
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ name: label(id, db), qty }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'))
      .map((row) => `${row.qty} ${row.name}`);

  push('Legend', [deck.legend, ...(deck.extraLegends ?? [])].filter((id): id is string => !!id).map((id) => `1 ${label(id, db)}`));

  // The Chosen Champion is counted inside `main`; the list shows it on its own and one copy fewer in Main.
  const main = new Map<string, number>();
  for (const entry of deck.main ?? []) main.set(entry.id, (main.get(entry.id) ?? 0) + entry.qty);
  if (deck.champion) {
    push('Champion', [`1 ${label(deck.champion, db)}`]);
    const left = (main.get(deck.champion) ?? 0) - 1;
    if (left > 0) main.set(deck.champion, left);
    else main.delete(deck.champion);
  }
  push('Main', sorted([...main.entries()]));

  const fields = new Map<string, number>();
  for (const id of deck.battlefields ?? []) fields.set(id, (fields.get(id) ?? 0) + 1);
  push('Battlefields', sorted([...fields.entries()]));

  const runes: string[] = [];
  for (const domain of DOMAIN_ORDER) {
    const count = deck.runes?.[domain] ?? 0;
    if (count <= 0) continue;
    const rune = runeCardForDomain(domain, db);
    runes.push(`${count} ${rune ? label(rune.id, db) : `${domain[0].toUpperCase()}${domain.slice(1)} Rune`}`);
  }
  push('Runes', runes);

  const side = new Map<string, number>();
  for (const entry of deck.side ?? []) side.set(entry.id, (side.get(entry.id) ?? 0) + entry.qty);
  push('Sideboard', sorted([...side.entries()]));

  return sections.join('\n\n') + (sections.length ? '\n' : '');
}
