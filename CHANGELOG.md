# Changelog

All notable changes to MedBud Mobile (unofficial). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- A step-by-step install guide (`site/index.html`) that detects your phone and browser, with a check that it worked, published to GitHub Pages with the userscript once the repository is public.

### Changed
- The logo and a standard three-line menu button sit in a bar that stays at the top while scrolling; the button turns into a close (X) while the menu is open.
- The top links (Login, Register, Public Charter, Advertising, Volunteers, Contact) move to the foot of the menu, wrapped to fit, instead of a sideways-scrolling row.

### Fixed
- The Planner panel ran off the left of the screen; it now opens full width under the Planner row.

## [0.1.0] - 2026-10-29

First release.

### Added
- Phone-sized screens get a real mobile viewport instead of the shrunk 1440px desktop page. Tablets and desktops are left exactly as they are.
- Fluid layout: fixed 1400px containers, the 1420px minimum width and the float columns all stack to fit the phone.
- Strains, cartridges, oils, extracts, discounts, clinics, pharmacy menus, the pharmacies directory, producers and breeders shown as cards: name first, one line of key facts, the comparison number strongest, and everything else behind a Details button.
- Compact header (logo, search, planner and nav), a full-screen menu with a close button, and tab strips as one scrollable row.
- Formulary as full-width product rows with its filters folded behind a Filters button.
- Prices still to be confirmed show "TBC" instead of £0.00.
- Labelled figures ("THC 16% · CBD <1%"), labelled planner and PDF buttons, "Only at" for single-stockist pills, and labelled clinic details.
- 44px tap targets, 14px minimum body text, readable contrast for faded text, a back-to-top button on long pages.
- Fixes for the donate page, stats lists, the map size, guides (article first) and the home page's latest lists and video grid.

[0.1.0]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.0
