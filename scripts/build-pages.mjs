// Assembles the GitHub Pages artifact: the install guide (site/) at the root, beside the userscript and its
// meta file, so @updateURL and @downloadURL resolve on the same site the guide is served from.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkVersion, extractMeta } from './build-meta.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = ['medbud-mobile.user.js', 'medbud-mobile.meta.js'];

/** Every file under dir, as forward-slash paths relative to it. */
function listFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );
}

/** Build the artifact into outDir (replacing it) and return the files written; refuses a stale meta file. */
export function buildPages(outDir = '_site', root = REPO_ROOT) {
  const source = readFileSync(path.join(root, 'medbud-mobile.user.js'), 'utf8');
  const version = checkVersion(source);
  const meta = readFileSync(path.join(root, 'medbud-mobile.meta.js'), 'utf8').replace(/\r\n/g, '\n');
  if (meta !== extractMeta(source).replace(/\r\n/g, '\n')) {
    throw new Error(`medbud-mobile.meta.js is out of date with the userscript (version ${version}); run node scripts/build-meta.mjs`);
  }
  const out = path.resolve(root, outDir);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(path.join(root, 'site'), out, { recursive: true });
  for (const name of SCRIPTS) cpSync(path.join(root, name), path.join(out, name));
  return listFiles(out);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = buildPages(process.argv[2] || '_site');
  console.log(`wrote ${files.length} files to ${process.argv[2] || '_site'}`);
}
