import { test, expect } from '@playwright/test';
import { PAGE_NAMES, fixturesAvailable, horizontalOverflow, openMedbud, routeMedbud, addUserscript } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

for (const name of PAGE_NAMES) {
  test(`no horizontal overflow on ${name}`, async ({ page }) => {
    await openMedbud(page, name);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

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
  // Loads all seven fixtures in turn (strains alone is 11MB), which outlasts the default on WebKit.
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`${e.message}\n${e.stack ?? ''}`));
  for (const name of PAGE_NAMES) {
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
