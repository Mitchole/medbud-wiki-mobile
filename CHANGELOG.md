# Changelog

All notable changes to MedBud Mobile (unofficial). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.4] - 2026-10-29

### Fixed
- Product pages: the Leafly cultivar box was a thin, tall column on the right; it now runs the full width.

## [0.1.3] - 2026-10-29

### Fixed
- Flower and other product pages: the gallery and the leaflet/certificate boxes no longer push the title and buttons into a narrow column; the title starts on its own line and the buttons run from the left.

## [0.1.2] - 2026-10-29

### Fixed
- Typing in the search box zoomed the page out to the desktop layout: the site's live results carry a desktop viewport and a second copy of its stylesheet, which are now stripped, and the results box fits under the search bar.
- Product pages: the picture no longer squeezes the title and buttons into a narrow right-hand column, and the "Other ... medications" lists are cards instead of tables cut off at the right.
- The iPhone install step now matches Safari on iOS 26: open Manage Extensions from the button left of the address bar and tap the word Userscripts to get its install prompt (confirmed on a real iPhone).

## [0.1.1] - 2026-10-29

### Added
- A step-by-step install guide (`site/index.html`) that detects your phone and browser, with a check that it worked, published to GitHub Pages with the userscript once the repository is public.

### Changed
- The logo and a standard three-line menu button sit in a bar that stays at the top while scrolling; the button turns into a close (X) while the menu is open.
- The top links (Login, Register, Public Charter, Advertising, Volunteers, Contact) move to the foot of the menu, wrapped to fit, instead of a sideways-scrolling row.

### Fixed
- The Planner panel ran off the left of the screen; it now opens full width under the Planner row.
- "Only at" was added to status and month pills (for example "Only at Cancelled"); it now goes only on single-stockist pharmacy names.
- Rows revealed by "Include Unavailable?" turned back into table rows instead of cards.
- In landscape, cells added for cards showed up as extra table columns.
- With two copies of the script running (two managers), controls were doubled and the menu would not open.
- Planner buttons always said "Add"; they now say "Added to Planner" for items already in it.
- Small tablets such as the iPad mini were treated as phones; they keep the desktop site.

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

[0.1.4]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.4
[0.1.3]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.3
[0.1.2]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.2
[0.1.1]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.1
[0.1.0]: https://github.com/Mitchole/medbud-wiki-mobile/releases/tag/v0.1.0
