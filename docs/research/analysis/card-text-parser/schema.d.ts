// Structured representation produced by parser.mjs. One ParsedCard per distinct rules name.
// Rule numbers refer to the Core Rules edition 2026-10-09 (docs/research/rules.md, source CR).

export type Kind = 'keyword' | 'static' | 'triggered' | 'activated' | 'on-play' | 'replacement';
export type Speed = 'normal' | 'action' | 'reaction';
export type Status = 'full' | 'partial' | 'none';

export interface Target {
  /** self = "me"/"this"; ref = pronoun pointing at an earlier target; player = a player; np = a described set of objects */
  ref?: 'self' | 'prev' | 'chosen' | 'player';
  count?: number | 'all' | 'any-number' | { upTo: number } | 'x';
  other?: boolean;                       // "another", "other"
  controller?: 'friendly' | 'enemy' | 'any';
  types?: string[];                      // unit, gear, spell, card, rune, legend, equipment, battlefield, token, permanent
  tags?: string[];                       // Mech, Poro, Dragon, ... (card tags, CR 759) and domain words
  states?: string[];                     // stunned, buffed, exhausted, ready, damaged, attacking, defending, mighty, empowered, equipped, token, non-token, facedown, alone
  location?: 'here' | 'there' | 'battlefield' | 'base' | 'combat' | 'board' | 'trash' | 'hand' | 'deck' | 'anywhere' | 'same-battlefield' | 'my-battlefield';
  filters?: { key: string; op: string; value: number | string }[]; // might<=3, energy<=3, might<self, keyword=Hidden, totalMight<=4
  raw: string;
  ok: boolean;                           // false when part of the phrase was not understood
}

export interface Cost {
  energy?: number;                       // [N]
  power?: Record<string, number>;        // fury/calm/mind/body/chaos/order/any ([Rainbow] = any domain)
  exhaust?: boolean;                     // [Exhaust] of the source
  other?: { verb: string; amount?: number | string; target?: Target; raw: string }[]; // discard, kill, recycle, spendBuff, spendXp, exhaustOther, disempower, banish, returnToHand, burn
  variable?: boolean;                    // "pay any amount of ..."
  raw: string;
}

export interface Condition { type: string; value?: number | string; negate?: boolean; raw: string; ok: boolean }

export interface Effect {
  verb: string;                          // see VERBS in parser.mjs
  target?: Target;
  amount?: number | { ref: string } | 'x';
  duration?: 'turn' | 'combat' | 'while-attached' | 'until-leaves' | 'next-end-phase' | 'permanent';
  optional?: boolean;                    // "you may"
  cost?: Cost;                           // inline "you may pay X to ..."
  conditions?: Condition[];              // "if ...", "if you do", "otherwise", "unless"
  perEach?: string;                      // "for each ..."
  instead?: boolean;                     // replaces the previous effect
  delayed?: string;                      // "at end of turn", "the next time ..."
  actor?: 'you' | 'opponent' | 'each-player' | 'controller' | 'owner' | 'each-opponent' | 'chosen-player';
  // verb-specific payload
  keywords?: { name: string; value?: number | string }[];
  token?: { name: string; might?: number; type: string; count: number | string; ready?: boolean; exhausted?: boolean; keywords?: string[]; where?: string };
  resources?: Cost;                      // add
  from?: string; to?: string;            // zones
  free?: boolean | 'energy';             // "ignoring its cost" / "ignoring its Energy cost"
  options?: Effect[][];                  // choose-one
  chooseCount?: number;
  granted?: Ability;                     // grantAbility: the quoted ability
  minimum?: number;                      // "to a minimum of 1 [Might]"
  split?: boolean;                       // damage "split among"
  raw: string;
  ok: boolean;
}

export interface Trigger {
  event: string;                         // when-played, when-i-attack, when-i-defend, when-i-conquer, when-i-hold, when-i-move, when-i-die, ...
  events?: string[];                     // all events when the clause lists several ("when I attack or defend")
  frequency?: 'first-each-turn' | 'second-each-turn' | 'third-each-turn' | 'once-each-turn' | 'next' | 'next-n';
  scope?: 'here' | 'self' | 'any';
  subject?: string;
  raw: string;
  ok: boolean;
}

export interface Ability {
  kind: Kind;
  keyword?: { name: string; value?: number | string };
  trigger?: Trigger;
  cost?: Cost;
  speed: Speed;
  conditions: Condition[];               // gates: Legion, Level N, Empowered, "while ...", intervening "if"
  effects: Effect[];
  staticType?: string;                   // might-mod, keyword-grant, enter-ready, cost-mod, play-permission, restriction, additional-cost, bonus-damage, trigger-mod, deckbuilding, usage-limit, ...
  origin: 'rules' | 'equipment-effect';  // equipment-effect = text granted to the equipped unit (CR 136.2.b: Effect Text is inactive unless attached)
  text: string;
  status: Status;
}

export interface ParsedCard {
  code: string; name: string; type: string; superTypes: string[]; domains: string[];
  energy: number | null; power: number | null; might: number | null; mightBonus?: number | null; tags: string[];
  sets: string[]; codes: string[];
  speed: Speed;                          // card-level play speed (spell line [Action]/[Reaction], or a unit/gear with that keyword)
  keywords: { name: string; value?: number | string; conditional?: boolean; cost?: Cost }[];
  abilities: Ability[];
  parse: { status: Status; sentences: { text: string; status: Status; why?: string }[] };
  textUsed: string; textSource: 'gallery' | 'errata' | 'fix';
}
