'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { AxisId, Band, Deck, Fix, Line, LineReport, Role, SwapProposal, WinRoute } from '@/engine/types';
import { Bar, CardImage, Gauge, Heur, LegendPicker, Measured, Thumbs } from '../../components/card';
import { useLabels } from '../../components/Shell';
import type { AnalyzeResponse, BuildPickView, CardLookup, ClientCard } from '../../lib/api';
import { ROLE_LABELS, ROUTE_LABEL, axisLabel, bandVar, blocking, legendName, looksMeasured, pct } from '../../lib/ui';

export type PanelId = 'rating' | 'win' | 'network' | 'lines' | 'matchup' | 'themes' | 'improve';
export interface BuildLog { mode: string; picks: BuildPickView[]; notes: string[]; profile: { id: string; title: string; strategy: string } | null; at: string }

const TABS: { id: PanelId; label: string }[] = [
  { id: 'rating', label: 'Rating' },
  { id: 'win', label: 'Win conditions' },
  { id: 'lines', label: 'Lines' },
  { id: 'matchup', label: 'Matchup' },
  { id: 'network', label: 'Network' },
  { id: 'themes', label: 'Themes' },
  { id: 'improve', label: 'Improve' },
];

interface Common { lookup: CardLookup; onOpen: (id: string) => void }

