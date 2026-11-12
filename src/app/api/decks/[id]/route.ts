import type { DeckResponse } from '@/app/lib/api';
import { cardLookup, deckIds } from '@/server/cards';
import { deleteDeck, getDeck, sanitizeDeck, saveDeck } from '@/server/decks';
import { HttpError, handle, json, readBody } from '@/server/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    const found = getDeck((await params).id);
    if (!found) throw new HttpError(404, 'No deck with that id.');
    return json({ ...found, cards: cardLookup(deckIds(found.deck)) } satisfies DeckResponse);
  });

export const PUT = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params;
    const body = await readBody(req);
    const saved = saveDeck(sanitizeDeck(body.deck), id);
    if (!saved) throw new HttpError(404, 'No deck with that id.');
    return json({ ...saved, cards: cardLookup(deckIds(saved.deck)) } satisfies DeckResponse);
  });

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    if (!deleteDeck((await params).id)) throw new HttpError(404, 'No deck with that id.');
    return json({ ok: true });
  });
