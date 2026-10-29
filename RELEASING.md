# Releasing

Installed copies of the userscript update themselves from `@updateURL`. They only take a new version when `@version` goes up, so every release bumps it.

## Userscript release

1. **Pick the version** (semver):
   - patch (`0.1.1`): CSS fixes, small layout corrections;
   - minor (`0.2.0`): a new page type or feature handled;
   - major (`1.0.0`): behaviour users would notice changing, or a breaking change in how it installs.
2. **Bump it in both places** in `medbud-mobile.user.js`: the `// @version` line in the header and the `const VERSION = '...'` line in the code. `scripts/build-meta.mjs` refuses to run if they differ.
3. **Regenerate the update file:**
   ```
   node scripts/build-meta.mjs
   ```
   This writes `medbud-mobile.meta.js` (the header only), which managers check for new versions.
4. **Test:**
   ```
   npm run test:unit
   npm test
   ```
   `npm test` needs the page fixtures; see `tests/fixtures/README.md`.
5. **Update `CHANGELOG.md`**: add a section for the version with today's date.
6. **Commit, tag and push:**
   ```
   git commit -am "release: vX.Y.Z"
   git tag vX.Y.Z
   git push --follow-tags
   ```

Once GitHub Pages is serving the files, installed copies pick the new version up on their next update check:

- **Tampermonkey** checks daily by default. To check now: Tampermonkey dashboard, Utilities, "Check for userscript updates".
- **Userscripts (iPhone/iPad Safari)**: open the extension menu in Safari and look under "Available Updates". The app's update support is incomplete, so check there after a release.

GitHub Pages stays off while the repository is private. Until it is public, `@updateURL` and `@downloadURL` (`https://mitchole.github.io/medbud-wiki-mobile/...`) do not resolve and nothing updates automatically; install by hand from a local copy.

## The website (GitHub Pages)

The install guide (`site/`), the userscript and `medbud-mobile.meta.js` are published together by `.github/workflows/pages.yml` on every push to `main`. The workflow runs the release-tooling tests, then `node scripts/build-pages.mjs _site`, which refuses to build if `medbud-mobile.meta.js` is out of date with the userscript, so regenerate it (step 3 above) before pushing.

To preview the guide locally, serve the repository root (for example `python -m http.server 8765`) and open `http://127.0.0.1:8765/site/`.

Pages is enabled once the repository is public: Settings, Pages, Source: GitHub Actions. The first run after that publishes `https://mitchole.github.io/medbud-wiki-mobile/`.
