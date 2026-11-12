'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Deck } from '@/engine/types';
import { getCard, getCardFor, type CardDetailResponse, type CardPartner } from '../lib/api';
import { FORMAT_SHORT, PART_LABEL, ROLE_LABELS, axisLabel, bandVar, errText, evidenceText, fmtInt, isAbort, isMeasuredScope, pct, traitLabel, typeLine } from '../lib/ui';
import { Bar, CardImage, DomainPips, Heur, Measured, Overlay, RichText, richTokens } from './card';
import { useLabels } from './Shell';

/**
 * Why a card is what the app says it is: the picture, the current text, what the engine read from
 * it, how the score in this deck adds up, the two ratings with their evidence, and its partners.
 */
export function CardDetail({ id, deck, onClose, onOpen, actions }: {
  id: string;
  /** The deck as it is being edited; null = no deck (collection, legend pages). */
  deck: Deck | null;
  onClose: () => void;
  onOpen: (id: string) => void;
  actions?: (detail: CardDetailResponse) => ReactNode;
}) {
  const labels = useLabels();
  const [detail, setDetail] = useState<CardDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    (deck ? getCardFor(id, deck, ctrl.signal) : getCard(id, null, ctrl.signal)).then(setDetail, (e) => {
      if (!isAbort(e)) setError(errText(e));
    });
    return () => ctrl.abort();
  }, [id, deck]);

  const d = detail && detail.card.id === id ? detail : null;
  const card = d?.card ?? null;
  const f = d?.features ?? null;
  const wide = card?.type === 'battlefield';

  return (
    <Overlay onClose={onClose} label={card?.name ?? 'Card'} width={1180}>
      <div className="flex min-h-0 flex-1" data-testid="card-detail">
        <div className={`shrink-0 overflow-y-auto border-r border-edge bg-pit p-4 ${wide ? 'w-[460px]' : 'w-[372px]'}`}>
          <CardImage card={card} id={id} eager />
          {d && (
            <div className="mt-3 space-y-2">
              {actions?.(d)}
              {d.bannedIn.length > 0 && <p className="text-[12px] text-bad">Banned in {d.bannedIn.map((x) => FORMAT_SHORT[x]).join(', ')} (synced ban list).</p>}
              {card?.dataIncomplete && <p className="text-[12px] text-bad">The official gallery row for this card is unfinished, so it is kept out of decks until a sync repairs it.</p>}
              <p className="sub">
                {d.printings.length} {d.printings.length === 1 ? 'printing' : 'printings'}: {d.printings.slice(0, 6).map((p) => `${p.code}${p.variant && p.variant !== 'base' ? ` ${p.variant}` : ''}`).join(', ')}
                {d.printings.length > 6 ? ` and ${d.printings.length - 6} more` : ''}. You own {d.owned}.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          {error && <p role="alert" className="text-bad">This card could not be loaded: {error}</p>}
          {!d && !error && <div className="skeleton h-40 rounded-lg" />}
          {d && card && (
            <div className="space-y-5">
              <header className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="display text-[26px]">{card.name}</h2>
                  <p className="sub mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>{typeLine(card)}</span>
                    {card.domains.length > 0 && <DomainPips domains={card.domains} />}
                    {card.energy !== null && <span><span className="energy">{card.energy}</span> Energy</span>}
                    {card.power !== null && card.power > 0 && <span>{card.power} Power</span>}
                    {card.might !== null && <span>{card.might} Might</span>}
                    {card.mightBonus !== null && <span>+{card.mightBonus} Might when attached</span>}
                    {card.tags.length > 0 && <span>{card.tags.join(', ')}</span>}
                    <span className="text-dim">{card.code}</span>
                  </p>
                </div>
                <button type="button" className="btn quiet" onClick={onClose}>Close</button>
              </header>

              <section>
                <h3 className="h mb-1.5 flex items-center gap-2">
                  Current text
                  {card.errata && <span className="mark rule" data-testid="errata-mark" title="An official errata changed this card. The text here is the current one; the picture may still show the old wording.">errata</span>}
                </h3>
                <div className="well px-3 py-2.5 text-[13.5px] leading-relaxed">
                  {card.text ? <RichText text={card.text} /> : <span className="sub">No rules text.</span>}
                </div>
                {d.printedText && (
                  <details className="mt-1.5">
                    <summary className="sub cursor-pointer">Text as printed, before the errata</summary>
                    <div className="mt-1 border-l-2 border-edge-hi pl-3 text-[12.5px] text-mist"><RichText text={d.printedText} /></div>
                  </details>
                )}
              </section>

              {f && (
                <section>
                  <h3 className="h mb-1.5">What the engine read from the text</h3>
                  <div className="flex flex-wrap gap-1.5" data-testid="traits">
                    {f.roles.map((r) => <span key={r} className="chip text-bone" title="Role: what the card does for a deck">{ROLE_LABELS[r]}</span>)}
                    {[...new Set(f.traits.map((t) => traitLabel(t, labels)))].filter((t) => !f.roles.some((r) => ROLE_LABELS[r] === t)).map((t) => <span key={t} className="chip">{t}</span>)}
                    {f.speed !== 'normal' && <span className="chip">{f.speed === 'reaction' ? 'Reaction speed' : 'Action speed'}</span>}
                    {f.roles.length + f.traits.length === 0 && <span className="sub">No mechanic was read from this card. Its ratings rest on stats and play data alone.</span>}
                  </div>
                  {Object.keys(f.axes).length > 0 && (
                    <p className="sub mt-2">
                      Themes: {Object.entries(f.axes).map(([axis, v]) => `${axisLabel(axis, labels)} (${[v.e > 0 ? 'enabler' : '', v.p > 0 ? 'payoff' : ''].filter(Boolean).join(' and ')})`).join(', ')}.
                    </p>
                  )}
                  {f.unparsed.length > 0 && (
                    <p className="mt-2 text-[12px] text-bad">
                      Not understood by the engine ({f.unparsed.length} {f.unparsed.length === 1 ? 'sentence' : 'sentences'}): {f.unparsed.map((s) => `"${s}"`).join(' ')}
                    </p>
                  )}
                </section>
              )}

              {f && (
                <section data-testid="ratings">
                  <h3 className="h mb-1.5">Card rating, outside any deck</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="well p-3">
                      <div className="flex items-baseline gap-2">
                        <span className="num text-[30px]" style={{ color: bandVar(f.baseRating) }}>{Math.round(f.baseRating)}</span>
                        <span className="font-semibold">Mechanical rating</span>
                        <Heur title="Computed from the card text and stats alone, with weights the engine's authors chose." />
                      </div>
                      <p className="sub mt-1">Grade {f.grade}. From the text and stats only; no play data.</p>
                    </div>
                    <div className="well p-3">
                      <div className="flex items-baseline gap-2">
                        <span className="num text-[30px]" style={{ color: bandVar(f.evaluatedRating) }}>{Math.round(f.evaluatedRating)}</span>
                        <span className="font-semibold">Evaluated rating</span>
                        {f.evidence ? <Measured /> : <Heur title="No play data: the evaluated rating equals the mechanical rating." />}
                      </div>
                      <p className="mt-1 text-[12.5px]" data-testid="evidence">
                        {f.evidence ? (
                          <>
                            Played {evidenceText(f.evidence)}
                            <span className="sub"> ({fmtInt(f.evidence.lists)} lists, {f.evidence.avgCopies.toFixed(1)} copies when run{f.evidence.banned ? '; banned today, so these numbers are from before the ban' : ''}).</span>
                          </>
                        ) : (
                          <span className="sub">No play data: no synced list that could run this card exists yet.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 text-[12.5px] text-mist">
                    {f.ratingReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </section>
              )}

              {d.score && (
                <section data-testid="score-parts">
                  <h3 className="h mb-1.5 flex items-baseline gap-2">
                    Score in this deck
                    <span className="num text-[20px]" style={{ color: bandVar(d.score.score, !!d.score.gate) }}>{d.score.gate ? 'not allowed' : `${d.score.score} / 100`}</span>
                  </h3>
                  {d.score.gate && <p className="mb-2 text-bad">{d.score.gate.message}</p>}
                  <div className="space-y-2">
                    {d.score.parts.map((p, i) => {
                      const reason = d.score!.reasons.find((r) => r.toLowerCase().startsWith((PART_REASON_PREFIX[p.key] ?? p.key).toLowerCase())) ?? d.score!.reasons[i];
                      return (
                        <div key={p.key} className="grid grid-cols-[200px_1fr] gap-x-3">
                          <div>
                            <div className="flex items-baseline justify-between text-[12.5px]">
                              <span>{PART_LABEL[p.key] ?? p.key}</span>
                              <span className="num text-mist">{p.points.toFixed(1)} / {p.max.toFixed(1)}</span>
                            </div>
                            <Bar value={p.points} max={p.max} />
                          </div>
                          <p className="text-[12.5px] text-mist">{reason ? reason.replace(/^[^:]{0,40}?\d+(\.\d+)?\/\d+(\.\d+)?( \(heuristic\))?: /, '') : ''}{reason && /heuristic/i.test(reason) ? <> <Heur /></> : null}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <PartnerList title={deck ? 'Partners in and around this deck' : 'Strongest partners'} partners={d.partners} onOpen={onOpen} testId="partners" empty="No stored pair involves this card." legendId={deck?.legend ?? null} />
              {d.conflicts.length > 0 && <PartnerList title="Works against" partners={d.conflicts} onOpen={onOpen} testId="conflicts" empty="" legendId={deck?.legend ?? null} />}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

/** The engine starts each reason with the part's own name; this maps a part key to that prefix. */
const PART_REASON_PREFIX: Record<string, string> = { quality: 'Quality', synergy: 'Synergy', role: 'Role', curve: 'Curve', meta: 'Meta', fit: 'Format' };

function PartnerList({ title, partners, onOpen, testId, empty, legendId }: { title: string; partners: CardPartner[]; onOpen: (id: string) => void; testId: string; empty: string; legendId: string | null }) {
  return (
    <section data-testid={testId}>
      <h3 className="h mb-1.5">{title}</h3>
      {partners.length === 0 && <p className="sub">{empty}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        {partners.map((p) => (
          <div key={p.card.id} className="well flex gap-3 p-2.5">
            <button type="button" className={`shrink-0 self-start ${p.card.type === 'battlefield' ? 'w-[110px]' : 'w-[78px]'}`} onClick={() => onOpen(p.card.id)} title={`Open ${p.card.name}`}>
              <CardImage card={p.card} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-semibold">{p.card.name}</span>
                <span className="num ml-auto shrink-0 text-mist" title="Net strength of the pair: synergy minus anti-synergy">{p.net > 0 ? '+' : ''}{p.net.toFixed(2)}</span>
              </div>
              <p className="sub">{p.card.type === 'legend' ? (p.card.id === legendId ? 'The legend of this deck' : 'A legend') : p.inDeck > 0 ? `${p.inDeck} in the deck` : p.fits ? 'Not in the deck; it could run it' : 'Outside what this deck can run'}</p>
              <ul className="mt-1 space-y-1.5">
                {p.reasons.slice(0, 3).map((r) => (
                  <li key={r.id} className="text-[12px] leading-snug">
                    <span className={r.kind === 'antisynergy' ? 'text-bad' : 'text-bone'}>{r.label.replace(/ \(measured\)$/, '')}</span>{' '}
                    {isMeasuredScope(r.scope) ? <Measured title="Counted in synced public lists: these two cards are registered together more often than chance predicts." /> : <Heur title="Read from the two card texts by the engine's pair rules; not measured in play." />}
                    <span className="mt-0.5 block text-mist">{richTokens(r.detail)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Share of a legend's lists that register a champion, for the champion step. */
export const shareText = (share: number | null): string => (share === null ? 'no play data' : `${pct(share)} of its lists`);
