import type { ExportResponse, ImportResponse } from '@/app/lib/api';
import { isLegal, validateDeck } from '@/engine/rules/validate';
import { encodeDeckCode, exportDecklist, parseDecklist } from '@/engine/text';
import type { Deck } from '@/engine/types';
import { cardLookup, deckIds } from './cards';
import { sanitizeDeck } from './decks';
import { HttpError, type Body } from './http';
import { FORMATS, POWERS, getSettings } from './settings';
import { getCardDb } from './store';

export const MAX_IMPORT_TEXT = 200_000;

/**
 * POST /api/import: a pasted text list or a deck code becomes a deck (not saved; the client saves it).
 * Lines that name no card come back in `unresolved`. The deck is validated but returned either way:
 * an old list with a banned card must still open, with the violation shown.
 */
export function importDeck(body: Body): ImportResponse {
  if (typeof body.text !== 'string' || !body.text.trim()) throw new HttpError(400, 'text must be a deck list or a deck code.');
  if (body.text.length > MAX_IMPORT_TEXT) throw new HttpError(413, 'The list is too large.');
  if (body.format !== undefined && !FORMATS.includes(body.format as Deck['format'])) throw new HttpError(400, `format must be one of ${FORMATS.join(', ')}.`);
  if (body.power !== undefined && !POWERS.includes(body.power as Deck['power'])) throw new HttpError(400, `power must be one of ${POWERS.join(', ')}.`);
  const db = getCardDb();
  const settings = getSettings();
  const parsed = parseDecklist(body.text, db);
  const legend = parsed.deck.legend ? db.get(parsed.deck.legend) : undefined;
  const deck = sanitizeDeck({
    ...parsed.deck,
    id: null,
    name: typeof body.name === 'string' && body.name.trim() ? body.name : legend ? `${legend.name} (imported)` : 'Imported deck',
    format: body.format ?? settings.defaultFormat,
    power: body.power ?? settings.defaultPower,
  });
  const violations = validateDeck(deck, db);
  return { deck, unresolved: parsed.unresolved, notices: parsed.notices, violations, legal: isLegal(violations), cards: cardLookup(deckIds(deck)) };
}

/** POST /api/export: the deck as a text list and, when every card has a portable code, as a deck code. */
export function exportDeck(deck: Deck): ExportResponse {
  const db = getCardDb();
  const encoded = encodeDeckCode(deck, db);
  return { text: exportDecklist(deck, db), code: encoded.error ? null : encoded.code || null, codeSkipped: encoded.skipped, codeError: encoded.error };
}
