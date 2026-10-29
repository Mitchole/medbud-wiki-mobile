import { test, expect } from '@playwright/test';
import { TAP_TARGETS, fixturesAvailable, openMedbud, type PageName } from '../helpers/medbud';

test.skip(!fixturesAvailable(), 'fixtures missing: see tests/fixtures/README.md');
test.skip(({ isMobile }) => !isMobile, 'phone projects only');

const PAGES_TO_CHECK: PageName[] = ['home', 'strains', 'clinics', 'guide'];

// Text that is legitimately tiny: super/subscripts sit beside full-size text, and
// star icons are glyphs whose size is set by the rating widget, not reading text.
const SMALL_TEXT_ALLOWLIST = 'sup, sub, i.fa-star';

for (const name of PAGES_TO_CHECK) {
  test(`tap targets are at least 44px tall on ${name}`, async ({ page }) => {
    await openMedbud(page, name);
    const small = await page.evaluate((selectors) => {
      const bad: string[] = [];
      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') continue;
          if (r.height < 44) bad.push(`${sel} h=${Math.round(r.height)}`);
        }
      }
      return [...new Set(bad)];
    }, [...TAP_TARGETS]);
    expect(small).toEqual([]);
  });

  test(`text is readable on ${name}`, async ({ page }) => {
    await openMedbud(page, name);
    const problems = await page.evaluate((allow) => {
      const ownText = (el: Element) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };
      const tag = (el: Element) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const out = new Set<string>();
      for (const el of document.querySelectorAll('main p, main li, main td')) {
        if (!ownText(el) || !visible(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 14) out.add(`body text ${tag(el)} ${fs}px`);
      }
      for (const el of document.body.querySelectorAll('*')) {
        if (el.matches(allow) || !ownText(el) || !visible(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) out.add(`tiny text ${tag(el)} ${fs}px`);
      }
      return [...out].slice(0, 30);
    }, SMALL_TEXT_ALLOWLIST);
    expect(problems).toEqual([]);
  });
}
