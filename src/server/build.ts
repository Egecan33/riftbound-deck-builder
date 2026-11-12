import type { BuildMode, BuildResponse } from '@/app/lib/api';
import {
  applySwaps, autoBuildDetailed, chooseBattlefields, chooseRunes, fillRestDetailed, improveDeck, planSideDeck, rate, suggestSwaps, type BuildPick,
} from '@/engine/builder';
import { validateDeck } from '@/engine/rules/validate';
import type { BuildOptions, Deck, SwapProposal } from '@/engine/types';
import { cardLookup, deckIds } from './cards';
import { getOwned } from './collection';
import { HttpError, intParam, isObject } from './http';
import { getSettings } from './settings';
import { getCardDb } from './store';

export const BUILD_MODES: readonly BuildMode[] = ['auto', 'fill', 'side', 'runes', 'battlefields', 'swaps', 'improve', 'apply'];
export const MAX_BUILD_AROUND = 20;
export const MAX_SWAPS = 40;

function readSwaps(raw: unknown): SwapProposal[] {
  if (!Array.isArray(raw) || raw.length > MAX_SWAPS) throw new HttpError(400, `options.swaps must be a list of at most ${MAX_SWAPS} proposals.`);
  return raw.map((s) => {
    if (!isObject(s) || (s.zone !== 'main' && s.zone !== 'side') || typeof s.out !== 'string' || typeof s.in !== 'string') throw new HttpError(400, 'A swap needs zone (main or side), out and in.');
    return { zone: s.zone, out: s.out, in: s.in, reason: typeof s.reason === 'string' ? s.reason : '', ratingBefore: Number(s.ratingBefore) || 0, ratingAfter: Number(s.ratingAfter) || 0 };
  });
}

/**
 * POST /api/build. `auto` and `fill` return a deck with a reason per pick; `side`, `runes` and
 * `battlefields` rebuild one zone; `swaps` and `improve` return proposals without applying them;
 * `apply` applies the proposals the user accepted. The collection is read here, never sent by the client.
 */
export function runBuild(deck: Deck, modeRaw: unknown, optionsRaw: unknown): BuildResponse {
  const started = performance.now();
  if (!BUILD_MODES.includes(modeRaw as BuildMode)) throw new HttpError(400, `mode must be one of ${BUILD_MODES.join(', ')}.`);
  const mode = modeRaw as BuildMode;
  const o = optionsRaw === undefined || optionsRaw === null ? {} : optionsRaw;
  if (!isObject(o)) throw new HttpError(400, 'options must be an object.');
  if (o.buildAround !== undefined && (!Array.isArray(o.buildAround) || o.buildAround.length > MAX_BUILD_AROUND || o.buildAround.some((id) => typeof id !== 'string'))) {
    throw new HttpError(400, `options.buildAround must be a list of at most ${MAX_BUILD_AROUND} card ids.`);
  }
  const ownedOnly = typeof o.ownedOnly === 'boolean' ? o.ownedOnly : getSettings().ownedOnly;
  const opts: BuildOptions = {
    ownedOnly, owned: ownedOnly ? getOwned() : null,
    seed: intParam(o.seed, 1, 0, 2 ** 31 - 1), buildAround: (o.buildAround as string[] | undefined) ?? [],
  };
  const db = getCardDb();
  const ctx = { db, opponentLegend: null };

  let out = deck;
  let picks: BuildPick[] = [];
  let notes: string[] = [];
  let proposals: SwapProposal[] = [];
  let profile: BuildResponse['profile'] = null;
  switch (mode) {
    case 'auto':
    case 'fill': {
      const r = mode === 'auto' ? autoBuildDetailed(deck, ctx, opts) : fillRestDetailed(deck, ctx, opts);
      out = { ...r.deck, id: deck.id, name: deck.name };
      picks = r.picks;
      notes = r.notes;
      proposals = r.climb;
      profile = r.profile ? { id: r.profile.id, title: r.profile.title, strategy: r.profile.strategy } : null;
      break;
    }
    case 'side': {
      const plan = planSideDeck(deck, ctx, opts);
      const wasLocked = new Set(deck.side.filter((e) => e.locked).map((e) => e.id));
      out = { ...deck, side: plan.entries.map((e) => ({ ...e, locked: wasLocked.has(e.id) })) };
      picks = plan.picks;
      notes = plan.notes;
      break;
    }
    case 'runes': {
      const r = chooseRunes(deck, ctx);
      out = { ...deck, runes: r.runes };
      notes = [r.reason];
      break;
    }
    case 'battlefields': {
      const around = opts.buildAround.map((id) => db.get(id)).filter((c) => c !== undefined);
      const r = chooseBattlefields(deck, ctx, around, opts, deck.battlefields);
      out = { ...deck, battlefields: r.ids };
      picks = r.picks;
      if (r.ids.length < 3) notes = [`Only ${r.ids.length} legal battlefield${r.ids.length === 1 ? '' : 's'}${opts.ownedOnly ? ' in the collection' : ''}.`];
      break;
    }
    case 'swaps':
      proposals = suggestSwaps(deck, ctx, opts, intParam(o.count, 5, 1, 20));
      break;
    case 'improve':
      proposals = improveDeck(deck, ctx, opts, intParam(o.count, 15, 1, 15));
      break;
    case 'apply':
      out = applySwaps(deck, readSwaps(o.swaps));
      break;
  }

  const { rating, precise } = rate(out, ctx);
  const ids = new Set(deckIds(out));
  for (const p of proposals) { ids.add(p.out); ids.add(p.in); }
  for (const p of picks) ids.add(p.id);
  return {
    mode, deck: out, picks, notes, proposals, profile, rating, precise, violations: validateDeck(out, db),
    cards: cardLookup(ids), ms: Math.round(performance.now() - started),
  };
}
