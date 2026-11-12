// Plan Task 12: end-to-end journeys against the real synced database (data/forge.db). Skipped without it.
// Every deck the spec creates is deleted again through the API, so a run leaves the owner's decks as they were.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const DB = path.join(process.cwd(), 'data', 'forge.db');
test.skip(!existsSync(DB), 'needs the synced database (pnpm sync)');
test.describe.configure({ mode: 'serial' });

const created: string[] = [];
const deckIdOf = (page: Page): string => new URL(page.url()).pathname.split('/').pop() as string;
const issues: string[] = [];

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 500) issues.push(`http ${r.status()} ${r.url()}`); });
});

test.afterAll(async ({ request }) => {
  for (const id of created) await request.delete(`/api/decks/${id}`);
});

async function ready(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid=deck-tile]');
  await expect(page.getByTestId('legal-chip')).not.toHaveText('Checking', { timeout: 20_000 });
}
const precise = async (page: Page): Promise<string> => (await page.getByTestId('rating-precise').innerText()).trim();
const mainCount = async (page: Page): Promise<number> => parseInt(await page.getByTestId('count-main').innerText(), 10);

/** Images on the page that finished loading with pixels (lazy ones are scrolled into view first). */
async function loadedImages(page: Page): Promise<number> {
  const view = page.getByTestId('deck-view');
  for (const y of [0, 800, 1600, 3200, 6400]) {
    await view.evaluate((el, top) => { el.scrollTo(0, top); el.querySelector('.overflow-y-auto')?.scrollTo(0, top); }, y);
    await page.waitForTimeout(150);
  }
  return page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
    return imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
  });
}

/** Card names of the deck, from the deck tiles' image alt text. */
const deckNames = (page: Page): Promise<string[]> =>
  page.locator('[data-testid=deck-tile] img').evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLImageElement).alt).filter((a) => a && a.length > 2))]);

test('auto-build a deck, edit it, read its lines and matchup, export it', async ({ page }) => {
  await page.goto('/new');
  await page.waitForSelector('[data-testid=legend-tile]');
  await page.getByTestId('legend-search').fill('Daughter of the Void');
  await page.getByTestId('legend-tile').first().click();
  await page.waitForSelector('[data-testid=champion-tile]');
  await page.getByTestId('champion-tile').first().click();
  await page.getByTestId('format-standard-bo3').click();
  await page.getByTestId('power-competitive').click();
  await page.getByTestId('auto-build-new').click();
  await page.waitForURL(/\/deck\//, { timeout: 30_000 });
  created.push(deckIdOf(page));
  await ready(page);

  // 40 main, legal, a rating, at least 40 card images.
  expect(await mainCount(page)).toBe(40);
  await expect(page.getByTestId('legal-chip')).toHaveText(/^Legal in/);
  const before = await precise(page);
  expect(Number(before)).toBeGreaterThan(50);
  expect(await loadedImages(page)).toBeGreaterThanOrEqual(40);

  // Remove one copy: the count and the rating move.
  const tile = page.getByTestId('deck-tile').first();
  await tile.hover();
  await tile.getByTestId('tile-remove').click();
  await expect(page.getByTestId('count-main')).toContainText('39');
  await expect.poll(() => precise(page), { timeout: 10_000 }).not.toBe(before);

  // Lines name cards of this deck.
  const names = await deckNames(page);
  expect(names.length).toBeGreaterThan(5);
  await page.getByTestId('tab-lines').click();
  await expect(page.locator('[data-testid=panel-lines] [data-testid=line]').first()).toBeVisible({ timeout: 10_000 });
  const lines = await page.locator('[data-testid=panel-lines] [data-testid=line]').allInnerTexts();
  expect(lines.some((t) => names.some((n) => t.includes(n)))).toBe(true);

  // An opponent gives matchup lines.
  await page.getByTestId('tab-matchup').click();
  await page.locator('[data-testid=opponent-bar] [data-testid=legend-picker]').click();
  await page.fill('input[placeholder="Search legends"]', 'Voidreaver');
  await page.getByTestId('legend-option').first().click();
  await expect(page.locator('[data-testid=panel-matchup] [data-testid=line]').first()).toBeVisible({ timeout: 10_000 });

  // Export: the text names the legend and the cards.
  await page.getByTestId('export').click();
  await expect(page.getByTestId('export-dialog')).toBeVisible();
  const text = await page.getByTestId('export-text').inputValue();
  expect(text).toContain('Daughter of the Void');
  expect(names.filter((n) => text.includes(n)).length).toBeGreaterThan(5);
  expect(issues).toEqual([]);
});

test('import a tournament list, Improve proposes swaps, accept one', async ({ page }) => {
  const list = readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'decks', 'kaisa-daughter-of-the-void.txt'), 'utf8')
    .split('\n').filter((l) => !l.startsWith('#')).join('\n')
    // Two weak copies in place of two good ones, so Improve has something plain to find.
    .replace(/^3 Stupefy$/m, '1 Stupefy\n2 Armed Assailant');
  await page.goto('/');
  await page.getByTestId('import-deck').click();
  await page.getByTestId('import-text').fill(list);
  await page.getByTestId('import-read').click();
  await expect(page.getByTestId('import-result')).toBeVisible();
  await page.getByTestId('import-save').click();
  await page.waitForURL(/\/deck\//, { timeout: 20_000 });
  created.push(deckIdOf(page));
  await ready(page);
  const before = await precise(page);

  await page.getByTestId('tab-improve').click();
  await page.getByTestId('swaps-run').click();
  await expect(page.locator('[data-testid=proposal], [data-testid=no-proposals]').first()).toBeVisible({ timeout: 30_000 });
  const proposals = await page.getByTestId('proposal').count();
  expect(proposals).toBeGreaterThan(0);
  await page.getByTestId('accept').first().click();
  await expect.poll(() => precise(page), { timeout: 15_000 }).not.toBe(before);
  expect(Number(await precise(page))).toBeGreaterThan(Number(before));
  expect(issues).toEqual([]);
});
