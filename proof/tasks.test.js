import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, extractTasks, extractCriteria } from './lib/parse.js';

const spec = read('proof', 'fixtures', 'valid-spec.md');
const tasks = extractTasks(read('proof', 'fixtures', 'valid-tasks.md'));
const criteria = extractCriteria(spec);
const activeIds = criteria.filter((c) => c.status === 'active').map((c) => c.id);
const allIds = criteria.map((c) => c.id);

test('the fixture parses into tasks', () => {
  assert.equal(tasks.length, 4);
  assert.deepEqual(
    tasks.map((t) => t.id),
    ['T-01', 'T-02', 'T-03', 'T-04'],
  );
});

// AC-005 — a task closing nothing is unnecessary work, or a missing criterion.
test('every task cites at least one criterion', () => {
  for (const t of tasks) {
    assert.ok(t.closes.length > 0, `${t.id} closes nothing`);
  }
});

test('every cited criterion exists in the source spec', () => {
  for (const t of tasks) {
    for (const id of t.closes) {
      assert.ok(allIds.includes(id), `${t.id} cites ${id}, which is not in the spec`);
    }
  }
});

test('no task cites a retired criterion', () => {
  const retired = criteria.filter((c) => c.status === 'retired').map((c) => c.id);
  for (const t of tasks) {
    for (const id of t.closes) {
      assert.ok(!retired.includes(id), `${t.id} cites retired ${id}`);
    }
  }
});

test('every task names the files it expects to touch', () => {
  for (const t of tasks) {
    assert.ok(t.files.length > 0, `${t.id} names no files`);
  }
});

// Forward references would make spec-implement a scheduler instead of a forward pass.
test('dependencies reference only earlier tasks', () => {
  const seen = [];
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      assert.ok(seen.includes(dep), `${t.id} depends on ${dep}, which is not earlier in the list`);
    }
    seen.push(t.id);
  }
});

test('task ids are unique and sequential from T-01', () => {
  const ids = tasks.map((t) => t.id);
  assert.deepEqual([...new Set(ids)], ids, 'duplicate task ids');
  ids.forEach((id, i) => {
    assert.equal(id, `T-${String(i + 1).padStart(2, '0')}`, 'task ids must run in order');
  });
});

// The direction that nothing downstream would catch: spec-implement only verifies
// criteria a task cites, so an uncited one is never checked and never built.
test('every active criterion is closed by some task', () => {
  const covered = new Set(tasks.flatMap((t) => t.closes));
  const orphans = activeIds.filter((id) => !covered.has(id));
  assert.deepEqual(orphans, [], `criteria in the slice that no task closes: ${orphans}`);
});

test('checkboxes are the only state, and they parse', () => {
  assert.deepEqual(
    tasks.map((t) => t.done),
    [true, true, false, false],
    'a resumed run starts at the first unchecked task',
  );
});

test('a task list with a forward dependency is detectable', () => {
  const bad = extractTasks(`
- [ ] T-01 Do the second thing — closes AC-001 — files: a.js — depends: T-02
- [ ] T-02 Do the first thing — closes AC-002 — files: b.js
`);
  const seen = [];
  let forward = false;
  for (const t of bad) {
    if (t.dependsOn.some((d) => !seen.includes(d))) forward = true;
    seen.push(t.id);
  }
  assert.ok(forward, 'the forward reference in T-01 must be caught');
});

test('a task that closes nothing is detectable', () => {
  const bad = extractTasks('- [ ] T-01 Tidy up the imports — files: a.js\n');
  assert.equal(bad.length, 1);
  assert.equal(bad[0].closes.length, 0, 'a citation-free task must parse as closing nothing');
});
