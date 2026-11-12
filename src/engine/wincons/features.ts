// Route features of a card. New code; the feature list follows docs/research/wincons.md section 4.1.
//
// The research detector ran one regex per feature over the whole text and failed in the ways its verification
// log lists (P1-P7). The differences here, by defect:
//   P1  a keyword counts only when the card itself has it (`Card.keywords`), never when its text names it or
//       puts it on a token;
//   P4  a hold trigger that returns the card ("When I hold, return me") is not hold support, a unit that deals
//       no combat damage is not a tall closer, a gear-only kill or a flicker is not removal (answers.ts);
//   P5  "ready me" on a legend readies the legend; a move that only goes to base is a retreat;
//   P6  a battlefield only counts for effects that score for its controller (points, doublers, alternate wins);
//   P7  a card with no type is never read (view.ts drops it).
// HEURISTIC: everything in this file. Mined traits (src/engine/mine) are used where one exists; the patterns
// below read single sentences with reminder text removed.
import { REMOVING, answersOf } from './answers';
import type { DeckCard } from './view';

export type Feature =
  | 'point' | 'altwin' | 'denial' | 'doubler'
  | 'haste' | 'ready' | 'gank' | 'move' | 'retreat' | 'movepay' | 'assault' | 'pump'
  | 'token' | 'multi-token' | 'token-engine' | 'temp-token' | 'widepay' | 'cheap'
  | 'mighty' | 'big' | 'top-end' | 'scaling' | 'self-pump' | 'mightypay' | 'buff' | 'equip' | 'prot' | 'no-combat-damage'
  | 'holdpay' | 'holdpay-shared' | 'no-hold' | 'conqpay' | 'shield' | 'tank' | 'stun' | 'deftrick'
  | 'removal' | 'sweep' | 'displace' | 'debuff' | 'counter' | 'recur' | 'draw' | 'ramp'
  | 'hidden' | 'hidden-unit' | 'ambush' | 'facedown-pay'
  | 'elsewhere' | 'solo' | 'death-enabler' | 'death-payoff' | 'cost-reduction' | 'hand-attack' | 'shield-to-assault';

export type CardRole = 'main' | 'legend' | 'battlefield';

const kw = (c: DeckCard, keyword: string): boolean => c.card.keywords.some((k) => k.toLowerCase() === keyword);

const cache = new WeakMap<DeckCard, Set<Feature>>();

