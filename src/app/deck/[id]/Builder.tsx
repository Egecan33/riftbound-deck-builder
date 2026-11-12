'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardScore, Deck, Fix, Format, PowerTarget, SwapProposal } from '@/engine/types';
import { CardDetail, shareText } from '../../components/CardDetail';
import { CardImage, Gauge, LegendPicker, Overlay, seamStyle } from '../../components/card';
import { useNotify, useStatus } from '../../components/Shell';
import {
  ApiError, analyzeDeck, browseCards, buildDeck, exportDeck, getChampions, getDeck, updateDeck,
  type AnalyzeResponse, type BuildMode, type BuildPickView, type CardLookup, type ChampionOption, type ClientCard, type ExportResponse,
} from '../../lib/api';
import {
  DEFAULT_QUERY, FORMATS, POWERS, addCard, blocking, copiesOf, countOf, errText, formatRules, isAbort, qtyOf, queryForFix, removeCard, runeCount, setChampion, setRune, toggleBattlefield, toggleLock,
  type BrowserQuery, type CardZone,
} from '../../lib/ui';
import { Browser } from './Browser';
import { DeckView } from './DeckView';
import { Panels, type BuildLog, type PanelId } from './Panels';

const WEAKEST = 4;
export const logKey = (id: string): string => `forge:buildlog:${id}`;

