import type { LegendsResponse } from '@/app/lib/api';
import { listLegends } from '@/server/cards';
import { handle, json } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  handle(() => {
    const p = new URL(req.url).searchParams;
    return json({ legends: listLegends(p.get('q'), p.get('domains')) } satisfies LegendsResponse);
  });