export function routeFeatures(c: DeckCard, role: CardRole = 'main'): Set<Feature> {
  const held = cache.get(c);
  if (held) return held;
  const f = new Set<Feature>();
  cache.set(c, f);
  const { card, traits } = c;
  const S = c.sentences.map((s) => s.toLowerCase());
  const some = (re: RegExp): boolean => S.some((s) => re.test(s));
  const unit = role === 'main' && card.type === 'unit';
  const might = card.might ?? 0;

  // Points and the rules-changing texts: read on every card type.
  if (S.some((s) => /\b(?:score|gain)s? (?:\d+|a|one) points?\b/.test(s) && !/\bopponents?\b|\bthat player\b|\bwould\b/.test(s))) f.add('point');
  if (some(/\byou win the game\b/)) f.add('altwin');
  if (some(/\bcan't (?:gain|score) points\b|\bpoints needed to win\b/)) f.add('denial');
  if (some(/\b(?:conquer|hold) effects?\b[^.]*\badditional time\b|\bactivate the conquer effects\b/)) f.add('doubler');
  if (role === 'battlefield') return f;

  // Speed and movement.
  if (unit && (kw(c, 'accelerate') || some(/\bi enter ready\b/))) f.add('haste');
  if (role === 'legend' && some(/\bunits? you play\b[^.]*\benter ready\b|\byour units enter ready\b/)) f.add('haste');
  const readies = S.filter((s) => /\bready (?:an?|it|them|me|up to \w+|another|each|all|your|that|two|friendly)\b/.test(s) && !/\bready (?:up to \w+ |\d+ |your |an? |all |two )?(?:friendly |exhausted )?(?:runes?|gear|legends?)\b/.test(s));
  if (readies.some((s) => role !== 'legend' || !/\bready me\b/.test(s) || /\bready (?:it|a unit|an? \w+ unit)\b/.test(s))) f.add('ready');
  if (unit && kw(c, 'ganking')) f.add('gank');
  if (role === 'legend' && some(/\bgive a unit \[ganking\]/)) f.add('gank');
  const moves = S.filter((s) => /\bmove (?:an? |up to \w+ |another |your |that |an exhausted |me\b)/.test(s) && (/\bfriendly\b|\byou control\b|\bmove me\b|\bmove your\b/.test(s)));
  if (moves.some((s) => !/\bto (?:its |your |their )?base\b/.test(s) || /\bto or from\b/.test(s))) f.add('move');
  else if (moves.length > 0) f.add('retreat');
  if (traits.has('movement-payoff')) f.add('movepay');
  if ((unit && kw(c, 'assault')) || some(/\b(?:give|gives|have|has)\b[^.]*\[assault(?: \d+)?\]/)) f.add('assault');
  if (some(/\[assault\] equal to (?:my|its) \[shield\]/)) f.add('shield-to-assault');
  if (role === 'main' && card.type !== 'unit' && traits.has('might-boost')) f.add('pump');

  // Width.
  // A 0-Might token is a tool (Zed's Shadow Clone), not a body that takes a battlefield.
  const tokens = S.filter((s) => /\bplay\b[^.]*\bunit tokens?\b/.test(s) && !/\b0 \[might\]/.test(s));
  if (tokens.length > 0) {
    f.add('token');
    if (tokens.some((s) => /\bplay (?:two|three|four|five|six|\d{1}(?!\s*\[might\])) /.test(s) || /\bfor each\b/.test(s))) f.add('multi-token');
    if (tokens.some((s) => /\[temporary\]/.test(s))) f.add('temp-token');
    if ((card.type !== 'spell') && tokens.some((s) => /^(?:when|at|whenever)\b|:/.test(s) || /\[exhaust\]/.test(s)) && !tokens.every((s) => /^when you play (?:me|this)\b/.test(s))) f.add('token-engine');
  }
  if ((traits.has('wide') || traits.has('token-matters')) && !traits.has('sweeper')) f.add('widepay');
  if (unit && c.need <= 2) f.add('cheap');

  // Height.
  if (unit && might >= 5) f.add('mighty');
  if (unit && might >= 6) f.add('big');
  if (role === 'main' && (card.energy ?? 0) >= 7) f.add('top-end');
  if (unit && some(/\bi don't deal combat damage\b/)) f.add('no-combat-damage');
  if (unit && some(/\bi (?:have|get) \+\d+ \[might\] for each\b|\bmy might is equal\b|\bi have \+\[might\] equal\b/)) f.add('scaling');
  // A unit that pumps itself to 6 or more ("give me +2 [Might] this turn" on a 4-Might body) is a big threat on the turn that matters.
  const selfPump = S.map((x) => /\bgive me \+(\d+) \[might\]/.exec(x)).find(Boolean);
  if (unit && selfPump && might + Number(selfPump[1]) >= 6) f.add('self-pump');
  if (traits.has('mighty')) f.add('mightypay');
  if (traits.has('buff-producer')) f.add('buff');
  if (role === 'main' && traits.has('equipment')) f.add('equip');
  if ((unit && kw(c, 'deflect')) || traits.has('protection') || traits.has('death-prevention') || traits.has('damage-prevention')) f.add('prot');

  // Holding.
  const holds = S.filter((s) => /\bwhen (?:i|you|a friendly unit|an ally|you or an ally)\b[^.]*\bholds?\b/.test(s) && !/\bholds?\b[^.]*\breturn (?:me|this)\b/.test(s) && !/\bopponent holds\b/.test(s));
  if (holds.some((s) => !/\bconquers? or holds?\b/.test(s))) f.add('holdpay');
  else if (holds.length > 0) f.add('holdpay-shared');
  if (some(/\bwhen (?:i|you)\b[^.]*\bconquers?\b|\bwhen i attack\b|\bwhen you win a combat\b/)) f.add('conqpay');
  // P4: "When I hold, return me to my owner's hand" - the card leaves when it holds, so it is no holder.
  const leavesOnHold = some(/\bwhen i hold\b[^.]*\breturn me\b/);
  if (leavesOnHold) f.add('no-hold');
  if (unit && kw(c, 'shield') && !leavesOnHold) f.add('shield');
  if (unit && kw(c, 'tank') && !leavesOnHold) f.add('tank');
  if (role === 'legend' && some(/\byour \w+ have \[shield\]|\bgive a friendly unit \[tank\]/)) f.add('shield');
  if (some(/\bdefends? alone\b|\bwhile (?:i'm|i am) (?:a defender|defending)\b|\bwhen i defend\b/) || (role === 'main' && card.type === 'spell' && some(/\bdefend(?:s|er|ers|ing)?\b/))) f.add('deftrick');

  // Interaction, read with its limits by answers.ts.
  const answers = answersOf(card);
  if (answers.some((a) => a.kind === 'stun')) f.add('stun');
  if (answers.some((a) => a.kind === 'sweep')) f.add('sweep');
  if (answers.some((a) => (REMOVING.includes(a.kind) && a.kind !== 'sweep' && (a.kind !== 'damage' || a.amount === null || a.amount >= 2)))) f.add('removal');
  if (answers.some((a) => a.kind === 'displace' || a.kind === 'bounce')) f.add('displace');
  if (answers.some((a) => a.kind === 'shrink')) f.add('debuff');
  if (answers.some((a) => a.kind === 'counter')) f.add('counter');
  const roles = new Set(c.features?.roles ?? []);
  if (roles.has('recursion')) f.add('recur');
  if (roles.has('card-flow')) f.add('draw');
  if (roles.has('rune-ramp')) f.add('ramp');

  // Hidden delivery.
  if (role === 'main' && kw(c, 'hidden')) { f.add('hidden'); if (unit) f.add('hidden-unit'); }
  if (unit && kw(c, 'ambush')) f.add('ambush');
  if (S.some((s) => /\bfrom face ?down\b|\bhide a card\b|\bfacedown cards? (?:you control|here)\b/.test(s) && !/^\[deathknell\]/.test(s))) f.add('facedown-pay');

  // Plan families the prototype had no feature for (P9).
  if (role === 'main' && (kw(c, 'hidden') || kw(c, 'flow')
    || some(/\bplay (?:me|it|this|that card|one|a (?:unit|spell|gear|card))\b[^.]*\bfrom (?:your |the top of your |the )?(?:trash|deck|main deck)\b/)
    || (some(/\bfrom the top of your deck\b/) && some(/\byou may play me\b/)))) f.add('elsewhere');
  if (traits.has('solo')) f.add('solo');
  if (traits.has('death-enabler')) f.add('death-enabler');
  if (traits.has('death-payoff')) f.add('death-payoff');
  if (traits.has('cost-reduction')) f.add('cost-reduction');
  if (some(/\bopponents? discards?\b|\bfrom (?:an opponent's|their) hand\b[^.]*\bdiscard|\bthey discard\b/) || (some(/\breveal their hand\b/) && some(/\bchoose an? [^.]*\bcard from it\b/))) f.add('hand-attack');
  return f;
}
