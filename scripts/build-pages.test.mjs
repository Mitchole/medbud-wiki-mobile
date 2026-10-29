import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPages } from './build-pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('writes the guide, fonts and both script files at the artifact root', () => {
  const out = mkdtempSync(path.join(tmpdir(), 'mbm-pages-'));
  try {
    const files = buildPages(out);
    for (const name of ['index.html', 'medbud-mobile.user.js', 'medbud-mobile.meta.js', 'fonts/LICENSE.txt']) {
      assert.ok(files.includes(name), `${name} listed`);
      assert.ok(existsSync(path.join(out, name)), `${name} written`);
    }
    assert.ok(files.some((f) => /^fonts\/.+\.woff2$/.test(f)), 'a woff2 font listed');
    assert.equal(readFileSync(path.join(out, 'medbud-mobile.user.js'), 'utf8'), readFileSync(path.join(ROOT, 'medbud-mobile.user.js'), 'utf8'));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('refuses to build when the meta file version does not match', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mbm-root-'));
  const out = path.join(root, '_site');
  try {
    cpSync(path.join(ROOT, 'site'), path.join(root, 'site'), { recursive: true });
    cpSync(path.join(ROOT, 'medbud-mobile.user.js'), path.join(root, 'medbud-mobile.user.js'));
    const meta = readFileSync(path.join(ROOT, 'medbud-mobile.meta.js'), 'utf8').replace(/(@version\s+)\S+/, '$19.9.9');
    writeFileSync(path.join(root, 'medbud-mobile.meta.js'), meta);
    assert.throws(() => buildPages(out, root), /meta/i);
    assert.ok(!existsSync(path.join(out, 'index.html')), 'nothing written');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refuses an output folder that would delete the repository or the guide source', () => {
  for (const bad of ['.', '..', 'site', 'site/fonts']) {
    assert.throws(() => buildPages(bad), /refus/i, bad);
  }
  assert.ok(existsSync(path.join(ROOT, 'site', 'index.html')), 'site/ untouched');
});

test('the Pages workflow is skipped while the repository is private', () => {
  const workflow = readFileSync(path.join(ROOT, '.github', 'workflows', 'pages.yml'), 'utf8');
  const build = workflow.slice(workflow.indexOf('  build:'), workflow.indexOf('  deploy:'));
  assert.match(build, /if: \$\{\{ !github\.event\.repository\.private \}\}/);
});
