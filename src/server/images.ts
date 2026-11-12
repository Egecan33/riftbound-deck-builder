import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { imageDir } from './store';

/** `{cardId}.webp`: lower-case letters, digits and single hyphens. Nothing else reaches the file system. */
export const IMAGE_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/;
export const MAX_IMAGE_NAME = 96;

/** A plain card back at the card aspect ratio (63 x 88 mm), shown for images that are not on disk. */
export const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 352" width="252" height="352" role="img" aria-label="Card image not available">' +
  '<rect width="252" height="352" rx="13" fill="#0f1420"/>' +
  '<rect x="11" y="11" width="230" height="330" rx="8" fill="#182033" stroke="#33415f" stroke-width="2"/>' +
  '<path d="M126 108l44 68-44 68-44-68z" fill="none" stroke="#33415f" stroke-width="3"/>' +
  '<circle cx="126" cy="176" r="14" fill="#33415f"/>' +
  '</svg>';

const text = (status: number, message: string): Response =>
  new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/**
 * GET /api/img/:file. A card image never changes under its name, so hits are cached for a year.
 * A miss answers the placeholder with status 404 and is not cached: the image may arrive with the
 * next `images` sync.
 */
export async function serveImage(file: string): Promise<Response> {
  if (typeof file !== 'string' || file.length > MAX_IMAGE_NAME || !IMAGE_FILE.test(file)) return text(400, 'file must be <card id>.webp');
  const dir = path.resolve(imageDir());
  const target = path.resolve(dir, file);
  if (path.dirname(target) !== dir) return text(400, 'file must be <card id>.webp');
  try {
    const bytes = await readFile(target);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { 'Content-Type': 'image/webp', 'Content-Length': String(bytes.byteLength), 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response(PLACEHOLDER_SVG, { status: 404, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
