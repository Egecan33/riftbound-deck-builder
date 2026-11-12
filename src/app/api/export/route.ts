import { sanitizeDeck } from '@/server/decks';
import { handle, json, readBody } from '@/server/http';
import { exportDeck } from '@/server/text';

export const POST = (req: Request) =>
  handle(async () => {
    const body = await readBody(req);
    return json(exportDeck(sanitizeDeck(body.deck)));
  });