export function Panels(props: {
  panel: PanelId; setPanel: (p: PanelId) => void;
  deck: Deck; analysis: AnalyzeResponse | null; lookup: CardLookup; onOpen: (id: string) => void; onFix: (fix: Fix) => void;
  opponent: string | null; onOpponent: (id: string | null, card: ClientCard | null) => void;
  onThemes: (w: Record<AxisId, number> | null) => void;
  proposals: SwapProposal[] | null; onPropose: (kind: 'improve' | 'swaps') => void; onApply: (swaps: SwapProposal[]) => void; onReject: (p: SwapProposal) => void;
  busy: string | null; log: BuildLog | null;
}) {
  const { panel, setPanel, analysis, lookup, onOpen } = props;
  return (
    <aside className="flex min-h-0 flex-col border-l border-edge bg-slate" aria-label="Analysis" data-testid="panels">
      <div className="flex shrink-0 gap-x-0.5 overflow-x-auto border-b border-edge px-2 pt-1.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id} type="button" role="tab" aria-selected={panel === t.id} data-testid={`tab-${t.id}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-1.5 pb-1.5 pt-1 text-[12px] font-semibold ${panel === t.id ? 'border-heat text-bone' : 'border-transparent text-mist hover:text-bone'}`}
            onClick={() => setPanel(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={panel} className="min-h-0 flex-1 overflow-y-auto p-3.5" role="tabpanel" data-testid={`panel-${panel}`}>
        {!analysis ? (
          <div className="skeleton h-32 rounded-lg" />
        ) : panel === 'rating' ? (
          <RatingPanel analysis={analysis} onFix={props.onFix} lookup={lookup} onOpen={onOpen} />
        ) : panel === 'win' ? (
          <WinPanel analysis={analysis} lookup={lookup} onOpen={onOpen} />
        ) : panel === 'lines' ? (
          <LinesPanel analysis={analysis} lookup={lookup} onOpen={onOpen} opponent={props.opponent} onOpponent={props.onOpponent} deck={props.deck} />
        ) : panel === 'matchup' ? (
          <MatchupPanel analysis={analysis} lookup={lookup} onOpen={onOpen} opponent={props.opponent} onOpponent={props.onOpponent} deck={props.deck} />
        ) : panel === 'network' ? (
          <NetworkPanel analysis={analysis} lookup={lookup} onOpen={onOpen} />
        ) : panel === 'themes' ? (
          <ThemesPanel analysis={analysis} deck={props.deck} onThemes={props.onThemes} />
        ) : (
          <ImprovePanel {...props} analysis={analysis} />
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------------------------
// Rating

function RatingPanel({ analysis, onFix }: Common & { analysis: AnalyzeResponse; onFix: (fix: Fix) => void }) {
  const { rating, summary, targets } = analysis;
  const errors = blocking(rating.violations);
  const others = rating.violations.filter((v) => v.severity !== 'error');
  const t = targets as typeof targets & { reason?: string; notes?: string[] };
  const curveMax = Math.max(1, ...summary.curve, ...targets.curve.map((b) => b.hi));
  const roles = (Object.keys(targets.roles) as Role[]).filter((r) => r !== 'unit-body' && r !== 'gear' && ((targets.roles[r]?.hi ?? 0) > 0 || (summary.roleCounts[r] ?? 0) > 0));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3.5">
        <Gauge value={rating.rating} size={76} />
        <div className="min-w-0">
          <p className="text-[13px]">
            {rating.legal ? 'Legal and complete.' : errors.length > 0 ? 'Not legal as built, so the rating is capped.' : 'Not finished yet, so the rating is capped.'}{' '}
            <span className="text-mist">The rating is the weighted mean of the nine parts below. Parts marked heuristic are judgements of the engine; the others compare the deck with rules or with measured public lists.</span>
          </p>
        </div>
      </div>

      {(errors.length > 0 || others.length > 0) && (
        <ul className="space-y-1.5" data-testid="violations">
          {[...errors, ...others].map((v, i) => (
            <li key={i} className="well px-2.5 py-1.5 text-[12.5px]" style={{ borderColor: v.severity === 'error' ? 'var(--color-bad)' : undefined }}>
              <span style={{ color: v.severity === 'error' ? 'var(--color-bad)' : 'var(--color-mist)' }}>{v.message}</span>{' '}
              <span className="text-dim">{v.rule}</span> {v.interpretation && <Heur title="The rules do not settle this case; the app takes the stricter reading." />}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2.5" data-testid="subscores">
        {rating.subscores.map((s) => (
          <div key={s.key}>
            <div className="flex items-baseline gap-2 text-[12.5px]">
              <span className="font-semibold">{s.label}</span>
              {s.heuristic && <Heur />}
              <span className="ml-auto text-dim">weight {s.weight}</span>
              <span className="num w-8 text-right text-[15px]" style={{ color: bandVar(s.value) }}>{Math.round(s.value)}</span>
            </div>
            <Bar value={s.value} />
            {s.fixes.map((f, i) => (
              <div key={i} className="mt-1 flex items-start gap-2 text-[12px] text-mist">
                <span className="min-w-0 flex-1">{f.text}</span>
                {f.filter && <button type="button" className="btn small shrink-0" onClick={() => onFix(f)} data-testid="fix-button">Show cards</button>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div>
        <h3 className="h mb-1 flex items-center gap-2">Shape against {targets.archetype} lists <Measured title="The bands are the middle half of public lists of the nearest archetype." /></h3>
        {t.reason && <p className="sub mb-2">{t.reason}</p>}
        <div className="well p-3">
          <div className="flex h-[92px] items-end gap-1.5" aria-label="Energy curve" data-testid="curve">
            {summary.curve.map((n, i) => {
              const band = targets.curve[i];
              const inside = band ? n >= band.lo && n <= band.hi : true;
              return (
                <div key={i} className="relative flex h-full flex-1 flex-col justify-end" title={`${i === 7 ? '7+' : i} Energy: ${n} cards${band ? `, public lists run ${band.lo} to ${band.hi}` : ''}`}>
                  {band && band.hi > 0 && (
                    <span className="absolute inset-x-0 rounded-sm border border-dashed border-edge-hi" style={{ bottom: `${(band.lo / curveMax) * 100}%`, height: `${Math.max(2, ((band.hi - band.lo) / curveMax) * 100)}%` }} />
                  )}
                  <span className="relative mx-auto w-[62%] rounded-t-sm" style={{ height: `${(n / curveMax) * 100}%`, background: inside ? 'var(--color-band-good)' : 'var(--color-bad)' }} />
                  <span className="num absolute inset-x-0 -top-0.5 text-center text-[11px] text-mist">{n}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1.5 text-center text-[11px] text-dim">
            {summary.curve.map((_, i) => <span key={i} className="flex-1">{i === 7 ? '7+' : i}</span>)}
          </div>
          <p className="sub mt-1.5">Cards by Energy cost. Dashed boxes: where public lists sit. Average {summary.avgEnergy.toFixed(2)}, lists run {targets.avgEnergy.lo} to {targets.avgEnergy.hi}.</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {(['unit', 'spell', 'gear'] as const).map((k) => <BandRow key={k} label={k === 'unit' ? 'Units' : k === 'spell' ? 'Spells' : 'Gear'} have={summary.typeCounts[k]} band={targets.types[k]} />)}
          {roles.map((r) => <BandRow key={r} label={ROLE_LABELS[r]} have={summary.roleCounts[r] ?? 0} band={targets.roles[r]!} />)}
        </div>
        {t.notes?.map((n, i) => <p key={i} className="sub mt-2">{n}</p>)}
      </div>
    </div>
  );
}

function BandRow({ label, have, band }: { label: string; have: number; band: Band }) {
  const inside = have >= band.lo && have <= band.hi;
  return (
    <div className="flex items-baseline gap-2 text-[12px]" title={`${label}: ${have} in the deck; public lists run ${band.lo} to ${band.hi}`}>
      <span className="min-w-0 flex-1 truncate text-mist">{label}</span>
      <span className="num text-[14px]" style={{ color: inside ? 'var(--color-bone)' : 'var(--color-bad)' }}>{have}</span>
      <span className="w-12 text-right text-dim">{band.lo}-{band.hi}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Win conditions

const SPREAD_ROUTES = new Set(['attrition', 'wide']);

function WinPanel({ analysis, lookup, onOpen }: Common & { analysis: AnalyzeResponse }) {
  const { win } = analysis;
  if (win.routes.length === 0) return <p className="sub">No win route found yet. Add units and ways to score, and the routes appear here with the cards that close them.</p>;
  return (
    <div className="space-y-3" data-testid="win-routes">
      <p className="sub">How this list wins, strongest route first. Strength and clock are estimates <Heur />; "folds to" rates are counted in synced lists <Measured />.</p>
      {win.hiddenDelivery && <p className="well px-2.5 py-1.5 text-[12.5px]">The deck can deliver points from Hidden cards, which the opponent cannot plan around.</p>}
      {win.routes.map((r) => <Route key={r.id} route={r} lookup={lookup} onOpen={onOpen} />)}
    </div>
  );
}

function Route({ route, lookup, onOpen }: Common & { route: WinRoute }) {
  const spread = SPREAD_ROUTES.has(route.id);
  return (
    <article className="well p-3" data-testid="win-route">
      <header className="flex items-baseline gap-2.5">
        <h3 className="h">{ROUTE_LABEL[route.id] ?? route.id}</h3>
        <span className="num text-[15px]" style={{ color: bandVar(route.strength * 100) }}>{pct(route.strength)}</span>
        <span className="sub">strength</span>
        <span className="ml-auto text-[12.5px]">wins about <span className="num text-[15px]">turn {route.clock}</span> uncontested</span>
      </header>
      <div className="mt-1"><Bar value={route.strength} max={1} /></div>

      <div className="mt-2.5">
        <p className="sub mb-1">
          {spread ? 'Cards that carry this route (no single card closes it)' : 'Closers'}: {route.closerCopies} copies, {pct(route.pCloserByTurn5)} to hold one by turn 5
        </p>
        <Thumbs ids={route.closers} lookup={lookup} onOpen={onOpen} size={62} />
      </div>
      {route.enablers.length > 0 && (
        <div className="mt-2">
          <p className="sub mb-1">Enablers</p>
          <Thumbs ids={route.enablers} lookup={lookup} onOpen={onOpen} size={42} max={12} />
        </div>
      )}

      {route.foldsTo.length > 0 && (
        <div className="mt-3 border-t border-edge pt-2">
          <h4 className="mb-1.5 text-[12.5px] font-semibold text-bad">Folds to</h4>
          <ul className="space-y-2.5">
            {route.foldsTo.map((fold, i) => (
              <li key={i} className="text-[12.5px]" data-testid="folds-to">
                <p>{fold.text}</p>
                <div className="mt-1 flex items-end gap-3">
                  {fold.answerIds && fold.answerIds.length > 0 && <Thumbs ids={fold.answerIds} lookup={lookup} onOpen={onOpen} size={40} />}
                  {fold.fieldRate !== null && <span className="sub pb-0.5">in {pct(fold.fieldRate)} of synced lists <Measured /></span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {route.notes.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-edge pt-2 text-[12px] text-mist">
          {route.notes.map((n, i) => <li key={i}>{n.replace(/\s*\(?HEURISTIC\)?:?\.?/g, (m) => (m.includes(':') ? ' Note:' : ''))} {/HEURISTIC/.test(n) && <Heur />}</li>)}
        </ul>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------------------------
// Lines

type GroupId = keyof LineReport;
const GROUPS: { id: GroupId; label: string; blurb: string }[] = [
  { id: 'keeps', label: 'Keeps', blurb: 'Which opening hands to keep, with the odds of seeing them.' },
  { id: 'turns', label: 'Turn plan', blurb: 'What the deck plays on each turn and how often it has it.' },
  { id: 'sequencing', label: 'Sequencing', blurb: 'Pairs that only work in one order.' },
  { id: 'packages', label: 'Packages', blurb: 'Groups of cards that work as one engine.' },
  { id: 'oneAway', label: 'One away', blurb: 'Packages that one more card would switch on.' },
  { id: 'spikes', label: 'Spikes', blurb: 'Turns where the deck jumps ahead.' },
  { id: 'matchup', label: 'Matchup', blurb: 'How the deck meets the chosen opponent.' },
  { id: 'side', label: 'Side in / out', blurb: 'One-for-one exchanges against the chosen opponent.' },
  { id: 'format', label: 'Format notes', blurb: 'Battlefields and what this format changes.' },
];

function LineItem({ line, lookup, onOpen, otherLabel }: Common & { line: Line; otherLabel: string }) {
  return (
    <li className="well p-2.5" data-testid="line">
      <p className="text-[13px] leading-snug">{line.text}</p>
      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <Thumbs ids={line.cardIds} lookup={lookup} onOpen={onOpen} size={50} />
        {line.otherIds && line.otherIds.length > 0 && (
          <span className="flex items-end gap-1.5">
            <span className="sub pb-1">{otherLabel}</span>
            <Thumbs ids={line.otherIds} lookup={lookup} onOpen={onOpen} size={40} dim />
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] text-mist">
        {line.probability !== null && <span className="num mr-2 text-[13px] text-bone" title="Chance of having the cards this line names">{pct(line.probability)}</span>}
        {line.heuristic ? <Heur /> : <span className="mark rule" title="Follows from the rules or from counted data, not from a judgement.">rule or data</span>} {line.reason}
      </p>
    </li>
  );
}

function OpponentBar({ opponent, onOpponent, deck, lookup }: { opponent: string | null; onOpponent: (id: string | null, card: ClientCard | null) => void; deck: Deck; lookup: CardLookup }) {
  const card = opponent ? lookup[opponent] : undefined;
  return (
    <div className="well mb-3 flex items-center gap-3 p-2.5" data-testid="opponent-bar">
      {card && <span className="w-[46px] shrink-0"><CardImage card={card} /></span>}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold">{card ? `Against ${legendName(card)}` : 'No opponent chosen'}</p>
        <p className="sub">{card ? 'Matchup and side-deck lines are written for this legend\'s typical public lists.' : 'Pick the legend you expect to face to get matchup and side-deck lines.'}</p>
      </div>
      <LegendPicker value={opponent} onChange={onOpponent} label="Opponent's legend" emptyText="Choose opponent" exclude={deck.format === '2v2' ? null : null} />
    </div>
  );
}

function LinesPanel({ analysis, lookup, onOpen, opponent, onOpponent, deck }: Common & { analysis: AnalyzeResponse; opponent: string | null; onOpponent: (id: string | null, card: ClientCard | null) => void; deck: Deck }) {
  const [group, setGroup] = useState<GroupId>('keeps');
  const lines = analysis.lines[group];
  const def = GROUPS.find((g) => g.id === group)!;
  const needsOpponent = group === 'matchup' || group === 'side';
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-1" role="group" aria-label="Kind of line">
        {GROUPS.map((g) => (
          <button key={g.id} type="button" className="chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)} data-testid={`lines-${g.id}`}>
            {g.label} <span className="num text-dim">{analysis.lines[g.id].length}</span>
          </button>
        ))}
      </div>
      {needsOpponent && <OpponentBar opponent={opponent} onOpponent={onOpponent} deck={deck} lookup={lookup} />}
      <p className="sub mb-2">{def.blurb}</p>
      <LineList lines={lines} lookup={lookup} onOpen={onOpen} group={group} hasOpponent={!!opponent} />
    </div>
  );
}

function LineList({ lines, lookup, onOpen, group, hasOpponent }: Common & { lines: Line[]; group: GroupId; hasOpponent: boolean }) {
  if (lines.length === 0) {
    const why = (group === 'matchup' || group === 'side') && !hasOpponent
      ? 'Choose an opponent above.'
      : group === 'side' ? 'No side-deck exchange passes the bar against this legend, or the deck has no side deck.'
      : group === 'oneAway' ? 'No package in this deck is a single card short.'
      : 'Nothing to say here for this deck yet. Lines appear as the deck fills up.';
    return <p className="sub py-2" data-testid="lines-empty">{why}</p>;
  }
  const otherLabel = group === 'oneAway' ? 'missing' : group === 'matchup' || group === 'side' ? 'their cards' : 'also named';
  return <ul className="space-y-2" data-testid="line-list">{lines.map((l, i) => <LineItem key={i} line={l} lookup={lookup} onOpen={onOpen} otherLabel={otherLabel} />)}</ul>;
}

function MatchupPanel({ analysis, lookup, onOpen, opponent, onOpponent, deck }: Common & { analysis: AnalyzeResponse; opponent: string | null; onOpponent: (id: string | null, card: ClientCard | null) => void; deck: Deck }) {
  return (
    <div>
      <OpponentBar opponent={opponent} onOpponent={onOpponent} deck={deck} lookup={lookup} />
      <h3 className="h mb-1.5">How the deck meets it</h3>
      <LineList lines={analysis.lines.matchup} lookup={lookup} onOpen={onOpen} group="matchup" hasOpponent={!!opponent} />
      <h3 className="h mb-1.5 mt-4">Side in and out</h3>
      <LineList lines={analysis.lines.side} lookup={lookup} onOpen={onOpen} group="side" hasOpponent={!!opponent} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Network

function NetworkPanel({ analysis, lookup, onOpen }: Common & { analysis: AnalyzeResponse }) {
  const pairs = useMemo(() => {
    const seen = new Map<string, { a: string; b: string; net: number; reason: string }>();
    for (const s of Object.values(analysis.deckScores)) {
      for (const p of s.partners) {
        const key = [s.id, p.id].sort().join('|');
        const cur = seen.get(key);
        if (!cur || p.net > cur.net) seen.set(key, { a: s.id, b: p.id, net: p.net, reason: p.reason });
      }
    }
    return [...seen.values()].sort((x, y) => y.net - x.net).slice(0, 18);
  }, [analysis]);
  return (
    <div className="space-y-4">
      <section data-testid="network-pairs">
        <h3 className="h mb-1">Strongest pairs in the deck</h3>
        <p className="sub mb-2">Pairs the engine read from the two card texts are marked heuristic; pairs counted in public lists are marked measured. Open a card for the full reason.</p>
        {pairs.length === 0 && <p className="sub">No pair yet. Pairs appear once two cards of the deck work together.</p>}
        <ul className="space-y-1.5">
          {pairs.map((p) => (
            <li key={`${p.a}|${p.b}`} className="well flex items-center gap-3 px-2 py-1.5">
              <Thumbs ids={[p.a, p.b]} lookup={lookup} onOpen={onOpen} size={38} />
              <span className="min-w-0 flex-1 text-[12.5px] leading-snug">
                <span className="text-mist">{lookup[p.a]?.shortName ?? p.a} + {lookup[p.b]?.shortName ?? p.b}</span>
                <span className="block">{p.reason.replace(/ \(measured\)$/, '')} {looksMeasured(p.reason) ? <Measured /> : <Heur />}</span>
              </span>
              <span className="num shrink-0 text-[14px] text-mist" title="Net strength of the pair">+{p.net.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="h mb-1.5">Packages</h3>
        <LineList lines={analysis.lines.packages} lookup={lookup} onOpen={onOpen} group="packages" hasOpponent />
      </section>
      <section>
        <h3 className="h mb-1.5">One card away</h3>
        <LineList lines={analysis.lines.oneAway} lookup={lookup} onOpen={onOpen} group="oneAway" hasOpponent />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Themes

function ThemesPanel({ analysis, deck, onThemes }: { analysis: AnalyzeResponse; deck: Deck; onThemes: (w: Record<AxisId, number> | null) => void }) {
  const labels = useLabels();
  const weights = deck.themeWeights ?? analysis.themeWeights;
  const [adding, setAdding] = useState('');
  const axes = Object.keys(weights).sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0) || a.localeCompare(b));
  const totals = analysis.summary.axisTotals;
  const set = (axis: AxisId, v: number) => onThemes({ ...weights, [axis]: v });
  const rest = Object.keys(totals).filter((a) => !(a in weights)).sort((a, b) => (totals[b]!.e + totals[b]!.p) - (totals[a]!.e + totals[a]!.p));
  return (
    <div data-testid="themes">
      <p className="sub mb-3">
        What the deck is built around. Each weight says how much a card on that theme gains in its score. {deck.themeWeights ? 'You set these weights.' : <>They come from the legend's text and its public lists <Heur />.</>}
      </p>
      <ul className="space-y-3">
        {axes.map((axis) => {
          const t = totals[axis];
          return (
            <li key={axis}>
              <div className="flex items-baseline gap-2 text-[12.5px]">
                <span className="font-semibold">{axisLabel(axis, labels)}</span>
                <span className="sub">{t ? `${fmt(t.e)} enabler, ${fmt(t.p)} payoff copies` : 'no card of the deck is on it'}</span>
                <span className="num ml-auto text-[14px]">{(weights[axis] ?? 0).toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={weights[axis] ?? 0} onChange={(e) => set(axis, Number(e.target.value))} className="w-full accent-[var(--color-heat)]" aria-label={`Weight of ${axisLabel(axis, labels)}`} />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <select className="field min-w-0 flex-1" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Theme to add">
          <option value="">Add a theme</option>
          {[...new Set([...rest, ...(labels?.axes.map((a) => a.id) ?? [])])].filter((a) => !(a in weights)).map((a) => <option key={a} value={a}>{axisLabel(a, labels)}{totals[a] ? ` (${fmt(totals[a]!.e + totals[a]!.p)} copies)` : ''}</option>)}
        </select>
        <button type="button" className="btn" disabled={!adding} onClick={() => { set(adding, 0.5); setAdding(''); }}>Add</button>
        <button type="button" className="btn quiet" disabled={!deck.themeWeights} onClick={() => onThemes(null)}>Follow the legend again</button>
      </div>
    </div>
  );
}
const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// ---------------------------------------------------------------------------------------------
// Improve

const PHASE_LABEL: Record<string, string> = { champion: 'Champion', package: 'Package', core: 'Core of its public lists', curve: 'Curve', fill: 'Fill', battlefields: 'Battlefield' };
const phaseLabel = (p: string): string => PHASE_LABEL[p] ?? (p.startsWith('side:') ? `Side deck: ${p.slice(5).replace(/-/g, ' ')}` : p);

function ImprovePanel({ analysis, lookup, onOpen, proposals, onPropose, onApply, onReject, busy, log }: Common & {
  analysis: AnalyzeResponse; proposals: SwapProposal[] | null; onPropose: (kind: 'improve' | 'swaps') => void; onApply: (swaps: SwapProposal[]) => void; onReject: (p: SwapProposal) => void; busy: string | null; log: BuildLog | null;
}) {
  return (
    <div className="space-y-4" data-testid="improve">
      <div>
        <p className="sub mb-2">Swap proposals take the weakest copy out and put the best card for that slot in. Each one is checked: it has to raise the deck rating. Nothing changes until you accept.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn primary" disabled={!!busy} onClick={() => onPropose('improve')} data-testid="improve-run">{busy === 'improve' ? 'Looking' : 'Improve this deck'}</button>
          <button type="button" className="btn" disabled={!!busy} onClick={() => onPropose('swaps')} data-testid="swaps-run">{busy === 'swaps' ? 'Looking' : 'Suggest single swaps'}</button>
          {proposals && proposals.length > 1 && <button type="button" className="btn ml-auto" disabled={!!busy} onClick={() => onApply(proposals)} data-testid="apply-all">Apply all {proposals.length}</button>}
        </div>
      </div>

      {proposals && proposals.length === 0 && <p className="sub" data-testid="no-proposals">No proposal left. Current rating {analysis.precise.toFixed(1)}.</p>}
      {proposals && proposals.length > 0 && (
        <ul className="space-y-2.5" data-testid="proposals">
          {proposals.map((p, i) => {
            const delta = p.ratingAfter - p.ratingBefore;
            return (
              <li key={`${p.zone}|${p.out}|${p.in}|${i}`} className="well p-2.5" data-testid="proposal">
                <div className="flex items-center gap-2.5">
                  <SwapCard id={p.out} lookup={lookup} onOpen={onOpen} label="out" />
                  <span className="display text-[20px] text-dim" aria-hidden>→</span>
                  <SwapCard id={p.in} lookup={lookup} onOpen={onOpen} label="in" />
                  <div className="ml-auto text-right">
                    <div className="num text-[20px]" style={{ color: delta > 0 ? 'var(--color-ok)' : 'var(--color-mist)' } as CSSProperties} title={`Rating ${p.ratingBefore.toFixed(1)} to ${p.ratingAfter.toFixed(1)}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</div>
                    <div className="sub">rating, {p.zone === 'side' ? 'side deck' : 'main deck'}</div>
                    <div className="mt-1.5 flex justify-end gap-1.5">
                      <button type="button" className="btn small primary" disabled={!!busy} onClick={() => onApply([p])} data-testid="accept">Accept</button>
                      <button type="button" className="btn small" disabled={!!busy} onClick={() => onReject(p)} data-testid="reject">Reject</button>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-mist">{p.reason}</p>
              </li>
            );
          })}
        </ul>
      )}

      {log && (
        <details className="well p-2.5" open={!proposals} data-testid="build-log">
          <summary className="cursor-pointer text-[13px] font-semibold">Why the builder chose these cards ({log.picks.length} picks)</summary>
          {log.profile && <p className="sub mt-2">Plan: {log.profile.title}. {log.profile.strategy} <Heur /></p>}
          {log.notes.map((n, i) => <p key={i} className="sub mt-1.5">{n}</p>)}
          <ul className="mt-2.5 space-y-2">
            {log.picks.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-[12px]">
                <button type="button" className={`shrink-0 self-start ${lookup[p.id]?.type === 'battlefield' ? 'w-[58px]' : 'w-[42px]'}`} onClick={() => onOpen(p.id)}><CardImage card={lookup[p.id]} id={p.id} /></button>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="text-bone">{p.qty > 1 ? `${p.qty} × ` : ''}{lookup[p.id]?.name ?? p.id}</span> <span className="text-dim">{phaseLabel(p.phase)}</span>
                  <span className="block text-mist">{p.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function SwapCard({ id, lookup, onOpen, label }: Common & { id: string; label: 'out' | 'in' }): ReactNode {
  return (
    <button type="button" className="w-[84px] shrink-0 text-left" onClick={() => onOpen(id)} title={lookup[id]?.name ?? id} data-testid={`swap-${label}`}>
      <span className={label === 'out' ? 'block opacity-70' : 'block'}><CardImage card={lookup[id]} id={id} /></span>
      <span className="mt-0.5 block truncate text-[11px]" style={{ color: label === 'out' ? 'var(--color-bad)' : 'var(--color-ok)' }}>{label === 'out' ? 'Out' : 'In'}: {lookup[id]?.name ?? id}</span>
    </button>
  );
}
