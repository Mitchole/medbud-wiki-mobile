import { test, expect, type Page } from '@playwright/test';
import { fixturesAvailable, openMedbud } from '../helpers/medbud';

test.skip(({ isMobile }) => !isMobile, 'phone projects only');

const innerWidth = (page: Page) => page.evaluate(() => window.innerWidth);

test.describe('donate', () => {
  test.skip(!fixturesAvailable('donate'), 'donate fixture missing');

  test('donation text gets the full width under the donation form', async ({ page }) => {
    await openMedbud(page, 'donate');
    const inner = await innerWidth(page);
    const section = page.locator('main > section').first();
    // Full width of main's content box (main keeps its own padding).
    const content = await page.locator('main').first().evaluate((m) => {
      const cs = getComputedStyle(m);
      return m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    });
    expect((await section.boundingBox())!.width).toBeGreaterThanOrEqual(content - 2);
    const iframe = page.locator('main > iframe').first();
    const box = (await iframe.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(inner);
    // The text follows the form instead of sitting beside it.
    expect((await section.boundingBox())!.y).toBeGreaterThanOrEqual(box.y + box.height - 1);
  });
});

test.describe('formulary', () => {
  test.skip(!fixturesAvailable('formulary'), 'formulary fixture missing');
  test.setTimeout(180_000);

  const firstCard = (page: Page) => page.locator('#mb-grid .mb-row:not(.mb-head):not(.mb-hidden)').first();

  test('product cards use the full width', async ({ page }) => {
    await openMedbud(page, 'formulary');
    const inner = await innerWidth(page);
    expect((await firstCard(page).boundingBox())!.width).toBeGreaterThanOrEqual(inner - 40);
    const title = firstCard(page).locator('.mb-card-title');
    expect((await title.boundingBox())!.width).toBeGreaterThanOrEqual(180);
  });

  test('availability pill does not overlap the title or price', async ({ page }) => {
    await openMedbud(page, 'formulary');
    const overlaps = await firstCard(page).evaluate((row) => {
      const box = (sel: string) => row.querySelector(sel)!.getBoundingClientRect();
      const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const pill = box('.availability');
      return [hit(pill, box('.mb-card-title')), hit(pill, box('.mb-card-price'))];
    });
    expect(overlaps).toEqual([false, false]);
  });

  test('brand caption is readable and stays inside its card', async ({ page }) => {
    await openMedbud(page, 'formulary');
    const info = await firstCard(page).evaluate((row) => {
      const cap = row.querySelector('figcaption')!;
      const r = cap.getBoundingClientRect();
      const card = row.getBoundingClientRect();
      return { size: parseFloat(getComputedStyle(cap).fontSize), inside: r.left >= card.left - 1 && r.right <= card.right + 1 };
    });
    expect(info.size).toBeGreaterThanOrEqual(12);
    expect(info.inside).toBe(true);
  });

  test('filters fold behind a Filters button', async ({ page }) => {
    await openMedbud(page, 'formulary');
    const controls = page.locator('#mb-grid .mb-controls');
    const button = page.getByRole('button', { name: 'Filters' });
    await expect(controls).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await button.tap();
    await expect(controls).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    expect((await controls.boundingBox())!.width).toBeGreaterThanOrEqual((await innerWidth(page)) - 40);
  });
});
