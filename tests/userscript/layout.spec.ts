import { test, expect } from '@playwright/test';
import { capturedPages, fixturesAvailable, horizontalOverflow, openMedbud, routeMedbud, addUserscript } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

for (const name of capturedPages()) {
  test(`no horizontal overflow on ${name}`, async ({ page }) => {
    await openMedbud(page, name);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test('nav "more" menu opens inside the screen', async ({ page }) => {
  await openMedbud(page, 'home');
  await page.locator('header nav .menuEllipsis__dropdown').tap();
  const panel = page.locator('header nav .menuEllipsis__more');
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  const inner = await page.evaluate(() => window.innerWidth);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(inner + 1);
  // Every top-level entry is fully on screen, not cut off at the left edge.
  const cut = await panel.evaluate((el) =>
    [...el.querySelectorAll(':scope > ul > li > a, :scope li.level1 > a')]
      .map((a) => a.getBoundingClientRect())
      .filter((r) => r.width > 0 && (r.left < 0 || r.right > window.innerWidth + 1)).length,
  );
  expect(cut).toBe(0);
});

test('viewport rewritten on phones', async ({ page }) => {
  await openMedbud(page, 'strains');
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute(
    'content',
    'width=device-width, initial-scale=1, viewport-fit=cover',
  );
  await expect(page.locator('html')).toHaveAttribute('data-medbud-mobile', '0.1.0');
  const transform = await page.evaluate(() => document.body.style.transform);
  expect(['', 'none', 'scale(1)']).toContain(transform);
});

test('search box is usable', async ({ page }) => {
  await openMedbud(page, 'home');
  const search = page.locator('form#search input[type=search]');
  await expect(search).toBeVisible();
  expect((await search.boundingBox())!.width).toBeGreaterThanOrEqual(200);
});

test('strain detail sidebar stacks', async ({ page }) => {
  await openMedbud(page, 'strain-detail');
  const width = (await page.locator('section.tri-one').first().boundingBox())!.width;
  const inner = await page.evaluate(() => window.innerWidth);
  expect(width).toBeGreaterThanOrEqual(inner - 32);
});

test('no script errors from the userscript on any page', async ({ page }) => {
  // Loads every captured fixture in turn (formulary is 9MB), which outlasts the default on WebKit.
  test.setTimeout(400_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`${e.message}\n${e.stack ?? ''}`));
  for (const name of capturedPages()) {
    await openMedbud(page, name);
  }
  expect(errors.filter((e) => /medbud-mobile|mbm/i.test(e))).toEqual([]);
});

test('no script errors on a page without the expected markup', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await routeMedbud(page);
  await page.route('https://medbud.wiki/unknown/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><head><meta name="viewport" content="width=1440"></head><body><p>x</p></body></html>',
    }),
  );
  await addUserscript(page);
  await page.goto('https://medbud.wiki/unknown/');
  await expect(page.locator('html')).toHaveAttribute('data-medbud-mobile', '0.1.0');
  expect(errors).toEqual([]);
});
