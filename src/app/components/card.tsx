'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Domain } from '@/engine/types';
import { getLegends, imagePath, type CardLookup, type ClientCard, type LegendTile } from '../lib/api';
import { DOMAINS, DOMAIN_LABEL, bandVar, domainVar } from '../lib/ui';

// ---------------------------------------------------------------------------------------------
// Card image. A card is always its picture; when the file is missing the tile says the name.

export function CardImage({ card, id, name, wide, eager, className = '' }: { card?: ClientCard | null; id?: string; name?: string; wide?: boolean; eager?: boolean; className?: string }) {
  const cardId = card?.id ?? id ?? '';
  const label = card?.name ?? name ?? cardId;
  const isWide = wide ?? card?.type === 'battlefield';
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [cardId]);
  return (
    <span className={`card ${isWide ? 'wide' : ''} ${className}`}>
      {cardId && !failed ? (
        <img
          src={card?.image ?? imagePath(cardId)} alt={label} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
          onError={() => setFailed(true)}
          // The image route answers a missing file with a 252x352 SVG, which a browser draws like any picture. Show the name instead.
          onLoad={(e) => e.currentTarget.naturalWidth === 252 && e.currentTarget.naturalHeight === 352 && setFailed(true)}
        />
      ) : (
        <span className="card-fallback" data-testid="card-fallback">{label || 'Unknown card'}</span>
      )}
    </span>
  );
}

