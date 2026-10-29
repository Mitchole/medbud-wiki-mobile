import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { USERSCRIPT_PATH, addUserscript, fixturesAvailable, openMedbud, routeMedbud, PAGES } from '../helpers/medbud';

// Findings from the final whole-branch review.

test.describe('phone-only behaviour', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone projects only');

  test('"Only at" goes only on pharmacy-name pills, never on statuses or months', async ({ page }) => {
    test.skip(!fixturesAvailable('oils'), 'oils fixture missing');
    test.setTimeout(180_000);
    for (const name of ['strains', 'oils'] as const) {
      await openMedbud(page, name, { fullStrains: true });
      const wrong = await page.evaluate(() =>
        [...document.querySelectorAll('.availability.mbm-exclusive')]
          .filter((p) => !p.matches('.stock-low, .limited') || /cancel|confirm|tbc|ordered|recall|importer|eta|january|february|march|april|may|june|july|august|september|october|november|december/i.test(p.textContent || ''))
          .map((p) => (p.textContent || '').trim()),
      );
      expect(wrong, name).toEqual([]);
    }
  });

  test('rows the site reveals with "Include Unavailable" stay cards', async ({ page }) => {
    await openMedbud(page, 'pharmacy');
    await page.locator('.show-unavailable-link').first().evaluate((el) => (el as HTMLElement).click());
    const tableRows = await page.evaluate(() =>
      [...document.querySelectorAll('table.pharmacy-list.mbm-cards > tbody > tr.product-row')]
        .filter((tr) => getComputedStyle(tr).display !== 'none' && getComputedStyle(tr).display !== 'grid').length,
    );
    expect(tableRows).toBe(0);
  });

  test('a second copy running in a separate script world adds nothing and the menu still opens', async ({ page }) => {
    // Two managers (or the app plus a manager) may run the script in worlds that cannot see each other's window flag.
    const twin = readFileSync(USERSCRIPT_PATH, 'utf8').replace(/__medbudMobileLoaded/g, '__medbudMobileLoadedTwin');
    await routeMedbud(page);
    await page.context().addCookies([{ name: 'consent-access', value: '1', domain: 'medbud.wiki', path: '/' }]);
    await addUserscript(page);
    await page.addInitScript({ content: twin });
    await page.goto(PAGES.home);
    await expect(page.locator('.mbm-menu-close')).toHaveCount(1);
    await expect(page.locator('.mbm-top')).toHaveCount(1);
    const toggle = page.getByRole('button', { name: 'Menu', exact: true });
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('header nav .menuEllipsis__more')).toBeVisible();
  });

  test('planner buttons say whether the item is already added', async ({ page }) => {
    const markFirstAdded = (html: string) => html.replace('class="calcStrain"', 'class="calcStrain selected"');
    await openMedbud(page, 'strains', { transformHtml: markFirstAdded });
    const labels = await page.locator('table.product button.calcStrain .mbm-label').allInnerTexts();
    expect(labels[0]).toBe('Added to Planner');
    expect(labels[1]).toBe('Add to Planner');
  });
});

test('in landscape, the cells the script adds do not show as extra table columns', async ({ page }, info) => {
  test.skip(info.project.name !== 'pixel', 'pixel only');
  test.skip(!fixturesAvailable('producers'), 'producers fixture missing');
  for (const [name, role] of [['clinics', 'notes'], ['producers', 'count']] as const) {
    await openMedbud(page, name);
    await page.setViewportSize({ width: 915, height: 412 });
    const shown = await page.locator(`td[data-mbm-role=${role}]`).evaluateAll((tds) => tds.filter((td) => getComputedStyle(td).display !== 'none').length);
    expect(shown, name).toBe(0);
    await page.setViewportSize({ width: 412, height: 839 });
  }
});

test('the viewport keeps content clear of the notch (no viewport-fit=cover)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone projects only');
  await openMedbud(page, 'home');
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', 'width=device-width, initial-scale=1');
});

test('a small tablet (iPad mini) keeps the desktop site', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 744, height: 1133 }, screen: { width: 744, height: 1133 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await openMedbud(page, 'home');
  await expect(page.locator('html')).not.toHaveAttribute('data-medbud-mobile', /.*/);
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', 'width=1440');
  await context.close();
});
