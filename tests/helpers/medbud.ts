import type { Page, Route } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures');
export const USERSCRIPT_PATH = path.join(ROOT, 'medbud-mobile.user.js');

export const PAGES = {
  home: 'https://medbud.wiki/',
  strains: 'https://medbud.wiki/strains/',
  'strain-detail': 'https://medbud.wiki/strains/4c-labs/sck-s-smalls-t25-strawberry-glue/',
  clinics: 'https://medbud.wiki/clinics/',
  'clinic-detail': 'https://medbud.wiki/clinics/dispensed/',
  pharmacy: 'https://medbud.wiki/pharmacies/ips-pharma/',
  guide: 'https://medbud.wiki/guides/patients-joining/eligibility-conditions/',
} as const;

export type PageName = keyof typeof PAGES;
export const PAGE_NAMES = Object.keys(PAGES) as PageName[];

const pageFile = (name: PageName) => path.join(FIXTURES, 'pages', `${name}.html`);
const ASSETS = {
  css: path.join(FIXTURES, 'assets', 'site.css'),
  jquery: path.join(FIXTURES, 'assets', 'jquery.js'),
  js: path.join(FIXTURES, 'assets', 'site.js'),
};

// 1x1 transparent PNG.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export function fixturesAvailable(): boolean {
  return PAGE_NAMES.every((n) => existsSync(pageFile(n))) && Object.values(ASSETS).every((p) => existsSync(p));
}

const live = new WeakMap<Page, string[]>();

/** Requests that reached the router but were not served from fixtures. Should stay empty. */
export function liveRequests(page: Page): string[] {
  return live.get(page) ?? [];
}

const pageByUrl = new Map<string, PageName>(PAGE_NAMES.map((n) => [PAGES[n], n]));

export interface OpenOptions {
  /** Inject medbud-mobile.user.js at document start (default true). */
  userscript?: boolean;
  /** How many times to inject it (default 1). */
  times?: number;
  /** Replace the fixture HTML before it is served. */
  transformHtml?: (html: string) => string;
  /** Start as a visitor who already accepted the site's notice, so its popup does not cover the page (default true). */
  consented?: boolean;
}

/** Route every request for a medbud.wiki page to local fixtures; nothing reaches the network. */
export async function routeMedbud(page: Page, opts: Pick<OpenOptions, 'transformHtml'> = {}): Promise<void> {
  const unserved: string[] = [];
  live.set(page, unserved);
  await page.context().route('**/*', async (route: Route) => {
    const url = route.request().url();
    const type = route.request().resourceType();
    const name = pageByUrl.get(url.split('#')[0]);
    if (name) {
      let html = readFileSync(pageFile(name), 'utf8');
      if (opts.transformHtml) html = opts.transformHtml(html);
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (url.startsWith('https://files.medbud.wiki/css/')) {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', path: ASSETS.css });
    }
    if (url.startsWith('https://files.medbud.wiki/javascript/jquery/')) {
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', path: ASSETS.jquery });
    }
    if (url.startsWith('https://files.medbud.wiki/javascript/')) {
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', path: ASSETS.js });
    }
    if (type === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL });
    }
    if (type === 'document') unserved.push(url);
    return route.abort();
  });
}

export async function addUserscript(page: Page, times = 1): Promise<void> {
  if (!existsSync(USERSCRIPT_PATH)) {
    throw new Error(`userscript not found at ${USERSCRIPT_PATH}`);
  }
  for (let i = 0; i < times; i++) await page.addInitScript({ path: USERSCRIPT_PATH });
}

export async function openMedbud(page: Page, name: PageName, opts: OpenOptions = {}): Promise<void> {
  await routeMedbud(page, opts);
  if (opts.consented !== false) {
    // The cookies the site sets after "Accept & Proceed" with analytics declined.
    await page.context().addCookies([
      { name: 'consent-access', value: '1', domain: 'medbud.wiki', path: '/' },
      { name: 'consent-analytics', value: '0', domain: 'medbud.wiki', path: '/' },
    ]);
  }
  if (opts.userscript !== false) await addUserscript(page, opts.times ?? 1);
  await page.goto(PAGES[name], { waitUntil: 'load' });
}

/** Controls the audit found under 44px on phones. Selectors with no visible match on a page are skipped. */
export const TAP_TARGETS = [
  '.top-links a',
  'nav.breadcrumbs a',
  'header nav .menuEllipsis__elem > a',
  'form#search button',
  'form#search input[type=search]',
  'button.calcStrain',
  'button.pdfStrain',
  'table#clinics td a.button',
  '.mbm-more',
] as const;

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}
