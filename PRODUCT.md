# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single static `index.html` (inline CSS and JS, no build step), hosted on GitHub Pages under the `Mitchole` account. The userscript is a plain `.user.js` file served from the same site. An Android APK was planned and then cancelled (2026-10-29).

## Users

UK medical cannabis patients (and people researching it) who use medbud.wiki on a phone. The first user is a friend of the maintainer; the install guide is written to be shared widely, so it must work for a stranger arriving from a forum or chat link with no context. They are on iPhone (Safari) or Android (Chrome or Firefox), often not technical, and have never installed a userscript or browser extension.

## Product Purpose

MedBud Mobile (unofficial) makes medbud.wiki usable on phones. The wiki ships a fixed 1440px desktop layout (`<meta name="viewport" content="width=1440">`, `min-width:1420px`, no media queries) that phones shrink to unreadable size. A userscript corrects the viewport and applies targeted mobile fixes; the install guide walks a non-technical visitor through installing it on their exact device, one step at a time. Success: a stranger on a phone goes from the guide's link to a working mobile medbud.wiki without help.

## Positioning

An independent fix layered on the real site in the visitor's own browser: no proxy, no copy of MedBud's data, no account. It is not affiliated with or endorsed by MedBud. Care and attention made to not destroy or misplace medbuds displayed advertising.

## Operating Context

- Install paths: iPhone/iPad via the free Userscripts Safari extension (iOS 15.1+); Android Firefox via Tampermonkey; Android Chrome cannot run userscripts, so the guide helps the visitor get Firefox and reopen the guide there; desktop gets an explanation plus an optional Tampermonkey path; unknown devices see every option.
- The guide detects platform from the user agent and offers a manual "Not your device?" switch.
- The userscript also runs on the guide's own page and sets `data-medbud-mobile` on `<html>`, which flips the guide to an "installed" state.
- medbud.wiki sits behind a Cloudflare human check; nothing in this project automates or bypasses it.
- Updates reach installed copies by bumping `@version`; iOS Userscripts needs `@version` plus an `@updateURL` ending in `.meta.js`.

## Capabilities and Constraints

- The guide is a step-by-step flow with Previous/Next controls, one action per step.
- Must state clearly that it is unofficial and not affiliated with MedBud. Must not use MedBud's logo, wordmark, or styling in a way that reads as MedBud's own page.
- No analytics, cookies, or third-party requests beyond what the install steps link to (App Store, Firefox Add-ons, Google Play for Firefox, Tampermonkey, the userscript) and the GitHub issues link for reporting pages that look wrong.
- Undecided: whether steps get drawn illustrations of the iOS/Android settings screens.

## Brand Commitments

Name: "MedBud Mobile (unofficial)". "MedBud" is used only as the name of the site this works on.

## Evidence on Hand

- Audit findings and selectors for medbud.wiki's mobile problems (this conversation; to be recorded in the design doc).
- Captured page fixtures in `tests/fixtures/` (local only, not committed).
- No screenshots of the install steps on real devices yet; no testimonials or user counts exist and none may be invented.

## Product Principles

1. One step, one action: never ask the visitor to read ahead or juggle two apps' instructions at once.
2. Meet the visitor on their device: detect it, but always let them correct the guess.
3. Honest about what it is: unofficial, open source, and what it changes on the site.
4. Fix, don't redesign: the userscript keeps MedBud's own identity and content and only makes it fit a phone.

## Accessibility & Inclusion

Phone-first: 44px minimum tap targets, 16px minimum body text, works with large text settings and screen readers (step changes announced), and respects reduced motion.
