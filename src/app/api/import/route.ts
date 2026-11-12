import { handle, json, readBody } from '@/server/http';
import { importDeck } from '@/server/text';

export const POST = (req: Request) => handle(async () => json(importDeck(await readBody(req))));
