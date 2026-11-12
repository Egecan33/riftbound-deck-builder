'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AxisId, Deck, Domain, Format, PowerTarget } from '@/engine/types';
import { CardDetail, shareText } from '../components/CardDetail';
import { CardImage, DomainFilter, DomainPips, Heur, RichText, seamStyle } from '../components/card';
import { ImportDialog } from '../components/ImportDialog';
import { useLabels, useNotify, useStatus } from '../components/Shell';
import { analyzeDeck, browseCards, buildDeck, createDeck, getChampions, getLegends, type ChampionOption, type ClientCard, type LegendTile, type ScoredCard } from '../lib/api';
import { FORMATS, FORMAT_SHORT, POWERS, axisLabel, emptyDeck, isAbort, legendName, setChampion } from '../lib/ui';
import { logKey } from '../deck/[id]/Builder';

const MAX_BUILD_AROUND = 6;

export default function NewDeckPage() {
  const router = useRouter();
  const notify = useNotify();
  const labels = useLabels();
  const { status } = useStatus();

  const [legends, setLegends] = useState<LegendTile[] | null>(null);
  const [q, setQ] = useState('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [legend, setLegend] = useState<LegendTile | null>(null);
  const [champions, setChampions] = useState<ChampionOption[] | null>(null);
  const [champion, setChampionCard] = useState<ClientCard | null>(null);
  const [format, setFormat] = useState<Format>('standard-bo3');
  const [power, setPower] = useState<PowerTarget>('focused');
  const [name, setName] = useState('');
  const [themes, setThemes] = useState<Record<AxisId, number> | null>(null);
  const [themesEdited, setThemesEdited] = useState(false);
  const [around, setAround] = useState<ClientCard[]>([]);
  const [aroundQ, setAroundQ] = useState('');
  const [found, setFound] = useState<ScoredCard[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (status) {
      setFormat(status.settings.defaultFormat);
      setPower(status.settings.defaultPower);
    }
  }, [status]);

  useEffect(() => {
    const ctrl = new AbortController();
    getLegends({}, ctrl.signal).then((r) => setLegends(r.legends), (e) => {
      if (!isAbort(e)) notify.error(e);
    });
    return () => ctrl.abort();
  }, [notify]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (legends ?? []).filter((l) => (!needle || `${l.card.name} ${l.card.championTag ?? ''}`.toLowerCase().includes(needle)) && domains.every((d) => l.card.domains.includes(d)));
  }, [legends, q, domains]);

  const deck: Deck | null = useMemo(
    () => (legend ? emptyDeck({ name: name.trim() || `${legend.card.championTag ?? legend.card.name} ${FORMAT_SHORT[format]}`, format, power, legend: legend.card.id, champion: champion?.id ?? null, themeWeights: themesEdited ? themes : null, teammate: format === '2v2' ? { legend: null, battlefields: [] } : null }) : null),
    [legend, champion, format, power, name, themes, themesEdited],
  );

  // Champions of the chosen legend; the one most of its lists register is preselected.
  useEffect(() => {
    if (!legend) return;
    const ctrl = new AbortController();
    setChampions(null);
    setChampionCard(null);
    setThemes(null);
    setThemesEdited(false);
    setAround([]);
    getChampions(legend.card.id, ctrl.signal).then((r) => {
      setChampions(r.champions);
      const best = [...r.champions].filter((c) => !c.bannedIn.includes(format)).sort((a, b) => (b.share ?? 0) - (a.share ?? 0))[0];
      setChampionCard(best?.card ?? null);
    }, (e) => {
      if (!isAbort(e)) notify.error(e);
    });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legend, notify]);

  // The legend's own themes, for the optional step.
  const legendId = legend?.card.id ?? null;
  const championId = champion?.id ?? null;
  useEffect(() => {
    if (!legendId || themesEdited) return;
    const ctrl = new AbortController();
    analyzeDeck(emptyDeck({ legend: legendId, champion: championId, format, power }), null, ctrl.signal).then((r) => setThemes(r.themeWeights), () => {});
    return () => ctrl.abort();
  }, [legendId, championId, format, power, themesEdited]);

  useEffect(() => {
    if (!legendId || !aroundQ.trim()) return setFound([]);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      browseCards({ deck: emptyDeck({ legend: legendId, champion: championId, format, power }), q: aroundQ, filters: { hideGated: true }, pageSize: 10 }, ctrl.signal).then((r) => setFound(r.cards), () => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [aroundQ, legendId, championId, format, power]);

  const autoBuild = async () => {
    if (!deck) return;
    setBusy('auto');
    try {
      const built = await buildDeck(deck, 'auto', { buildAround: around.map((c) => c.id) });
      const saved = await createDeck({ ...built.deck, id: null, name: deck.name });
      try {
        sessionStorage.setItem(logKey(saved.deck.id!), JSON.stringify({ mode: 'auto', picks: built.picks, notes: built.notes, profile: built.profile, at: new Date().toISOString() }));
      } catch {
        // storage is optional
      }
      router.push(`/deck/${saved.deck.id}`);
    } catch (e) {
      notify.error(e);
      setBusy(null);
    }
  };
  const startEmpty = async () => {
    if (!deck) return;
    setBusy('empty');
    try {
      let d = champion ? setChampion(deck, champion.id) : deck;
      for (const c of around) d = { ...d, main: d.main.some((e) => e.id === c.id) ? d.main : [...d.main, { id: c.id, qty: 1, locked: true }] };
      const saved = await createDeck(d);
      router.push(`/deck/${saved.deck.id}`);
    } catch (e) {
      notify.error(e);
      setBusy(null);
    }
  };

  const themeAxes = Object.keys(themes ?? {}).sort((a, b) => (themes![b] ?? 0) - (themes![a] ?? 0));

  return (
    <div className="mx-auto max-w-[1320px] px-6 py-6" data-testid="new-page">
      <div className="mb-4 flex items-end gap-3">
        <div>
          <h1 className="display text-[30px]">New deck</h1>
          <p className="sub mt-1">A deck starts from its legend: the legend sets the two domains every card has to fit.</p>
        </div>
        <button type="button" className="btn ml-auto" onClick={() => setImporting(true)}>Import a list instead</button>
      </div>

      <Step n={1} title="Legend" done={legend ? legendName(legend.card) : null}>
        {legend ? (
          <div className="flex items-start gap-4">
            <button type="button" className="w-[150px] shrink-0" onClick={() => setDetail(legend.card.id)}><CardImage card={legend.card} eager /></button>
            <div className="min-w-0 max-w-[60ch]">
              <div className="seam mb-2 w-24" style={seamStyle(legend.card.domains)} />
              <h3 className="display text-[22px]">{legendName(legend.card)}</h3>
              <p className="sub mt-1 flex items-center gap-2"><DomainPips domains={legend.card.domains} /> {legend.champions} champion {legend.champions === 1 ? 'unit' : 'units'}, {legend.meta ? `${legend.meta.decks} public lists` : 'no public lists'}</p>
              {legend.meta && legend.meta.quality !== 'ok' && (
                <p className="mt-2 text-[12.5px] text-mist">
                  {legend.meta.quality === 'thin' ? 'Few public lists exist for this legend, so its play data is thin.' : 'Too few public lists exist for this legend: the builder leans on card texts and on the play data of all legends, and the result is more generic.'}
                </p>
              )}
              <div className="well mt-2.5 px-3 py-2 text-[13px] leading-relaxed"><RichText text={legend.card.text} /></div>
              {legend.bannedIn.length > 0 && <p className="mt-2 text-[12.5px] text-bad">Banned as a legend in {legend.bannedIn.map((f) => FORMAT_SHORT[f]).join(', ')}.</p>}
              <button type="button" className="btn small mt-3" onClick={() => setLegend(null)} data-testid="change-legend">Choose another legend</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input className="field w-60" placeholder="Search legends or champions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search legends" data-testid="legend-search" />
              <DomainFilter value={domains} onChange={(d) => setDomains(d.slice(-2))} />
              <span className="sub ml-auto">{legends ? `${shown.length} of ${legends.length} legends` : ''}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-3" data-testid="legend-grid">
              {legends === null && Array.from({ length: 18 }, (_, i) => <div key={i} className="card skeleton" />)}
              {shown.map((l) => (
                <button key={l.card.id} type="button" className="tile text-left" onClick={() => setLegend(l)} data-testid="legend-tile" title={l.card.name}>
                  <CardImage card={l.card} />
                  <span className="mt-1 flex items-center gap-1.5 text-[12px]"><DomainPips domains={l.card.domains} /><span className="truncate">{l.card.championTag ?? l.card.name}</span></span>
                  <span className="block text-[11px] text-dim">{l.meta ? `${l.meta.decks} lists` : 'no lists'}{l.bannedIn.length ? `, banned in ${l.bannedIn.map((f) => FORMAT_SHORT[f]).join(', ')}` : ''}</span>
                </button>
              ))}
              {legends && shown.length === 0 && <p className="sub col-span-full py-6">No legend matches. Clear the search or a domain.</p>}
            </div>
          </>
        )}
      </Step>

      {legend && (
        <Step n={2} title="Chosen Champion" done={champion?.name ?? null}>
          <p className="sub mb-2.5">The champion unit that starts in the Champion Zone. The share is how many of this legend's public lists register it.</p>
          <div className="flex flex-wrap gap-3" data-testid="champion-row">
            {champions === null && <div className="card skeleton" style={{ width: 128 }} />}
            {champions?.map((c) => (
              <button key={c.card.id} type="button" className={`tile w-[128px] text-left ${champion?.id === c.card.id ? 'locked' : ''}`} aria-pressed={champion?.id === c.card.id} onClick={() => setChampionCard(c.card)} data-testid="champion-tile">
                <CardImage card={c.card} />
                <span className="sub mt-1 block">{shareText(c.share)}{c.bannedIn.includes(format) ? ', banned here' : ''}</span>
              </button>
            ))}
            {champions?.length === 0 && <p className="sub">The card data has no champion unit for this legend.</p>}
          </div>
        </Step>
      )}

      {legend && (
        <Step n={3} title="Format and power" done={`${FORMAT_SHORT[format]}, ${POWERS.find((p) => p.id === power)!.label.toLowerCase()}`}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.id} type="button" className="well p-2.5 text-left" aria-pressed={format === f.id} style={format === f.id ? { borderColor: 'var(--color-heat)' } : undefined} onClick={() => setFormat(f.id)} data-testid={`format-${f.id}`}>
                    <span className="block text-[13px] font-semibold">{f.label}</span>
                    <span className="sub block">{f.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-2">
                {POWERS.map((p) => (
                  <button key={p.id} type="button" className="well p-2.5 text-left" aria-pressed={power === p.id} style={power === p.id ? { borderColor: 'var(--color-heat)' } : undefined} onClick={() => setPower(p.id)} data-testid={`power-${p.id}`}>
                    <span className="block text-[13px] font-semibold">{p.label}</span>
                    <span className="sub block">{p.blurb}</span>
                  </button>
                ))}
              </div>
              <p className="sub mt-2">The power target changes how scores weigh staples and tournament play <Heur />.</p>
              <input className="field mt-3 w-full" placeholder={deck?.name ?? 'Deck name'} value={name} onChange={(e) => setName(e.target.value)} aria-label="Deck name" />
            </div>
          </div>
        </Step>
      )}

      {legend && (
        <Step n={4} title="Themes and build-around cards" done="optional">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="sub mb-2">Themes the legend supports, with how much each counts {themesEdited ? '(your weights)' : <>(from its text and lists <Heur />)</>}.</p>
              <ul className="space-y-1.5">
                {themeAxes.slice(0, 9).map((axis) => (
                  <li key={axis} className="grid grid-cols-[170px_1fr_36px] items-center gap-2 text-[12.5px]">
                    <span className="truncate">{axisLabel(axis, labels)}</span>
                    <input type="range" min={0} max={1} step={0.05} value={themes![axis] ?? 0} className="accent-[var(--color-heat)]" aria-label={`Weight of ${axisLabel(axis, labels)}`} onChange={(e) => { setThemesEdited(true); setThemes({ ...themes!, [axis]: Number(e.target.value) }); }} />
                    <span className="num text-right">{(themes![axis] ?? 0).toFixed(2)}</span>
                  </li>
                ))}
                {themes && themeAxes.length === 0 && <li className="sub">No theme stands out for this legend.</li>}
              </ul>
              {themesEdited && <button type="button" className="btn small quiet mt-2" onClick={() => setThemesEdited(false)}>Follow the legend again</button>}
            </div>
            <div>
              <p className="sub mb-2">Cards the build has to include and work around (up to {MAX_BUILD_AROUND}).</p>
              <input className="field w-full" placeholder="Search a card to build around" value={aroundQ} onChange={(e) => setAroundQ(e.target.value)} aria-label="Search build-around cards" data-testid="around-search" />
              {found.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2" data-testid="around-results">
                  {found.map((c) => (
                    <button key={c.card.id} type="button" className="w-[76px]" disabled={around.length >= MAX_BUILD_AROUND || around.some((a) => a.id === c.card.id)} onClick={() => { setAround((a) => [...a, c.card]); setAroundQ(''); }} title={`Build around ${c.card.name}`}>
                      <CardImage card={c.card} />
                    </button>
                  ))}
                </div>
              )}
              {around.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2" data-testid="around-chosen">
                  {around.map((c) => (
                    <div key={c.id} className="tile locked w-[88px]">
                      <button type="button" className="tile-main" onClick={() => setDetail(c.id)}><CardImage card={c} /></button>
                      <span className="tile-actions" style={{ opacity: 1 }}><button type="button" className="tile-btn" onClick={() => setAround((a) => a.filter((x) => x.id !== c.id))} aria-label={`Do not build around ${c.name}`}>−</button></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Step>
      )}

      {legend && (
        <div className="panel sticky bottom-3 z-10 mt-5 flex items-center gap-3 px-4 py-3 shadow-2xl" data-testid="new-actions">
          <div className="min-w-0 flex-1">
            <p className="display truncate text-[18px]">{deck?.name}</p>
            <p className="sub truncate">{legendName(legend.card)}{champion ? `, ${champion.name}` : ', no champion chosen'}. {FORMATS.find((f) => f.id === format)!.label}, {power}.</p>
          </div>
          <button type="button" className="btn" disabled={!!busy} onClick={() => void startEmpty()} data-testid="start-empty">{busy === 'empty' ? 'Saving' : 'Start empty'}</button>
          <button type="button" className="btn primary" disabled={!!busy || !champion} onClick={() => void autoBuild()} data-testid="auto-build-new" title={champion ? 'Builds main deck, runes, battlefields and side deck, with a reason for every pick' : 'Choose a champion first'}>
            {busy === 'auto' ? 'Building the deck' : 'Auto-build the deck'}
          </button>
        </div>
      )}

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {detail && <CardDetail id={detail} deck={null} onClose={() => setDetail(null)} onOpen={setDetail} />}
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: string | null; children: ReactNode }) {
  return (
    <section className="panel mb-3 p-4" data-testid={`step-${n}`}>
      <h2 className="mb-3 flex items-baseline gap-2.5">
        <span className="num flex h-6 w-6 items-center justify-center self-center rounded-full border border-edge-hi text-[13px] text-mist">{n}</span>
        <span className="h text-[17px]">{title}</span>
        {done && <span className="sub truncate">{done}</span>}
      </h2>
      {children}
    </section>
  );
}
