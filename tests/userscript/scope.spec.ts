import { test, expect } from '@playwright/test';
import { fixturesAvailable, openMedbud, addUserscript, USERSCRIPT_VERSION } from '../helpers/medbud';

test('desktop untouched', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop project only');
  test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
  await openMedbud(page, 'strains');
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', 'width=1440');
  await expect(page.locator('html')).not.toHaveAttribute('data-medbud-mobile', /.*/);
  await expect(page.locator('#medbud-mobile-css')).toHaveCount(0);
});

test('install page only gets the flag', async ({ page }) => {
  await page.route('https://mitchole.github.io/medbud-wiki-mobile/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><title>Install</title></head><body><p>Install</p></body></html>' }),
  );
  await addUserscript(page);
  await page.goto('https://mitchole.github.io/medbud-wiki-mobile/');
  await expect(page.locator('html')).toHaveAttribute('data-medbud-mobile', USERSCRIPT_VERSION);
  await expect(page.locator('#medbud-mobile-css')).toHaveCount(0);
});

test('runs when injected before the html element exists', async ({ page }) => {
  // addInitScript runs before <html> is created, as document-start can in userscript managers.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://mitchole.github.io/medbud-wiki-mobile/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>x</body></html>' }),
  );
  await addUserscript(page);
  await page.goto('https://mitchole.github.io/medbud-wiki-mobile/');
  expect(errors).toEqual([]);
});

test('idempotent when injected twice', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone projects only');
  test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
  await openMedbud(page, 'strains', { times: 2 });
  await expect(page.locator('#medbud-mobile-css')).toHaveCount(1);
  await expect(page.locator('.mbm-scroll .mbm-scroll')).toHaveCount(0);
});