export function ScoreBadge({ score, gated = false, title }: { score: number; gated?: boolean; title?: string }) {
  return (
    <span className={`score ${gated ? 'gated' : ''}`} style={{ '--band': bandVar(score, gated) } as CSSProperties} title={title ?? (gated ? 'Cannot go in this deck' : `Card score ${score} of 100 in this deck`)}>
      {gated ? 'no' : score}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Domains

export function Pip({ domain, title }: { domain: Domain; title?: string }) {
  return <span className="pip" style={{ '--dc': domainVar(domain) } as CSSProperties} title={title ?? DOMAIN_LABEL[domain]} role="img" aria-label={DOMAIN_LABEL[domain]} />;
}
export function DomainPips({ domains }: { domains: Domain[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {domains.map((d) => <Pip key={d} domain={d} />)}
    </span>
  );
}
export function DomainFilter({ value, onChange, only }: { value: Domain[]; onChange: (next: Domain[]) => void; only?: Domain[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {(only ?? DOMAINS).map((d) => {
        const on = value.includes(d);
        return (
          <button key={d} type="button" className="chip" aria-pressed={on} style={{ '--dc': domainVar(d) } as CSSProperties} onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}>
            <Pip domain={d} />
            {DOMAIN_LABEL[d]}
          </button>
        );
      })}
    </span>
  );
}
export const seamStyle = (domains: Domain[] | undefined): CSSProperties => ({ '--d1': domainVar(domains?.[0]), '--d2': domainVar(domains?.[1] ?? domains?.[0]) }) as CSSProperties;

// ---------------------------------------------------------------------------------------------
// Provenance marks

export const Heur = ({ title }: { title?: string }) => <span className="mark heuristic" title={title ?? 'A judgement of the engine: not an official rule and not measured in play data.'}>heuristic</span>;
export const Measured = ({ title }: { title?: string }) => <span className="mark measured" title={title ?? 'Counted in synced public deck lists. Data about what players register, not proof of what wins.'}>measured</span>;

// ---------------------------------------------------------------------------------------------
// Card text: [Fury] becomes a rune pip, [3] an Energy cost, [Legion] a keyword.

const DOMAIN_WORD: Record<string, Domain> = { fury: 'fury', calm: 'calm', mind: 'mind', body: 'body', chaos: 'chaos', order: 'order' };
/** One line of card text with its bracket tokens drawn; also used inside quoted reasons. */
export function richTokens(line: string): ReactNode[] {
  return line.split(/(\[[^\]]+\])/).map((part, i) => {
    const m = /^\[([^\]]+)\]$/.exec(part);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const word = m[1]!;
    const domain = DOMAIN_WORD[word.toLowerCase().replace(/ rune$/, '')];
    if (domain) return <Pip key={i} domain={domain} title={`${DOMAIN_LABEL[domain]} rune`} />;
    if (/^\d+$/.test(word)) return <span key={i} className="energy" title={`${word} Energy`}>{word}</span>;
    if (/^(any|a|any rune)$/i.test(word)) return <span key={i} className="energy" title="A rune of any domain">any</span>;
    return <span key={i} className="kw">{word}</span>;
  });
}
export function RichText({ text }: { text: string }) {
  const lines = text.split(/\n+/).filter((l) => l.trim() !== '');
  return (
    <>
      {lines.map((line, li) => <p key={li} className={li ? 'mt-1.5' : ''}>{richTokens(line)}</p>)}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// A row of small card images inside a sentence-level block (a line, a route, a reason).

export function Thumbs({ ids, lookup, onOpen, size = 46, dim, max = 10 }: { ids: string[]; lookup: CardLookup; onOpen?: (id: string) => void; size?: number; dim?: boolean; max?: number }) {
  const unique = useMemo(() => [...new Set(ids)], [ids]);
  if (unique.length === 0) return null;
  const shown = unique.slice(0, max);
  return (
    <span className="flex flex-wrap items-end gap-1.5">
      {shown.map((id) => {
        const card = lookup[id];
        const wide = card?.type === 'battlefield';
        return (
          <button key={id} type="button" className={`shrink-0 ${dim ? 'opacity-60 hover:opacity-100' : ''}`} style={{ width: wide ? size * 1.4 : size }} onClick={() => onOpen?.(id)} title={card?.name ?? id}>
            <CardImage card={card} id={id} />
          </button>
        );
      })}
      {unique.length > shown.length && <span className="sub pb-1">+{unique.length - shown.length} more</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Gauge and bars

export function Gauge({ value, size = 56, label }: { value: number | null; size?: number; label?: string }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} title={label} data-testid="rating-gauge">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-edge)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bandVar(v)} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, Math.max(0, v))) / 100} ${c}`} />
      </svg>
      <span className="num absolute" style={{ fontSize: size * 0.4, color: bandVar(v) }}>{value === null ? '–' : Math.round(v)}</span>
    </span>
  );
}

export function Bar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span className="bar block" style={{ '--band': color ?? bandVar(share * 100) } as CSSProperties}>
      <i style={{ width: `${share * 100}%` }} />
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Overlay

export function Overlay({ onClose, children, label, width = 1080 }: { onClose: () => void; children: ReactNode; label: string; width?: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    box.current?.focus();
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div className="overlay-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="panel flex max-h-full flex-col overflow-hidden shadow-2xl outline-none" style={{ width: `min(${width}px, 100%)` }}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Legend picker: a button showing the chosen legend; opens a grid of legend images.

export function LegendPicker({ value, onChange, label, emptyText, exclude }: { value: string | null; onChange: (id: string | null, card: ClientCard | null) => void; label: string; emptyText: string; exclude?: string | null }) {
  const [open, setOpen] = useState(false);
  const [legends, setLegends] = useState<LegendTile[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if ((!open && !value) || legends) return;
    const ctrl = new AbortController();
    getLegends({}, ctrl.signal).then((r) => setLegends(r.legends), () => {});
    return () => ctrl.abort();
  }, [open, value, legends]);
  const chosen = legends?.find((l) => l.card.id === value)?.card ?? null;
  const shown = (legends ?? []).filter((l) => l.card.id !== exclude && (!q.trim() || `${l.card.name} ${l.card.championTag ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)} data-testid="legend-picker" title={label}>
        {chosen ? (
          <>
            <DomainPips domains={chosen.domains} />
            {chosen.championTag ?? chosen.name}
          </>
        ) : value ? 'Loading' : emptyText}
      </button>
      {open && (
        <Overlay onClose={() => setOpen(false)} label={label} width={980}>
          <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
            <h2 className="h">{label}</h2>
            <input className="field w-56" placeholder="Search legends" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <span className="sub">Lists behind each legend are shown under it; fewer lists means thinner matchup data.</span>
            <button type="button" className="btn quiet ml-auto" onClick={() => { onChange(null, null); setOpen(false); }}>No legend</button>
            <button type="button" className="btn quiet" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="grid grid-cols-8 gap-2.5 overflow-y-auto p-4">
            {legends === null && Array.from({ length: 16 }, (_, i) => <div key={i} className="card skeleton" />)}
            {shown.map((l) => (
              <button key={l.card.id} type="button" className="text-left" onClick={() => { onChange(l.card.id, l.card); setOpen(false); }} data-testid="legend-option">
                <CardImage card={l.card} />
                <span className="sub mt-1 block truncate">{l.card.championTag ?? l.card.name}</span>
                <span className="block text-[10.5px] text-dim">{l.meta ? `${l.meta.decks} lists` : 'no lists'}</span>
              </button>
            ))}
          </div>
        </Overlay>
      )}
    </>
  );
}
