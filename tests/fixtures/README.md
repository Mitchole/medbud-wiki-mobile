# Test fixtures

The Playwright suite runs against saved copies of medbud.wiki pages, never the live site. These files are **not committed**: they are MedBud's own content, and this repo is intended to become public.

## Files expected

```
tests/fixtures/pages/home.html            https://medbud.wiki/
tests/fixtures/pages/strains.html         https://medbud.wiki/strains/
tests/fixtures/pages/strain-detail.html   https://medbud.wiki/strains/4c-labs/sck-s-smalls-t25-strawberry-glue/
tests/fixtures/pages/clinics.html         https://medbud.wiki/clinics/
tests/fixtures/pages/clinic-detail.html   https://medbud.wiki/clinics/dispensed/
tests/fixtures/pages/pharmacy.html        https://medbud.wiki/pharmacies/ips-pharma/
tests/fixtures/pages/guide.html           https://medbud.wiki/guides/patients-joining/eligibility-conditions/
tests/fixtures/assets/site.css            https://files.medbud.wiki/css/?v=...
tests/fixtures/assets/site.js             https://files.medbud.wiki/javascript/?v=...
tests/fixtures/assets/jquery.js           https://files.medbud.wiki/javascript/jquery/
```

The pages are the raw HTML the server sent (the original `width=1440` viewport and the site's `scaleBodyToFit()` script intact), captured on 2026-10-29. Tests that need them skip with a message when any file is missing.

## Re-capturing

medbud.wiki shows a Cloudflare human check to automated browsers and blocks scripted requests. Do not try to get around it. Capture from your own browser instead:

1. In your normal Chrome, enable remote debugging at `chrome://inspect/#remote-debugging`. This project has a local `chrome-devtools` MCP server configured with `--autoConnect`, which attaches to that Chrome.
2. Load each page above normally. If the Cloudflare check appears, tick it yourself.
3. With the page loaded, read the HTML the browser already has in its cache (no new request is sent) and save it as the file above:
   ```js
   await (await fetch(location.href, { cache: 'only-if-cached', mode: 'same-origin' })).text()
   ```
4. Save the stylesheet and the two scripts from the Network panel responses (the `files.medbud.wiki/css/` and `files.medbud.wiki/javascript/` requests).
5. Check the files contain no session data (search for `PHPSESSID`, `cf_clearance`, your email).
