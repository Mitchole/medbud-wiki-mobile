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

  function onReady() {
    // The style may have landed in <html> before <head> existed; move it so it sits after the site's CSS.
    const style = document.getElementById('medbud-mobile-css');
    if (style && document.head && style.parentNode !== document.head) document.head.appendChild(style);
    wrapWideTables(document);
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
