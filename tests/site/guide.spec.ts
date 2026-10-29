import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { USERSCRIPT_PATH, addUserscript } from '../helpers/medbud';
import { GUIDE_URL, UA, USERSCRIPT_URL, extRequests, guidePage, openGuide } from '../helpers/site';

const heading = (page: Page) => page.locator('.step:visible h2');

test.describe('install guide behaviour', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === 'iphone-landscape', 'portrait and desktop are enough for behaviour'));

  const starts: [string, string, string][] = [
    ['iPhone Safari', UA.iphone, 'Get the Userscripts app'],
    ['Android Firefox', UA.androidFirefox, 'Add Tampermonkey to Firefox'],
    ['Android Chrome', UA.androidChrome, 'Get Firefox'],
    ['Samsung Internet', UA.samsung, 'Get Firefox'],
    ['desktop Chrome', UA.desktopChrome, 'This is for phones'],
  ];
  for (const [name, ua, title] of starts) {
    test(`${name} starts on "${title}"`, async ({ browser }, info) => {
      const page = await guidePage(browser, info, ua);
      await openGuide(page);
      await expect(page.locator('.step:visible')).toHaveCount(1);
      await expect(heading(page)).toHaveText(title);
      await page.context().close();
    });
  }

  test('iPad reporting as a Mac with touch starts on the iPhone/iPad path', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.macSafari);
    await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 }));
    await openGuide(page);
    await expect(heading(page)).toHaveText('Get the Userscripts app');
    await page.context().close();
  });

  test('an unrecognised browser gets the chooser', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.unknown);
    await openGuide(page);
    await expect(page.locator('.step:visible')).toHaveCount(1);
    await expect(page.locator('.step:visible')).toHaveAttribute('data-path', 'chooser');
    await page.context().close();
  });

  test('"Not your device?" opens the chooser and picking Android with Firefox shows its first step', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page);
    await page.getByRole('link', { name: 'Not your device?' }).click();
    await expect(page.locator('.step:visible')).toHaveAttribute('data-path', 'chooser');
    await page.getByRole('link', { name: /Android.*Firefox/ }).click();
    await expect(heading(page)).toHaveText('Add Tampermonkey to Firefox');
    await page.context().close();
  });

  test('Done and Back move one step and announce it', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page);
    const back = page.getByRole('button', { name: 'Back' });
    await expect(back).toBeDisabled();
    await page.getByRole('button', { name: 'Done, next step' }).click();
    await expect(heading(page)).toHaveText('Turn on Userscripts in Safari');
    await expect(page.locator('#announce')).toContainText('Step 2 of 4');
    await expect(page.locator('.meter .on')).toHaveCount(2);
    expect(new URL(page.url()).hash).toBe('#ios-2');
    await back.click();
    await expect(heading(page)).toHaveText('Get the Userscripts app');
    await expect(back).toBeDisabled();
    await page.context().close();
  });

  test('a reload keeps the current step', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.androidFirefox);
    await openGuide(page, { hash: 'firefox-2' });
    await expect(heading(page)).toHaveText('Install MedBud Mobile');
    await page.reload();
    await expect(heading(page)).toHaveText('Install MedBud Mobile');
    await page.context().close();
  });

  test('the installed attribute shows the installed state with its version', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page, { installed: '0.1.0' });
    await expect(heading(page)).toHaveText('MedBud Mobile is installed');
    await expect(page.locator('.step:visible')).toContainText('0.1.0');
    await expect(page.getByRole('link', { name: 'Open MedBud' })).toHaveAttribute('href', 'https://medbud.wiki/');
    await page.context().close();
  });

  test('the guide says not every page was checked and links to GitHub issues to report one', async ({ browser }, info) => {
    const issues = 'https://github.com/Mitchole/medbud-wiki-mobile/issues/new';
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page);
    const footer = page.locator('footer.caveat');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/not every.*page/i);
    await expect(footer.locator(`a[href="${issues}"]`)).toBeVisible();
    await page.context().close();
    const done = await guidePage(browser, info, UA.iphone);
    await openGuide(done, { installed: '0.1.0' });
    const label = done.locator('.step:visible');
    await expect(label).toContainText(/not every.*page/i);
    await expect(label.locator(`a[href="${issues}"]`)).toBeVisible();
    await done.context().close();
  });

  test('Check now without the script says it was not found yet', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page, { hash: 'ios-4' });
    await page.getByRole('button', { name: 'Check now' }).click();
    const note = page.locator('.step:visible .notfound');
    await expect(note).toBeVisible();
    await expect(note).toContainText(/not found/i);
    await expect(heading(page)).toHaveText('Check it worked');
    await page.context().close();
  });

  test('Check now finds the script once it runs', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.androidFirefox);
    await openGuide(page, { hash: 'firefox-3' });
    await page.evaluate(() => { document.documentElement.dataset.medbudMobile = '0.1.0'; });
    await page.getByRole('button', { name: 'Check now' }).click();
    await expect(heading(page)).toHaveText('MedBud Mobile is installed');
    await page.context().close();
  });

  test('step links go to the exact store and script URLs', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page);
    for (const href of [
      'https://apps.apple.com/app/userscripts/id1463298887',
      'https://addons.mozilla.org/android/addon/tampermonkey/',
      'https://play.google.com/store/apps/details?id=org.mozilla.firefox',
      'https://www.tampermonkey.net/',
    ]) {
      await expect(page.locator(`a[href="${href}"]`), href).toHaveCount(1);
    }
    const scripts = page.locator(`a[href="${USERSCRIPT_URL}"]`);
    expect(await scripts.count()).toBeGreaterThanOrEqual(3);
    // Some Firefox versions will not install a userscript opened in a new tab.
    expect(await scripts.evaluateAll((as) => as.filter((a) => a.hasAttribute('target')).length)).toBe(0);
    await page.context().close();
  });

  test('the page makes no third-party requests', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page);
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Done, next step' }).click();
    await page.waitForLoadState('networkidle');
    expect(extRequests(page)).toEqual([]);
    await page.context().close();
  });

  test('with JavaScript off every path is listed', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone, { javaScriptEnabled: false });
    await openGuide(page);
    for (const title of ['Get the Userscripts app', 'Add Tampermonkey to Firefox', 'Get Firefox', 'This is for phones']) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await page.context().close();
  });
});

test('the real userscript marks the guide as installed', async ({ page }) => {
  const version = /const VERSION = '([^']+)'/.exec(readFileSync(USERSCRIPT_PATH, 'utf8'))![1];
  await addUserscript(page);
  await openGuide(page);
  await expect(page.locator('html')).toHaveAttribute('data-medbud-mobile', version);
  await expect(page.locator('.step:visible h2')).toHaveText('MedBud Mobile is installed');
  await expect(page.locator('.step:visible')).toContainText(version);
  expect(page.url().startsWith(GUIDE_URL)).toBe(true);
});
