'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Format, PowerTarget } from '@/engine/types';
import { Bar, Heur, Measured } from '../components/card';
import { useNotify, useStatus } from '../components/Shell';
import { getSync, startSync, updateSettings, type Settings, type SyncState, type SyncStep } from '../lib/api';
import { FORMATS, FORMAT_SHORT, POWERS, fmtDate, fmtInt, pct } from '../lib/ui';

const STEPS: { id: SyncStep; label: string; what: string }[] = [
  { id: 'cards', label: 'Cards', what: 'Every card from the official card gallery.' },
  { id: 'errata', label: 'Errata', what: 'Official text changes, applied over the gallery text.' },
  { id: 'legality', label: 'Legality', what: 'Ban lists, legal sets and the side deck size, checked against the rules hub.' },
  { id: 'meta', label: 'Public lists', what: 'Tournament and community deck lists: the play data behind every "measured" number.' },
  { id: 'features', label: 'Card understanding', what: 'Reads every card text into traits, roles, ratings and pair edges. Run it after cards or lists change.' },
  { id: 'images', label: 'Images', what: 'Card pictures, stored on this computer.' },
];
const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function stepSummary(step: SyncStep, info: Record<string, unknown>): string {
  switch (step) {
    case 'cards': return `${fmtInt(n(info.cards))} cards from ${fmtInt(n(info.printings))} printings, ${n(info.legends)} legends, ${n(info.dataIncomplete)} with unfinished source rows`;
    case 'errata': return `${n(info.applied)} of ${n(info.entries)} errata applied`;
    case 'legality': return `${n(info.bans)} bans, ${n(info.sets)} sets, as of ${String(info.asOf ?? 'unknown')}${info.stale ? '; the rules hub has a newer date' : ''}`;
    case 'meta': return `${fmtInt(n(info.decks))} lists (${fmtInt(n(info.complete))} usable), ${n(info.legends)} legends: ${n(info.ok)} well covered, ${n(info.thin)} thin, ${n(info.insufficient)} too few`;
    case 'features': return `${fmtInt(n(info.cards))} cards read, ${fmtInt(n(info.edges))} pair edges, ${n(info.unparsedSentences)} of ${fmtInt(n(info.sentences))} sentences not understood`;
    case 'images': return `${fmtInt(n(info.present))} of ${fmtInt(n(info.cards))} on disk${n(info.failed) ? `, ${n(info.failed)} failed` : ''}`;
  }
}

