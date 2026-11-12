import { handle, json, readBody } from '@/server/http';
import { startSync, syncState } from '@/server/sync-runner';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) => handle(() => json(syncState(Number(new URL(req.url).searchParams.get('since') ?? 0))));

export const POST = (req: Request) => handle(async () => json(startSync(await readBody(req)), 202));