export function Builder({ id }: { id: string }) {
  const notify = useNotify();
  const { status } = useStatus();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [settled, setSettled] = useState<Deck | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [lookup, setLookup] = useState<CardLookup>({});
  const [loadError, setLoadError] = useState<{ text: string; missing: boolean } | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved');
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId>('rating');
  const [query, setQuery] = useState<BrowserQuery>(DEFAULT_QUERY);
  const [detail, setDetail] = useState<string | null>(null);
  const [exported, setExported] = useState<ExportResponse | null>(null);
  const [proposals, setProposals] = useState<SwapProposal[] | null>(null);
  const [log, setLog] = useState<BuildLog | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [champions, setChampions] = useState<ChampionOption[] | null>(null);
  const [seed, setSeed] = useState(1);
  const dirty = useRef(false);
  const saveSeq = useRef(0);

  const learn = useCallback((cards: CardLookup | ClientCard[]) => {
    setLookup((cur) => {
      const next = { ...cur };
      for (const c of Array.isArray(cards) ? cards : Object.values(cards)) next[c.id] = c;
      return next;
    });
  }, []);

  // ---- load
  useEffect(() => {
    const ctrl = new AbortController();
    getDeck(id, ctrl.signal).then(
      (res) => {
        learn(res.cards);
        setDeck(res.deck);
        setSettled(res.deck);
      },
      (e) => {
        if (!isAbort(e)) setLoadError({ text: errText(e), missing: e instanceof ApiError && e.status === 404 });
      },
    );
    try {
      setOpponent(localStorage.getItem(`forge:opponent:${id}`));
      const raw = sessionStorage.getItem(logKey(id));
      if (raw) setLog(JSON.parse(raw) as BuildLog);
    } catch {
      // storage is optional
    }
    return () => ctrl.abort();
  }, [id, learn]);

  // ---- every change: wait 200 ms, then analyse and save
  useEffect(() => {
    if (!deck || deck === settled) return;
    const t = setTimeout(() => setSettled(deck), 200);
    return () => clearTimeout(t);
  }, [deck, settled]);

  useEffect(() => {
    if (!settled) return;
    const ctrl = new AbortController();
    setAnalysing(true);
    analyzeDeck(settled, opponent, ctrl.signal).then(
      (res) => {
        learn(res.cards);
        setAnalysis(res);
        setAnalysing(false);
      },
      (e) => {
        if (isAbort(e)) return;
        setAnalysing(false);
        notify.error(`Could not analyse the deck: ${errText(e)}`);
      },
    );
    return () => ctrl.abort();
  }, [settled, opponent, learn, notify]);

  useEffect(() => {
    if (!settled || !dirty.current) return;
    const seq = ++saveSeq.current;
    setSaveState('saving');
    updateDeck(id, settled).then(
      () => {
        if (seq === saveSeq.current) setSaveState('saved');
      },
      (e) => {
        if (seq !== saveSeq.current) return;
        setSaveState('failed');
        notify.error(`The deck was not saved: ${errText(e)}`);
      },
    );
  }, [settled, id, notify]);

  const mutate = useCallback((fn: (d: Deck) => Deck) => {
    dirty.current = true;
    setDeck((d) => (d ? fn(d) : d));
  }, []);

  const pickOpponent = useCallback((legendId: string | null, card: ClientCard | null) => {
    if (card) learn([card]);
    setOpponent(legendId);
    try {
      if (legendId) localStorage.setItem(`forge:opponent:${id}`, legendId);
      else localStorage.removeItem(`forge:opponent:${id}`);
    } catch {
      // storage is optional
    }
  }, [id, learn]);

  const rules = useMemo(() => (deck ? formatRules(deck.format, status?.legality ?? undefined) : null), [deck, status]);

  // ---- card actions
  const add = useCallback((zone: CardZone | 'battlefields', card: ClientCard | string) => {
    if (typeof card !== 'string') learn([card]);
    const cardId = typeof card === 'string' ? card : card.id;
    if (zone === 'battlefields') return mutate((d) => (d.battlefields.includes(cardId) ? d : toggleBattlefield(d, cardId)));
    mutate((d) => addCard(d, zone, cardId));
  }, [learn, mutate]);
  const remove = useCallback((zone: CardZone | 'battlefields', cardId: string) => {
    mutate((d) => (zone === 'battlefields' ? (d.battlefields.includes(cardId) ? toggleBattlefield(d, cardId) : d) : removeCard(d, zone, cardId)));
  }, [mutate]);
  /** True when one more copy would break the card's copy limit across main and side. */
  const atLimit = useCallback((cardId: string): boolean => {
    const limit = lookup[cardId]?.copyLimit;
    return !!deck && limit !== null && limit !== undefined && copiesOf(deck, cardId) >= limit;
  }, [deck, lookup]);
  const lock = useCallback((zone: CardZone, cardId: string) => mutate((d) => toggleLock(d, zone, cardId)), [mutate]);
  const openCard = useCallback((card: ClientCard | string) => {
    if (typeof card !== 'string') learn([card]);
    setDetail(typeof card === 'string' ? card : card.id);
  }, [learn]);

  const weakest = useMemo(() => {
    if (!deck || !analysis || countOf(deck.main) < 30) return new Set<string>();
    const scored = deck.main
      .filter((e) => !e.locked && e.id !== deck.champion)
      .map((e) => ({ id: e.id, s: analysis.deckScores[e.id] }))
      .filter((x): x is { id: string; s: CardScore } => !!x.s && !x.s.gate)
      .sort((a, b) => a.s.score - b.s.score);
    return new Set(scored.slice(0, WEAKEST).map((x) => x.id));
  }, [deck, analysis]);

  // ---- build actions
  const BUILD_SAID: Partial<Record<BuildMode, string>> = {
    auto: 'Built a new deck. Locked cards were kept.', fill: 'Filled the open slots.', side: 'Planned the side deck.', runes: 'Set the rune split.', battlefields: 'Chose the battlefields.',
  };
  const runBuild = async (mode: 'auto' | 'fill' | 'side' | 'runes' | 'battlefields', nextSeed?: number) => {
    if (!deck) return;
    setBusy(mode);
    try {
      const res = await buildDeck(deck, mode, { seed: nextSeed ?? seed });
      learn(res.cards);
      setProposals(null);
      mutate((d) => ({ ...res.deck, id: d.id, name: d.name }));
      const entry: BuildLog = { mode, picks: res.picks, notes: res.notes, profile: res.profile, at: new Date().toISOString() };
      setLog(entry);
      try {
        sessionStorage.setItem(logKey(id), JSON.stringify(entry));
      } catch {
        // storage is optional
      }
      notify.info(BUILD_SAID[mode] ?? 'Done.');
      if (res.notes.length && mode !== 'auto' && mode !== 'fill') notify.info(res.notes[0]!);
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(null);
    }
  };
  const propose = async (kind: 'improve' | 'swaps') => {
    if (!deck) return;
    setBusy(kind);
    setPanel('improve');
    try {
      const res = await buildDeck(deck, kind, { count: kind === 'swaps' ? 8 : 15 });
      learn(res.cards);
      setProposals(res.proposals);
      if (res.proposals.length === 0) notify.info(res.notes[0] ?? 'No swap raises the rating of this deck.');
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(null);
    }
  };
  const applySwaps = async (swaps: SwapProposal[]) => {
    if (!deck || swaps.length === 0) return;
    setBusy('apply');
    try {
      const res = await buildDeck(deck, 'apply', { swaps });
      learn(res.cards);
      mutate((d) => ({ ...res.deck, id: d.id, name: d.name }));
      setProposals((cur) => (cur ? cur.filter((p) => !swaps.includes(p)) : cur));
      notify.info(swaps.length === 1 ? `Swapped ${lookup[swaps[0]!.out]?.name ?? 'a card'} for ${lookup[swaps[0]!.in]?.name ?? 'a card'}` : `Applied ${swaps.length} swaps`);
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(null);
    }
  };
  const applyFix = useCallback((fix: Fix) => {
    const q = queryForFix(fix);
    if (q) setQuery(q);
  }, []);

  const doExport = async () => {
    if (!deck) return;
    try {
      setExported(await exportDeck(deck));
    } catch (e) {
      notify.error(e);
    }
  };

  const openChampions = async () => {
    if (!deck?.legend) return;
    try {
      const res = await getChampions(deck.legend);
      learn(res.champions.map((c) => c.card));
      setChampions(res.champions);
    } catch (e) {
      notify.error(e);
    }
  };

  // ---- render
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="display text-[26px]">{loadError.missing ? 'This deck does not exist' : 'The deck could not be loaded'}</h1>
        <p className="mt-2 text-mist">{loadError.missing ? 'It may have been deleted.' : loadError.text}</p>
        <Link href="/" className="btn mt-5">Back to decks</Link>
      </div>
    );
  }
  if (!deck || !rules) return <div className="p-6"><div className="skeleton h-24 rounded-lg" /></div>;

  const legend = deck.legend ? lookup[deck.legend] : undefined;
  const champion = deck.champion ? lookup[deck.champion] : undefined;
  const rating = analysis?.rating ?? null;
  const errors = rating ? blocking(rating.violations) : [];
  const mainCount = countOf(deck.main);
  const sideCount = countOf(deck.side);
  const counts: { label: string; have: number; want: string; ok: boolean }[] = [
    { label: 'Main', have: mainCount, want: rules.mainExact ? String(rules.mainExact) : `${rules.mainMin}+`, ok: rules.mainExact ? mainCount === rules.mainExact : mainCount >= rules.mainMin },
    { label: 'Runes', have: runeCount(deck), want: '12', ok: runeCount(deck) === 12 },
    { label: 'Battlefields', have: deck.battlefields.length, want: '3', ok: deck.battlefields.length === 3 },
    ...(rules.sideAllowed ? [{ label: 'Side', have: sideCount, want: `0-${rules.sideMax}`, ok: sideCount <= rules.sideMax }] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="builder">
      <div className="seam shrink-0" style={seamStyle(legend?.domains)} />
      <header className="relative flex shrink-0 items-center gap-4 overflow-hidden border-b border-edge bg-pit px-4 py-2.5">
        {legend && <img src={legend.image} alt="" aria-hidden className="pointer-events-none absolute -top-24 left-0 w-[520px] opacity-[0.16] blur-[2px] [mask-image:linear-gradient(90deg,black_30%,transparent)]" />}
        <div className="relative flex shrink-0 gap-2">
          <button type="button" className="w-[52px]" onClick={() => deck.legend && openCard(deck.legend)} title={legend ? `Legend: ${legend.name}` : 'No legend'} data-testid="header-legend">
            <CardImage card={legend} name="No legend" eager />
          </button>
          <button type="button" className="w-[52px]" onClick={() => (deck.champion ? openCard(deck.champion) : void openChampions())} title={champion ? `Chosen Champion: ${champion.name}` : 'Choose a champion'} data-testid="header-champion">
            <CardImage card={champion} name="No champion" eager />
          </button>
        </div>
        <div className="relative min-w-0 flex-1">
          <input
            className="display w-full max-w-[420px] rounded bg-transparent text-[22px] outline-none hover:bg-slate focus:bg-slate"
            value={deck.name}
            aria-label="Deck name"
            onChange={(e) => mutate((d) => ({ ...d, name: e.target.value }))}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <select className="field" style={{ height: 26 }} value={deck.format} aria-label="Format" onChange={(e) => mutate((d) => ({ ...d, format: e.target.value as Format, teammate: e.target.value === '2v2' ? (d.teammate ?? { legend: null, battlefields: [] }) : null }))}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select className="field" style={{ height: 26 }} value={deck.power} aria-label="Power target" title="Power target (heuristic): how much staples and tournament play count" onChange={(e) => mutate((d) => ({ ...d, power: e.target.value as PowerTarget }))}>
              {POWERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button type="button" className="btn small" onClick={() => void openChampions()} disabled={!deck.legend}>Change champion</button>
            {deck.format === '2v2' && (
              <LegendPicker
                value={deck.teammate?.legend ?? null}
                label="Teammate's legend"
                emptyText="Teammate's legend"
                exclude={deck.legend}
                onChange={(lid) => mutate((d) => ({ ...d, teammate: { legend: lid, battlefields: d.teammate?.battlefields ?? [] } }))}
              />
            )}
            {deck.format === '2v2' && (
              <TeammateBattlefields
                deck={deck}
                onChange={(ids) => mutate((d) => ({ ...d, teammate: { legend: d.teammate?.legend ?? null, battlefields: ids } }))}
              />
            )}
            <span className="text-[11.5px] text-dim" data-testid="save-state">{saveState === 'saving' ? 'Saving' : saveState === 'failed' ? 'Not saved' : 'Saved'}{analysing ? ', analysing' : ''}</span>
          </div>
        </div>

        <dl className="relative flex shrink-0 gap-4" data-testid="counts">
          {counts.map((c) => (
            <div key={c.label} className="text-center">
              <dd className="num text-[20px] leading-none" style={{ color: c.ok ? 'var(--color-bone)' : 'var(--color-bad)' }} data-testid={`count-${c.label.toLowerCase()}`}>
                {c.have}<span className="text-[13px] text-dim"> / {c.want}</span>
              </dd>
              <dt className="mt-0.5 text-[11px] text-mist">{c.label}</dt>
            </div>
          ))}
        </dl>

        <button
          type="button"
          className="chip relative shrink-0"
          style={{ height: 26, borderColor: rating ? (errors.length ? 'var(--color-bad)' : rating.legal ? 'var(--color-ok)' : 'var(--color-edge-hi)') : undefined, color: rating ? (errors.length ? 'var(--color-bad)' : rating.legal ? 'var(--color-ok)' : 'var(--color-mist)') : undefined }}
          onClick={() => setPanel('rating')}
          data-testid="legal-chip"
          title={errors.length ? errors.map((v) => v.message).join('\n') : 'Checked against the format rules and the synced ban list'}
        >
          {!rating ? 'Checking' : rating.legal ? `Legal in ${FORMATS.find((f) => f.id === deck.format)?.label ?? deck.format}` : errors.length ? `${errors.length} rule ${errors.length === 1 ? 'problem' : 'problems'}` : 'Unfinished'}
        </button>

        <button type="button" className="relative flex shrink-0 items-center gap-2" onClick={() => setPanel('rating')} title="Deck rating, 0 to 100. Open the Rating panel for the parts and their reasons.">
          <Gauge value={rating ? rating.rating : null} size={58} />
          <span className="text-left">
            <span className="block text-[11px] text-mist">Rating</span>
            <span className="num block text-[13px] text-mist" data-testid="rating-precise">{analysis ? analysis.precise.toFixed(1) : ''}</span>
          </span>
        </button>

        <div className="relative flex shrink-0 flex-col gap-1.5">
          <div className="flex gap-1.5">
            <button type="button" className="btn primary" disabled={!!busy || !deck.legend} onClick={() => void runBuild('auto')} data-testid="auto-build" title="Builds main deck, runes, battlefields and side deck around the legend. Locked cards stay.">
              {busy === 'auto' ? 'Building' : 'Auto-build'}
            </button>
            <button type="button" className="btn" disabled={!!busy || !deck.legend} onClick={() => void runBuild('fill')} data-testid="fill-rest" title="Keeps every card you have and fills the open slots.">
              {busy === 'fill' ? 'Filling' : 'Fill the rest'}
            </button>
          </div>
          <div className="flex gap-1.5">
            <button type="button" className="btn small flex-1" disabled={!!busy || !deck.legend} onClick={() => { const s = seed + 1; setSeed(s); void runBuild('auto', s); }} title="Auto-build again with another seed. Well-covered legends change little: their public lists agree.">Reroll</button>
            <button type="button" className="btn small flex-1" onClick={() => void doExport()} data-testid="export">Export</button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(380px,29%)_minmax(0,1fr)_minmax(450px,33%)]">
        <Browser deck={settled ?? deck} live={deck} query={query} setQuery={setQuery} onOpen={openCard} onAdd={add} onRemove={remove} atLimit={atLimit} legendDomains={legend?.domains ?? []} sideAllowed={rules.sideAllowed} />
        <DeckView
          deck={deck} lookup={lookup} analysis={analysis} weakest={weakest} rules={rules} busy={busy}
          onOpen={openCard} onAdd={add} onRemove={remove} onLock={lock} atLimit={atLimit}
          onRune={(domain, n) => mutate((d) => setRune(d, domain, n))}
          onBuild={(mode) => void runBuild(mode)}
          onBrowse={(zone) => setQuery((q) => ({ ...q, zone, fromFix: null }))}
          browseZone={query.zone}
        />
        <Panels
          panel={panel} setPanel={setPanel} deck={deck} analysis={analysis} lookup={lookup} onOpen={openCard} onFix={applyFix}
          opponent={opponent} onOpponent={pickOpponent}
          onThemes={(w) => mutate((d) => ({ ...d, themeWeights: w }))}
          proposals={proposals} onPropose={(k) => void propose(k)} onApply={(s) => void applySwaps(s)} onReject={(p) => setProposals((cur) => (cur ? cur.filter((x) => x !== p) : cur))}
          busy={busy} log={log}
        />
      </div>

      {detail && (
        <CardDetail
          id={detail}
          deck={settled ?? deck}
          onClose={() => setDetail(null)}
          onOpen={openCard}
          actions={(d) => {
            const c = d.card;
            if (c.type === 'battlefield') {
              const has = deck.battlefields.includes(c.id);
              return <button type="button" className="btn primary w-full" onClick={() => (has ? remove('battlefields', c.id) : add('battlefields', c))} data-testid="detail-add">{has ? 'Remove from battlefields' : 'Bring this battlefield'}</button>;
            }
            if (c.type !== 'unit' && c.type !== 'spell' && c.type !== 'gear') return null;
            const inMain = qtyOf(deck.main, c.id);
            const inSide = qtyOf(deck.side, c.id);
            const full = atLimit(c.id);
            return (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <button type="button" className="btn primary flex-1" disabled={full || !!d.score?.gate} onClick={() => add('main', c)} data-testid="detail-add">Add to main ({inMain})</button>
                  <button type="button" className="btn" disabled={inMain === 0} onClick={() => remove('main', c.id)} data-testid="detail-remove">Remove one</button>
                </div>
                {rules.sideAllowed && (
                  <div className="flex gap-1.5">
                    <button type="button" className="btn flex-1" disabled={full || !!d.score?.gate} onClick={() => add('side', c)}>Add to side deck ({inSide})</button>
                    <button type="button" className="btn" disabled={inSide === 0} onClick={() => remove('side', c.id)}>Remove one</button>
                  </div>
                )}
                {full && <p className="sub">At the copy limit of {c.copyLimit} across main and side deck.</p>}
              </div>
            );
          }}
        />
      )}

      {champions && (
        <Overlay onClose={() => setChampions(null)} label="Choose the Chosen Champion" width={760}>
          <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
            <h2 className="h">Chosen Champion</h2>
            <span className="sub">It starts in the Champion Zone; one copy counts inside the main deck.</span>
            <button type="button" className="btn quiet ml-auto" onClick={() => setChampions(null)}>Close</button>
          </div>
          <div className="grid grid-cols-5 gap-3 overflow-y-auto p-4">
            {champions.map((c) => (
              <button key={c.card.id} type="button" className={`tile text-left ${deck.champion === c.card.id ? 'locked' : ''}`} onClick={() => { mutate((d) => setChampion(d, c.card.id)); setChampions(null); }} data-testid="champion-option">
                <CardImage card={c.card} />
                <span className="sub mt-1 block">{shareText(c.share)}{c.bannedIn.includes(deck.format) ? ', banned here' : ''}</span>
              </button>
            ))}
          </div>
        </Overlay>
      )}

      {exported && <ExportDialog exported={exported} onClose={() => setExported(null)} />}
    </div>
  );
}

