import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, statSync } from 'node:fs';
import type { Browser, BrowserContextOptions, Page, TestInfo } from '@playwright/test';

export const GUIDE_URL = 'https://mitchole.github.io/medbud-wiki-mobile/';
export const USERSCRIPT_URL = `${GUIDE_URL}medbud-mobile.user.js`;
const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'site');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

export const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  unknown: 'SomeReader/1.0',
};

export interface GuideOptions {
  /** Hash to open at, without the '#'. */
  hash?: string;
  /** Pretend the userscript is installed: sets data-medbud-mobile at document-start. */
  installed?: string;
}

/** Requests the guide made to anywhere other than its own folder (all aborted). */
const external = new WeakMap<Page, string[]>();
export function extRequests(page: Page): string[] {
  return external.get(page) ?? [];
}

/** A context like the current project's device, with another browser's user agent. */
export async function guidePage(browser: Browser, info: TestInfo, userAgent: string, extra: BrowserContextOptions = {}): Promise<Page> {
  const { defaultBrowserType: _ignored, ...device } = info.project.use as BrowserContextOptions & { defaultBrowserType?: string };
  const context = await browser.newContext({ ...device, userAgent, serviceWorkers: 'block', ...extra });
  return context.newPage();
}

/** Serve site/ at its real Pages URL and refuse every other request. */
export async function routeGuide(page: Page): Promise<void> {
  const seen: string[] = [];
  external.set(page, seen);
  await page.context().route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.startsWith(GUIDE_URL)) {
      seen.push(url);
      return route.abort();
    }
    let rel = decodeURIComponent(new URL(url).pathname.slice(new URL(GUIDE_URL).pathname.length));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.join(SITE_DIR, rel);
    if (!file.startsWith(SITE_DIR) || !existsSync(file) || !statSync(file).isFile()) {
      return route.fulfill({ status: 404, body: 'not found' });
    }
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
  });
}

export async function openGuide(page: Page, opts: GuideOptions = {}): Promise<void> {
  await routeGuide(page);
  if (opts.installed !== undefined) {
    const version = opts.installed;
    await page.addInitScript((v) => {
      const set = () => { document.documentElement.dataset.medbudMobile = v; };
      if (document.documentElement) set();
      else new MutationObserver((_, o) => { if (document.documentElement) { o.disconnect(); set(); } }).observe(document, { childList: true });
    }, version);
  }
  await page.goto(GUIDE_URL + (opts.hash ? `#${opts.hash}` : ''));
}
