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

test('product page header stacks: gallery full width, title below the pictures, buttons from the left', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone projects only');
  await openMedbud(page, 'strain-detail');
  const layout = await page.evaluate(() => {
    const aside = document.querySelector('aside.product')!;
    const h1 = aside.querySelector('h1')!.getBoundingClientRect();
    const figuresBottom = Math.max(...[...aside.querySelectorAll('section figure')].map((f) => f.getBoundingClientRect().bottom));
    const gallery = aside.querySelector('div[style*="float:right"]');
    return {
      titleBelowPictures: h1.top >= figuresBottom - 1,
      buttonLeft: Math.round(aside.querySelector('button.calcStrain')!.getBoundingClientRect().left),
      galleryFloat: gallery ? getComputedStyle(gallery).float : 'none',
    };
  });
  expect(layout.titleBelowPictures).toBe(true);
  expect(layout.buttonLeft).toBeLessThanOrEqual(40);
  expect(layout.galleryFloat).toBe('none');
});

test('the Leafly box and the price list use the full width', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone projects only');
  await openMedbud(page, 'strain-detail');
  const boxes = await page.evaluate(() => {
    const r = (e: Element) => { const b = e.getBoundingClientRect(); return { left: Math.round(b.left), width: Math.round(b.width) }; };
    return { leafly: r(document.querySelector('aside.product p.leafly')!), prices: r(document.querySelector('aside.product ul.miniPrice')!) };
  });
  expect(boxes.leafly.left).toBeLessThanOrEqual(40);
  expect(boxes.leafly.width).toBeGreaterThanOrEqual(300);
  expect(boxes.prices.left).toBeLessThanOrEqual(80);
});
