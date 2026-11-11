// node text.mjs <htmlfile> [maxChars] [startRegex] : strip tags, print text
import { readFileSync } from 'node:fs';
const [f, max = '6000', start] = process.argv.slice(2);
let h = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ');
h = h.replace(/<a [^>]*href="([^"]+)"[^>]*>/g, ' [$1] ').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
let i = 0; if (start) { const m = h.search(new RegExp(start, 'i')); if (m >= 0) i = m; }
console.log(h.slice(i, i + Number(max)));
