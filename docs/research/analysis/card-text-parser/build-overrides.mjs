// Builds overrides.proposed.json: every card the text parser cannot capture, with the reason and the hand-written
// role corrections. Text is copied from out/parsed.json (gallery snapshot 2026-11-11, errata applied), never typed here.
import { readFileSync, writeFileSync } from 'node:fs';
const P = new Map(JSON.parse(readFileSync(new URL('./out/parsed.json', import.meta.url))).map((c) => [c.code, c]));
const F = new Map(JSON.parse(readFileSync(new URL('./out/features.json', import.meta.url))).cards.map((c) => [c.code, c]));
const pool = JSON.parse(readFileSync(new URL('./out/pool.json', import.meta.url))).cards;
// class: unparsed (parser flags it) | silent-loss (parser says full, hand audit / engine diff found a loss) | dynamic (text depends on other cards) | role-fix (parse fine, role rule wrong)
const O = [
  ['OGN-063', 'unparsed', 'Clause "if they didn\'t already" is a no-op qualifier; the parse is otherwise right.', {}, 'Treat as full.'],
  ['OGN-112', 'unparsed', 'Free-cast of a spell from trash limited by "Energy cost less than your points".', { add: ['recursion'] }, 'trigger when-i-conquer; play spell from trash, energy free, filter energy < your points; then recycle it'],
  ['OGN-115', 'role-fix', 'Parsed in full on the errata text (banish one, recycle the rest, then each player plays the banished card). The effect is symmetric: every player gets the look and the free play.', { note: 'card_selection is symmetric (each player)' }, 'each-player: look 5, banish 1, recycle rest; then each plays the banished card energy-free'],
  ['OGN-242', 'unparsed', 'Sacrifice-and-upgrade: unit from top 5 with "Might up to 1 more than the killed unit".', { add: ['card_selection'] }, 'activated {E1, order1, exhaust}: kill friendly unit (as effect); look 5; may play unit with might <= killed+1 free; recycle rest'],
  ['OGN-244', 'unparsed', 'Symmetric keep-N sweeper over units, gear, runes and hands.', { add: ['removal_sweeper', 'disruption'] }, 'each player keeps 2 units, 2 gear, 2 runes, 2 cards in hand; everything else is recycled'],
  ['OGN-263', 'unparsed', 'Returns a named champion ("a Teemo unit you own") from Champion Zone or board to hand.', {}, 'static: alternative hide cost [1]; activated {E1, exhaust}: Teemo unit -> hand'],
  ['OGN-281', 'unparsed', 'Chosen Champion from trash to Champion Zone.', { add: ['recursion'] }, 'trigger when-you-hold here; optional; condition Champion Zone empty'],
  ['RAD-068', 'unparsed', 'Cost reduction phrased as "you may pay ... less to play a gear", once each turn, while at a battlefield.', { add: ['cost_reducer'] }, 'static cost-mod: gear, -[1][Rainbow], once each turn, condition at-battlefield'],
  ['RAD-140', 'unparsed', 'Variable-X blink: banish X of your units, owners replay them free.', {}, 'additional cost: any amount of Power (X); banish X friendly units; each is replayed free to same location or base (re-triggers when-played abilities)'],
  ['RAD-145', 'unparsed', 'Type-changing effect: a gear "becomes a unit gear with Might equal to its Energy cost".', {}, 'trigger start-of-main; may pay [1]; chosen friendly gear is also a unit with might = its energy until another is chosen'],
  ['RAD-151', 'unparsed', 'Cost reduction paid by exhausting the legend and three friendly units.', { add: ['cost_reducer'] }, 'optional additional cost on any of your spells: exhaust me + 3 friendly units -> that spell costs [2] less'],
  ['RAD-167', 'unparsed', 'Deckbuilding rule plus Legend Zone change. Errata text used (errata-texts.json). See rules.md 8.3.', {}, 'deck rule: up to 3 extra legends; when-played: add one of them to Legend Zone while on board'],
  ['SFD-059', 'dynamic', 'Copies the equipped unit\'s text into its own effect text; what it does depends on the wearer.', {}, 'cannot be scored statically; score per deck from the units it can equip'],
  ['SFD-146', 'unparsed', 'Two-sided cost modifier with a floor, gated on being in combat.', { add: ['cost_reducer'] }, 'static IF in-combat: friendly spells -[1][Rainbow] (min [1]); enemy spells +[1][Rainbow]'],
  ['SFD-173', 'unparsed', 'Death replacement for another unit with a Might comparison; the recall is part of the save, not movement.', {}, 'replacement @would-die (other friendly unit here, might < mine): heal, exhaust, recall'],
  ['UNL-054', 'unparsed', 'Target set limited by "same controller" and "total Might of 8 or less".', {}, 'move any number of enemy units (one controller, total might <= 8) to one location'],
  ['VEN-040', 'unparsed', 'Target must be in combat with an enemy Fury unit or chosen by an enemy Fury spell.', {}, 'conditional combat trick (+4 Might this turn), only versus Fury'],
  ['VEN-069', 'unparsed', 'Replacement that increases -Might effects by 1.', {}, 'Empowered: your spells/abilities cannot be countered; your -Might effects give an additional -1'],
  ['VEN-086', 'unparsed', 'Self-protection replacement (stun / -Might / return to hand become +3 Might this turn; errata text).', { add: ['counter_protection'] }, 'Empowered replacement on self'],
  ['VEN-137', 'dynamic', 'Equipped unit "becomes a copy of" another friendly unit.', {}, 'cannot be scored statically'],
  ['VEN-139', 'unparsed', 'Nested condition ("if I\'m Empowered, ready it") inside an activated ability.', {}, 'activated <action> {exhaust}: your turn only; move friendly unit in a showdown to base; if Empowered ready it'],
  ['VEN-157', 'unparsed', 'Any player may pay an additional cost to play a Dragon to this battlefield.', {}, 'symmetric play-permission for Dragon units, cost [Rainbow][Rainbow]'],
  ['VEN-160', 'unparsed', 'Tax on cards with [Reaction] during showdowns here.', {}, 'static tax, symmetric'],
  ['VEN-163', 'unparsed', 'Reduces [Empower] costs of your units here.', { add: ['cost_reducer'] }, 'static cost-mod on Empower costs, -[1] or -[Rainbow]'],
  ['VEN-053', 'role-fix', 'Symmetric replacement of early points by a draw (parsed with both conditions since iteration 3); the draw goes to whoever would have scored, so it is not card flow for its owner.', { remove: ['card_flow'], add: ['disruption'] }, 'replacement @would-score (any player, turns 1-2, conquer/hold): that player draws 1 instead'],
  ['OGN-033', 'role-fix', 'Punisher: the opponent chooses between taking 6 and letting you draw 2. Neither outcome is guaranteed.', { note: 'removal_single and card_flow are both opponent-choice' }, 'deal 6 to enemy unit UNLESS its controller has you draw 2'],
  ['VEN-101', 'role-fix', '"banish a card from any trash to give ..." is a cost-shaped clause, so the trash hate is not seen.', { add: ['disruption'] }, 'when-played IF paid: banish a card from any trash; a unit gets Assault 2 this turn'],
  ['RAD-110', 'role-fix', 'Sets another unit\'s base Might to 4: a buff or a shrink depending on the target.', { add: ['combat_trick'] }, 'when-i-move: may set another unit\'s base Might to 4 this turn'],
  ['OGN-111', 'dynamic', 'Has all [Exhaust] abilities of all friendly legends, units and gear.', {}, 'cannot be scored statically'],
  ['UNL-200', 'dynamic', 'Reflection token becomes a copy of a chosen unit.', {}, 'value depends on the copied unit'],
  ['UNL-086', 'dynamic', 'Doubles token-unit plays; the token is whatever the other card makes.', {}, 'replacement @would-play token unit, once each turn, while at a battlefield'],
  ['UNL-148', 'role-fix', 'Reanimation through an intermediate zone: banishes all units from your trash, then plays "a unit banished with this".', { add: ['recursion'] }, 'when-played: banish all units from your trash; activated {exhaust}: play a unit banished with this'],
  ['SFD-175', 'role-fix', 'The [Add] happens only "as I\'m revealed from your deck"; it is not a repeatable resource source.', { note: 'rune_ramp is conditional on reveal effects' }, ''],
  ['OGN-276', 'role-fix', 'Changes the points needed to win; no scorer role fits.', { note: 'rule-mod victory-score +1' }, ''],
  ['VEN-022', 'role-fix', 'Whole-card engine: banish hand and trash, burn 7, skip draws, play from trash.', { note: 'recursion via permission; treat as build-around' }, ''],
];
const out = { generated: '2026-11-11', source: 'gallery snapshot 2026-11-11 (https://playriftbound.com/en-us/card-gallery/), errata applied', note: 'PROPOSAL. roles.add / roles.remove patch the output of features.mjs; "ability" is the intended reading for whoever writes the structured override.',
  cards: O.map(([code, cls, why, roles, ability]) => { const c = P.get(code); if (!c) throw new Error(code); return { code, name: c.name, type: c.type, class: cls, parseStatus: c.parse.status, text: c.textUsed.replace(/[ \t]*\([^()]*\)/g, '').replace(/\n/g, ' / ').trim(), derivedRoles: Object.keys(F.get(code).roles), roles, why, ability }; }),
  tokens: { source: 'Core Rules 2026-10-09, rules 187.1-187.12', file: 'tokens.cr187.json', note: 'All 12 tokens are defined by the Core Rules and parsed in full by build-tokens.mjs; no hand-written token definition is needed. Join on the token name in roles.token_maker.', defined: JSON.parse(readFileSync(new URL('./tokens.cr187.json', import.meta.url))).tokens.map((t) => `${t.rule} ${t.name} (${t.type}${t.might != null ? ', ' + t.might + ' Might' : ''})`), haveGalleryRow: pool.filter((c) => c.superTypes.includes('token') && !c.playAid).map((c) => `${c.code} ${c.name}`) },
  dataFixes: {
    type: pool.filter((c) => c.typeNote && !c.playAid).map((c) => ({ code: c.code, name: c.name, galleryType: c.galleryType || null, resolvedType: c.type, evidence: 'image alt text type word; Might / [Equip] / [Deploy] structure' })),
    domainMissing: pool.filter((c) => !c.domains.length && ['unit', 'spell', 'gear'].includes(c.type) && !c.superTypes.includes('token')).map((c) => ({ code: c.code, name: c.name, domains: null, status: 'UNCONFIRMED: gallery row has no domain; needs a second source' })),
    text: [...P.values()].filter((c) => c.textSource !== 'gallery').map((c) => ({ code: c.code, name: c.name, kind: c.textSource })), // kind 'errata' = text taken from errata-texts.json
  } };
writeFileSync(new URL('./overrides.proposed.json', import.meta.url), JSON.stringify(out, null, 1));
const k = {}; for (const c of out.cards) k[c.class] = (k[c.class] || 0) + 1;
console.log('cards', out.cards.length, k, 'typeFixes', out.dataFixes.type.length, 'domainMissing', out.dataFixes.domainMissing.length, 'textFixes', out.dataFixes.text.length);
const flagged = [...P.values()].filter((c) => c.parse.status !== 'full').map((c) => c.code); console.log('flagged not in overrides:', flagged.filter((x) => !O.some((o) => o[0] === x)).join(','));
