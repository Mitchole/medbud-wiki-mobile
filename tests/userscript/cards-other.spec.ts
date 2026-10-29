import { test, expect } from '@playwright/test';
import { fixturesAvailable, horizontalOverflow, openMedbud } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

test('clinics rows render as cards', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const row = page.locator('table#clinics > tbody > tr').first();
  expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
  await expect(row.locator('> [data-mbm-role=name]')).toContainText('Dispensed');
  await expect(row.locator('> [data-mbm-role=price]')).toBeVisible();
  await expect(row.locator('> [data-mbm-role=contact]')).toBeHidden();
  await row.locator('.mbm-more').tap();
  await expect(row.locator('> [data-mbm-role=contact]')).toBeVisible();
  await expect(row.locator('> [data-mbm-role=pricing]')).toBeVisible();
});

test('nested pricing table inside a clinic card stays a table', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const row = page.locator('table#clinics > tbody > tr').first();
  await row.locator('.mbm-more').tap();
  const nestedDisplay = await row.locator('> [data-mbm-role=pricing] tr').first().evaluate((tr) => getComputedStyle(tr).display);
  expect(nestedDisplay).toBe('table-row');
  await expect(row.locator('> [data-mbm-role=pricing] .mbm-more')).toHaveCount(0);
});

test('pharmacy rows render as cards', async ({ page }) => {
  await openMedbud(page, 'pharmacy');
  // The site hides unavailable products by default; check the first one a visitor sees.
  const row = page.locator('table.pharmacy-list > tbody > tr.product-row:visible').first();
  expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
  await expect(row.locator('> [data-mbm-role=name]')).not.toBeEmpty();
  await expect(row.locator('> [data-mbm-role=ppg]')).toBeVisible();
  await expect(row.locator('> [data-mbm-role=stock]')).toBeVisible();
  // Details appears only when the actions cell has something to show.
  const actions = row.locator('> [data-mbm-role=actions]');
  const hasActions = (await actions.innerHTML()).trim() !== '';
  await expect(row.locator('.mbm-more')).toHaveCount(hasActions ? 1 : 0);
  if (hasActions) {
    await row.locator('.mbm-more').tap();
    await expect(actions).toBeVisible();
  }
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});
