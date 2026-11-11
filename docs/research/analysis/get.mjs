// Polite single-URL fetcher: node get.mjs <url> <outfile> ; prints status + size. Generic UA, no personal info.
import { writeFileSync } from 'node:fs';
const [url, out] = process.argv.slice(2);
const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; deck-research/1.0)', 'Accept': 'text/html,application/json,*/*' } });
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(out, buf);
console.log(res.status, buf.length, res.headers.get('content-type'));
