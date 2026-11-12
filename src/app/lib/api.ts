// The API contract: request and response types of every route, and a typed client for the UI.
// Types only from the engine; nothing here imports server code, so the file is safe in the browser.
import type {
  AxisId, Card, CardEdge, CardFeatures, CardScore, CardType, Deck, DeckRating, DeckSummary, Domain, Format, LegalityData,
  LineReport, PowerTarget, Role, Speed, SwapProposal, Targets, Violation, WinReport, Zone,
} from '@/engine/types';

export type { Deck };

// ---------------------------------------------------------------------------------------------
// Cards

/** A card as the UI gets it: the engine card plus its image path and the few stored features every tile shows. */
export interface ClientCard extends Omit<Card, 'copyLimit' | 'imageUrl' | 'printedText'> {
  /** null = any number of copies (JSON has no Infinity). */
  copyLimit: number | null;
  /** Path of the image on this server; answers an SVG placeholder with status 404 when the file is missing. */
  image: string;
  roles: Role[];
  speed: Speed;
  /** Evaluated card rating 0..100 (mechanical rating blended with play data). */
  rating: number;
  grade: string;
}
export type CardLookup = Record<string, ClientCard>;

// ---------------------------------------------------------------------------------------------
// Status, sync, settings

export type SyncStep = 'cards' | 'errata' | 'legality' | 'meta' | 'features' | 'images';
export interface SyncState {
  running: boolean;
  step: SyncStep | 'all' | null;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  /** Number of progress lines so far; pass it back as `since` to get only newer ones. */
  lineCount: number;
  lines: string[];
}
export interface SyncRequest { step: SyncStep | 'all'; /** `images`: at most this many downloads. */ limit?: number; /** `meta`: at most this many requests. */ max?: number }

export interface Settings {
  /** Builder default: only cards of the collection. */
  ownedOnly: boolean;
  /** Free-for-all has no official ban list. null = follow the legality snapshot; true/false = the user's choice (heuristic either way). */
  ffaUsesStandardBans: boolean | null;
  defaultFormat: Format;
  defaultPower: PowerTarget;
}

export interface StatusResponse {
  /** Cards and features are loaded: the app can build. false = send the user to the Data page. */
  ready: boolean;
  error: string | null;
  dbPath: string;
  steps: Record<SyncStep, { finishedAt: string; info: Record<string, unknown> } | null>;
  counts: {
    cards: number; legends: number; dataIncomplete: number; errata: number; features: number; edges: number;
    metaLists: number; metaLegends: number; images: number; collection: number; decks: number;
  };
  /** Missing images = cards - images, never below 0. */
  imagesMissing: number;
  /** The legality snapshot with its sources; null when it cannot be read. */
  legality: (LegalityData & { hub: { url: string; banListUpdated: string; rulesUpdated: string } | null; ffaUsesStandardBans: boolean; ffaNote: string | null }) | null;
  /** Card mine coverage of the last `features` step; null before it ran. */
  coverage: { cards: number; noMechanic: number; sentences: number; unparsedSentences: number; edges: number; playLists: number; cardsWithEvidence: number } | null;
  cardsSyncedAt: string | null;
  /** The card data is older than a week or was never synced. */
  stale: boolean;
  settings: Settings;
  sync: SyncState;
  /** Plain-word names the UI shows for engine ids, and the basic rune card of each domain (for its image). */
  labels: { traits: Record<string, string>; axes: { id: AxisId; label: string }[]; runeCards: Partial<Record<Domain, string>> };
}

// ---------------------------------------------------------------------------------------------
// Legends and champions

export interface LegendTile {
  card: ClientCard;
  /** Champion units this legend may choose. */
  champions: number;
  /** Public lists behind its meta numbers, and how far they can be trusted. */
  meta: { decks: number; quality: 'ok' | 'thin' | 'insufficient' } | null;
  /** Formats whose ban list names this legend. */
  bannedIn: Format[];
}
export interface LegendsResponse { legends: LegendTile[] }
export interface ChampionOption {
  card: ClientCard;
  /** Share of the legend's public lists that register this champion; null without meta data. */
  share: number | null;
  /** Formats whose ban list names this card. */
  bannedIn: Format[];
}
export interface ChampionsResponse { legend: ClientCard; champions: ChampionOption[]; signatures: ClientCard[] }

// ---------------------------------------------------------------------------------------------
// Decks

export interface DeckTile {
  id: string; name: string; updatedAt: string;
  format: Format; power: PowerTarget;
  legend: ClientCard | null; champion: ClientCard | null;
  mainCount: number; sideCount: number; runeCount: number; battlefieldCount: number;
  rating: number; legal: boolean; complete: boolean;
}
export interface DecksResponse { decks: DeckTile[] }
export interface DeckResponse { deck: Deck; updatedAt: string; cards: CardLookup }

// ---------------------------------------------------------------------------------------------
// Analyze

