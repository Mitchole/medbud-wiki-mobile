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
    // The guide watches for the userscript's mark, so it flips without the visitor tapping Check now.
    await page.evaluate(() => { document.documentElement.dataset.medbudMobile = '0.1.0'; });
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

test.describe('finish review fixes', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === 'iphone-landscape', 'portrait and desktop are enough'));

  test('Done changes the step at once, without waiting for a hash event', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone, { reducedMotion: 'reduce' });
    await openGuide(page);
    const id = await page.evaluate(() => {
      (document.getElementById('next') as HTMLButtonElement).click();
      return (document.querySelector('.step:not([hidden])') as HTMLElement).dataset.key;
    });
    expect(id).toBe('ios-2');
    await page.context().close();
  });

  test('the last Chrome step does not send people into the Firefox steps', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.androidChrome);
    await openGuide(page, { hash: 'android-2' });
    await expect(page.getByRole('button', { name: 'Done, next step' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Back' })).toBeEnabled();
    await page.context().close();
  });

  test('the Safari settings step names the path for iOS 18 and for older iOS', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page, { hash: 'ios-2' });
    const step = page.locator('.step:visible');
    await expect(step).toContainText('Apps › Safari › Extensions');
    await expect(step).toContainText('Safari › Extensions');
    await expect(step).toContainText(/iOS 17|older/);
    await page.context().close();
  });

  test('chooser and installed labels have no eyebrow; installed carries a Checked date', async ({ browser }, info) => {
    const chooser = await guidePage(browser, info, UA.unknown);
    await openGuide(chooser);
    await expect(chooser.locator('.step:visible .head')).toHaveCount(0);
    await expect(chooser.getByRole('link', { name: 'Not your device?' })).toBeHidden();
    await chooser.context().close();
    const done = await guidePage(browser, info, UA.iphone);
    await openGuide(done, { installed: '0.1.0' });
    await expect(done.locator('.step:visible .head')).toHaveCount(0);
    const checked = done.locator('.step:visible .row', { hasText: 'Checked' });
    await expect(checked).toContainText(String(new Date().getFullYear()));
    await done.context().close();
  });

  test('opening at a step keeps the header in view', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone, { viewport: { width: 320, height: 640 } });
    await openGuide(page, { hash: 'ios-3' });
    await page.waitForLoadState('load');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('link', { name: 'Not your device?' })).toBeInViewport();
    await page.context().close();
  });

  test('desktop copy is honest and says click', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.desktopChrome);
    await openGuide(page);
    const first = page.locator('.step:visible');
    await expect(first).toContainText(/does nothing on a computer/i);
    const dirs = await first.locator('.dir li').allInnerTexts();
    const caution = await first.locator('.caution').innerText();
    for (const d of dirs) expect(caution).not.toContain(d.replace(/\.$/, ''));
    await openGuide(page, { hash: 'desktop-2' });
    await expect(page.locator('.step:visible .dir')).not.toContainText('Tap');
    await page.context().close();
  });
});

test.describe('final review fixes', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === 'iphone-landscape', 'portrait and desktop are enough'));

  test('a userscript that marks the page late still flips it to installed', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => setTimeout(() => { document.documentElement.dataset.medbudMobile = '0.1.0'; }, 400));
    });
    await openGuide(page, { hash: 'ios-4' });
    await expect(heading(page)).toHaveText('MedBud Mobile is installed');
    await expect(page.locator('.notfound:visible')).toHaveCount(0);
    await page.context().close();
  });

  test('an iPad is told the fix is made for iPhone', async ({ browser }, info) => {
    const ipad = await guidePage(browser, info, UA.macSafari);
    await ipad.addInitScript(() => Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 }));
    await openGuide(ipad);
    await expect(ipad.locator('.step:visible .ipad-note')).toBeVisible();
    await expect(ipad.locator('.step:visible .ipad-note')).toContainText(/iPad/);
    await ipad.context().close();
    const phone = await guidePage(browser, info, UA.iphone);
    await openGuide(phone);
    await expect(phone.locator('.step:visible .ipad-note')).toBeHidden();
    await phone.context().close();
  });

  for (const [name, ua] of [
    ['Chrome on iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1'],
    ['a chat app on iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.0]'],
  ] as const) {
    test(`${name} is sent to Safari first`, async ({ browser }, info) => {
      const page = await guidePage(browser, info, ua);
      await openGuide(page);
      await expect(heading(page)).toHaveText('Open this guide in Safari');
      await expect(page.locator('.step:visible [data-copy]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Done, next step' })).toBeHidden();
      await page.context().close();
    });
  }

  test('firefox-1 says to come back to the guide', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.androidFirefox);
    await openGuide(page);
    await expect(page.locator('.step:visible .dir li').last()).toContainText(/come back to this page/i);
    await page.context().close();
  });

  test('the installed state names the browser to open MedBud in', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone);
    await openGuide(page, { installed: '0.1.0' });
    await expect(page.locator('.step:visible')).toContainText(/Safari on iPhone/);
    await expect(page.locator('.step:visible')).toContainText(/Firefox on Android/);
    await page.context().close();
  });
});