function ExportDialog({ exported, onClose }: { exported: ExportResponse; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied(null);
    }
  };
  return (
    <Overlay onClose={onClose} label="Export the deck" width={620}>
      <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
        <h2 className="h">Export</h2>
        <button type="button" className="btn quiet ml-auto" onClick={onClose}>Close</button>
      </div>
      <div className="space-y-3 overflow-y-auto p-4" data-testid="export-dialog">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-semibold">Text list</span>
            <button type="button" className="btn small" onClick={() => void copy('list', exported.text)}>{copied === 'list' ? 'Copied' : 'Copy list'}</button>
          </div>
          <textarea className="field w-full" rows={14} readOnly value={exported.text} data-testid="export-text" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-semibold">Deck code</span>
            {exported.code && <button type="button" className="btn small" onClick={() => void copy('code', exported.code!)}>{copied === 'code' ? 'Copied' : 'Copy code'}</button>}
          </div>
          {exported.code ? <textarea className="field w-full" rows={3} readOnly value={exported.code} /> : <p className="sub">No deck code: {exported.codeError ?? 'the deck cannot be encoded.'}</p>}
          {exported.codeSkipped.length > 0 && <p className="sub mt-1">Left out of the code: {exported.codeSkipped.join(', ')}.</p>}
        </div>
      </div>
    </Overlay>
  );
}

