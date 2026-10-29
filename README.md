# MedBud Mobile (unofficial)

Makes [medbud.wiki](https://medbud.wiki) usable on a phone. Not affiliated with or endorsed by MedBud.

medbud.wiki is built for 1440px desktop screens, so on a phone it shows a shrunk page with tiny text and links. This userscript runs in your own browser and, on phone-sized screens only:

- lays the page out at your phone's width;
- turns the big tables (strains, cartridges, oils, clinics, pharmacies, producers and more) into cards with the key facts first and a Details button for the rest;
- compacts the header, gives the menu a proper full-screen view, and enlarges tap targets and small text.

It changes nothing on tablets or desktops, sends nothing anywhere, and keeps MedBud's own content, colours and adverts.

## Install

An install guide (one step at a time, for iPhone and Android) is on the way. Until then:

- **Android:** Firefox with the Tampermonkey add-on, then open `medbud-mobile.user.js` from this repository.
- **iPhone/iPad:** the free Userscripts app for Safari, then open `medbud-mobile.user.js` in Safari and install it from the extension menu.

## Development

```
npm install
npx playwright install chromium webkit
npm test            # Playwright suite (needs page fixtures, see tests/fixtures/README.md)
npm run test:unit   # release tooling
```

Tests never contact medbud.wiki: they replay saved copies of its pages.

Releasing and version bumps: see [RELEASING.md](RELEASING.md). Changes: [CHANGELOG.md](CHANGELOG.md).
