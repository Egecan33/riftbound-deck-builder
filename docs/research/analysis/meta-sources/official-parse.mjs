// Parse official "Top Decks" articles (playriftbound.com, __NEXT_DATA__ rich text) into
// raw/official-events.json : [{slug,title,publishedAt,field:[{legend,day1,day1Pct,day2,day2Pct}],decks:[{player,legendRank,legendField,overallRank,sections{}}]}]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const out = [];
for (const f of readdirSync('raw').filter((x) => /^prb-.*(top-decks|bologna)\.html$/.test(x))) {
  const h = readFileSync('raw/' + f, 'utf8');
  const j = JSON.parse(h.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const page = j.props.pageProps.page;
  const body = page.blades.filter((b) => b.type === 'articleRichText').map((b) => b.richText?.body || '').join('\n');
  // field table
  const field = [];
  for (const tr of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const c = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((x) => x[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#x27;|&#39;/g, "'").trim());
    // Column order differs by article: older = Legend,#Day1,#Day2,%Day1,%Day2 ; newer = Legend,#D1,%D1,#D2,%D2
    if (c.length >= 5 && /^\d+$/.test(c[1])) {
      const int = (x) => /^\d+$/.test(x);
      field.push(int(c[2]) ? { legend: c[0], day1: +c[1], day2: +c[2], day1Pct: c[3], day2Pct: c[4] } : { legend: c[0], day1: +c[1], day1Pct: c[2], day2: int(c[3]) ? +c[3] : null, day2Pct: c[4] });
    }
  }
  // decks: plain text walk
  const t = body.replace(/<img[^>]*>/g, '\n[IMG]\n').replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|li|h\d|div|td|tr)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');
  const lines = t.split('\n').map((x) => x.trim()).filter(Boolean);
  const decks = []; let cur = null, sec = null;
  const SEC = /^(Legend|Champion|Chosen Champion|Main Deck|Battlefields?|Rune Pool|Runes|Sideboard|Side Deck)\s*:?\s*$/i;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const rk = L.match(/Legend Rank:\s*#?(\d+)\s*\/\s*(\d+)/i), ov = L.match(/Overall Rank(?:ing)?:\s*#?(\d+)/i);
    if (rk || ov) {
      if (!cur || cur.started) { cur = { player: null, sections: {} }; decks.push(cur); // player name = nearest previous non-IMG line
        for (let k = i - 1; k >= 0 && k >= i - 3; k--) if (lines[k] !== '[IMG]' && !/^\d/.test(lines[k]) && lines[k].length < 60) { cur.player = lines[k]; break; } }
      if (rk) { cur.legendRank = +rk[1]; cur.legendField = +rk[2]; } if (ov) cur.overallRank = +ov[1];
      const inl = L.match(/Legend:\s*$/i); if (inl) sec = 'legend';
      continue;
    }
    if (!cur) continue;
    const s = L.match(SEC); if (s) { sec = s[1].toLowerCase().replace(/s$/, ''); cur.started = true; continue; }
    const m = L.match(/^(\d+)\s+(.+)$/);
    if (m && sec) (cur.sections[sec] ||= []).push({ qty: +m[1], name: m[2].trim() });
  }
  for (const d of decks) delete d.started;
  out.push({ slug: f.replace(/^prb-|\.html$/g, ''), title: page.title, publishedAt: page.displayedPublishDate || (page.blades.find((b) => b.type === "articleMasthead") || {}).publishDate || "", field, decks });
}
out.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
writeFileSync('raw/official-events.json', JSON.stringify(out));
for (const e of out) {
  const sum = (k) => e.field.reduce((a, r) => a + (r[k] || 0), 0);
  const q = (d, s) => (d.sections[s] || []).reduce((a, c) => a + c.qty, 0);
  const shapes = {}; for (const d of e.decks) { const k = ['legend', 'champion', 'main deck', 'battlefield', 'rune pool', 'sideboard'].map((s) => q(d, s)).join('/'); shapes[k] = (shapes[k] || 0) + 1; }
  console.log(e.publishedAt.slice(0, 10), e.slug, '| legends in table', e.field.length, 'day1', sum('day1'), 'day2', sum('day2'), '| decks', e.decks.length, 'withRank', e.decks.filter((d) => d.legendRank).length, 'top8(overall<=8)', e.decks.filter((d) => d.overallRank <= 8).length, 'shapes', JSON.stringify(shapes));
}
