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

test('clinic notes rows join their clinic card instead of becoming cards', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const stats = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table#clinics > tbody > tr')];
    const shown = rows.filter((tr) => getComputedStyle(tr).display !== 'none');
    return {
      clinics: rows.filter((tr) => tr.querySelector(':scope > [data-mbm-role=price]')).length,
      shownCards: shown.length,
      notesRows: rows.filter((tr) => tr.classList.contains('notes')).length,
    };
  });
  expect(stats.notesRows).toBeGreaterThan(0);
  expect(stats.shownCards).toBe(stats.clinics);
  const first = page.locator('table#clinics > tbody > tr').first();
  await first.locator('.mbm-more').tap();
  await expect(first.locator('> [data-mbm-role=notes]')).toBeVisible();
  await expect(first.locator('> [data-mbm-role=notes]')).not.toBeEmpty();
});

test('clinic logo stays small on the closed card', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const logo = page.locator('table#clinics > tbody > tr').first().locator('> [data-mbm-role=name] img:not(.country)').first();
  // Fixture images are served as 1x1 pixels, so check the limit the real logo will meet.
  const maxHeight = await logo.evaluate((img) => parseFloat(getComputedStyle(img).maxHeight));
  expect(maxHeight).toBeLessThanOrEqual(40);
});

test('nested pricing table inside a clinic card stays a table', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const row = page.locator('table#clinics > tbody > tr').first();
  await row.locator('.mbm-more').tap();
  const nestedDisplay = await row.locator('> [data-mbm-role=pricing] tr').first().evaluate((tr) => getComputedStyle(tr).display);
  expect(nestedDisplay).toBe('table-row');
  await expect(row.locator('> [data-mbm-role=pricing] .mbm-more')).toHaveCount(0);
});

test('pharmacy card shows the price large and the rating small', async ({ page }) => {
  await openMedbud(page, 'pharmacy');
  const row = page.locator('table.pharmacy-list > tbody > tr.product-row:visible').first();
  const sizes = await row.locator('> [data-mbm-role=ppg]').evaluate((td) => ({
    price: parseFloat(getComputedStyle(td.querySelector(':scope > span')!).fontSize),
    stars: parseFloat(getComputedStyle(td.querySelector('.stars-full')!).fontSize),
  }));
  expect(sizes.price).toBeGreaterThanOrEqual(20);
  expect(sizes.stars).toBeLessThanOrEqual(16);
});

test('pharmacy product names avoid the display font that draws < as an arrow', async ({ page }) => {
  await openMedbud(page, 'pharmacy');
  const title = page.locator('table.pharmacy-list > tbody > tr.product-row:visible').first().locator('> [data-mbm-role=name] a.title');
  const family = await title.evaluate((a) => getComputedStyle(a).fontFamily);
  expect(family).not.toMatch(/^"?Greatest Britain/);
});

test('cards with a Details toggle have no extra space under it', async ({ page }) => {
  await openMedbud(page, 'pharmacy');
  const row = page.locator('table.pharmacy-list > tbody > tr.product-row:visible').first();
  await expect(row.locator('.mbm-more')).toHaveCount(1);
  expect(await row.evaluate((tr) => getComputedStyle(tr).paddingBottom)).toBe('0px');
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
