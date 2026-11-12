import { serveImage } from '@/server/images';

type Ctx = { params: Promise<{ file: string }> };

export const GET = async (_req: Request, { params }: Ctx) => serveImage((await params).file);