export interface AnalyzeRequest { deck: Deck; opponentLegend?: string | null }
export interface AnalyzeResponse {
  rating: DeckRating;
  /** The rating before rounding, one decimal: one swapped copy rarely moves the whole number. */
  precise: number;
  summary: DeckSummary;
  targets: Targets;
  themeWeights: Record<AxisId, number>;
  /** Score of every card of the deck in its own zone (main cards leave-one-out), by card id. A card in both main and side has its main score here and its side score in `sideScores`. */
  deckScores: Record<string, CardScore>;
  sideScores: Record<string, CardScore>;
  win: WinReport;
  lines: LineReport;
  /** The opponent the matchup lines were written for; null = none or unknown. */
  opponentLegend: string | null;
  /** Every card the report names. */
  cards: CardLookup;
  /** Deck ids the card data does not know. */
  unknown: string[];
  /** Where the time went, ms; `cached` = this deck state was analysed before. */
  timing: { ms: number; cached: boolean };
}

// ---------------------------------------------------------------------------------------------
// Card browser

export type BrowseZone = 'main' | 'side' | 'battlefields';
export interface CardFilters {
  type?: CardType;
  role?: Role;
  axis?: AxisId;
  /** The card has at least one of these domains (cards with no domain are kept only when `domains` is absent). */
  domains?: Domain[];
  energyMin?: number;
  energyMax?: number;
  speed?: Speed;
  /** 'champion' | 'signature' | 'basic'. */
  superType?: string;
  set?: string;
  /** Only cards of the collection. */
  owned?: boolean;
  /** true: only cards in this zone of the deck; false: only cards not in it. */
  inDeck?: boolean;
  /** Leave gated cards (banned, outside the Domain Identity, wrong type, incomplete data) out instead of listing them last. */
  hideGated?: boolean;
}
export type CardSort = 'score' | 'name' | 'energy' | 'rating' | 'popularity';
export interface CardsRequest {
  deck: Deck;
  zone?: BrowseZone;
  q?: string;
  filters?: CardFilters;
  sort?: CardSort;
  /** Default: name ascending, everything else best or highest first. */
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
export interface ScoredCard {
  card: ClientCard;
  score: CardScore;
  /** Copies in the browsed zone of the deck. */
  inDeck: number;
  owned: number;
}
export interface CardsResponse { total: number; gated: number; page: number; pageSize: number; zone: BrowseZone; cards: ScoredCard[] }

export interface CardPartner {
  card: ClientCard;
  net: number; synergy: number; antisynergy: number;
  reasons: CardEdge['reasons'];
  /** Copies in the deck's main deck (0 without a deck). */
  inDeck: number;
  /** The deck could run the partner (type, ban list, Domain Identity); true without a deck. */
  fits: boolean;
}
export interface CardDetailResponse {
  card: ClientCard;
  /** The text as printed, when an errata changed it; null otherwise. */
  printedText: string | null;
  features: CardFeatures | null;
  /** Score against the deck; null without a deck. */
  score: CardScore | null;
  /** Strongest stored pairs; with a deck, its own cards first, then cards it could run. */
  partners: CardPartner[];
  /** Stored pairs that work against the card. */
  conflicts: CardPartner[];
  printings: { code: string; set: string; variant: string; rarity: string | null }[];
  bannedIn: Format[];
  owned: number;
}

// ---------------------------------------------------------------------------------------------
// Build

export type BuildMode = 'auto' | 'fill' | 'side' | 'runes' | 'battlefields' | 'swaps' | 'improve' | 'apply';
export interface BuildRequestOptions {
  seed?: number;
  /** Default: the `ownedOnly` setting. */
  ownedOnly?: boolean;
  buildAround?: string[];
  /** `swaps`: how many proposals (default 5). `improve`: at most this many (default 15). */
  count?: number;
  /** `apply`: the proposals to apply, in order. */
  swaps?: SwapProposal[];
}
export interface BuildRequest { deck: Deck; mode: BuildMode; options?: BuildRequestOptions }
export interface BuildPickView { zone: Zone; id: string; qty: number; phase: string; reason: string }
export interface BuildResponse {
  mode: BuildMode;
  /** The deck after the build. For `swaps` and `improve` it is the deck as sent: proposals are not applied. */
  deck: Deck;
  /** Why each card was chosen, in order. */
  picks: BuildPickView[];
  notes: string[];
  /** `auto`: swaps the rating climb accepted (already in `deck`). `swaps` / `improve`: the proposals. */
  proposals: SwapProposal[];
  profile: { id: string; title: string; strategy: string } | null;
  rating: DeckRating;
  precise: number;
  violations: Violation[];
  cards: CardLookup;
  ms: number;
}

// ---------------------------------------------------------------------------------------------
// Import, export, collection

export interface ImportRequest { text: string; name?: string; format?: Format; power?: PowerTarget }
export interface ImportResponse {
  deck: Deck;
  unresolved: { line: number; text: string }[];
  notices: string[];
  violations: Violation[];
  legal: boolean;
  cards: CardLookup;
}
export interface ExportResponse { text: string; code: string | null; codeSkipped: string[]; codeError: string | null }

export interface CollectionResponse { owned: Record<string, number>; unique: number; total: number; cards: CardLookup }
export interface CollectionRequest {
  /** A pasted list or a CSV export. */
  text?: string;
  /** Or counts by card id. */
  owned?: Record<string, number>;
  /** 'replace' (default) or 'merge' (adds to what is there; with `owned`, sets those cards). */
  mode?: 'replace' | 'merge';
}
export interface CollectionImportResponse extends CollectionResponse {
  unresolved: { line: number; text: string }[];
  notices: string[];
  format: 'csv' | 'list' | 'counts';
  columns: { name: string | null; code: string | null; set: string | null; quantity: string[] } | null;
}

// ---------------------------------------------------------------------------------------------
// Client

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Where the API lives; '' in the browser. Tests and scripts set it to an absolute origin. */
let base = '';
export const setApiBase = (origin: string): void => { base = origin.replace(/\/$/, ''); };

async function call<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(base + path, {
    method, signal, cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch (e) {
    // An aborted read must not look like an empty answer; an empty or non-JSON body is reported by status below.
    if (signal?.aborted) throw e;
  }
  if (!res.ok) {
    const message = data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : `${method} ${path} failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

const query = (params: Record<string, string | number | boolean | null | undefined>): string => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const imagePath = (cardId: string): string => `/api/img/${encodeURIComponent(cardId)}.webp`;

export const getStatus = (signal?: AbortSignal) => call<StatusResponse>('GET', '/api/status', undefined, signal);
export const getSync = (since = 0, signal?: AbortSignal) => call<SyncState>('GET', `/api/sync${query({ since })}`, undefined, signal);
export const startSync = (request: SyncRequest) => call<SyncState>('POST', '/api/sync', request);

export const getLegends = (params: { q?: string; domains?: Domain[] } = {}, signal?: AbortSignal) =>
  call<LegendsResponse>('GET', `/api/legends${query({ q: params.q, domains: params.domains?.join(',') })}`, undefined, signal);
export const getChampions = (legend: string, signal?: AbortSignal) => call<ChampionsResponse>('GET', `/api/champions${query({ legend })}`, undefined, signal);

export const listDecks = (signal?: AbortSignal) => call<DecksResponse>('GET', '/api/decks', undefined, signal);
export const createDeck = (deck: Deck) => call<DeckResponse>('POST', '/api/decks', { deck });
export const getDeck = (id: string, signal?: AbortSignal) => call<DeckResponse>('GET', `/api/decks/${encodeURIComponent(id)}`, undefined, signal);
export const updateDeck = (id: string, deck: Deck) => call<DeckResponse>('PUT', `/api/decks/${encodeURIComponent(id)}`, { deck });
export const deleteDeck = (id: string) => call<{ ok: true }>('DELETE', `/api/decks/${encodeURIComponent(id)}`);

export const analyzeDeck = (deck: Deck, opponentLegend: string | null = null, signal?: AbortSignal) =>
  call<AnalyzeResponse>('POST', '/api/analyze', { deck, opponentLegend } satisfies AnalyzeRequest, signal);
export const browseCards = (request: CardsRequest, signal?: AbortSignal) => call<CardsResponse>('POST', '/api/cards', request, signal);
/** Card detail against a saved deck (`deckId`) or none. */
export const getCard = (id: string, deckId?: string | null, signal?: AbortSignal) =>
  call<CardDetailResponse>('GET', `/api/card/${encodeURIComponent(id)}${query({ deck: deckId })}`, undefined, signal);
/** Card detail against the deck as it is being edited. */
export const getCardFor = (id: string, deck: Deck, signal?: AbortSignal) =>
  call<CardDetailResponse>('POST', `/api/card/${encodeURIComponent(id)}`, { deck }, signal);
export const buildDeck = (deck: Deck, mode: BuildMode, options?: BuildRequestOptions, signal?: AbortSignal) =>
  call<BuildResponse>('POST', '/api/build', { deck, mode, options } satisfies BuildRequest, signal);

export const importDeck = (request: ImportRequest) => call<ImportResponse>('POST', '/api/import', request);
export const exportDeck = (deck: Deck) => call<ExportResponse>('POST', '/api/export', { deck });

export const getCollection = (signal?: AbortSignal) => call<CollectionResponse>('GET', '/api/collection', undefined, signal);
export const saveCollection = (request: CollectionRequest) => call<CollectionImportResponse>('POST', '/api/collection', request);

export const getSettings = (signal?: AbortSignal) => call<Settings>('GET', '/api/settings', undefined, signal);
export const updateSettings = (patch: Partial<Settings>) => call<Settings>('PUT', '/api/settings', patch);
