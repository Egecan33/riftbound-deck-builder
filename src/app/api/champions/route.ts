import { championsOf } from '@/server/cards';
import { handle, json } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) => handle(() => json(championsOf(new URL(req.url).searchParams.get('legend'))));
