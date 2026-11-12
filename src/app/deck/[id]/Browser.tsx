'use client';

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { CardType, Deck, Domain, Role } from '@/engine/types';
import { DomainFilter, CardImage, ScoreBadge } from '../../components/card';
import { useLabels, useNotify } from '../../components/Shell';
import { VirtualGrid, usePaged } from '../../components/VirtualGrid';
import { browseCards, type BrowseZone, type CardSort, type ClientCard, type ScoredCard } from '../../lib/api';
import { DEFAULT_QUERY, ROLES, ROLE_LABELS, activeFilterCount, gateNote, isLimitGate, qtyOf, toFilters, type BrowserQuery, type CardZone } from '../../lib/ui';

const PAGE = 60;
const SORTS: { id: CardSort; label: string }[] = [
  { id: 'score', label: 'Score in this deck' },
  { id: 'rating', label: 'Card rating' },
  { id: 'popularity', label: 'Played most' },
  { id: 'energy', label: 'Energy cost' },
  { id: 'name', label: 'Name' },
];
const ZONE_LABEL: Record<BrowseZone, string> = { main: 'Main deck', side: 'Side deck', battlefields: 'Battlefields' };

export function Browser({ deck, live, query, setQuery, onOpen, onAdd, onRemove, atLimit, legendDomains, sideAllowed }: {
  /** The settled deck: what the scores are computed against. */
  deck: Deck;
  /** The deck as it is right now, for the copy counts on the tiles. */
  live: Deck;
  query: BrowserQuery;
  setQuery: Dispatch<SetStateAction<BrowserQuery>>;
  onOpen: (card: ClientCard) => void;
  onAdd: (zone: CardZone | 'battlefields', card: ClientCard) => void;
  onRemove: (zone: CardZone | 'battlefields', id: string) => void;
  atLimit: (id: string) => boolean;
  legendDomains: Domain[];
  sideAllowed: boolean;
}) {
  const notify = useNotify();
  const labels = useLabels();
  const [typed, setTyped] = useState(query.q);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setTyped(query.q), [query.q]);
  useEffect(() => {
    if (typed === query.q) return;
    const t = setTimeout(() => setQuery((q) => ({ ...q, q: typed })), 180);
    return () => clearTimeout(t);
  }, [typed, query.q, setQuery]);
  useEffect(() => {
    if (query.fromFix) setShowFilters(true);
  }, [query.fromFix]);

  const zone: BrowseZone = query.zone === 'side' && !sideAllowed ? 'main' : query.zone;
  const filters = useMemo(() => toFilters(query), [query]);
  const queryKey = JSON.stringify([zone, query.q, filters, query.sort]);
  // The deck is part of the key: a changed deck re-scores every card. Old pages stay until the new ones arrive.
  const key = useMemo(() => `${queryKey}|${JSON.stringify([deck.legend, deck.champion, deck.format, deck.power, deck.main, deck.side, deck.battlefields, deck.runes, deck.themeWeights])}`, [queryKey, deck]);
  const [gated, setGated] = useState(0);
  const fetchPage = useCallback(async (page: number, signal: AbortSignal) => {
    const res = await browseCards({ deck, zone, q: query.q, filters, sort: query.sort, page, pageSize: PAGE }, signal);
    setGated(res.gated);
    return { total: res.total, items: res.cards };
  }, [deck, zone, query.q, query.sort, filters]);
  const { total, loading, ensure, itemAt } = usePaged<ScoredCard>(key, PAGE, fetchPage, notify.error);

  const set = <K extends keyof BrowserQuery>(k: K, v: BrowserQuery[K]) => setQuery((q) => ({ ...q, [k]: v, fromFix: k === 'zone' ? null : q.fromFix }));
  const filterCount = activeFilterCount(query);
  const wide = zone === 'battlefields';

  return (
    <section className="flex min-h-0 flex-col border-r border-edge" aria-label="Card browser" data-testid="browser">
      <div className="shrink-0 space-y-2 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="seg" role="group" aria-label="Zone to add cards to">
            {(['main', 'side', 'battlefields'] as BrowseZone[]).filter((z) => z !== 'side' || sideAllowed).map((z) => (
              <button key={z} type="button" aria-pressed={zone === z} onClick={() => set('zone', z)} data-testid={`browse-${z}`}>{ZONE_LABEL[z]}</button>
            ))}
          </div>
          <span className="sub ml-auto whitespace-nowrap" data-testid="browser-total" title="Cards that fit the deck come first; cards it cannot run are greyed with the reason.">
            {total === null ? 'Loading' : gated > 0 && !query.hideGated ? `${total - gated} fit, ${gated} do not` : `${total} cards`}{loading && total !== null ? ' …' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input className="field min-w-0 flex-1" placeholder="Search name, text or tag" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Search cards" data-testid="browser-search" />
          <select className="field" value={query.sort} onChange={(e) => set('sort', e.target.value as CardSort)} aria-label="Sort by">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" className="btn" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)} data-testid="browser-filters">
            Filters{filterCount ? ` (${filterCount})` : ''}
          </button>
        </div>
        {query.fromFix && (
          <div className="well flex items-start gap-2 px-2.5 py-1.5 text-[12px]">
            <span className="min-w-0 flex-1 text-mist">Showing cards for: {query.fromFix}</span>
            <button type="button" className="btn quiet small" onClick={() => setQuery({ ...DEFAULT_QUERY, zone: query.zone })}>Clear</button>
          </div>
        )}
        {showFilters && (
          <div className="well space-y-2 p-2.5" data-testid="filter-panel">
            <div className="flex flex-wrap items-center gap-2">
              {!wide && (
                <select className="field" value={query.type} onChange={(e) => set('type', e.target.value as CardType | '')} aria-label="Card type">
                  <option value="">Any type</option>
                  <option value="unit">Units</option>
                  <option value="spell">Spells</option>
                  <option value="gear">Gear</option>
                </select>
              )}
              {!wide && (
                <select className="field" value={query.role} onChange={(e) => set('role', e.target.value as Role | '')} aria-label="Role" data-testid="filter-role">
                  <option value="">Any role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              )}
              <select className="field" value={query.axis} onChange={(e) => set('axis', e.target.value)} aria-label="Theme">
                <option value="">Any theme</option>
                {(labels?.axes ?? []).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
              {!wide && (
                <span className="flex items-center gap-1 text-[12px] text-mist">
                  Energy
                  <input className="field w-11 text-center" inputMode="numeric" placeholder="0" value={query.energyMin} onChange={(e) => set('energyMin', e.target.value)} aria-label="Lowest Energy" />
                  to
                  <input className="field w-11 text-center" inputMode="numeric" placeholder="12" value={query.energyMax} onChange={(e) => set('energyMax', e.target.value)} aria-label="Highest Energy" />
                </span>
              )}
            </div>
            {!wide && <DomainFilter value={query.domains} onChange={(d) => set('domains', d)} only={legendDomains.length ? legendDomains : undefined} />}
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" className="chip" aria-pressed={query.hideGated} onClick={() => set('hideGated', !query.hideGated)}>Hide cards the deck cannot run</button>
              <button type="button" className="chip" aria-pressed={query.hideInDeck} onClick={() => set('hideInDeck', !query.hideInDeck)}>Hide cards already in</button>
              <button type="button" className="chip" aria-pressed={query.owned} onClick={() => set('owned', !query.owned)}>Only cards I own</button>
              {filterCount > 0 && <button type="button" className="btn quiet small ml-auto" onClick={() => setQuery({ ...DEFAULT_QUERY, zone: query.zone, q: query.q, sort: query.sort })}>Clear filters</button>}
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <VirtualGrid<ScoredCard>
          count={total ?? 24}
          itemAt={itemAt}
          ensure={ensure}
          keyOf={(c) => c.card.id}
          minTile={wide ? 170 : 92}
          gap={8}
          wide={wide}
          resetKey={queryKey}
          testId="browser-grid"
          empty={<p className="sub px-2 py-8 text-center">No card matches. Clear a filter or change the search.</p>}
          render={(item) => {
            const have = zone === 'battlefields' ? (live.battlefields.includes(item.card.id) ? 1 : 0) : qtyOf(live[zone], item.card.id);
            const limit = isLimitGate(item.score.gate);
            const gate = limit ? null : item.score.gate;
            const full = zone === 'battlefields' ? have > 0 : limit || atLimit(item.card.id);
            return (
              <div className={`tile ${gate ? 'gated' : ''}`} data-testid="browser-tile" data-card={item.card.id}>
                <button type="button" className="tile-main" onClick={() => onOpen(item.card)} title={item.score.gate ? item.score.gate.message : `${item.card.name}: score ${item.score.score}. ${item.score.reasons[1] ?? ''}`}>
                  <CardImage card={item.card} wide={wide} />
                </button>
                {limit ? <span className="score gated" style={{ background: 'var(--color-band-gated)' }} title={item.score.gate!.message}>max</span> : <ScoreBadge score={item.score.score} gated={!!gate} title={gate?.message} />}
                {have > 0 && <span className="qty" title={`${have} in this zone`}>{zone === 'battlefields' ? 'in' : have}</span>}
                {gate && <span className="tile-note">{gateNote(gate)}</span>}
                {!gate && (
                  <span className="tile-actions">
                    {have > 0 && <button type="button" className="tile-btn" onClick={() => onRemove(zone, item.card.id)} aria-label={`Remove one ${item.card.name}`}>−</button>}
                    {!full && <button type="button" className="tile-btn" onClick={() => onAdd(zone, item.card)} aria-label={`Add ${item.card.name}`} data-testid="tile-add">+</button>}
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}
