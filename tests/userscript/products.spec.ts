import { test, expect } from '@playwright/test';
import { fixturesAvailable, horizontalOverflow, openMedbud } from '../helpers/medbud';

test.skip(({ isMobile }) => !isMobile, 'phone projects only');

test.describe('oils', () => {
  test.skip(!fixturesAvailable('oils'), 'oils fixture missing');

  test('columns map by header: cultivar is genetics, carrier oil goes behind Details', async ({ page }) => {
    await openMedbud(page, 'oils');
    const row = page.locator('table.product > tbody > tr').first();
    await expect(row.locator('> [data-mbm-role=genetics]')).toContainText('Cultivar');
    const carrier = row.locator('> td', { hasText: 'Ionic Complex' });
    await expect(carrier).toHaveAttribute('data-mbm-role', 'extra');
    await expect(carrier).toBeHidden();
    await expect(row.locator('> [data-mbm-role=meta]')).toContainText(/THC\s*\d+mg\s*·\s*CBD/);
  });

  test('an unconfirmed price shows TBC instead of £0.00', async ({ page }) => {
    await openMedbud(page, 'oils');
    const row = page.locator('table.product > tbody > tr', { has: page.locator('td.priceBreakdown', { hasText: 'TBC' }) }).first();
    await expect(row.locator('> [data-mbm-role=ppg]')).toBeHidden();
    await expect(row.locator('> [data-mbm-role=packs]')).toBeVisible();
    await expect(row.locator('> [data-mbm-role=packs]')).toContainText('TBC');
  });
});

test.describe('extracts', () => {
  test.skip(!fixturesAvailable('extracts'), 'extracts fixture missing');
  test('extract rows render as cards', async ({ page }) => {
    await openMedbud(page, 'extracts');
    const row = page.locator('table.product > tbody > tr').first();
    expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
    await expect(row.locator('> [data-mbm-role=name]')).toBeVisible();
  });
});

test.describe('discounts', () => {
  test.skip(!fixturesAvailable('discounts'), 'discounts fixture missing');
  test.setTimeout(120_000);

  test('discount rows render as cards with the discounted price strongest', async ({ page }) => {
    await openMedbud(page, 'discounts');
    const table = page.locator('table.pharmacy-list').first();
    await expect(table).toHaveClass(/mbm-cards/);
    const header = table.locator('> tbody > tr').first();
    await expect(header).toBeHidden();
    const row = table.locator('> tbody > tr').nth(1);
    expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
    await expect(row.locator('> [data-mbm-role=name]')).toContainText('Curaleaf');
    await expect(row.locator('> [data-mbm-role=price]')).toContainText('Save');
    await expect(row.locator('> [data-mbm-role=meta]')).toContainText(/THC\s*\d+mg\s*·\s*CBD/);
    const size = await row.locator('> [data-mbm-role=price]').evaluate((td) => parseFloat(getComputedStyle(td).fontSize));
    expect(size).toBeGreaterThanOrEqual(20);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
