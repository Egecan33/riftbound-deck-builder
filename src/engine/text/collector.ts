// Collects cards into the zones of a Deck. Shared by the text importer and the deck-code decoder. Pure.
import { nameKey } from '../rules/names';
import type { Card, CardDb, Deck, DeckEntry, Domain } from '../types';
import { isToken, tokenNotice } from './resolve';

export type Section = 'legend' | 'champion' | 'main' | 'runes' | 'battlefields' | 'side';

/** Collects cards into the zones of a Deck. Shared by the text importer and the deck-code decoder. */
export class DeckCollector {
  legend: string | null = null;
  champion: string | null = null;
  readonly extraLegends: string[] = [];
  readonly battlefields: string[] = [];
  readonly runes: Partial<Record<Domain, number>> = {};
  readonly notices: string[] = [];
  private readonly main = new Map<string, number>();
  private readonly side = new Map<string, number>();
  private readonly bannedSeen = new Set<string>();
  private readonly bans: Map<string, string[]>;

  constructor(private readonly db: CardDb) {
    // The ban list is synced data (sync-data/legality.json); here it only produces a notice.
    this.bans = new Map();
    for (const ban of db.legality().bans) {
      const key = nameKey(ban.name);
      this.bans.set(key, [...(this.bans.get(key) ?? []), ...ban.formats]);
    }
  }

  private notice(text: string): void {
    if (!this.notices.includes(text)) this.notices.push(text);
  }

  /** Returns false when the card cannot be placed (a rune without a domain). */
  add(card: Card, qty: number, section: Section | null): boolean {
    if (qty <= 0) return true;
    if (isToken(card)) { this.notice(tokenNotice(card)); return true; }
    const formats = this.bans.get(nameKey(card.name));
    if (formats && !this.bannedSeen.has(card.id)) {
      this.bannedSeen.add(card.id);
      this.notice(`${card.name} is on the ban list (${[...new Set(formats)].join(', ')}); it was imported and the deck check will flag it.`);
    }
    if (card.dataIncomplete) this.notice(`${card.name} (${card.code}) has incomplete source data; check it by hand.`);
    if (card.type === 'legend') {
      if (!this.legend) this.legend = card.id;
      else if (card.id !== this.legend && !this.extraLegends.includes(card.id)) this.extraLegends.push(card.id);
      return true;
    }
    if (card.type === 'battlefield') {
      for (let i = 0; i < Math.min(qty, 12); i++) this.battlefields.push(card.id);
      return true;
    }
    if (card.type === 'rune') {
      const domain = card.domains[0];
      if (!domain) return false;
      this.runes[domain] = (this.runes[domain] ?? 0) + qty;
      return true;
    }
    if (section === 'side') { this.side.set(card.id, (this.side.get(card.id) ?? 0) + qty); return true; }
    if (section === 'champion' && !this.champion) {
      this.champion = card.id; // the Chosen Champion is counted inside `main` (types.ts Deck.champion)
    }
    this.main.set(card.id, (this.main.get(card.id) ?? 0) + qty);
    return true;
  }

  /** Marks a card already in `main` as the Chosen Champion (deck codes carry it as a separate field). */
  setChampion(card: Card): void {
    if (isToken(card)) return;
    this.champion = card.id;
    if (!this.main.has(card.id)) this.main.set(card.id, 1);
  }

  deck(): Partial<Deck> {
    const entries = (zone: Map<string, number>): DeckEntry[] =>
      [...zone.entries()].map(([id, qty]) => ({ id, qty, locked: false }));
    return {
      legend: this.legend, champion: this.champion,
      main: entries(this.main), side: entries(this.side),
      runes: { ...this.runes }, battlefields: [...this.battlefields], extraLegends: [...this.extraLegends],
    };
  }
}
