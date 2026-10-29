import { test, expect } from '@playwright/test';
import { fixturesAvailable, openMedbud, liveRequests } from './helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');

test('harness serves fixtures without live requests', async ({ page }) => {
  await openMedbud(page, 'strains', { userscript: false });
  expect(await page.title()).toContain('All Flower/Strains');
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content', 'width=1440');
  expect(liveRequests(page)).toEqual([]);
});
