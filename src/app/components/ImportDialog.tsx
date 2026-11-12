'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Format, PowerTarget } from '@/engine/types';
import { createDeck, importDeck, type ImportResponse } from '../lib/api';
import { FORMATS, POWERS, countOf, runeCount } from '../lib/ui';
import { Overlay, Thumbs } from './card';
import { useNotify, useStatus } from './Shell';

const SAMPLE = `Legend:
1 Daughter of the Void

Champion:
1 Kai'Sa, Survivor

Main:
3 Falling Star
...`;

/** Paste a text list or a deck code, see what was understood, then save it as a deck. */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const notify = useNotify();
  const { status } = useStatus();
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>(status?.settings.defaultFormat ?? 'standard-bo3');
  const [power, setPower] = useState<PowerTarget>(status?.settings.defaultPower ?? 'focused');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const read = async () => {
    setBusy(true);
    try {
      setResult(await importDeck({ text, name: name.trim() || undefined, format, power }));
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const res = await createDeck(result.deck);
      router.push(`/deck/${res.deck.id}`);
    } catch (e) {
      notify.error(e);
      setBusy(false);
    }
  };

  const d = result?.deck;
  return (
    <Overlay onClose={onClose} label="Import a deck" width={860}>
      <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
        <h2 className="h">Import a deck</h2>
        <span className="sub">A text list (with or without section headers, set codes allowed) or a deck code.</span>
        <button type="button" className="btn quiet ml-auto" onClick={onClose}>Close</button>
      </div>
      <div className="grid min-h-0 grid-cols-2 gap-4 overflow-y-auto p-4" data-testid="import-dialog">
        <div className="space-y-2">
          <textarea className="field w-full" rows={18} placeholder={SAMPLE} value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} aria-label="Deck list or deck code" data-testid="import-text" />
          <input className="field w-full" placeholder="Deck name (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Deck name" />
          <div className="flex gap-2">
            <select className="field min-w-0 flex-1" value={format} onChange={(e) => { setFormat(e.target.value as Format); setResult(null); }} aria-label="Format">
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select className="field" value={power} onChange={(e) => setPower(e.target.value as PowerTarget)} aria-label="Power target">
              {POWERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <button type="button" className="btn primary" disabled={busy || !text.trim()} onClick={() => void read()} data-testid="import-read">{busy && !result ? 'Reading' : 'Read the list'}</button>
        </div>

        <div className="min-w-0">
          {!result && <p className="sub">Nothing is saved until you have seen what was understood. Lines the app cannot resolve are listed here, never dropped silently.</p>}
          {result && d && (
            <div className="space-y-3" data-testid="import-result">
              <p className="text-[13px]">
                Read {countOf(d.main)} main, {runeCount(d)} runes, {d.battlefields.length} battlefields, {countOf(d.side)} side.{' '}
                <span style={{ color: result.legal ? 'var(--color-ok)' : 'var(--color-bad)' }}>{result.legal ? 'Legal in this format.' : 'Not legal as read.'}</span>
              </p>
              <Thumbs ids={[d.legend, d.champion, ...d.main.map((e) => e.id)].filter((x): x is string => !!x)} lookup={result.cards} size={44} max={28} />
              {result.unresolved.length > 0 && (
                <div>
                  <h3 className="mb-1 text-[12.5px] font-semibold text-bad">{result.unresolved.length} {result.unresolved.length === 1 ? 'line was' : 'lines were'} not understood</h3>
                  <ul className="well max-h-32 overflow-y-auto px-2.5 py-1.5 text-[12px]" data-testid="import-unresolved">
                    {result.unresolved.map((u) => <li key={u.line}><span className="text-dim">line {u.line}</span> {u.text}</li>)}
                  </ul>
                </div>
              )}
              {result.notices.length > 0 && <ul className="space-y-1 text-[12px] text-mist">{result.notices.map((n, i) => <li key={i}>{n}</li>)}</ul>}
              {result.violations.length > 0 && (
                <ul className="space-y-1 text-[12px]">
                  {result.violations.slice(0, 8).map((v, i) => <li key={i} style={{ color: v.severity === 'error' ? 'var(--color-bad)' : 'var(--color-mist)' }}>{v.message}</li>)}
                </ul>
              )}
              <button type="button" className="btn primary" disabled={busy} onClick={() => void save()} data-testid="import-save">Save as a new deck</button>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}
