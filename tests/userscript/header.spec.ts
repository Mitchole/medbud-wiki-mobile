import { test, expect } from '@playwright/test';
import { fixturesAvailable, openMedbud } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

test('header takes at most 300px before the page content', async ({ page }, info) => {
  test.skip(info.project.name === 'iphone-landscape', 'portrait budget');
  await openMedbud(page, 'home');
  const bottom = await page.evaluate(() => document.querySelector('header')!.getBoundingClientRect().bottom + window.scrollY);
  expect(bottom).toBeLessThanOrEqual(300);
});

test('trust badges move below the content but stay on the page', async ({ page }) => {
  await openMedbud(page, 'home');
  const order = await page.evaluate(() => {
    const charter = document.querySelector('aside.charter')!;
    const mains = document.querySelectorAll('main');
    const last = mains[mains.length - 1];
    return { after: Boolean(last.compareDocumentPosition(charter) & Node.DOCUMENT_POSITION_FOLLOWING), shown: getComputedStyle(charter).display !== 'none' };
  });
  expect(order).toEqual({ after: true, shown: true });
});

test('adverts stay displayed', async ({ page }) => {
  await openMedbud(page, 'home');
  // The site hides banners until its ad service fills them (blocked offline); show them as a filled page would,
  // then check nothing in the userscript hides them.
  // An inline !important style stands in for the filled state; a userscript rule could only hide it with
  // visibility, opacity or a zero size, which is what this checks.
  const banners = await page.evaluate(() =>
    [...document.querySelectorAll('figure.banner')].map((f) => {
      (f as HTMLElement).style.setProperty('display', 'block', 'important');
      (f as HTMLElement).style.setProperty('min-height', '50px', 'important');
      const cs = getComputedStyle(f);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && f.getBoundingClientRect().height > 0;
    }),
  );
  expect(banners.length).toBeGreaterThan(0);
  expect(banners.every(Boolean)).toBe(true);
});

test('menu button opens a full-screen menu that can be closed', async ({ page }) => {
  await openMedbud(page, 'home');
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('header nav .menuEllipsis__more');
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  const view = page.viewportSize()!;
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.height).toBeGreaterThanOrEqual(view.height - 1);
  const close = page.getByRole('button', { name: 'Close menu' });
  await expect(close).toBeVisible();
  await close.tap();
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.tap();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('tab strips are one scrollable row of 44px tabs', async ({ page }) => {
  await openMedbud(page, 'clinics');
  const tabs = await page.evaluate(() => {
    const strip = document.querySelector('div.tabs')!;
    const links = [...strip.querySelectorAll(':scope > a')].map((a) => a.getBoundingClientRect());
    return { tops: [...new Set(links.map((r) => Math.round(r.top)))].length, minHeight: Math.min(...links.map((r) => r.height)), count: links.length };
  });
  expect(tabs.count).toBeGreaterThan(1);
  expect(tabs.tops).toBe(1);
  expect(tabs.minHeight).toBeGreaterThanOrEqual(44);
});
