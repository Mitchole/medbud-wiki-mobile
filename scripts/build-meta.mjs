// Writes medbud-mobile.meta.js: the userscript's metadata block alone. Userscript managers fetch this small
// file from @updateURL to see whether @version changed, then download @downloadURL.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const START = '// ==UserScript==';
const END = '// ==/UserScript==';

/** The `// ==UserScript==` ... `// ==/UserScript==` block, with a trailing newline. */
export function extractMeta(source) {
  const start = source.indexOf(START);
  const end = source.indexOf(END);
  if (start === -1 || end === -1 || end < start) throw new Error('metadata block not found');
  return source.slice(start, end + END.length) + '\n';
}

/** The @version value; throws if it differs from the VERSION constant in the code. */
export function checkVersion(source) {
  const header = extractMeta(source).match(/^\/\/ @version\s+(\S+)/m);
  const constant = source.match(/const VERSION = '([^']+)'/);
  if (!header) throw new Error('@version not found in the metadata block');
  if (!constant) throw new Error('VERSION constant not found');
  if (header[1] !== constant[1]) {
    throw new Error(`@version ${header[1]} does not match VERSION ${constant[1]}; bump both together`);
  }
  return header[1];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = readFileSync(path.join(root, 'medbud-mobile.user.js'), 'utf8');
  const version = checkVersion(source);
  writeFileSync(path.join(root, 'medbud-mobile.meta.js'), extractMeta(source));
  console.log(`wrote medbud-mobile.meta.js (version ${version})`);
}
