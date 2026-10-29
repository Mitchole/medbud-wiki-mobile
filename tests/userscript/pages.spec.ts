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
    const ranges = await controls.locator('input[type=range]').evaluateAll((r) => r.map((e) => e.getBoundingClientRect().height));
    expect(Math.min(...ranges)).toBeGreaterThanOrEqual(44);
  });
});

test.describe('pharmacies directory', () => {
  test.skip(!fixturesAvailable('pharmacies'), 'pharmacies fixture missing');

  test('pharmacies render as cards with notes folded in', async ({ page }) => {
    await openMedbud(page, 'pharmacies');
    const stats = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('table#pharmacies > tbody > tr')];
      return {
        pharmacies: rows.filter((tr) => tr.querySelector(':scope > [data-mbm-role=name]')).length,
        shown: rows.filter((tr) => getComputedStyle(tr).display !== 'none').length,
      };
    });
    expect(stats.pharmacies).toBeGreaterThan(10);
    expect(stats.shown).toBe(stats.pharmacies);
    const row = page.locator('table#pharmacies > tbody > tr').first();
    expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
    await expect(row.locator('> [data-mbm-role=name]')).toContainText('IPS Pharma');
    await expect(row.locator('> [data-mbm-role=meta]')).toContainText('Available');
    await expect(row.locator('> [data-mbm-role=contact]')).toBeHidden();
    await row.locator('.mbm-more').tap();
    await expect(row.locator('> [data-mbm-role=contact]')).toBeVisible();
    await expect(row.locator('> [data-mbm-role=notes]')).toBeVisible();
  });
});

for (const [name, noun] of [['producers', 'medications'], ['breeders', 'cultivars']] as const) {
  test.describe(`${name} directory`, () => {
    test.skip(!fixturesAvailable(name), `${name} fixture missing`);

    test(`${name} render as cards with a ${noun} count`, async ({ page }) => {
      await openMedbud(page, name);
      // The first row with any items, so the count is not zero.
      const row = page.locator('table#producers > tbody > tr').filter({ has: page.locator('[data-mbm-role=items] a') }).first();
      expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
      await expect(row.locator('> [data-mbm-role=name]')).toBeVisible();
      await expect(row.locator('> [data-mbm-role=count]')).toContainText(new RegExp(`\\d+ ${noun.slice(0, -1)}s?`));
      await expect(row.locator('> [data-mbm-role=items]')).toBeHidden();
      await row.locator('.mbm-more').tap();
      await expect(row.locator('> [data-mbm-role=items]')).toBeVisible();
      const link = row.locator('> [data-mbm-role=items] a').first();
      const size = await link.evaluate((a) => ({ h: parseFloat(getComputedStyle(a).minHeight), w: a.getBoundingClientRect().width }));
      expect(size.h).toBeGreaterThanOrEqual(44);
    });
  });
}

test.describe('stats', () => {
  test.skip(!fixturesAvailable('stats'), 'stats fixture missing');
  test('stat columns are full width with counts beside their labels', async ({ page }) => {
    await openMedbud(page, 'stats');
    const inner = await innerWidth(page);
    const block = page.locator('article.quad-three div.block').first();
    expect((await block.boundingBox())!.width).toBeGreaterThanOrEqual(inner - 80);
    const line = await page.locator('article.quad-three div.block li').filter({ has: page.locator('span') }).first().evaluate((li) => {
      const span = li.querySelector('span')!.getBoundingClientRect();
      const r = li.getBoundingClientRect();
      return { single: r.height < 40, inside: span.top >= r.top - 1 && span.bottom <= r.bottom + 1 };
    });
    expect(line).toEqual({ single: true, inside: true });
  });
});

test.describe('map', () => {
  test.skip(!fixturesAvailable('map'), 'map fixture missing');
  test('map fits the screen and lets vertical swipes scroll the page', async ({ page }) => {
    await openMedbud(page, 'map');
    const map = await page.locator('#map').evaluate((m) => ({ h: m.getBoundingClientRect().height, touch: getComputedStyle(m).touchAction }));
    expect(map.h).toBeLessThanOrEqual(page.viewportSize()!.height * 0.65);
    expect(map.touch).toContain('pan-y');
  });
});

test.describe('guide', () => {
  test('article comes first and the guide list folds behind a button', async ({ page }) => {
    await openMedbud(page, 'guide');
    const articleTop = (await page.locator('main article.quad-three').first().boundingBox())!.y;
    const button = page.getByRole('button', { name: 'All guides' });
    const buttonBox = (await button.boundingBox())!;
    expect(buttonBox.y).toBeGreaterThan(articleTop);
    expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('aside.quad-one')).toBeHidden();
    await button.tap();
    await expect(page.locator('aside.quad-one')).toBeVisible();
  });

  test('share buttons sit on their own row with 44px targets', async ({ page }) => {
    await openMedbud(page, 'guide');
    const heights = await page.locator('nav.share-widget-custom a').evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height).filter((h) => h > 0));
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  });
});

test.describe('home lists', () => {
  test('latest edits and listings fit without sideways scrolling', async ({ page }) => {
    await openMedbud(page, 'home');
    const inner = await innerWidth(page);
    const worst = await page.evaluate((inner) => {
      const cells = [...document.querySelectorAll('table.latest > tbody > tr > td')];
      return Math.max(...cells.map((td) => td.getBoundingClientRect().right)) - inner;
    }, inner);
    expect(worst).toBeLessThanOrEqual(0);
    await expect(page.locator('table#edits > tbody > tr').first()).toContainText('Available');
  });

  test('feature cards are full width and video reviews sit two to a row', async ({ page }) => {
    await openMedbud(page, 'home');
    const inner = await innerWidth(page);
    const widths = await page.locator('section.tri.home-feature').evaluateAll((s) => s.map((e) => e.getBoundingClientRect().width));
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(inner - 60);
    const tops = await page.locator('section.video-review').evaluateAll((s) => s.slice(0, 2).map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(tops[0]).toBe(tops[1]);
  });
});
