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
  // The same button, now an X above the sheet, closes it.
  await expect(toggle).toBeVisible();
  await toggle.tap();
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

test.describe('header fixes from the phone test', () => {
  for (const dark of [false, true]) {
    test(`top links sit in the menu sheet, wrapped inside the screen (${dark ? 'dark' : 'light'})`, async ({ page }) => {
      await openMedbud(page, 'stats', { dark });
      await page.getByRole('button', { name: 'Menu', exact: true }).tap();
      await expect(page.locator('header nav .menuEllipsis__more .top-links a.login_open')).toBeVisible();
      await expect(page.locator('header nav .menuEllipsis__more .top-links a', { hasText: 'Contact' })).toBeVisible();
      const links = await page.evaluate(() => {
        const strip = document.querySelector('.top-links') as HTMLElement;
        const outside = [...strip.querySelectorAll('a, span')].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
        }).map((e) => e.textContent!.trim());
        return { scrolls: strip.scrollWidth > strip.clientWidth + 1, outside };
      });
      expect(links).toEqual({ scrolls: false, outside: [] });
    });
  }

  test('the planner box opens inside the screen', async ({ page }) => {
    await openMedbud(page, 'stats', { dark: true });
    await page.locator('#calculator').tap();
    const panel = page.locator('#calculatorResults');
    await expect(panel).toBeVisible();
    const outside = await panel.evaluate((p) =>
      [p, ...p.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && (r.left < -1 || r.right > innerWidth + 1);
      }).map((e) => `${e.tagName}#${e.id} ${Math.round(e.getBoundingClientRect().left)}..${Math.round(e.getBoundingClientRect().right)}`),
    );
    expect(outside).toEqual([]);
    const below = await page.evaluate(() => document.querySelector('#calculatorResults')!.getBoundingClientRect().top - document.querySelector('#calculator')!.getBoundingClientRect().bottom);
    expect(below).toBeGreaterThanOrEqual(0);
    expect(below).toBeLessThanOrEqual(24);
  });

  test('the menu button sits right of the logo in a bar that stays at the top', async ({ page }) => {
    await openMedbud(page, 'stats');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    const place = async () => page.evaluate(() => {
      const logo = document.querySelector('#logo')!.getBoundingClientRect();
      const button = document.querySelector('.mbm-burger')!.getBoundingClientRect();
      return {
        rightGap: innerWidth - button.right,
        centreDiff: Math.abs((logo.top + logo.bottom) / 2 - (button.top + button.bottom) / 2),
        top: button.top,
        size: Math.min(button.width, button.height),
      };
    });
    const before = await place();
    expect(before.rightGap).toBeLessThanOrEqual(16);
    expect(before.centreDiff).toBeLessThanOrEqual(8);
    expect(before.size).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => window.scrollTo(0, 3000));
    const after = await place();
    expect(after.top).toBeGreaterThanOrEqual(0);
    expect(after.top).toBeLessThanOrEqual(16);
    await menu.tap();
    await expect(page.locator('header nav .menuEllipsis__more')).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    // Open over a scrolled page, the bar and its button (now the close X) stay at the top, above the sheet.
    const open = await place();
    expect(open.top).toBeGreaterThanOrEqual(0);
    expect(open.top).toBeLessThanOrEqual(16);
    const onTop = await page.evaluate(() => {
      const r = document.querySelector('.mbm-burger')!.getBoundingClientRect();
      return Boolean(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)!.closest('.mbm-burger'));
    });
    expect(onTop).toBe(true);
  });
});
