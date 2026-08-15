import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, listSkills, lineCount, read } from './lib/parse.js';

const ADAPTERS_DIR = join(REPO_ROOT, 'adapters');

const adapterFiles = readdirSync(ADAPTERS_DIR, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.(md|mdc)$/.test(e.name))
  .map((e) => join(e.parentPath ?? e.path, e.name));

// A pointer file that grows is a pointer file accumulating rules.
const ADAPTER_MAX_LINES = 80;

test('adapters exist', () => {
  assert.ok(adapterFiles.length > 0, 'no adapter files found');
});

for (const file of adapterFiles) {
  const rel = file.slice(REPO_ROOT.length + 1).replace(/\\/g, '/');
  const body = readFileSync(file, 'utf8');

  test(`${rel}: every skill path it names exists`, () => {
    const paths = [...body.matchAll(/skills\/([a-z-]+)\/SKILL\.md/g)];
    assert.ok(paths.length > 0, 'an adapter that points nowhere is not an adapter');
    for (const m of paths) {
      assert.ok(existsSync(join(REPO_ROOT, 'skills', m[1], 'SKILL.md')), `${m[0]} does not exist`);
    }
  });

  test(`${rel}: lists every stage`, () => {
    for (const skill of listSkills()) {
      assert.ok(body.includes(`skills/${skill}/SKILL.md`), `${skill} is missing from this adapter`);
    }
  });

  test(`${rel}: stays a pointer`, () => {
    const lines = lineCount(body);
    assert.ok(lines <= ADAPTER_MAX_LINES, `${lines} lines, over the ${ADAPTER_MAX_LINES} limit`);
  });

  // AC-016 — operationalised: an adapter may not carry the two forms a rule takes in
  // this system. Obligations ("shall") belong in a spec; workflow phases belong in a
  // SKILL.md. Neither can appear here, so an adapter cannot disagree with skills/.
  test(`${rel}: carries no rule of its own`, () => {
    assert.doesNotMatch(body, /\bshall\b/, 'obligations belong in a spec, not an adapter');
    assert.doesNotMatch(body, /^#+\s*Phase\b/m, 'workflow phases belong in SKILL.md');
    assert.doesNotMatch(body, /^\s*\d+\.\s+\*\*/m, 'numbered rule lists belong in SKILL.md');
  });
}

// AC-011 — a skill that batches questions must degrade where no such tool exists.
for (const skill of listSkills()) {
  const body = read('skills', skill, 'SKILL.md');
  if (!body.includes('AskUserQuestion')) continue;

  test(`${skill}: states the fallback for hosts with no question tool`, () => {
    assert.match(
      body,
      /numbered list/i,
      'must say what to do where AskUserQuestion is unavailable',
    );
    assert.match(
      body,
      /single message|one message|in one call|single call/i,
      'the fallback must still be one message, not one question at a time',
    );
  });
}
