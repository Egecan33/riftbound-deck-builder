// Dumps the GameLab engine's compiled CardScript for every card to JSON (read-only use of GameLab).
// Run: cd ~/github_repositories/GameLab/packages/engine && ./node_modules/.bin/tsx <this file> <out.json>
import { writeFileSync } from 'node:fs';
const ENGINE = process.env.GAMELAB_ENGINE ?? '/Users/egecanaktan/github_repositories/GameLab/packages/engine/src/index.ts';
const eng: any = await import(ENGINE);
const { lib } = eng.buildLibrary();
const out: Record<string, unknown> = {};
const cards = lib instanceof Map ? [...lib.values()] : Object.values(lib as any);
for (const entry of cards as any[]) {
  const card = entry.card ?? entry;
  const script = entry.script ?? eng.compileCard(card);
  out[card.gameplayId] = script;
}
writeFileSync(process.argv[2]!, JSON.stringify(out));
console.log('cards', Object.keys(out).length, JSON.stringify(eng.scriptSummary(Object.entries(out) as any)));
