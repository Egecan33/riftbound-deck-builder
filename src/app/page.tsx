'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CardImage, Gauge, seamStyle } from './components/card';
import { ImportDialog } from './components/ImportDialog';
import { useNotify, useStatus } from './components/Shell';
import { createDeck, deleteDeck, getDeck, listDecks, type DeckTile } from './lib/api';
import { FORMAT_SHORT, fmtDate, isAbort, legendName, powerLabel } from './lib/ui';

export default function DecksPage() {
  const notify = useNotify();
  const { status } = useStatus();
  const [decks, setDecks] = useState<DeckTile[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    listDecks(signal).then((r) => setDecks(r.decks), (e) => {
      if (!isAbort(e)) notify.error(e);
    });
  }, [notify]);
  useEffect(() => {
    if (!status?.ready) return;
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [status?.ready, load]);

  const duplicate = async (id: string) => {
    try {
      const src = await getDeck(id);
      await createDeck({ ...src.deck, id: null, name: `${src.deck.name} copy` });
      load();
    } catch (e) {
      notify.error(e);
    }
  };
  const remove = async (id: string) => {
    try {
      await deleteDeck(id);
      setConfirming(null);
      load();
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] px-6 py-6" data-testid="decks-page">
      <div className="mb-5 flex items-end gap-3">
        <div>
          <h1 className="display text-[30px]">Decks</h1>
          <p className="sub mt-1">{decks ? `${decks.length} saved on this computer.` : 'Loading.'}</p>
        </div>
        <Link href="/new" className="btn primary ml-auto" data-testid="new-deck">New deck</Link>
        <button type="button" className="btn" onClick={() => setImporting(true)} data-testid="import-deck">Import a list</button>
      </div>

      {decks && decks.length === 0 && (
        <div className="panel mx-auto mt-16 max-w-xl p-8 text-center">
          <h2 className="display text-[22px]">No decks yet</h2>
          <p className="mt-2 text-mist">Pick a legend and let the builder make a first list, or paste one you already play. Every pick comes with its reason.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/new" className="btn primary">Start with a legend</Link>
            <button type="button" className="btn" onClick={() => setImporting(true)}>Import a list</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
        {(decks ?? []).map((d) => (
          <article key={d.id} className="panel overflow-hidden" data-testid="deck-tile-home">
            <div className="seam" style={seamStyle(d.legend?.domains)} />
            <div className="flex gap-3.5 p-3.5">
              <Link href={`/deck/${d.id}`} className="relative block w-[150px] shrink-0" title={`Open ${d.name}`}>
                <span className="block w-[112px]"><CardImage card={d.legend} name="No legend" /></span>
                <span className="absolute bottom-0 right-0 block w-[70px]"><CardImage card={d.champion} name="No champion" /></span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/deck/${d.id}`} className="display truncate text-[20px] hover:text-heat">{d.name}</Link>
                <p className="sub truncate">{d.legend ? legendName(d.legend) : 'No legend yet'}</p>
                <p className="mt-1.5 text-[12.5px] text-mist">{FORMAT_SHORT[d.format]}, {powerLabel(d.power).toLowerCase()}</p>
                <p className="num text-[14px]">{d.mainCount} main, {d.runeCount} runes, {d.battlefieldCount} battlefields{d.sideCount ? `, ${d.sideCount} side` : ''}</p>
                <div className="mt-auto flex items-center gap-2.5 pt-2">
                  <Gauge value={d.rating} size={46} label={`Rating ${d.rating}`} />
                  <span className="text-[12px]" style={{ color: d.legal ? 'var(--color-ok)' : d.complete ? 'var(--color-bad)' : 'var(--color-mist)' }}>{d.legal ? 'Legal' : d.complete ? 'Not legal' : 'Unfinished'}</span>
                  <span className="ml-auto text-[11px] text-dim">{fmtDate(d.updatedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 border-t border-edge px-3.5 py-2">
              <Link href={`/deck/${d.id}`} className="btn small">Open</Link>
              <button type="button" className="btn small" onClick={() => void duplicate(d.id)} data-testid="duplicate">Duplicate</button>
              {confirming === d.id ? (
                <span className="ml-auto flex items-center gap-1.5 text-[12px] text-mist">
                  Delete for good?
                  <button type="button" className="btn small" style={{ borderColor: 'var(--color-bad)', color: 'var(--color-bad)' }} onClick={() => void remove(d.id)} data-testid="confirm-delete">Delete</button>
                  <button type="button" className="btn small quiet" onClick={() => setConfirming(null)}>Keep</button>
                </span>
              ) : (
                <button type="button" className="btn small quiet ml-auto" onClick={() => setConfirming(d.id)} data-testid="delete">Delete</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}