export type { BuildPickView };

/** 2v2: the battlefields the teammate brings, so a shared battlefield name is flagged (CR 491.8.i). */
function TeammateBattlefields({ deck, onChange }: { deck: Deck; onChange: (ids: string[]) => void }) {
  const [all, setAll] = useState<ClientCard[] | null>(null);
  const chosen = deck.teammate?.battlefields ?? [];
  useEffect(() => {
    const ctrl = new AbortController();
    browseCards({ deck, zone: 'battlefields', sort: 'name', page: 1, pageSize: 200 }, ctrl.signal)
      .then((r) => setAll(r.cards.map((c) => c.card)))
      .catch(() => {});
    return () => ctrl.abort();
    // the battlefield list does not depend on the deck's contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.format]);
  const name = (id: string) => all?.find((c) => c.id === id)?.name ?? id;
  return (
    <span className="flex flex-wrap items-center gap-1" data-testid="teammate-battlefields">
      {chosen.map((id) => (
        <button key={id} type="button" className="chip" title="Remove from the teammate's battlefields" onClick={() => onChange(chosen.filter((x) => x !== id))}>
          {name(id)} ×
        </button>
      ))}
      {chosen.length < 3 && (
        <select
          className="field"
          style={{ height: 26 }}
          value=""
          aria-label="Add a teammate battlefield"
          disabled={!all}
          onChange={(e) => { if (e.target.value) onChange([...chosen, e.target.value]); }}
        >
          <option value="">Teammate's battlefields ({chosen.length}/3)</option>
          {(all ?? []).filter((c) => !chosen.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </span>
  );
}
