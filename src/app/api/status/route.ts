import { json } from '@/server/http';
import { getStatus } from '@/server/status';

export const dynamic = 'force-dynamic';

export const GET = () => json(getStatus());