export default function DataPage() {
  const notify = useNotify();
  const { status, refresh } = useStatus();
  const [sync, setSync] = useState<SyncState | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const seen = useRef(0);
  const logBox = useRef<HTMLPreElement>(null);

  const poll = useCallback(async () => {
    try {
      const s = await getSync(seen.current);
      seen.current = s.lineCount;
      if (s.lines.length) setLines((cur) => [...cur, ...s.lines].slice(-400));
      setSync(s);
      return s;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    void poll();
  }, [poll]);
  const running = sync?.running === true;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      void poll().then((s) => {
        if (s && !s.running) void refresh();
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, poll, refresh]);
  useEffect(() => {
    if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight;
  }, [lines]);

  const run = async (step: SyncStep | 'all') => {
    try {
      seen.current = 0;
      setLines([]);
      setSync(await startSync({ step }));
    } catch (e) {
      notify.error(e);
    }
  };
  const save = async (patch: Partial<Settings>) => {
    try {
      await updateSettings(patch);
      await refresh();
    } catch (e) {
      notify.error(e);
    }
  };

  if (!status) return <div className="p-6"><div className="skeleton h-24 rounded-lg" /></div>;
  const leg = status.legality;
  const cov = status.coverage;
  const imagesHave = Math.min(status.counts.images, status.counts.cards);

  return (
    <div className="mx-auto max-w-[1180px] space-y-4 px-6 py-6" data-testid="data-page">
      <div>
        <h1 className="display text-[30px]">Card data</h1>
        <p className="sub mt-1 max-w-[80ch]">
          {status.ready
            ? 'Everything the app says comes from this data: card texts, the ban list, and public deck lists. Nothing is looked up while you build, so the app works offline after a sync.'
            : 'No card data yet. Run a full sync once; after that the app works offline.'}
        </p>
        <p className="mt-1 text-[11.5px] text-dim">Database: {status.dbPath}</p>
      </div>

      <section className="panel p-4" data-testid="sync-steps">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="h text-[17px]">Sync</h2>
          <span className="sub">{running ? `Running: ${sync?.step ?? ''}` : sync?.finishedAt ? `Last run finished ${fmtDate(sync.finishedAt)}${sync.exitCode ? ` with exit code ${sync.exitCode}` : ''}` : 'Requests to community sites are slow and one at a time.'}</span>
          <button type="button" className="btn primary ml-auto" disabled={running} onClick={() => void run('all')} data-testid="sync-all">{running ? 'Syncing' : 'Sync everything'}</button>
        </div>
        <ul className="divide-y divide-edge">
          {STEPS.map((s) => {
            const done = status.steps[s.id];
            return (
              <li key={s.id} className="grid grid-cols-[170px_1fr_auto] items-center gap-4 py-2.5" data-testid={`step-${s.id}`}>
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-[11.5px] text-dim">{done ? fmtDate(done.finishedAt) : 'never run'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px]">{done ? stepSummary(s.id, done.info) : 'Not synced yet.'}</p>
                  <p className="sub">{s.what}</p>
                  {s.id === 'images' && (
                    <div className="mt-1.5 flex items-center gap-2" data-testid="image-progress">
                      <span className="w-64"><Bar value={imagesHave} max={Math.max(1, status.counts.cards)} color="var(--color-band-good)" /></span>
                      <span className="sub">{fmtInt(imagesHave)} of {fmtInt(status.counts.cards)}{status.imagesMissing > 0 ? `, ${fmtInt(status.imagesMissing)} missing: those cards show a name tile` : ', none missing'}</span>
                    </div>
                  )}
                </div>
                <button type="button" className="btn small" disabled={running} onClick={() => void run(s.id)}>{running && sync?.step === s.id ? 'Running' : `Sync ${s.label.toLowerCase()}`}</button>
              </li>
            );
          })}
        </ul>
        {lines.length > 0 && <pre ref={logBox} className="well mt-3 max-h-48 overflow-auto p-2.5 font-mono text-[11.5px] leading-relaxed text-mist" data-testid="sync-log">{lines.join('\n')}</pre>}
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="panel p-4" data-testid="legality">
          <h2 className="h mb-1 text-[17px]">Legality snapshot</h2>
          {!leg ? <p className="sub">No legality data. Run the legality step.</p> : (
            <>
              <p className="sub">
                Reviewed {leg.asOf}. {leg.hub && <>Rules hub: ban list updated {leg.hub.banListUpdated}, rules {leg.hub.rulesUpdated} (<a className="text-heat underline-offset-2 hover:underline" href={leg.hub.url} target="_blank" rel="noreferrer">source</a>). </>}
                Side deck: up to {leg.sideboardMax} cards.
              </p>
              <h3 className="mt-3 text-[12.5px] font-semibold">Legal sets</h3>
              <ul className="mt-1 grid grid-cols-2 gap-x-4 text-[12.5px]">
                {leg.sets.map((s) => <li key={s.code} className="flex gap-2"><span className="num w-9 text-mist">{s.code}</span><span className="min-w-0 flex-1 truncate">{s.name}</span><span className="text-dim">{s.legalFrom ?? 'no date'}</span></li>)}
              </ul>
              <h3 className="mt-3 text-[12.5px] font-semibold">Banned cards ({leg.bans.length})</h3>
              <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto pr-1 text-[12.5px]" data-testid="ban-list">
                {leg.bans.map((b, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate">{b.name}{b.zone !== 'main' ? ` (${b.zone})` : ''}</span>
                    <span className="text-dim">{b.formats.map((f) => FORMAT_SHORT[f]).join(', ')}</span>
                    <a className="text-heat underline-offset-2 hover:underline" href={b.sourceUrl} target="_blank" rel="noreferrer">since {b.effectiveFrom}</a>
                  </li>
                ))}
              </ul>
              {(leg.upcomingBans?.length ?? 0) > 0 && (
                <>
                  <h3 className="mt-3 text-[12.5px] font-semibold">Announced, not yet in effect ({leg.upcomingBans?.length})</h3>
                  <p className="sub">Legal until their date; decks holding them get a warning.</p>
                  <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto pr-1 text-[12.5px]" data-testid="upcoming-ban-list">
                    {leg.upcomingBans?.map((b, i) => (
                      <li key={i} className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate">{b.name}{b.zone !== 'main' ? ` (${b.zone})` : ''}</span>
                        <span className="text-dim">{b.formats.map((f) => FORMAT_SHORT[f]).join(', ')}</span>
                        <a className="text-heat underline-offset-2 hover:underline" href={b.sourceUrl} target="_blank" rel="noreferrer">from {b.effectiveFrom}</a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="well mt-3 p-2.5">
                <label className="flex items-start gap-2 text-[12.5px]">
                  <input type="checkbox" className="mt-0.5 accent-[var(--color-heat)]" checked={leg.ffaUsesStandardBans} onChange={(e) => void save({ ffaUsesStandardBans: e.target.checked })} data-testid="ffa-bans" />
                  <span>Apply the Standard ban list to free-for-all <Heur title="No official free-for-all ban list exists; this is the app's default, not a rule." /></span>
                </label>
                {leg.ffaNote && <p className="sub mt-1">{leg.ffaNote}</p>}
              </div>
            </>
          )}
        </section>

        <div className="space-y-4">
          <section className="panel p-4" data-testid="coverage">
            <h2 className="h mb-1 text-[17px]">How much the engine understands</h2>
            {!cov ? <p className="sub">The card understanding step has not run yet.</p> : (
              <>
                <p className="sub mb-2.5">Every rating and line rests on reading the card texts. These are the gaps.</p>
                <Stat label="Sentences understood" value={`${fmtInt(cov.sentences - cov.unparsedSentences)} of ${fmtInt(cov.sentences)}`} share={cov.sentences ? 1 - cov.unparsedSentences / cov.sentences : 0} />
                <Stat label="Cards with at least one mechanic read" value={`${fmtInt(cov.cards - cov.noMechanic)} of ${fmtInt(cov.cards)}`} share={cov.cards ? 1 - cov.noMechanic / cov.cards : 0} />
                <Stat label={<>Cards with play data <Measured /></>} value={`${fmtInt(cov.cardsWithEvidence)} of ${fmtInt(cov.cards)}`} share={cov.cards ? cov.cardsWithEvidence / cov.cards : 0} />
                <p className="sub mt-2">{fmtInt(cov.edges)} pair edges stored; {fmtInt(cov.playLists)} public lists behind the play data. {status.counts.dataIncomplete} cards have unfinished rows in the official gallery and are kept out of decks. {status.counts.errata} cards carry an errata.</p>
              </>
            )}
          </section>

          <section className="panel p-4" data-testid="settings">
            <h2 className="h mb-2 text-[17px]">Defaults for new decks</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select className="field" value={status.settings.defaultFormat} onChange={(e) => void save({ defaultFormat: e.target.value as Format })} aria-label="Default format">
                {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <select className="field" value={status.settings.defaultPower} onChange={(e) => void save({ defaultPower: e.target.value as PowerTarget })} aria-label="Default power target">
                {POWERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <label className="mt-2.5 flex items-start gap-2 text-[12.5px]">
              <input type="checkbox" className="mt-0.5 accent-[var(--color-heat)]" checked={status.settings.ownedOnly} onChange={(e) => void save({ ownedOnly: e.target.checked })} data-testid="owned-only" />
              <span>Build only from cards in my collection ({fmtInt(status.counts.collection)} different cards owned)</span>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, share }: { label: ReactNode; value: string; share: number }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-2 text-[12.5px]">
        <span>{label}</span>
        <span className="num ml-auto text-[14px]">{value}</span>
        <span className="w-12 text-right text-dim">{pct(share, 1)}</span>
      </div>
      <Bar value={share} max={1} color="var(--color-band-good)" />
    </div>
  );
}
