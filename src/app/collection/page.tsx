'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CardDetail } from '../components/CardDetail';
import { CardImage } from '../components/card';
import { useNotify, useStatus } from '../components/Shell';
import { getCollection, saveCollection, type CollectionImportResponse, type CollectionResponse } from '../lib/api';
import { fmtInt, isAbort } from '../lib/ui';

export default function CollectionPage() {
  const notify = useNotify();
  const { refresh } = useStatus();
  const [col, setCol] = useState<CollectionResponse | null>(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [last, setLast] = useState<CollectionImportResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getCollection(ctrl.signal).then(setCol, (e) => {
      if (!isAbort(e)) notify.error(e);
    });
    return () => ctrl.abort();
  }, [notify]);

  const submit = async (body: string) => {
    setBusy(true);
    try {
      const res = await saveCollection({ text: body, mode });
      setCol(res);
      setLast(res);
      setText('');
      void refresh();
      notify.info(`Collection saved: ${fmtInt(res.total)} cards, ${fmtInt(res.unique)} different`);
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(false);
    }
  };
  const setQty = async (id: string, qty: number) => {
    try {
      const res = await saveCollection({ owned: { [id]: Math.max(0, qty) }, mode: 'merge' });
      setCol(res);
      void refresh();
    } catch (e) {
      notify.error(e);
    }
  };
  const clear = async () => {
    setBusy(true);
    try {
      const res = await saveCollection({ owned: {}, mode: 'replace' });
      setCol(res);
      setLast(null);
      void refresh();
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(false);
    }
  };

  const cards = useMemo(() => {
    if (!col) return [];
    const needle = q.trim().toLowerCase();
    return Object.entries(col.owned)
      .map(([id, qty]) => ({ id, qty, card: col.cards[id] }))
      .filter((x) => x.qty > 0 && (!needle || (x.card?.name ?? x.id).toLowerCase().includes(needle)))
      .sort((a, b) => (a.card?.name ?? a.id).localeCompare(b.card?.name ?? b.id));
  }, [col, q]);

  return (
    <div className="mx-auto grid max-w-[1320px] grid-cols-[380px_1fr] gap-5 px-6 py-6" data-testid="collection-page">
      <div>
        <h1 className="display text-[30px]">Collection</h1>
        <p className="sub mt-1">Optional. With a collection the browser can show only cards you own, and builds can stay inside it.</p>

        <section className="panel mt-4 space-y-2.5 p-4">
          <h2 className="h">Paste a list or load a CSV</h2>
          <textarea className="field w-full" rows={12} placeholder={'3 Falling Star\n2 OGN-122\nor a CSV export with name, code and quantity columns'} value={text} onChange={(e) => setText(e.target.value)} aria-label="Collection list or CSV" data-testid="collection-text" />
          <div className="seg" role="group" aria-label="What to do with the cards already saved">
            <button type="button" aria-pressed={mode === 'replace'} onClick={() => setMode('replace')}>Replace my collection</button>
            <button type="button" aria-pressed={mode === 'merge'} onClick={() => setMode('merge')}>Add to it</button>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn primary" disabled={busy || !text.trim()} onClick={() => void submit(text)} data-testid="collection-save">{busy ? 'Saving' : 'Save collection'}</button>
            <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>Load a CSV file</button>
            <input
              ref={file} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void submit(await f.text());
              }}
            />
          </div>
        </section>

        {last && (
          <section className="panel mt-4 p-4 text-[12.5px]" data-testid="collection-result">
            <h2 className="h mb-1">Last import</h2>
            <p>Read as {last.format === 'csv' ? 'a CSV file' : 'a text list'}.{last.format === 'csv' && last.columns ? ` Columns used: name ${last.columns.name ?? 'none'}, code ${last.columns.code ?? 'none'}, quantity ${last.columns.quantity.join(' + ') || 'none'}.` : ''}</p>
            {last.notices.map((n, i) => <p key={i} className="sub mt-1">{n}</p>)}
            {last.unresolved.length > 0 && (
              <>
                <p className="mt-2 font-semibold text-bad">{last.unresolved.length} {last.unresolved.length === 1 ? 'line was' : 'lines were'} not understood</p>
                <ul className="well mt-1 max-h-40 overflow-y-auto px-2.5 py-1.5">
                  {last.unresolved.map((u) => <li key={u.line}><span className="text-dim">line {u.line}</span> {u.text}</li>)}
                </ul>
              </>
            )}
          </section>
        )}
      </div>

      <section className="min-w-0">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="h text-[17px]" data-testid="collection-total">{col ? `${fmtInt(col.total)} cards, ${fmtInt(col.unique)} different` : 'Loading'}</h2>
          <input className="field ml-auto w-56" placeholder="Search your cards" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the collection" />
          <button type="button" className="btn quiet" disabled={busy || !col || col.total === 0} onClick={() => void clear()}>Empty the collection</button>
        </div>
        {col && col.total === 0 && <p className="panel p-6 text-mist">No cards saved. Paste a list on the left: one card per line, with a count in front.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2.5" data-testid="collection-grid">
          {cards.map((x) => (
            <div key={x.id} className="tile">
              <button type="button" className="tile-main" onClick={() => setDetail(x.id)} title={x.card?.name ?? x.id}><CardImage card={x.card} id={x.id} /></button>
              <span className="qty">{x.qty}</span>
              <span className="tile-actions">
                <button type="button" className="tile-btn" onClick={() => void setQty(x.id, x.qty - 1)} aria-label={`One ${x.card?.name ?? x.id} fewer`}>−</button>
                <button type="button" className="tile-btn" onClick={() => void setQty(x.id, x.qty + 1)} aria-label={`One ${x.card?.name ?? x.id} more`}>+</button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {detail && <CardDetail id={detail} deck={null} onClose={() => setDetail(null)} onOpen={setDetail} />}
    </div>
  );
}
