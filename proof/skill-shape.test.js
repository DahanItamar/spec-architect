import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  SKILLS_DIR,
  listSkills,
  listSkillDirs,
  listReferences,
  parseFrontmatter,
  crossSkillPaths,
  lineCount,
  read,
} from './lib/parse.js';

// Limits from docs/SPEC.md §4. SKILL.md is loaded on every invocation;
// references are loaded on demand. The limits follow that asymmetry.
const SKILL_MD_HARD_LINES = 220;
const REFERENCE_HARD_LINES = 300;
const REFERENCES_HARD_COUNT = 6;
const DESCRIPTION_MAX_CHARS = 1024;

test('every directory under skills/ has a SKILL.md', () => {
  assert.deepEqual(
    listSkillDirs(),
    listSkills(),
    'a skill directory without SKILL.md is a half-installed skill',
  );
});

test('at least one skill exists', () => {
  assert.ok(listSkills().length > 0, 'skills/ is empty');
});

for (const skill of listSkills()) {
  test(`${skill}: frontmatter is valid`, () => {
    const fm = parseFrontmatter(read('skills', skill, 'SKILL.md'));
    assert.ok(fm, 'SKILL.md must open with --- frontmatter ---');
    assert.equal(fm.name, skill, 'frontmatter name must equal the directory name');
    assert.ok(fm.description, 'description is the only text a host agent sees before loading');
    assert.ok(
      fm.description.length <= DESCRIPTION_MAX_CHARS,
      `description is ${fm.description.length} chars, over the ${DESCRIPTION_MAX_CHARS} limit`,
    );
  });

  test(`${skill}: description states when to use the skill`, () => {
    const { description } = parseFrontmatter(read('skills', skill, 'SKILL.md'));
    assert.match(
      description,
      /\bUse\s+(when|after|before|at|to|for|this)\b/i,
      'description must contain trigger conditions, not just a summary',
    );
  });

  test(`${skill}: SKILL.md is within its size limit`, () => {
    const lines = lineCount(read('skills', skill, 'SKILL.md'));
    assert.ok(
      lines <= SKILL_MD_HARD_LINES,
      `SKILL.md is ${lines} lines, over the hard limit of ${SKILL_MD_HARD_LINES}`,
    );
  });

  test(`${skill}: references are within their limits`, () => {
    const refs = listReferences(skill);
    assert.ok(
      refs.length <= REFERENCES_HARD_COUNT,
      `${refs.length} reference files, over the hard limit of ${REFERENCES_HARD_COUNT}`,
    );
    for (const ref of refs) {
      const lines = lineCount(read('skills', skill, 'references', ref));
      assert.ok(
        lines <= REFERENCE_HARD_LINES,
        `${ref} is ${lines} lines, over the hard limit of ${REFERENCE_HARD_LINES}`,
      );
    }
  });

  test(`${skill}: every reference it names exists`, () => {
    const body = read('skills', skill, 'SKILL.md');
    for (const m of body.matchAll(/references\/([a-z0-9-]+\.md)/g)) {
      assert.ok(
        existsSync(join(SKILLS_DIR, skill, 'references', m[1])),
        `SKILL.md points at references/${m[1]}, which does not exist`,
      );
    }
  });

  // AC-012 — a skill directory must be atomic, so it can be copied out on its own.
  test(`${skill}: reads no file belonging to another skill`, () => {
    const files = ['SKILL.md', ...listReferences(skill).map((r) => join('references', r))];
    for (const file of files) {
      const foreign = crossSkillPaths(read('skills', skill, file), skill);
      assert.deepEqual(foreign, [], `${file} references another skill's files: ${foreign}`);
    }
  });
}
