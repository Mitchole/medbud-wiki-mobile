import { test, expect, type Page } from '@playwright/test';
import { fixturesAvailable, openMedbud } from '../helpers/medbud';

test.skip(!fixturesAvailable('vape-cartridges'), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

const firstProduct = (page: Page) => page.locator('table.product > tbody > tr').first();

test('THC and CBD figures are labelled on flower cards', async ({ page }) => {
  await openMedbud(page, 'strains');
  await expect(firstProduct(page).locator('> [data-mbm-role=meta]')).toContainText(/THC\s*\d+%\s*·\s*CBD/);
});

test('THC and CBD figures are labelled on cartridge cards', async ({ page }) => {
  await openMedbud(page, 'vape-cartridges');
  await expect(firstProduct(page).locator('> [data-mbm-role=meta]')).toContainText(/THC\s*\d+mg\s*·\s*CBD/);
});

test('Details actions have text labels', async ({ page }) => {
  await openMedbud(page, 'strains');
  const row = firstProduct(page);
  await row.locator('.mbm-more').tap();
  const labels = await row.locator('> [data-mbm-role=actions] button').allInnerTexts();
  expect(labels.map((l) => l.trim())).toContain('Add to Planner');
  expect(labels.every((l) => l.trim().length > 0)).toBe(true);
});

test('a pharmacy name in the stock pill reads as "Only at"', async ({ page }) => {
  await openMedbud(page, 'strains');
  const pill = page.locator('table.product [data-mbm-role=stock] .availability', { hasText: /^\s*Curaleaf\s*$/ }).first();
  const before = await pill.evaluate((el) => getComputedStyle(el, '::before').content);
  expect(before).toContain('Only at');
});

test('cartridge price per mg is the strongest number', async ({ page }) => {
  await openMedbud(page, 'vape-cartridges');
  const price = firstProduct(page).locator('> [data-mbm-role=ppg] > span').first();
  const style = await price.evaluate((el) => ({ weight: parseInt(getComputedStyle(el).fontWeight, 10), size: parseFloat(getComputedStyle(el).fontSize) }));
  expect(style.weight).toBeGreaterThanOrEqual(700);
  expect(style.size).toBeGreaterThanOrEqual(20);
});

test('unexpected extra cells stay inside Details instead of leaking below the card', async ({ page }) => {
  const addExtra = (html: string) => {
    const start = html.indexOf('<tr', html.indexOf('<tbody', html.indexOf('class="product')));
    const end = html.indexOf('</tr>', start);
    return html.slice(0, end) + '<td class="mbm-test-extra">Cultivar Unknown</td>' + html.slice(end);
  };
  await openMedbud(page, 'strains', { transformHtml: addExtra });
  const row = firstProduct(page);
  const extra = row.locator('> td.mbm-test-extra');
  await expect(extra).toHaveAttribute('data-mbm-role', 'extra');
  await expect(extra).toBeHidden();
  await row.locator('.mbm-more').tap();
  await expect(extra).toBeVisible();
});

test('empty star ratings are hidden on cards', async ({ page }) => {
  await openMedbud(page, 'vape-cartridges');
  const empty = page.locator('table.product [data-mbm-role=meta] .stars-full[title="No Ratings"]').first();
  await expect(empty).toBeHidden();
});

test('clinic details are labelled', async ({ page }) => {
  test.skip(!fixturesAvailable('clinics'), 'clinics fixture missing');
  await openMedbud(page, 'clinics');
  const row = page.locator('table#clinics > tbody > tr').first();
  const label = (role: string) => row.locator(`> [data-mbm-role=${role}]`).evaluate((el) => getComputedStyle(el, '::before').content);
  expect(await label('meta')).toContain('Pharmacy choice');
  await row.locator('.mbm-more').tap();
  expect(await label('pharmacy')).toContain('Default pharmacy');
  expect(await label('contact')).toContain('Contact');
});

test('clinic consultation icons do not overlap their text', async ({ page }) => {
  test.skip(!fixturesAvailable('clinics'), 'clinics fixture missing');
  await openMedbud(page, 'clinics');
  const gap = await page.locator('table#clinics > tbody > tr').first().locator('> [data-mbm-role=meta2] i').first()
    .evaluate((i) => parseFloat(getComputedStyle(i).marginRight));
  expect(gap).toBeGreaterThanOrEqual(4);
});
