// Shared helpers for reading Piltover Archive pages (Next.js RSC flight payload embedded in HTML).
export const UA = 'Mozilla/5.0 (compatible; deck-research/1.0)';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function getHtml(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (res.status === 200) return await res.text();
      if (res.status === 404) return null;
      await sleep(5000 * (i + 1)); // back off on 429/5xx
    } catch { await sleep(5000 * (i + 1)); }
  }
  return null;
}
export function flight(html) {
  const out = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html))) { try { out.push(JSON.parse('"' + m[1] + '"')); } catch {} }
  return out.join('');
}
// Extract the balanced JSON value starting at index i (which must be '{' or '[').
export function balanced(s, i) {
  const open = s[i], close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return s.slice(i, j + 1); }
  }
  return null;
}
