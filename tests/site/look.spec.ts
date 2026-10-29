import { test, expect, type Page } from '@playwright/test';
import { UA, guidePage, openGuide } from '../helpers/site';

const ALL_STEPS = ['chooser', 'ios-1', 'ios-2', 'ios-3', 'ios-4', 'firefox-1', 'firefox-2', 'firefox-3', 'android-1', 'android-2', 'desktop-1', 'desktop-2', 'desktop-3'];

async function phone(browser: import('@playwright/test').Browser, info: import('@playwright/test').TestInfo, width?: number) {
  const page = await guidePage(browser, info, UA.iphone, width ? { viewport: { width, height: 640 } } : {});
  return page;
}

async function at(page: Page, id: string) {
  await page.evaluate((h) => { location.hash = h; }, id);
  await expect(page.locator('.step:visible')).toHaveAttribute('id', id);
}

test.describe('install guide look', () => {
  test.beforeEach(({ isMobile }, info) => test.skip(!isMobile || info.project.name === 'iphone-landscape', 'portrait phones'));

  for (const width of [320, 390]) {
    test(`no sideways scroll at ${width}px on every step`, async ({ browser }, info) => {
      const page = await phone(browser, info, width);
      await openGuide(page);
      const wide: string[] = [];
      for (const id of ALL_STEPS) {
        await at(page, id);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) wide.push(id);
      }
      expect(wide).toEqual([]);
      await page.context().close();
    });
  }

  test('every button and link in the guide is at least 44px tall', async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page);
    const small: string[] = [];
    for (const id of ALL_STEPS) {
      await at(page, id);
      small.push(...await page.evaluate(() =>
        [...document.querySelectorAll('a, button')]
          .filter((e) => (e as HTMLElement).offsetParent !== null && !e.closest('footer.caveat p, .report'))
          .filter((e) => e.getBoundingClientRect().height < 44)
          .map((e) => `${location.hash} ${(e.textContent || '').trim()}`),
      ));
    }
    expect([...new Set(small)]).toEqual([]);
    await page.context().close();
  });

  test('direction text is at least 16px and titles at least 24px', async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page);
    const sizes = await page.evaluate(() => {
      const step = document.querySelector('.step:not([hidden])')!;
      const px = (e: Element) => parseFloat(getComputedStyle(e).fontSize);
      return { title: px(step.querySelector('h2')!), dirs: Math.min(...[...step.querySelectorAll('.dir li')].map(px)) };
    });
    expect(sizes.title).toBeGreaterThanOrEqual(24);
    expect(sizes.dirs).toBeGreaterThanOrEqual(16);
    await page.context().close();
  });

  test('the label sits on the bag-green ground', async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page);
    const colours = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      label: getComputedStyle(document.querySelector('.step:not([hidden]) .label')!).backgroundColor,
    }));
    expect(colours).toEqual({ body: 'rgb(31, 107, 58)', label: 'rgb(255, 255, 255)' });
    await page.context().close();
  });

  test('caution yellow is only used by the caution strip', async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page);
    const others = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((e) => getComputedStyle(e).backgroundColor === 'rgb(242, 194, 0)' && !e.matches('.caution'))
        .map((e) => e.className),
    );
    expect(others).toEqual([]);
    expect(await page.locator('.step:visible .caution').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(242, 194, 0)');
    await page.context().close();
  });

  test("fonts load from the guide's own folder", async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([document.fonts.load('16px Arimo'), document.fonts.load('700 12px "Roboto Mono"')]);
      return { arimo: document.fonts.check('16px Arimo'), mono: document.fonts.check('700 12px "Roboto Mono"'), faces: [...document.fonts].filter((f) => f.status === 'loaded').length };
    });
    expect(loaded.arimo).toBe(true);
    expect(loaded.mono).toBe(true);
    expect(loaded.faces).toBeGreaterThanOrEqual(2);
    await page.context().close();
  });

  test('at 200% text size the button bar never covers the directions', async ({ browser }, info) => {
    const page = await phone(browser, info);
    await openGuide(page, { hash: 'ios-3' });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const result = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.step:not([hidden]) .dir li, .step:not([hidden]) .act-btn, .step:not([hidden]) .caution')];
      const last = items[items.length - 1] as HTMLElement;
      last.scrollIntoView({ block: 'end' });
      window.scrollBy(0, 2000);
      const bar = document.querySelector('.bar')!.getBoundingClientRect();
      return { lastBottom: last.getBoundingClientRect().bottom, barTop: bar.top, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(result.lastBottom).toBeLessThanOrEqual(result.barTop + 1);
    expect(result.overflow).toBe(false);
    await page.context().close();
  });

  test('with reduced motion the step swap is instant', async ({ browser }, info) => {
    const page = await guidePage(browser, info, UA.iphone, { reducedMotion: 'reduce' });
    await openGuide(page);
    await page.getByRole('button', { name: 'Done, next step' }).click();
    await page.waitForURL(/#ios-2$/);
    // Read in the same task as the hash change: an animated swap would still be running (or not yet applied).
    const state = await page.evaluate(() => {
      const shown = [...document.querySelectorAll('.step')].filter((s) => getComputedStyle(s).display !== 'none');
      return { shown: shown.length, id: shown[0].id, running: document.getAnimations().filter((a) => a.playState === 'running').length };
    });
    expect(state).toEqual({ shown: 1, id: 'ios-2', running: 0 });
    await page.context().close();
  });
});
