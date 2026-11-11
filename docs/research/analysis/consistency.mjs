// Hypergeometric consistency tables for Riftbound. Pure math; rule numbers are cited in deck-theory.md section 3.
// Library N = 39 (40-card Main Deck minus the Chosen Champion that starts in the Champion Zone).
const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const hyp = (N, K, n, x) => (C(K, x) * C(N - K, n - x)) / C(N, n);
const atLeast = (N, K, n, m = 1) => { let p = 0; for (let x = m; x <= Math.min(K, n); x++) p += hyp(N, K, n, x); return p; };
const pct = (p) => (100 * p).toFixed(0) + '%';
const N = 39;
const out = [];
// Cards seen by the start of your own turn T's main phase (1v1): 4 opening + T draws; a full 2-card mulligan digs 2 deeper.
out.push('### A. P(at least one copy seen) by own turn T, 1v1, N=39. "keep" = no mulligan (4+T cards); "dig" = mulligan 2 looking for it (6+T cards)');
out.push('| copies | T1 keep | T1 dig | T2 keep | T2 dig | T3 keep | T3 dig | T4 keep | T4 dig | T5 keep | T6 keep | T8 keep |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const k of [1, 2, 3, 4, 6, 9, 12, 15, 18]) out.push(`| ${k} | ${[1, 2, 3, 4].map((T) => `${pct(atLeast(N, k, 4 + T))} | ${pct(atLeast(N, k, 6 + T))}`).join(' | ')} | ${pct(atLeast(N, k, 9))} | ${pct(atLeast(N, k, 10))} | ${pct(atLeast(N, k, 12))} |`);
out.push('', '### B. Copies needed for P(at least one) >= target by own turn T (no mulligan / with 2-card dig)');
out.push('| target | T1 | T2 | T3 | T4 | T5 | T6 |', '|---|---|---|---|---|---|---|');
for (const tgt of [0.5, 0.75, 0.85, 0.9, 0.95]) out.push(`| ${pct(tgt)} | ${[1, 2, 3, 4, 5, 6].map((T) => { const f = (n) => { for (let k = 1; k <= 39; k++) if (atLeast(N, k, n) >= tgt) return k; }; return `${f(4 + T)} / ${f(6 + T)}`; }).join(' | ')} |`);
out.push('', '### C. Opening hand (4 cards, before mulligan): P(x copies) for a group of K cards');
out.push('| K | P(0) | P(1) | P(2) | P(3+) | P(>=1 after a 2-card dig when 0) |', '|---|---|---|---|---|---|');
for (const K of [3, 6, 9, 12, 15, 18, 21, 24]) out.push(`| ${K} | ${pct(hyp(N, K, 4, 0))} | ${pct(hyp(N, K, 4, 1))} | ${pct(hyp(N, K, 4, 2))} | ${pct(atLeast(N, K, 4, 3))} | ${pct(atLeast(N, K, 6))} |`);
// first-player-skips-draw modes
out.push('', '### D. Multiplayer first player (skips first draw: 3+T cards) vs others, P(>=1) by T2 and T3');
out.push('| copies | T2 first | T2 other | T3 first | T3 other |', '|---|---|---|---|---|');
for (const k of [3, 6, 9, 12]) out.push(`| ${k} | ${pct(atLeast(N, k, 5))} | ${pct(atLeast(N, k, 6))} | ${pct(atLeast(N, k, 6))} | ${pct(atLeast(N, k, 7))} |`);
// Runes: 12-card rune deck, a of domain A. Channel 2 per turn (+1 on the last player's first channel).
out.push('', '### E. Runes on board at own turn T (no recycling yet): first player 2T, second player 2T+1, cap 12');
out.push('| T | first | second |', '|---|---|---|'); for (let T = 1; T <= 6; T++) out.push(`| ${T} | ${Math.min(12, 2 * T)} | ${Math.min(12, 2 * T + 1)} |`);
out.push('', '### F. P(at least P runes of domain A among the r runes channelled), a = runes of A in the 12-card rune deck');
for (const P of [1, 2, 3]) {
  out.push(`**Power cost ${P}**`, '| a | r=2 (T1 first) | r=3 (T1 second) | r=4 (T2 first) | r=5 (T2 second) | r=6 (T3 first) | r=7 (T3 second) | r=8 (T4 first) | r=9 (T4 second) |', '|---|---|---|---|---|---|---|---|---|');
  for (const a of [2, 3, 4, 5, 6, 7, 8, 9, 10]) out.push(`| ${a} | ${[2, 3, 4, 5, 6, 7, 8, 9].map((r) => pct(atLeast(12, a, r, P))).join(' | ')} |`);
}
out.push('', '### G. Minimum runes of a domain for P(pay power cost P on turn T) >= 90% / >= 80% (first player; second player in brackets)');
out.push('| P | T1 | T2 | T3 | T4 |', '|---|---|---|---|---|');
for (const P of [1, 2, 3]) out.push(`| ${P} | ${[1, 2, 3, 4].map((T) => { const f = (r, tg) => { for (let a = P; a <= 12; a++) if (atLeast(12, a, r, P) >= tg) return a; return '-'; }; return `${f(2 * T, 0.9)}/${f(2 * T, 0.8)} [${f(2 * T + 1, 0.9)}/${f(2 * T + 1, 0.8)}]`; }).join(' | ')} |`);
// expected count
out.push('', '### H. Expected copies of a K-card group among cards seen by turn T (keep): K*(4+T)/39');
out.push('| K | T1 | T2 | T3 | T4 | T5 | T6 |', '|---|---|---|---|---|---|---|'); for (const K of [6, 9, 12, 15, 20, 25]) out.push(`| ${K} | ${[1, 2, 3, 4, 5, 6].map((T) => ((K * (4 + T)) / 39).toFixed(2)).join(' | ')} |`);
console.log(out.join('\n'));
