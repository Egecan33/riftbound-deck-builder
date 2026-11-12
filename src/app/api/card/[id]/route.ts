import { cardDetail } from '@/server/cards';
import { getDeck, sanitizeDeck } from '@/server/decks';
import { HttpError, handle, json, readBody } from '@/server/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** `?deck=<saved deck id>` scores the card against that deck; without it the card stands alone. */
export const GET = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const deckId = new URL(req.url).searchParams.get('deck');
    let deck = null;
    if (deckId) {
      const found = getDeck(deckId);
      if (!found) throw new HttpError(404, 'No deck with that id.');
      deck = found.deck;
    }
    return json(cardDetail((await params).id, deck));
  });

/** The same against the deck in the body: the builder's deck as it is being edited, saved or not. */
export const POST = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const body = await readBody(req);
    return json(cardDetail((await params).id, sanitizeDeck(body.deck)));
  });
