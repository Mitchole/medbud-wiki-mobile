// ==UserScript==
// @name         MedBud Mobile (unofficial)
// @namespace    https://github.com/Mitchole/medbud-wiki-mobile
// @version      0.1.0
// @description  Makes medbud.wiki usable on phones. Unofficial; not affiliated with MedBud.
// @match        https://medbud.wiki/*
// @match        https://mitchole.github.io/medbud-wiki-mobile/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://mitchole.github.io/medbud-wiki-mobile/medbud-mobile.meta.js
// @downloadURL  https://mitchole.github.io/medbud-wiki-mobile/medbud-mobile.user.js
// ==/UserScript==

(function () {
  'use strict';

  const VERSION = '0.1.0';
  const VIEWPORT = 'width=device-width, initial-scale=1';

  // Two managers, a reinstall, or the app plus a manager must not apply everything twice.
  if (window.__medbudMobileLoaded) return;
  window.__medbudMobileLoaded = true;

  /** Phone-sized device, judged by screen size so rotation does not change the answer. Tablets keep the desktop site. */
  function isPhone() {
    return Math.min(screen.width, screen.height) < 768 && Math.max(screen.width, screen.height) < 1024;
  }

  /** At document-start the <html> element may not exist yet; run once it does. */
  function whenRoot(callback) {
    if (document.documentElement) return callback(document.documentElement);
    const observer = new MutationObserver(() => {
      if (!document.documentElement) return;
      observer.disconnect();
      callback(document.documentElement);
    });
    observer.observe(document, { childList: true });
  }

  // On the install guide the script only announces itself.
  if (location.hostname === 'mitchole.github.io') {
    whenRoot((root) => { root.dataset.medbudMobile = VERSION; });
    return;
  }

  // Tablets and desktops keep the site exactly as it is.
  if (!isPhone()) return;

  /** Replace the site's fixed width=1440 viewport as soon as the tag is parsed. */
  function fixViewport() {
    const apply = () => {
      const meta = document.querySelector('meta[name=viewport]');
      if (meta && meta.content !== VIEWPORT) meta.content = VIEWPORT;
      return Boolean(meta);
    };
    if (apply()) return;
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', () => {
      observer.disconnect();
      if (!apply()) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = VIEWPORT;
        document.head.appendChild(meta);
      }
    });
  }

  const S = 'html[data-medbud-mobile]';
  const C = `${S} table.mbm-cards`;
  const R = `${C} > tbody > tr`;
  const O = `${C} > tbody > tr.mbm-open`;

  const CSS = `
@media (max-width: 1023px) {
  ${S}, ${S} body { min-width: 0 !important; width: auto !important; }
  ${S} body { transform: none !important; }
  ${S} :is(header, main, footer, .wrapper) {
    width: auto !important; max-width: 100% !important; box-sizing: border-box;
    margin-left: 8px !important; margin-right: 8px !important;
  }
  ${S} :is(.half, .quad, .tri, .tri-1, .tri-2, .tri-one, .tri-two, .tri-double, .quad-one, .quad-three, .double, .home-left, .home-right, .sidebar) {
    float: none !important; width: auto !important; max-width: 100% !important;
    margin-left: 0 !important; margin-right: 0 !important;
  }
  ${S} figure.banner, ${S} figure.banner :is(img, video) { width: 100% !important; height: auto !important; }
  ${S} form#search { display: block !important; width: auto !important; margin: 8px 0 !important; line-height: normal !important; }
  ${S} form#search input[type=search] { width: calc(100% - 59px) !important; box-sizing: border-box; font-size: 16px !important; }
  ${S} #js-search { width: auto !important; }
  ${S} #calculator, ${S} #calculatorResults { width: 100% !important; box-sizing: border-box; }
  ${S} :is(img, video, iframe) { max-width: 100%; }
  ${S} :is(.bx-wrapper, .bx-viewport) { max-width: 100% !important; }
  ${S} aside.charter ul { display: grid !important; grid-template-columns: 1fr 1fr; gap: 12px; }
  ${S} aside.charter li { float: none !important; width: auto !important; margin: 0 !important; }

  /* Header: logo and the dark-mode switch on one row, then search, planner and the nav bar (was ~555px). */
  ${S} header {
    display: grid !important; grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "logo switch" "search search" "planner planner" "nav nav"; align-items: center; column-gap: 8px;
  }
  ${S} header > a#logo { grid-area: logo; }
  ${S} header > a#logo img { max-height: 40px; width: auto !important; margin-top: 0 !important; }
  ${S} header > form#search { grid-area: search; margin: 2px 0 !important; }
  ${S} header > #calculator { grid-area: planner; }
  ${S} header > #switchHolder { grid-area: switch; float: none !important; }
  ${S} header > nav { grid-area: nav; margin-top: 4px !important; }
  ${S} header > :is(#js-search, #calculatorResults) { grid-column: 1 / -1; }
  ${S} div.wrapper.top-links {
    display: flex; flex-wrap: nowrap; gap: 0 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;
    white-space: nowrap; text-align: left; scrollbar-width: none;
  }

  /* Tab strips (regions, statuses): one sideways-scrolling row instead of wrapped, overlapping labels. */
  ${S} div.tabs { display: flex !important; flex-wrap: nowrap; gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  ${S} div.tabs > a { flex: 0 0 auto; white-space: nowrap; min-height: 44px; display: inline-flex !important; align-items: center; box-sizing: border-box; }

  /* Menu: the site's "more" panel opens on hover only; on phones a real button opens it as a full-screen sheet. */
  ${S} .menuEllipsis__drop-toggle { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  ${S}:not(.mbm-menu-open) header nav .menuEllipsis__more { display: none !important; }
  ${S}.mbm-menu-open header nav .menuEllipsis__more {
    display: block !important; position: fixed !important; top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important;
    width: auto !important; max-height: none !important; z-index: 2147483000; overflow-y: auto; overscroll-behavior: contain;
    background: #333; padding: 64px 8px 24px !important; box-sizing: border-box;
  }
  ${S}.mbm-menu-open body { overflow: hidden; }
  ${S}.mbm-menu-open .mbm-menu-close { display: flex; }

  /* The nav's "more" panel hangs off a 44px button with right:0, so it ran off the left edge.
     Anchor it to the full-width nav bar and keep submenus inside it instead of flying out sideways. */
  ${S} header nav { position: relative; }
  ${S} header nav .menuEllipsis__dropdown { position: static !important; }
  ${S} header nav .menuEllipsis__more {
    left: 0 !important; right: 0 !important; width: auto !important; box-sizing: border-box;
    max-height: 75vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
  }
  ${S} header nav .menuEllipsis__more ul { width: auto !important; }
  ${S} header nav .menuEllipsis__more ul ul { position: static !important; }
  ${S} header nav .menuEllipsis__more a { gap: 8px; }


  /* Stats: seven 109px floated columns become full-width lists with each count on its label's line. */
  ${S} article.quad-three div.block { float: none !important; width: auto !important; margin: 0 0 16px !important; }
  ${S} article.quad-three div.block li { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  ${S} article.quad-three div.block li > span { float: none !important; flex: 0 0 auto; }

  /* Map: 800px tall and grabbing every swipe; now 60% of the screen and vertical swipes scroll the page. */
  ${S} #map { height: 60vh !important; touch-action: pan-y pinch-zoom !important; }
  ${S} .leaflet-control-zoom a { width: 44px !important; height: 44px !important; line-height: 44px !important; }

  /* Guides: the article first, the 27-link guide list after it behind an "All guides" button. */
  ${S} main.wrapper:has(> aside.quad-one) { display: flex; flex-direction: column; }
  ${S} main.wrapper > aside.quad-one { order: 3; width: auto !important; }
  ${S} main.wrapper > .mbm-fold-toggle { order: 2; }
  ${S} main.wrapper:not(.mbm-guides-open) > aside.quad-one { display: none !important; }
  ${S} nav.share-widget-custom { float: none !important; display: flex !important; flex-wrap: wrap; gap: 6px; width: auto !important; margin: 8px 0 !important; }
  ${S} nav.share-widget-custom a { display: inline-flex !important; align-items: center; min-height: 44px; box-sizing: border-box; }

  /* Home: the "latest" tables become two-line lists; feature cards full width; video reviews two to a row. */
  ${S} .mbm-scroll:has(> table.latest) { overflow: visible; }
  ${S} table.latest, ${S} table.latest > tbody { display: block; width: 100% !important; }
  ${S} table.latest > tbody > tr {
    display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; column-gap: 10px; row-gap: 2px;
    padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, .08);
  }
  ${S} table.latest > tbody > tr > td {
    display: block; padding: 0 !important; border: 0 !important; width: auto !important; min-width: 0;
    white-space: normal !important; text-align: left !important; overflow-wrap: anywhere;
  }
  ${S} table.latest img { width: 40px !important; height: auto !important; max-height: 40px; object-fit: contain; }
  ${S} table#edits > tbody > tr > td:nth-child(1) { grid-column: 1; grid-row: 1 / span 2; }
  ${S} table#edits > tbody > tr > td:nth-child(2) { grid-column: 2; grid-row: 1; font-weight: 600; }
  ${S} table#edits > tbody > tr > td:nth-child(3) { grid-column: 2 / -1; grid-row: 2; }
  ${S} table#edits > tbody > tr > td:nth-child(4) { grid-column: 3; grid-row: 1; text-align: right !important; }
  ${S} table#new > tbody > tr > td:nth-child(2) { grid-column: 1; grid-row: 1 / span 4; }
  ${S} table#new > tbody > tr > td:nth-child(1) { grid-column: 2; grid-row: 1; }
  ${S} table#new > tbody > tr > td:nth-child(6) { grid-column: 3; grid-row: 1; text-align: right !important; }
  ${S} table#new > tbody > tr > td:nth-child(3) { grid-column: 2 / -1; grid-row: 2; font-weight: 600; }
  ${S} table#new > tbody > tr > td:nth-child(4) { grid-column: 2 / -1; grid-row: 3; }
  ${S} table#new > tbody > tr > td:nth-child(5) { grid-column: 2 / -1; grid-row: 4; }
  ${S} section.tri.home-feature { display: block !important; width: auto !important; margin: 0 0 12px !important; }
  ${S} #video-reviews { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  ${S} #video-reviews > :not(section.video-review) { grid-column: 1 / -1; }
  ${S} section.video-review { float: none !important; max-width: none !important; width: auto !important; margin: 0 !important; }
  ${S} section.video-review img { width: 100% !important; height: auto !important; }
  ${S} section.video-review lite-youtube { width: 100% !important; max-width: 100% !important; }


  /* Polish: faded text back to readable contrast, dead "Show Filters" hidden, footer links tappable. */
  ${S} :is(.quiet, small) { opacity: 1 !important; }
  ${S} body.device-mode-dark :is(.quiet, small.quiet) { color: #a8a8a8 !important; }
  ${S} a.toggleFilter { display: none !important; }
  ${S} footer a { display: inline-flex !important; align-items: center; justify-content: center; min-height: 44px; min-width: 44px; box-sizing: border-box; }
  ${S} figure.banner figcaption { position: static !important; }

  /* Donate: the site sizes the text column as calc(100% - 426px) beside a 425px form, which is 0px on a phone. */
  ${S} main > iframe { float: none !important; width: 100% !important; margin: 0 0 16px !important; }
  ${S} main > section[style*="426px"] { float: none !important; width: auto !important; }

  /* Formulary: drop the desktop filter sidebar behind a Filters button and make each product a full-width row. */
  ${S} .mbm-filters-toggle {
    all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; min-height: 44px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, .2); border-radius: .33rem;
    font-size: .9375rem; font-weight: 600; cursor: pointer;
  }
  ${S} .mbm-filters-toggle:focus-visible { outline: 2px solid #b5e853; outline-offset: 2px; }
  ${S} #mb-grid .mb-controls { float: none !important; width: auto !important; max-width: none !important; }
  ${S} #mb-grid .mb-controls input[type=range] { height: 44px !important; }
  ${S} #mb-grid:not(.mbm-filters-open) .mb-controls { display: none !important; }
  ${S} #mb-grid .mb-rows { float: none !important; width: auto !important; margin: 0 !important; }
  ${S} #mb-grid .mb-row:not(.mb-head):not(.mb-hidden) {
    float: none !important; width: auto !important; height: auto !important; display: grid !important;
    grid-template-columns: 72px minmax(0, 1fr); grid-template-areas: "img title" "img avail" "img price" "cap cap";
    column-gap: 14px; row-gap: 6px; padding: 14px !important; margin: 0 0 10px !important; box-sizing: border-box;
  }
  ${S} #mb-grid .mb-row .mb-card-image-holder { display: contents; }
  ${S} #mb-grid .mb-row .mb-card-image-link { grid-area: img; width: 72px !important; height: auto !important; }
  ${S} #mb-grid .mb-row .mb-card-image-link img { width: 72px !important; height: 72px !important; object-fit: contain; }
  ${S} #mb-grid .mb-row figcaption {
    grid-area: cap; position: static !important; width: auto !important; height: auto !important;
    font-size: 12px !important; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px;
  }
  ${S} #mb-grid .mb-row .mb-card-title { grid-area: title; width: auto !important; }
  ${S} #mb-grid .mb-row .availability { grid-area: avail; float: none !important; justify-self: start; width: auto !important; }
  ${S} #mb-grid .mb-row .mb-card-price { grid-area: price; width: auto !important; height: auto !important; }
  ${S} main :is(p, li, dd) { overflow-wrap: anywhere; }
  ${S} aside.company p { display: flex; flex-wrap: wrap; gap: 8px; }
  ${S} a.button { white-space: normal !important; width: auto !important; max-width: 100%; min-width: 0; box-sizing: border-box; overflow-wrap: anywhere; }
  ${S} a.button span { white-space: normal !important; }
  ${S} main p a { white-space: normal !important; }
  ${S} .mbm-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }

  /* Readable text: body copy at least 14px, nothing under 12px. Links, abbr and .quiet inside small inherit. */
  ${S} main :is(p, li, td) { font-size: max(14px, 1em) !important; }
  ${S} small { font-size: max(12px, 0.85em) !important; }
}

${S} td[data-mbm-role=toggle] { display: none; }
${S} td:is([data-mbm-role=notes], [data-mbm-role=count]) { display: none; }

${S} .mbm-top {
  all: unset; box-sizing: border-box; position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 2147482000;
  width: 48px; height: 48px; display: none; align-items: center; justify-content: center; border-radius: 50%;
  background: #333; color: #fff; box-shadow: 0 4px 12px rgba(0, 0, 0, .35); cursor: pointer;
}
${S} .mbm-top.mbm-show { display: flex; }
${S}.mbm-menu-open .mbm-top { display: none; }
${S} .mbm-top:focus-visible { outline: 2px solid #b5e853; outline-offset: 2px; }

${S} .mbm-fold-toggle {
  all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 44px; margin: 8px 0; border: 1px solid rgba(255, 255, 255, .2); border-radius: .33rem;
  font-size: .9375rem; font-weight: 600; cursor: pointer;
}
${S} .mbm-fold-toggle:focus-visible { outline: 2px solid #b5e853; outline-offset: 2px; }

${S} .mbm-menu-close {
  all: unset; box-sizing: border-box; display: none; position: fixed; top: 8px; right: 8px; z-index: 2147483001;
  width: 48px; height: 48px; align-items: center; justify-content: center; border-radius: 50%;
  background: rgba(255, 255, 255, .12); color: #fff; font-size: 1.25rem; cursor: pointer;
}
${S} .mbm-menu-close:focus-visible { outline: 2px solid #b5e853; outline-offset: 2px; }

@media (max-width: 767px) {
  /* Data tables as cards: name first, one meta line, the comparison number strongest, details on demand.
     Child combinators only: clinic cells contain whole nested tables that must stay tables. */
  ${S} .mbm-scroll:has(> table.mbm-cards) { overflow: visible; }
  ${C}, ${C} > tbody { display: block; width: 100% !important; border: 0; }
  ${C} > thead { display: none; }
  ${R} {
    display: grid !important; grid-template-columns: 52px minmax(0, 1fr) auto;
    column-gap: 14px; row-gap: 2px; padding: 14px 14px 0; margin: 0 0 10px;
    border-radius: .5rem; height: auto !important; background: rgba(255, 255, 255, .035);
  }
  ${R} > td {
    display: block; padding: 0 !important; border: 0 !important; width: auto !important; height: auto !important;
    min-width: 0; text-align: left !important; background: none !important;
  }
  ${R}:is(:hover, :active) > td { background: none !important; }
  ${R} > td:empty:not([data-mbm-role=toggle]) { display: none; }
  ${R}:is(.mbm-merged, :empty, [style*="display: none"], [style*="display:none"]) { display: none !important; }

  /* Strains list and pharmacy menu share one layout; pharmacy rows simply have no meta line. */
  ${S} table.mbm-cards:is(.product, .pharmacy-list) > tbody > tr {
    grid-template-areas: "thumb name name" "thumb meta meta" "price price stock" "toggle toggle toggle";
  }
  ${S} table.mbm-cards:is(.product, .pharmacy-list) > tbody > tr.mbm-open {
    grid-template-areas: "thumb name name" "thumb meta meta" "price price stock" "gen gen gen" "terps terps terps" "actions actions actions" "toggle toggle toggle";
  }
  /* Cards without a Details toggle need their own bottom padding; with one, the toggle bar closes the card. */
  ${S} table.mbm-cards.pharmacy-list > tbody > tr:not(:has(> td[data-mbm-role=toggle])) { padding-bottom: 14px; }
  /* Pharmacy price cell: pack price then rating, as sibling spans (unlike the strains list). */
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=ppg] { display: flex !important; flex-wrap: wrap; align-items: baseline; column-gap: 12px; row-gap: 4px; }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=ppg] > span { display: inline !important; font-size: .875rem; font-weight: 400; }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=ppg] > span:first-child { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=ppg] > span:first-child small { font-weight: 400; opacity: .7; margin-left: 6px; }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=ppg] > span > span { font-size: inherit; font-weight: inherit; }
  /* The site's display face draws '<' as an arrow, so 'CBD <1%' read as 'CBD (arrow)1%'. */
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=name] a.title { font-family: "Open Sans", "Helvetica Neue", Helvetica, sans-serif !important; }

  /* Clinics: name with the first-year minimum beside it, access and consultations below. */
  ${S} table#clinics.mbm-cards > tbody > tr {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "name price" "meta meta" "meta2 meta2" "toggle toggle";
  }
  ${S} table#clinics.mbm-cards > tbody > tr.mbm-open {
    grid-template-areas: "name price" "meta meta" "meta2 meta2" "price2 price2" "pricing pricing" "notes notes" "pharmacy pharmacy" "contact contact" "ratings ratings" "toggle toggle";
  }

  /* Pharmacies directory: name, formulary count and delivery up front; contact, brands and notes in Details. */
  ${S} table#pharmacies.mbm-cards > tbody > tr {
    grid-template-columns: minmax(0, 1fr); grid-template-areas: "name" "meta" "meta2" "toggle";
  }
  ${S} table#pharmacies.mbm-cards > tbody > tr.mbm-open {
    grid-template-areas: "name" "meta" "meta2" "notes" "contact" "brands" "brands2" "ratings" "toggle";
  }

  /* Producers and breeders: logo, name and a count; the medications or cultivars themselves in Details. */
  ${S} table#producers.mbm-cards > tbody > tr {
    grid-template-areas: "thumb name name" "thumb count count" "toggle toggle toggle";
  }
  ${S} table#producers.mbm-cards > tbody > tr.mbm-open {
    grid-template-areas: "thumb name name" "thumb count count" "items items items" "contact contact contact" "toggle toggle toggle";
  }
  ${R} > td[data-mbm-role=count] { display: block; grid-area: count; font-size: .875rem; margin-top: 2px; }
  ${R} > td[data-mbm-role=items] a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  ${R} > td[data-mbm-role=items] img { max-height: 44px; width: auto !important; }
  ${R} > td:is([data-mbm-role=brands], [data-mbm-role=brands2]) img { max-height: 32px; width: auto !important; }

  /* Oils with a price still to be confirmed: the pack line ("30ml: TBC") stands in for "£0.00". */
  ${R}.mbm-tbc > td[data-mbm-role=ppg] { display: none; }
  ${R}.mbm-tbc > td[data-mbm-role=packs] { display: block; grid-area: price; margin-top: 14px; font-size: 1.125rem; font-weight: 700; }

  /* Discounts: pharmacy logo, medication, figures, then the discounted price strongest with the RRP beside it. */
  ${S} table.mbm-cards.pharmacy-list > tbody > tr:has(> td[data-mbm-role=rrp]) {
    grid-template-areas: "thumb name name" "thumb meta meta" "price price rrp" "meta2 meta2 meta2"; padding-bottom: 14px;
  }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=price] { justify-self: start; text-align: left !important; margin-top: 12px; }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr > td[data-mbm-role=price]::before { content: none; }
  ${R} > td[data-mbm-role=rrp] { grid-area: rrp; justify-self: end; align-self: end; text-align: right !important; font-size: .875rem; text-decoration: line-through; }
  ${R} > td[data-mbm-role=meta2] { white-space: normal; }

  ${R} > td[data-mbm-role=thumb] { grid-area: thumb; align-self: start; }
  ${R} > td[data-mbm-role=thumb] img { width: 52px !important; height: 52px !important; object-fit: contain; border-radius: .33rem; }
  ${R} > td:is([data-mbm-role=thumb2], [data-mbm-role=altprice], [data-mbm-role=packs]) { display: none; }
  ${R} > td[data-mbm-role=name] { grid-area: name; line-height: 1.3; }
  ${R} > td[data-mbm-role=name] > a:first-child { display: block; font-size: 1.0625rem; font-weight: 600; max-width: none !important; padding: 2px 0; }
  ${R} > td[data-mbm-role=name] small { opacity: .75; }
  ${R} > td[data-mbm-role=name] img:not(.country) { display: block; width: auto !important; height: auto !important; max-height: 32px; max-width: 160px; margin-top: 8px; }
  ${R} > td:is([data-mbm-role=meta], [data-mbm-role=meta2]) * { text-align: left !important; white-space: normal !important; overflow-wrap: anywhere; }
  ${R} > td[data-mbm-role=name] a { width: auto !important; max-width: 100% !important; white-space: normal !important; }
  ${R} > td[data-mbm-role=meta] { grid-area: meta; margin-top: 2px; }
  ${R} > td[data-mbm-role=meta2] { grid-area: meta2; margin-top: 2px; }
  ${R} > td[data-mbm-role=meta2] i { margin-right: 6px; }
  ${R} > td:is([data-mbm-role=meta], [data-mbm-role=meta2]) br { display: none; }
  ${R} > td[data-mbm-role=meta] > span { display: flex; flex-wrap: wrap; align-items: center; column-gap: 10px; row-gap: 2px; }
  ${R} > td[data-mbm-role=meta] .subspecies { font-weight: 600; }
  ${R} > td[data-mbm-role=ppg] { grid-area: price; margin-top: 14px; }
  ${R} > td[data-mbm-role=ppg] br { display: none; }
  ${R} > td[data-mbm-role=ppg] > span { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 10px; row-gap: 2px; }
  ${R} > td[data-mbm-role=ppg] > span > span { display: flex; align-items: baseline; gap: 8px; font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  ${R} > td[data-mbm-role=ppg] > span > span small { font-weight: 400; opacity: .7; }
  ${R} > td[data-mbm-role=stock] { grid-area: stock; margin-top: 14px; justify-self: end; align-self: center; text-align: right !important; }
  ${R} > td[data-mbm-role=stock] .quiet { display: block; margin-top: 4px; }
  ${R} > td[data-mbm-role=price] { grid-area: price; justify-self: end; text-align: right !important; font-size: 1.25rem !important; font-weight: 700; font-variant-numeric: tabular-nums; }
  ${R} > td:is([data-mbm-role=price], [data-mbm-role=price2])::before { display: block; font-size: .8125rem; font-weight: 400; opacity: .7; }
  ${R} > td[data-mbm-role=price]::before { content: "First year from"; }
  ${R} > td[data-mbm-role=price2]::before { content: "Each year after"; }

  ${R} > td:is([data-mbm-role=genetics], [data-mbm-role=terps], [data-mbm-role=actions], [data-mbm-role=contact], [data-mbm-role=pharmacy], [data-mbm-role=pricing], [data-mbm-role=price2], [data-mbm-role=ratings], [data-mbm-role=notes], [data-mbm-role=brands], [data-mbm-role=brands2], [data-mbm-role=items], [data-mbm-role=extra]) { display: none; }
  ${O} > td[data-mbm-role=genetics] { display: block; grid-area: gen; margin-top: 14px; padding-top: 14px !important; border-top: 1px solid rgba(255, 255, 255, .08) !important; }
  ${O} > td[data-mbm-role=terps] { display: block; grid-area: terps; margin-top: 10px; }
  ${O} > td[data-mbm-role=actions] { display: flex; grid-area: actions; gap: 8px; margin-top: 10px; }
  ${O} > td:is([data-mbm-role=contact], [data-mbm-role=pharmacy], [data-mbm-role=pricing], [data-mbm-role=price2], [data-mbm-role=ratings], [data-mbm-role=notes]) { display: block; margin-top: 12px; }
  ${O} > td[data-mbm-role=notes] { grid-area: notes; }
  ${O} > td:is([data-mbm-role=brands], [data-mbm-role=brands2]) { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
  ${O} > td[data-mbm-role=brands] { grid-area: brands; }
  ${O} > td[data-mbm-role=brands2] { grid-area: brands2; }
  ${O} > td[data-mbm-role=items] { display: flex; flex-wrap: wrap; gap: 8px; grid-area: items; margin-top: 12px; }
  ${O} > td[data-mbm-role=extra] { display: block; grid-column: 1 / -1; margin-top: 12px; }
  ${O} > td[data-mbm-role=notes] > div + div { margin-top: 6px; }
  ${O} > td[data-mbm-role=price2] { grid-area: price2; font-weight: 700; }
  ${O} > td[data-mbm-role=pricing] { grid-area: pricing; }
  ${O} > td[data-mbm-role=pharmacy] { grid-area: pharmacy; }
  ${O} > td[data-mbm-role=contact] { grid-area: contact; overflow-wrap: anywhere; }
  ${O} > td[data-mbm-role=ratings] { grid-area: ratings; }
  ${R} > td[data-mbm-role=actions] br { display: none; }

  /* Clarity: price per mg as strong as price per gram, labelled figures and actions, no empty ratings. */
  ${R} > td[data-mbm-role=ppg] > span:first-child:not(:has(span)) { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  ${R} .stars-full[title="No Ratings"] { display: none !important; }
  ${R} .availability.mbm-exclusive::before { content: "Only at "; }
  ${R} > td[data-mbm-role=actions] { flex-wrap: wrap; }
  ${R} > td[data-mbm-role=actions] button { display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; }
  ${R} > td[data-mbm-role=actions] .mbm-label { font-size: .875rem; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=meta] > * { margin-left: 0 !important; margin-right: 0 !important; }
  ${S} table#clinics.mbm-cards > tbody > tr > td:is([data-mbm-role=meta], [data-mbm-role=pharmacy], [data-mbm-role=contact], [data-mbm-role=notes], [data-mbm-role=ratings], [data-mbm-role=pricing])::before {
    display: block; margin-bottom: 4px; font-size: .8125rem; font-weight: 400; color: #a8a8a8; text-align: left;
  }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=meta]::before { content: "Pharmacy choice"; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=pharmacy]::before { content: "Default pharmacy"; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=contact]::before { content: "Contact"; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=notes]::before { content: "Notes"; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=ratings]::before { content: "CQC ratings"; }
  ${S} table#clinics.mbm-cards > tbody > tr > td[data-mbm-role=pricing]::before { content: "Fees"; }
  ${R} > td[data-mbm-role=toggle] { display: block; grid-area: toggle; margin: 8px -14px 0; }
  ${R} > td > button.mbm-more {
    all: unset; box-sizing: border-box; width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: .875rem; color: inherit; opacity: 1; border-top: 1px solid rgba(255, 255, 255, .08); cursor: pointer;
    -webkit-tap-highlight-color: rgba(255, 255, 255, .08);
  }
  ${R} > td > button.mbm-more:focus-visible { outline: 2px solid #b5e853; outline-offset: -2px; }
  ${O} > td > button.mbm-more i { transform: rotate(180deg); }
}

@media (max-width: 1023px) and (pointer: coarse) {
  /* 44px touch targets, grown with padding and alignment, not bigger type. */
  ${S} :is(.top-links a, nav.breadcrumbs a, table#clinics td a.button) {
    display: inline-flex !important; align-items: center; min-height: 44px; box-sizing: border-box;
  }
  ${S} header nav .menuEllipsis__elem > a { display: flex !important; align-items: center; min-height: 44px; box-sizing: border-box; }
  ${S} :is(form#search button, form#search input[type=search]) { min-height: 44px; }
  ${S} :is(button.calcStrain, button.pdfStrain) { min-width: 44px; min-height: 44px; }
}
`;

  /** Add the stylesheet once, as early as the document allows. */
  function injectStyles(root) {
    if (document.getElementById('medbud-mobile-css')) return;
    const style = document.createElement('style');
    style.id = 'medbud-mobile-css';
    style.textContent = CSS;
    (document.head || root).appendChild(style);
  }

  /** Put every table in its own sideways-scrolling box (card tables stop scrolling below 768px, in CSS). */
  function wrapWideTables(scope) {
    scope.querySelectorAll('table').forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains('mbm-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'mbm-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  // ---- Cards -------------------------------------------------------------

  /** Roles whose cells only show once a card's Details are open. A row with any of them gets a toggle. */
  const DETAIL_ROLES = ['genetics', 'terps', 'actions', 'contact', 'pharmacy', 'pricing', 'price2', 'ratings', 'notes', 'brands', 'brands2', 'items', 'extra'];

  /** "16% / <1%" never said which figure is which; make it "THC 16% · CBD <1%". */
  function labelCannabinoids(td) {
    if (!td) return;
    const sep = [...td.querySelectorAll('span.quiet')].find((q) => q.textContent.trim() === '/');
    if (!sep || sep.dataset.mbm) return;
    sep.dataset.mbm = '1';
    sep.textContent = ' · CBD ';
    sep.parentNode.insertBefore(document.createTextNode('THC '), sep.parentNode.firstChild);
  }

  /** The planner and PDF buttons were bare icons; give each a short visible label from its title. */
  function labelActions(td) {
    if (!td) return;
    td.querySelectorAll('button').forEach((button) => {
      if (button.querySelector('.mbm-label')) return;
      const title = button.getAttribute('title') || '';
      let text = title;
      if (button.classList.contains('calcStrain')) text = button.classList.contains('selected') ? 'Added to Planner' : 'Add to Planner';
      else if (/patient information leaflet/i.test(title)) text = 'Leaflet';
      else if (/certificate of analysis/i.test(title)) {
        const date = title.match(/\(([^)]+)\)\s*$/);
        text = date ? `Lab report (${date[1]})` : 'Lab report';
      }
      if (!text) return;
      const label = document.createElement('span');
      label.className = 'mbm-label';
      label.textContent = text;
      button.appendChild(label);
    });
  }

  // Stock pills sometimes hold a pharmacy name (the only stockist) rather than a stock level.
  const STOCK_WORDS = /^(available|in stock|expiring|low|medium|high|very high|out of stock|unavailable|discontinued|awaiting|limited|pre-?order|coming soon|changes|cancel|confirming|tbc|ordered|product recall|no importer|eta|see |last stock|not yet)/i;
  const MONTHS = /^(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

  function markExclusive(td) {
    const pill = td && td.querySelector('.availability');
    // Statuses, months and TBC use other classes (soon, discontinued, backorder); pharmacy names are low/limited.
    if (!pill || !pill.matches('.stock-low, .limited')) return;
    const text = pill.textContent.trim();
    if (text && !/\d/.test(text) && !STOCK_WORDS.test(text) && !MONTHS.test(text)) pill.classList.add('mbm-exclusive');
  }

  /** Each column's header text (spaces removed, lower case), expanded across colspans. */
  function headerLabels(table) {
    const labels = [];
    if (!table || !table.tHead) return labels;
    table.tHead.querySelectorAll('th').forEach((th) => {
      const key = th.textContent.replace(/\s+/g, '').toLowerCase();
      for (let i = 0; i < (th.colSpan || 1); i++) labels.push(key);
    });
    return labels;
  }

  /** Strains list rows (table.product): positional cells plus the site's own price/terps classes. */
  function STRAIN_ROLES(tr) {
    const cells = [...tr.children];
    const tag = (td, role) => { if (td) td.dataset.mbmRole = role; };
    tag(cells[0], 'thumb');
    tag(cells[1], 'thumb2');
    // Name, figures and strain info by column header: oils add a carrier-oil column, so positions differ by list.
    const labels = headerLabels(tr.closest('table'));
    let column = 0;
    cells.forEach((td) => {
      const key = labels[column] || '';
      if (key.startsWith('medicalproduct') || key === 'product') tag(td, 'name');
      else if (key.startsWith('thc')) tag(td, 'meta');
      else if (key.startsWith('generalstrain')) tag(td, 'genetics');
      column += td.colSpan || 1;
    });
    cells.forEach((td) => {
      if (td.classList.contains('terps')) tag(td, 'terps');
      else if (td.classList.contains('priceGram')) tag(td, 'ppg');
      else if (td.classList.contains('priceBreakdown')) tag(td, 'packs');
      else if (/price/i.test(td.className)) tag(td, 'altprice');
      else if (td.querySelector('.availability')) tag(td, 'stock');
      else if (td.querySelector('button.calcStrain, button.pdfStrain')) tag(td, 'actions');
    });
    labelCannabinoids(tr.querySelector(':scope > [data-mbm-role=meta]'));
    labelActions(tr.querySelector(':scope > [data-mbm-role=actions]'));
    markExclusive(tr.querySelector(':scope > [data-mbm-role=stock]'));
    markUnpriced(tr);
  }

  /** A price still to be confirmed comes through as "0.0p/mg £0.00/ml"; show the pack line ("30ml: TBC") instead. */
  function markUnpriced(tr) {
    const ppg = tr.querySelector(':scope > [data-mbm-role=ppg]');
    const packs = tr.querySelector(':scope > [data-mbm-role=packs]');
    if (ppg && packs && /TBC/i.test(packs.textContent) && !/[1-9]/.test(ppg.textContent)) tr.classList.add('mbm-tbc');
  }

  /** Pharmacy menu rows (table.pharmacy-list, no header row): the strains layout without meta, genetics or terps. */
  function PHARMACY_ROLES(tr) {
    if (!tr.classList.contains('product-row')) return;
    const cells = [...tr.children];
    const tag = (td, role) => { if (td) td.dataset.mbmRole = role; };
    tag(cells[0], 'thumb');
    tag(cells[1], 'thumb2');
    tag(cells[2], 'name');
    cells.forEach((td) => { if (td.classList.contains('priceGram')) tag(td, 'ppg'); });
    tag(cells[4], 'stock');
    tag(cells[5], 'actions');
    labelActions(cells[5]);
    markExclusive(cells[4]);
  }

  /** Map cells to roles by their column header text (spaces removed, lower case, matched by prefix). */
  function rolesByHeader(tr, headers) {
    const roles = [];
    tr.closest('table').querySelectorAll(':scope > thead th').forEach((th) => {
      const key = th.textContent.replace(/\s+/g, '').toLowerCase();
      const match = headers.find(([prefix]) => (prefix === '' ? key === '' : key.startsWith(prefix)));
      for (let i = 0; i < (th.colSpan || 1); i++) roles.push(match ? match[1] : undefined);
    });
    let column = 0;
    [...tr.children].forEach((td) => {
      if (roles[column]) td.dataset.mbmRole = roles[column];
      column += td.colSpan || 1;
    });
  }

  /**
   * Directory tables (clinics, pharmacies) give each entry a main row, an empty spacer row and a notes row
   * (star rating plus dated notes). The notes are copied into the entry's own card; in card view the extra
   * rows are hidden.
   */
  function mergeNotes(tr) {
    let next = tr.nextElementSibling;
    // Spacer rows hold only whitespace, which WebKit does not count as :empty, so tag them here.
    while (next && next.children.length === 0) {
      next.classList.add('mbm-merged');
      next = next.nextElementSibling;
    }
    if (next && next.classList.contains('notes')) {
      const notes = document.createElement('td');
      notes.dataset.mbmRole = 'notes';
      [...next.children].forEach((cell) => {
        const part = document.createElement('div');
        part.innerHTML = cell.innerHTML;
        notes.appendChild(part);
      });
      tr.appendChild(notes);
    }
  }

  function directoryRoles(headers) {
    return (tr) => {
      if (tr.classList.contains('notes')) {
        tr.classList.add('mbm-merged');
        return;
      }
      rolesByHeader(tr, headers);
      mergeNotes(tr);
    };
  }

  // Clinics: the last, unlabelled column holds CQC ratings, not actions; the pricing cell holds a nested fee table.
  const CLINIC_ROLES = directoryRoles([
    ['prescribingclinic', 'name'],
    ['contact', 'contact'],
    ['defaultpharmacy', 'pharmacy'],
    ['pharmacyaccess', 'meta'],
    ['recurringconsultations', 'meta2'],
    ['clinicservicepricing', 'pricing'],
    ['min.firstyear', 'price'],
    ['min.yearlong-term', 'price2'],
    ['', 'ratings'],
  ]);

  // Pharmacies directory (table#pharmacies, not the per-pharmacy menus in table.pharmacy-list).
  const PHARMACIES_ROLES = directoryRoles([
    ['dispensingpharmacy', 'name'],
    ['contact', 'contact'],
    ['formulary', 'meta'],
    ['affiliatedbrands', 'brands'],
    ['distributedbrands', 'brands2'],
    ['deliverycourier', 'meta2'],
    ['', 'ratings'],
  ]);

  /** Producers and breeders share table#producers; their last column lists medications or cultivars. */
  function PRODUCER_ROLES(tr) {
    rolesByHeader(tr, [['', 'thumb'], ['producer', 'name'], ['details', 'contact'], ['medications', 'items'], ['cultivars', 'items']]);
    const table = tr.closest('table');
    const noun = table.tHead && /cultivars/i.test(table.tHead.textContent) ? 'cultivar' : 'medication';
    const items = tr.querySelector(':scope > [data-mbm-role=items]');
    const n = items ? items.querySelectorAll('a').length : 0;
    const count = document.createElement('td');
    count.dataset.mbmRole = 'count';
    count.textContent = n ? `${n} ${noun}${n === 1 ? '' : 's'}` : `No ${noun}s listed`;
    tr.appendChild(count);
  }

  /** Discounts: same table class as the pharmacy menus, but its column names sit in the first body row. */
  const DISCOUNT_HEADERS = [['pharmacy', 'thumb'], ['brand', 'thumb2'], ['medication', 'name'], ['details', 'meta'], ['rrp', 'rrp'], ['price', 'price'], ['status', 'meta2']];

  function discountHeaderRow(table) {
    const first = table.querySelector(':scope > tbody > tr');
    if (!first) return null;
    const text = first.textContent.replace(/\s+/g, ' ').toLowerCase();
    return text.includes('medication') && text.includes('pharmacy') && text.includes('rrp') ? first : null;
  }

  function DISCOUNT_ROLES(tr) {
    const header = discountHeaderRow(tr.closest('table'));
    if (tr === header) {
      tr.classList.add('mbm-merged');
      return;
    }
    const keys = [...header.children].map((th) => th.textContent.replace(/\s+/g, '').toLowerCase());
    [...tr.children].forEach((td, i) => {
      const match = DISCOUNT_HEADERS.find(([prefix]) => keys[i] === prefix);
      if (match) td.dataset.mbmRole = match[1];
      else if (keys[i] === '' && i === 1) td.dataset.mbmRole = 'thumb2';
    });
    labelCannabinoids(tr.querySelector(':scope > [data-mbm-role=meta]'));
  }

  function PHARMACY_LIST_ROLES(tr) {
    if (discountHeaderRow(tr.closest('table'))) DISCOUNT_ROLES(tr);
    else PHARMACY_ROLES(tr);
  }

  const CARD_TABLES = [
    { selector: 'table.product', roles: STRAIN_ROLES },
    { selector: 'table.pharmacy-list', roles: PHARMACY_LIST_ROLES },
    { selector: 'table#clinics', roles: CLINIC_ROLES },
    { selector: 'table#pharmacies', roles: PHARMACIES_ROLES },
    { selector: 'table#producers', roles: PRODUCER_ROLES },
  ];

  function addToggle(tr) {
    const td = document.createElement('td');
    td.dataset.mbmRole = 'toggle';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mbm-more';
    button.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.textContent = 'Details';
    const icon = document.createElement('i');
    icon.className = 'fas fa-chevron-down';
    icon.setAttribute('aria-hidden', 'true');
    button.append(label, icon);
    td.appendChild(button);
    tr.appendChild(td);
  }

  /** Tag every not-yet-seen row's cells with their roles and give it a Details toggle when it has details. */
  function cardify(table, roles) {
    table.querySelectorAll(':scope > tbody > tr').forEach((tr) => {
      if (tr.dataset.mbm || tr.children.length < 2) return;
      tr.dataset.mbm = '1';
      roles(tr);
      if (tr.classList.contains('mbm-merged')) return;
      // Cells a role map does not know (a column the site added later, an extra column on one list)
      // go behind Details instead of leaking below the card.
      const cells = [...tr.children];
      if (cells.some((td) => td.dataset.mbmRole)) {
        cells.forEach((td) => { if (!td.dataset.mbmRole) td.dataset.mbmRole = 'extra'; });
      }
      const hasDetails = [...tr.children].some((td) => DETAIL_ROLES.includes(td.dataset.mbmRole) && td.textContent.trim() + td.innerHTML.trim());
      if (hasDetails) addToggle(tr);
    });
  }

  /**
   * Only a table whose rows matched its role map becomes cards. Discounts shares table.pharmacy-list with the
   * pharmacy menus but has a different row structure; without roles it stays a table in its scroll box.
   */
  function markCardTable(table) {
    if (table.querySelector(':scope > tbody > tr > [data-mbm-role]:not([data-mbm-role=toggle])')) table.classList.add('mbm-cards');
  }

  /** Rows the site adds later (sorting, filtering, loading more) become cards too. */
  function observeTable(table, roles) {
    const observer = new MutationObserver(() => {
      cardify(table, roles);
      markCardTable(table);
    });
    table.querySelectorAll(':scope > tbody').forEach((tbody) => observer.observe(tbody, { childList: true }));
  }

  /** One listener per table, so it keeps working when the site re-renders rows. */
  function bindToggles(table) {
    table.addEventListener('click', (event) => {
      const button = event.target.closest('button.mbm-more');
      if (!button || !table.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      const open = button.closest('tr').classList.toggle('mbm-open');
      button.setAttribute('aria-expanded', String(open));
      button.querySelector('span').textContent = open ? 'Hide details' : 'Details';
    });
  }

  /**
   * Mark the card tables and tag their cells. Whether they actually look like cards is decided by the
   * CSS media query alone: WebKit does not reliably report the viewport rewrite as a media change, so
   * any width check made here could be stale and never corrected.
   */
  function setupCards() {
    CARD_TABLES.forEach(({ selector, roles }) => {
      document.querySelectorAll(selector).forEach((table) => {
        if (!table.dataset.mbmBound) {
          table.dataset.mbmBound = '1';
          cardify(table, roles);
          observeTable(table, roles);
          bindToggles(table);
        }
        markCardTable(table);
      });
    });
  }

  /** Run once the first element matching the selector exists; the site builds some widgets after load. */
  function whenPresent(selector, callback) {
    const found = document.querySelector(selector);
    if (found) return callback(found);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (!el) return;
      observer.disconnect();
      callback(el);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Pages without the widget stop watching once everything has loaded.
    window.addEventListener('load', () => setTimeout(() => observer.disconnect(), 5000), { once: true });
  }

  /** Formulary: the 17 filter cards (about 7,000px on a phone) fold behind one button. */
  function addFiltersToggle() {
    const grid = document.getElementById('mb-grid');
    const controls = grid && grid.querySelector(':scope > .mb-controls');
    if (!controls || grid.querySelector(':scope > .mbm-filters-toggle')) return;
    if (!controls.id) controls.id = 'mbm-filters';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mbm-filters-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', controls.id);
    button.textContent = 'Filters';
    button.addEventListener('click', () => {
      const open = grid.classList.toggle('mbm-filters-open');
      button.setAttribute('aria-expanded', String(open));
    });
    grid.insertBefore(button, controls);
  }

  /** The site's "more" menu opens on hover only. Make its toggle a real button opening a full-screen sheet. */
  function setupMenu() {
    const root = document.documentElement;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mbm-menu-close';
    close.setAttribute('aria-label', 'Close menu');
    const icon = document.createElement('i');
    icon.className = 'fas fa-times';
    icon.setAttribute('aria-hidden', 'true');
    close.appendChild(icon);
    document.body.appendChild(close);

    const toggles = () => document.querySelectorAll('.menuEllipsis__drop-toggle');
    const label = (toggle) => {
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');
      toggle.setAttribute('aria-label', 'Menu');
      toggle.setAttribute('aria-expanded', String(root.classList.contains('mbm-menu-open')));
    };
    const set = (open) => {
      root.classList.toggle('mbm-menu-open', open);
      toggles().forEach(label);
      if (open) close.focus();
      else if (toggles()[0]) toggles()[0].focus();
    };
    toggles().forEach(label);
    // The site's menu plugin can rebuild its toggle on resize, so listen on the document.
    document.addEventListener('click', (event) => {
      if (event.target.closest('.menuEllipsis__drop-toggle')) {
        event.preventDefault();
        set(!root.classList.contains('mbm-menu-open'));
      } else if (event.target.closest('.mbm-menu-close')) {
        set(false);
      }
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('mbm-menu-open')) set(false);
      else if ((event.key === 'Enter' || event.key === ' ') && event.target.closest && event.target.closest('.menuEllipsis__drop-toggle')) {
        event.preventDefault();
        set(!root.classList.contains('mbm-menu-open'));
      }
    });
  }

  /** The six "trust" badges filled ~400px of every first screen; they move to just above the footer. */
  function moveCharter() {
    const charter = document.querySelector('aside.charter');
    const footer = document.querySelector('footer');
    if (charter && footer && !charter.dataset.mbmMoved) {
      charter.dataset.mbmMoved = '1';
      footer.parentNode.insertBefore(charter, footer);
    }
  }

  /** Guides: the long guide list moves after the article and folds behind an "All guides" button. */
  function addGuidesToggle(aside) {
    const main = aside.parentElement;
    if (!main || main.querySelector(':scope > .mbm-fold-toggle')) return;
    if (!aside.id) aside.id = 'mbm-guides';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mbm-fold-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', aside.id);
    button.textContent = 'All guides';
    button.addEventListener('click', () => {
      const open = main.classList.toggle('mbm-guides-open');
      button.setAttribute('aria-expanded', String(open));
    });
    main.insertBefore(button, aside);
  }

  /** Long lists (strains is ~1,400 cards) get a back-to-top button once the reader is two screens down. */
  function addBackToTop() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mbm-top';
    button.setAttribute('aria-label', 'Back to top');
    const icon = document.createElement('i');
    icon.className = 'fas fa-arrow-up';
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    document.body.appendChild(button);
    const update = () => button.classList.toggle('mbm-show', window.scrollY > window.innerHeight * 2);
    window.addEventListener('scroll', update, { passive: true });
    update();
    button.addEventListener('click', () => {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    });
  }

  /** Flags inside headings are decoration; screen readers read every one before the heading's words. */
  function silenceHeadingFlags() {
    document.querySelectorAll(':is(h1, h2, h3, h4, h5, h6) img[alt^="Flag of"]').forEach((img) => { img.alt = ''; });
  }

  function onReady() {
    // A second copy injected into a separate script world (two managers, or the app plus a manager) cannot see
    // window.__medbudMobileLoaded; the DOM is shared, so mark it there before adding any controls or listeners.
    if (document.documentElement.dataset.mbmReady) return;
    document.documentElement.dataset.mbmReady = '1';
    // The style may have landed in <html> before <head> existed; move it so it sits after the site's CSS.
    const style = document.getElementById('medbud-mobile-css');
    if (style && document.head && style.parentNode !== document.head) document.head.appendChild(style);
    setupCards();
    wrapWideTables(document);
    whenPresent('#mb-grid > .mb-controls', addFiltersToggle);
    whenPresent('.menuEllipsis__drop-toggle', setupMenu);
    moveCharter();
    addBackToTop();
    silenceHeadingFlags();
    const guides = document.querySelector('main.wrapper > aside.quad-one');
    if (guides) addGuidesToggle(guides);
  }

  fixViewport();
  whenRoot((root) => {
    root.dataset.medbudMobile = VERSION;
    injectStyles(root);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
