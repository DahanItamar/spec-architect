import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, read, listSkills } from './lib/parse.js';

const pkg = JSON.parse(read('package.json'));
const plugin = JSON.parse(read('.claude-plugin', 'plugin.json'));
const marketplace = JSON.parse(read('.claude-plugin', 'marketplace.json'));
const readme = read('README.md');

test('the plugin manifest and package.json agree on the version', () => {
  assert.equal(
    plugin.version,
    pkg.version.replace(/-.*$/, ''),
    'a plugin published at a different version than the repo claims is unfixable from the outside',
  );
});

test('the marketplace entry points at this plugin', () => {
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source, './', 'the repo itself is the plugin');
});

// AC-013 — installation is copying Markdown files.
test('no runtime dependencies are declared', () => {
  assert.equal(pkg.dependencies, undefined, 'a runtime dependency ends portability');
});

test('the test script needs no install step', () => {
  assert.match(pkg.scripts.test, /^node --test/, 'npm test must run on node alone');
});

test('README documents every stage that exists', () => {
  for (const skill of listSkills()) {
    assert.ok(readme.includes(skill), `${skill} ships but is undocumented`);
  }
});

test('README names no stage that does not exist', () => {
  for (const m of readme.matchAll(/`(spec-[a-z-]+)`/g)) {
    assert.ok(
      listSkills().includes(m[1]),
      `README references ${m[1]}, which is not a skill in this repo`,
    );
  }
});

test('every example names only skills that exist', () => {
  for (const example of ['the-loop.md', 'delta-example.md']) {
    const body = read('examples', example);
    for (const m of body.matchAll(/`(spec-[a-z-]+)`/g)) {
      assert.ok(listSkills().includes(m[1]), `${example} references missing skill ${m[1]}`);
    }
  }
});

test('the documented install paths exist', () => {
  for (const path of [
    ['skills'],
    ['adapters', 'AGENTS.md'],
    ['.claude-plugin', 'plugin.json'],
    ['.claude-plugin', 'marketplace.json'],
  ]) {
    assert.ok(existsSync(join(REPO_ROOT, ...path)), `${path.join('/')} is documented but missing`);
  }
});

test('all five stages ship', () => {
  assert.deepEqual(listSkills(), [
    'spec-architect',
    'spec-constitution',
    'spec-drift',
    'spec-implement',
    'spec-tasks',
  ]);
});
