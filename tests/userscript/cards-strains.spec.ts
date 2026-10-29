import { test, expect, type Page } from '@playwright/test';
import { fixturesAvailable, horizontalOverflow, openMedbud } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

const rows = (page: Page) => page.locator('table.product').first().locator('tbody tr');

/** Empty the price, terpene and stock cells of the first product row in the served HTML. */
function blankFirstRow(html: string): string {
  const start = html.indexOf('<tr', html.indexOf('<tbody', html.indexOf('class="product')));
  const end = html.indexOf('</tr>', start) + 5;
  const row = html
    .slice(start, end)
    .replace(/(<td[^>]*class="priceGram"[^>]*>)[\s\S]*?(<\/td>)/, '$1$2')
    .replace(/(<td[^>]*class="terps"[^>]*>)[\s\S]*?(<\/td>)/, '$1$2')
    .replace(/(<td[^>]*>)(\s*<span class="stock-[\s\S]*?)(<\/td>)/, '$1$3');
  return html.slice(0, start) + row + html.slice(end);
}

test('strains rows render as cards', async ({ page }) => {
  await openMedbud(page, 'strains');
  const row = rows(page).first();
  expect(await row.evaluate((tr) => getComputedStyle(tr).display)).toBe('grid');
  await expect(row.locator('[data-mbm-role=name] a').first()).toBeVisible();
  await expect(row.locator('[data-mbm-role=ppg]')).toBeVisible();
  await expect(row.locator('[data-mbm-role=stock]')).toBeVisible();
  await expect(row.locator('[data-mbm-role=genetics]')).toBeHidden();
  await expect(row.locator('[data-mbm-role=terps]')).toBeHidden();
});

test('details toggle opens and closes', async ({ page }) => {
  await openMedbud(page, 'strains');
  const [first, second, third] = [rows(page).nth(0), rows(page).nth(1), rows(page).nth(2)];
  const button = second.locator('.mbm-more');
  await button.tap();
  await expect(second).toHaveClass(/mbm-open/);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveText(/Hide details/);
  await expect(second.locator('[data-mbm-role=genetics]')).toBeVisible();
  await expect(first).not.toHaveClass(/mbm-open/);
  await expect(third).not.toHaveClass(/mbm-open/);
  await button.tap();
  await expect(second).not.toHaveClass(/mbm-open/);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(second.locator('[data-mbm-role=genetics]')).toBeHidden();
});

test('toggle count matches rows, even when injected twice', async ({ page }) => {
  await openMedbud(page, 'strains', { times: 2 });
  const table = page.locator('table.product').first();
  const rowCount = await table.locator('tbody tr').count();
  expect(rowCount).toBeGreaterThan(10);
  await expect(table.locator('.mbm-more')).toHaveCount(rowCount);
});

test('rows added later become cards', async ({ page }) => {
  await openMedbud(page, 'strains');
  await page.evaluate(() => {
    const tbody = document.querySelector('table.product tbody')!;
    const clone = tbody.querySelector('tr')!.cloneNode(true) as HTMLTableRowElement;
    clone.removeAttribute('data-mbm');
    clone.classList.remove('mbm-open');
    clone.querySelector('[data-mbm-role=toggle]')?.remove();
    clone.querySelectorAll('[data-mbm-role]').forEach((td) => td.removeAttribute('data-mbm-role'));
    clone.id = 'mbm-test-added';
    tbody.appendChild(clone);
  });
  await expect(page.locator('#mbm-test-added .mbm-more')).toHaveCount(1, { timeout: 1000 });
});

test('empty cells render cleanly', async ({ page }) => {
  await openMedbud(page, 'strains', { transformHtml: blankFirstRow });
  const blank = rows(page).nth(0);
  const normal = rows(page).nth(1);
  const widest = await blank.evaluate((tr) => {
    const cardRight = tr.getBoundingClientRect().right;
    return Math.max(...[...tr.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right - cardRight));
  });
  expect(widest).toBeLessThanOrEqual(1);
  const [hBlank, hNormal] = [(await blank.boundingBox())!.height, (await normal.boundingBox())!.height];
  expect(hBlank).toBeLessThan(hNormal);
});

test('no hover tint after tap', async ({ page }) => {
  await openMedbud(page, 'strains');
  const row = rows(page).nth(1);
  await row.locator('.mbm-more').tap();
  const bg = await row.locator('[data-mbm-role=name]').evaluate((td) => getComputedStyle(td).backgroundColor);
  expect(bg).toBe('rgba(0, 0, 0, 0)');
});

test('rotation swaps cards for scroll', async ({ page }, info) => {
  test.skip(info.project.name !== 'pixel', 'pixel only');
  await openMedbud(page, 'strains');
  await expect(page.locator('table.product.mbm-cards').first()).toBeVisible();
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(page.locator('table.mbm-cards')).toHaveCount(0);
  await expect(page.locator('.mbm-scroll > table.product').first()).toBeAttached();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 412, height: 839 });
  await expect(page.locator('table.product.mbm-cards').first()).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});
