import { collectionResponse, saveCollection } from '@/server/collection';
import { handle, json, readBody } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = () => handle(() => json(collectionResponse()));

export const POST = (req: Request) => handle(async () => json(saveCollection(await readBody(req))));
