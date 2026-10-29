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
  const VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';

  // Two managers, a reinstall, or the app plus a manager must not apply everything twice.
  if (window.__medbudMobileLoaded) return;
  window.__medbudMobileLoaded = true;

  /** Phone-sized device, judged by the short side so rotation does not change the answer. */
  function isPhone() {
    return Math.min(screen.width, screen.height) < 768;
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

@media (max-width: 767px) {
  /* Data tables as cards: name first, one meta line, the comparison number strongest, details on demand.
     Child combinators only: clinic cells contain whole nested tables that must stay tables. */
  ${C}, ${C} > tbody { display: block; width: 100% !important; border: 0; }
  ${C} > thead { display: none; }
  ${R} {
    display: grid; grid-template-columns: 52px minmax(0, 1fr) auto;
    column-gap: 14px; row-gap: 2px; padding: 14px 14px 0; margin: 0 0 10px;
    border-radius: .5rem; height: auto !important; background: rgba(255, 255, 255, .035);
  }
  ${R} > td {
    display: block; padding: 0 !important; border: 0 !important; width: auto !important; height: auto !important;
    min-width: 0; text-align: left !important; background: none !important;
  }
  ${R}:is(:hover, :active) > td { background: none !important; }
  ${R} > td:empty:not([data-mbm-role=toggle]) { display: none; }

  /* Strains list and pharmacy menu share one layout; pharmacy rows simply have no meta line. */
  ${S} table.mbm-cards:is(.product, .pharmacy-list) > tbody > tr {
    grid-template-areas: "thumb name name" "thumb meta meta" "price price stock" "toggle toggle toggle";
  }
  ${S} table.mbm-cards:is(.product, .pharmacy-list) > tbody > tr.mbm-open {
    grid-template-areas: "thumb name name" "thumb meta meta" "price price stock" "gen gen gen" "terps terps terps" "actions actions actions" "toggle toggle toggle";
  }
  ${S} table.mbm-cards.pharmacy-list > tbody > tr { padding-bottom: 14px; }

  /* Clinics: name with the first-year minimum beside it, access and consultations below. */
  ${S} table#clinics.mbm-cards > tbody > tr {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "name price" "meta meta" "meta2 meta2" "toggle toggle";
  }
  ${S} table#clinics.mbm-cards > tbody > tr.mbm-open {
    grid-template-areas: "name price" "meta meta" "meta2 meta2" "price2 price2" "pricing pricing" "pharmacy pharmacy" "contact contact" "ratings ratings" "toggle toggle";
  }

  ${R} > td[data-mbm-role=thumb] { grid-area: thumb; align-self: start; }
  ${R} > td[data-mbm-role=thumb] img { width: 52px !important; height: 52px !important; object-fit: contain; border-radius: .33rem; }
  ${R} > td:is([data-mbm-role=thumb2], [data-mbm-role=altprice], [data-mbm-role=packs]) { display: none; }
  ${R} > td[data-mbm-role=name] { grid-area: name; line-height: 1.3; }
  ${R} > td[data-mbm-role=name] > a:first-child { display: block; font-size: 1.0625rem; font-weight: 600; max-width: none !important; padding: 2px 0; }
  ${R} > td[data-mbm-role=name] small { opacity: .75; }
  ${R} > td[data-mbm-role=name] a { width: auto !important; max-width: 100% !important; white-space: normal !important; }
  ${R} > td[data-mbm-role=meta] { grid-area: meta; margin-top: 2px; }
  ${R} > td[data-mbm-role=meta2] { grid-area: meta2; margin-top: 2px; }
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

  ${R} > td:is([data-mbm-role=genetics], [data-mbm-role=terps], [data-mbm-role=actions], [data-mbm-role=contact], [data-mbm-role=pharmacy], [data-mbm-role=pricing], [data-mbm-role=price2], [data-mbm-role=ratings]) { display: none; }
  ${O} > td[data-mbm-role=genetics] { display: block; grid-area: gen; margin-top: 14px; padding-top: 14px !important; border-top: 1px solid rgba(255, 255, 255, .08) !important; }
  ${O} > td[data-mbm-role=terps] { display: block; grid-area: terps; margin-top: 10px; }
  ${O} > td[data-mbm-role=actions] { display: flex; grid-area: actions; gap: 8px; margin-top: 10px; }
  ${O} > td:is([data-mbm-role=contact], [data-mbm-role=pharmacy], [data-mbm-role=pricing], [data-mbm-role=price2], [data-mbm-role=ratings]) { display: block; margin-top: 12px; }
  ${O} > td[data-mbm-role=price2] { grid-area: price2; font-weight: 700; }
  ${O} > td[data-mbm-role=pricing] { grid-area: pricing; }
  ${O} > td[data-mbm-role=pharmacy] { grid-area: pharmacy; }
  ${O} > td[data-mbm-role=contact] { grid-area: contact; overflow-wrap: anywhere; }
  ${O} > td[data-mbm-role=ratings] { grid-area: ratings; }
  ${R} > td[data-mbm-role=actions] br { display: none; }
  ${R} > td[data-mbm-role=toggle] { display: block; grid-area: toggle; margin: 8px -14px 0; }
  ${R} > td > button.mbm-more {
    all: unset; box-sizing: border-box; width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: .875rem; color: inherit; opacity: .85; border-top: 1px solid rgba(255, 255, 255, .08); cursor: pointer;
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

  /** Put every table that is not shown as cards in its own sideways-scrolling box. */
  function wrapWideTables(scope) {
    scope.querySelectorAll('table').forEach((table) => {
      if (table.classList.contains('mbm-cards')) return;
      if (table.parentElement && table.parentElement.classList.contains('mbm-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'mbm-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  // ---- Cards -------------------------------------------------------------

  /** Roles whose cells only show once a card's Details are open. A row with any of them gets a toggle. */
  const DETAIL_ROLES = ['genetics', 'terps', 'actions', 'contact', 'pharmacy', 'pricing', 'price2', 'ratings'];

  /** Strains list rows (table.product): positional cells plus the site's own price/terps classes. */
  function STRAIN_ROLES(tr) {
    const cells = [...tr.children];
    const tag = (td, role) => { if (td) td.dataset.mbmRole = role; };
    tag(cells[0], 'thumb');
    tag(cells[1], 'thumb2');
    tag(cells[2], 'name');
    tag(cells[3], 'meta');
    tag(cells[4], 'genetics');
    cells.forEach((td) => {
      if (td.classList.contains('terps')) tag(td, 'terps');
      else if (td.classList.contains('priceGram')) tag(td, 'ppg');
      else if (td.classList.contains('priceBreakdown')) tag(td, 'packs');
      else if (/price/i.test(td.className)) tag(td, 'altprice');
      else if (td.querySelector('.availability')) tag(td, 'stock');
      else if (td.querySelector('button.calcStrain, button.pdfStrain')) tag(td, 'actions');
    });
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
  }

  // Clinics table cells by header text (spaces removed, lower case). The last, unlabelled column holds the
  // CQC ratings, not actions; the pricing cell contains a nested table of fees.
  const CLINIC_HEADERS = {
    prescribingclinic: 'name',
    'contact/companydetails': 'contact',
    defaultpharmacy: 'pharmacy',
    pharmacyaccess: 'meta',
    recurringconsultations: 'meta2',
    clinicservicepricing: 'pricing',
    'min.firstyear': 'price',
    'min.yearlong-term': 'price2',
    '': 'ratings',
  };

  function CLINIC_ROLES(tr) {
    const table = tr.closest('table');
    const roles = [];
    table.querySelectorAll(':scope > thead th').forEach((th) => {
      const key = th.textContent.replace(/\s+/g, '').toLowerCase();
      for (let i = 0; i < (th.colSpan || 1); i++) roles.push(CLINIC_HEADERS[key]);
    });
    let column = 0;
    [...tr.children].forEach((td) => {
      if (roles[column]) td.dataset.mbmRole = roles[column];
      column += td.colSpan || 1;
    });
  }

  const CARD_TABLES = [
    { selector: 'table.product', roles: STRAIN_ROLES },
    { selector: 'table.pharmacy-list', roles: PHARMACY_ROLES },
    { selector: 'table#clinics', roles: CLINIC_ROLES },
  ];
  const cardQuery = matchMedia('(max-width: 767px)');

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
      const hasDetails = [...tr.children].some((td) => DETAIL_ROLES.includes(td.dataset.mbmRole) && td.textContent.trim() + td.innerHTML.trim());
      if (hasDetails) addToggle(tr);
    });
  }

  /** Rows the site adds later (sorting, filtering, loading more) become cards too. */
  function observeTable(table, roles) {
    const observer = new MutationObserver(() => cardify(table, roles));
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

  /** Cards in portrait-width screens, sideways-scrolling tables otherwise; re-run on rotation. */
  function setupCards() {
    CARD_TABLES.forEach(({ selector, roles }) => {
      document.querySelectorAll(selector).forEach((table) => {
        if (!table.dataset.mbmBound) {
          table.dataset.mbmBound = '1';
          cardify(table, roles);
          observeTable(table, roles);
          bindToggles(table);
        }
        const wrap = table.parentElement;
        if (cardQuery.matches) {
          table.classList.add('mbm-cards');
          if (wrap && wrap.classList.contains('mbm-scroll')) wrap.replaceWith(table);
        } else {
          table.classList.remove('mbm-cards');
          wrapWideTables(table.parentNode);
        }
      });
    });
  }

  function onReady() {
    // The style may have landed in <html> before <head> existed; move it so it sits after the site's CSS.
    const style = document.getElementById('medbud-mobile-css');
    if (style && document.head && style.parentNode !== document.head) document.head.appendChild(style);
    setupCards();
    wrapWideTables(document);
    cardQuery.addEventListener('change', setupCards);
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
