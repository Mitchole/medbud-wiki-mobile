import { test, expect } from '@playwright/test';
import { addUserscript, fixturesAvailable, openMedbud, routeMedbud } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

/** WCAG contrast of an element's text against the first opaque background behind it, opacity included. */
async function contrast(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((el) => {
    const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    let bg = [0, 0, 0];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.length >= 3 && (c.length === 3 || c[3] > 0.5)) { bg = c.slice(0, 3); break; }
      if (n === document.documentElement) bg = [255, 255, 255];
    }
    let opacity = 1;
    for (let n: Element | null = el; n; n = n.parentElement) opacity *= parseFloat(getComputedStyle(n).opacity);
    const fg = parse(getComputedStyle(el).color).slice(0, 3).map((v, i) => v * opacity + bg[i] * (1 - opacity));
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
}

test('Details button text meets 4.5:1 contrast in the dark theme', async ({ page }) => {
  await openMedbud(page, 'strains', { dark: true });
  expect(await contrast(page.locator('table.product .mbm-more').first())).toBeGreaterThanOrEqual(4.5);
});

test('quiet text is not faded below 4.5:1 in the dark theme', async ({ page }) => {
  await openMedbud(page, 'clinics', { dark: true });
  expect(await contrast(page.locator('table#clinics small.quiet').first())).toBeGreaterThanOrEqual(4.5);
});

test('a back-to-top button appears on long pages and works', async ({ page }) => {
  await openMedbud(page, 'strains');
  const button = page.getByRole('button', { name: 'Back to top' });
  await expect(button).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
  await expect(button).toBeVisible();
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await button.tap();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});

test('flag images inside headings are not read aloud', async ({ page }) => {
  await openMedbud(page, 'home');
  const alts = await page.locator(':is(h1, h2, h3, h4) img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
  expect(alts.length).toBeGreaterThan(0);
  expect(alts.filter((a) => a.startsWith('Flag of'))).toEqual([]);
});

test('the dead "Show Filters" button is hidden on phones', async ({ page }) => {
  await openMedbud(page, 'strains');
  await expect(page.locator('a.toggleFilter')).toBeHidden();
});

test('footer links are 44px tap targets', async ({ page }) => {
  await openMedbud(page, 'home');
  const heights = await page.locator('footer a').evaluateAll((as) => as.map((a) => a.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => r.height));
  expect(heights.length).toBeGreaterThan(0);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});

test('a page with no viewport tag (such as an error page) still gets one', async ({ page }) => {
  await routeMedbud(page);
  await page.route('https://medbud.wiki/rate-limited/', (route) =>
    route.fulfill({ status: 429, contentType: 'text/html', body: '<!doctype html><html><head><title>429</title></head><body><h1>Rate limited</h1></body></html>' }),
  );
  await addUserscript(page);
  await page.goto('https://medbud.wiki/rate-limited/');
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', /width=device-width/);
});
