import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractMeta, checkVersion } from './build-meta.mjs';

const source = readFileSync(new URL('../medbud-mobile.user.js', import.meta.url), 'utf8');

test('extractMeta returns only the metadata block', () => {
  const meta = extractMeta(source);
  assert.ok(meta.startsWith('// ==UserScript=='));
  assert.ok(meta.endsWith('// ==/UserScript==\n'));
  assert.ok(!meta.includes('(function'));
});

test('extractMeta throws when there is no metadata block', () => {
  assert.throws(() => extractMeta('console.log(1);'), /metadata block not found/);
});

test('checkVersion returns the version when @version and VERSION agree', () => {
  assert.equal(checkVersion(source), '0.1.0');
});

test('checkVersion throws when @version and VERSION disagree', () => {
  const bumpedHeaderOnly = source.replace('// @version      0.1.0', '// @version      0.2.0');
  assert.throws(() => checkVersion(bumpedHeaderOnly), /0\.2\.0.*0\.1\.0|0\.1\.0.*0\.2\.0/);
});
