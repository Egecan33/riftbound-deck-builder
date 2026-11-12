'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { FormatRules } from '@/engine/rules/formats';
import type { CardScore, Deck, DeckEntry, Domain } from '@/engine/types';
import { CardImage, Pip, ScoreBadge } from '../../components/card';
import { useLabels } from '../../components/Shell';
import type { AnalyzeResponse, BrowseZone, CardLookup, ClientCard } from '../../lib/api';
import { DOMAINS, DOMAIN_LABEL, countOf, domainVar, isLimitGate, runeCount, type CardZone } from '../../lib/ui';

const GROUPS: { type: 'unit' | 'spell' | 'gear'; label: string }[] = [
  { type: 'unit', label: 'Units' },
  { type: 'spell', label: 'Spells' },
  { type: 'gear', label: 'Gear' },
];

export function DeckView({ deck, lookup, analysis, weakest, rules, busy, onOpen, onAdd, onRemove, onLock, atLimit, onRune, onBuild, onBrowse, browseZone }: {
  deck: Deck;
  lookup: CardLookup;
  analysis: AnalyzeResponse | null;
  weakest: Set<string>;
  rules: FormatRules;
  busy: string | null;
  onOpen: (id: string) => void;
  onAdd: (zone: CardZone | 'battlefields', id: string) => void;
  onRemove: (zone: CardZone | 'battlefields', id: string) => void;
  onLock: (zone: CardZone, id: string) => void;
  atLimit: (id: string) => boolean;
  onRune: (domain: Domain, n: number) => void;
  onBuild: (mode: 'side' | 'runes' | 'battlefields') => void;
  onBrowse: (zone: BrowseZone) => void;
  browseZone: BrowseZone;
}) {
  const labels = useLabels();
  const legend = deck.legend ? lookup[deck.legend] : undefined;
  const sorted = (entries: DeckEntry[]) =>
    [...entries].sort((a, b) => (lookup[a.id]?.energy ?? 0) - (lookup[b.id]?.energy ?? 0) || (lookup[a.id]?.name ?? a.id).localeCompare(lookup[b.id]?.name ?? b.id));
  const mainGroups = GROUPS.map((g) => ({ ...g, entries: sorted(deck.main.filter((e) => lookup[e.id]?.type === g.type)) }));
  const other = sorted(deck.main.filter((e) => !GROUPS.some((g) => g.type === lookup[e.id]?.type)));
  const runeDomains = [...new Set<Domain>([...(legend?.domains ?? []), ...DOMAINS.filter((d) => (deck.runes[d] ?? 0) > 0)])];
  const demand = analysis?.summary.powerDemand ?? {};

  const tile = (zone: CardZone, e: DeckEntry, raw: CardScore | undefined) => {
    const card = lookup[e.id];
    // "No more copies fit" is not a verdict on a card that is already in: it gets no score rather than a zero.
    const score = isLimitGate(raw?.gate) ? undefined : raw;
    const isChampion = zone === 'main' && e.id === deck.champion;
    const weak = zone === 'main' && weakest.has(e.id);
    return (
      <div key={e.id} className={`tile ${e.locked ? 'locked' : weak ? 'weak' : ''} ${score?.gate ? 'gated' : ''}`} data-testid="deck-tile" data-card={e.id}>
        <button type="button" className="tile-main" onClick={() => onOpen(e.id)} title={`${card?.name ?? e.id}${score ? `: score ${score.score}` : ''}${weak ? '. One of the weakest cards in the main deck.' : ''}${score?.gate ? `. ${score.gate.message}` : ''}`}>
          <CardImage card={card} id={e.id} />
        </button>
        {score && <ScoreBadge score={score.score} gated={!!score.gate} />}
        <span className="qty">{e.qty}</span>
        {(isChampion || weak || e.locked) && (
          <span className="tile-note">{isChampion ? 'Chosen Champion' : e.locked ? 'Locked' : 'Weakest'}</span>
        )}
        <span className="tile-actions">
          <button type="button" className="tile-btn" onClick={() => onLock(zone, e.id)} aria-label={`${e.locked ? 'Unlock' : 'Lock'} ${card?.name ?? e.id}`} title={e.locked ? 'Unlock: builds may replace it' : 'Lock: builds and swaps keep it'}>{e.locked ? 'unlock' : 'lock'}</button>
          <button type="button" className="tile-btn" onClick={() => onRemove(zone, e.id)} aria-label={`Remove one ${card?.name ?? e.id}`} data-testid="tile-remove">−</button>
          {!atLimit(e.id) && <button type="button" className="tile-btn" onClick={() => onAdd(zone, e.id)} aria-label={`Add one ${card?.name ?? e.id}`}>+</button>}
        </span>
      </div>
    );
  };
  const grid = (children: ReactNode) => <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">{children}</div>;

  const mainCount = countOf(deck.main);
  const sideCount = countOf(deck.side);

  return (
    <section className="min-h-0 overflow-y-auto bg-void px-4 pb-6" aria-label="Deck" data-testid="deck-view">
      <Zone
        title="Main deck" count={`${mainCount} / ${rules.mainExact ?? `${rules.mainMin}+`}`} active={browseZone === 'main'} onBrowse={() => onBrowse('main')}
        note={analysis ? `${analysis.summary.typeCounts.unit} units, ${analysis.summary.typeCounts.spell} spells, ${analysis.summary.typeCounts.gear} gear. Average Energy ${analysis.summary.avgEnergy.toFixed(2)}.` : undefined}
      >
        {deck.main.length === 0 && <Empty>No cards yet. Add cards from the browser on the left, or use Auto-build.</Empty>}
        {mainGroups.filter((g) => g.entries.length > 0).map((g) => (
          <div key={g.type} className="mb-3" data-testid={`group-${g.type}`}>
            <h4 className="sub mb-1.5">{g.label} <span className="num text-bone">{countOf(g.entries)}</span></h4>
            {grid(g.entries.map((e) => tile('main', e, analysis?.deckScores[e.id])))}
          </div>
        ))}
        {other.length > 0 && (
          <div className="mb-3">
            <h4 className="sub mb-1.5 text-bad">Cards that do not belong in a main deck <span className="num">{countOf(other)}</span></h4>
            {grid(other.map((e) => tile('main', e, analysis?.deckScores[e.id])))}
          </div>
        )}
      </Zone>

      <Zone
        title="Rune deck" count={`${runeCount(deck)} / 12`}
        action={<button type="button" className="btn small" disabled={!!busy || !deck.legend} onClick={() => onBuild('runes')} data-testid="build-runes">Set the split for me</button>}
        note={Object.keys(demand).length ? `Power the main deck asks for: ${Object.entries(demand).map(([d, n]) => `${n} ${DOMAIN_LABEL[d as Domain]}`).join(', ')}.` : undefined}
      >
        {runeDomains.length === 0 && <Empty>Choose a legend first: its two domains decide which runes the deck may run.</Empty>}
        <div className="flex flex-wrap gap-4">
          {runeDomains.map((d) => {
            const n = deck.runes[d] ?? 0;
            const runeId = labels?.runeCards[d];
            return (
              <div key={d} className="flex items-center gap-3" data-testid={`rune-${d}`}>
                <button type="button" className="w-[58px]" onClick={() => runeId && onOpen(runeId)} title={`${DOMAIN_LABEL[d]} Rune`}>
                  <CardImage id={runeId} name={`${DOMAIN_LABEL[d]} Rune`} />
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-[12.5px]"><Pip domain={d} /> {DOMAIN_LABEL[d]}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button type="button" className="tile-btn" disabled={n === 0} onClick={() => onRune(d, n - 1)} aria-label={`One ${DOMAIN_LABEL[d]} rune fewer`}>−</button>
                    <span className="num w-7 text-center text-[20px]" style={{ color: domainVar(d) } as CSSProperties}>{n}</span>
                    <button type="button" className="tile-btn" onClick={() => onRune(d, n + 1)} aria-label={`One ${DOMAIN_LABEL[d]} rune more`}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Zone>

      <Zone
        title="Battlefields" count={`${deck.battlefields.length} / 3`} active={browseZone === 'battlefields'} onBrowse={() => onBrowse('battlefields')}
        action={<button type="button" className="btn small" disabled={!!busy || !deck.legend} onClick={() => onBuild('battlefields')} data-testid="build-battlefields">Choose for me</button>}
      >
        {deck.battlefields.length === 0 && <Empty>No battlefields yet. A deck brings three.</Empty>}
        <div className="grid grid-cols-3 gap-2">
          {deck.battlefields.map((bid) => (
            <div key={bid} className="tile" data-testid="battlefield-tile">
              <button type="button" className="tile-main" onClick={() => onOpen(bid)} title={lookup[bid]?.name ?? bid}>
                <CardImage card={lookup[bid]} id={bid} wide />
              </button>
              <span className="tile-actions">
                <button type="button" className="tile-btn" onClick={() => onRemove('battlefields', bid)} aria-label={`Remove ${lookup[bid]?.name ?? bid}`}>−</button>
              </span>
            </div>
          ))}
        </div>
      </Zone>

      {rules.sideAllowed ? (
        <Zone
          title="Side deck" count={`${sideCount} / ${rules.sideMax}`} active={browseZone === 'side'} onBrowse={() => onBrowse('side')}
          action={<button type="button" className="btn small" disabled={!!busy || !deck.legend} onClick={() => onBuild('side')} data-testid="build-side">Plan it for me</button>}
          note={deck.format === 'standard-bo1' ? 'Best of one uses a side deck only when the head judge allows it.' : undefined}
        >
          {deck.side.length === 0 && <Empty>Empty. The side deck is optional, up to {rules.sideMax} cards.</Empty>}
          {grid(sorted(deck.side).map((e) => tile('side', e, analysis?.sideScores[e.id] ?? analysis?.deckScores[e.id])))}
        </Zone>
      ) : (
        deck.side.length > 0 && (
          <Zone title="Side deck" count={`${sideCount}`} note="This format has no side deck. These cards are kept but do not count.">
            {grid(sorted(deck.side).map((e) => tile('side', e, analysis?.sideScores[e.id])))}
          </Zone>
        )
      )}
    </section>
  );
}

function Zone({ title, count, note, action, active, onBrowse, children }: { title: string; count: string; note?: string; action?: ReactNode; active?: boolean; onBrowse?: () => void; children: ReactNode }) {
  return (
    <div className="pt-4" data-testid={`zone-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="mb-2 flex items-baseline gap-2.5 border-b border-edge pb-1.5">
        <h3 className="h">{title}</h3>
        <span className="num text-[15px] text-mist">{count}</span>
        {note && <span className="sub min-w-0 flex-1 truncate" title={note}>{note}</span>}
        <span className="ml-auto flex shrink-0 gap-1.5">
          {action}
          {onBrowse && <button type="button" className="btn small" aria-pressed={active} disabled={active} onClick={onBrowse}>{active ? 'Browsing for this zone' : 'Browse cards for it'}</button>}
        </span>
      </div>
      {children}
    </div>
  );
}
const Empty = ({ children }: { children: ReactNode }) => <p className="sub py-3">{children}</p>;

export type { ClientCard };
