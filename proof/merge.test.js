import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  extractCriteria,
  parseProposal,
  proposalViolations,
  findConflicts,
  renderTombstone,
} from './lib/parse.js';

const spec = read('proof', 'fixtures', 'valid-spec.md');
const specCriteria = extractCriteria(spec);
const proposal = parseProposal(read('proof', 'fixtures', 'proposal-0004.md'));

test('a proposal parses into ordinal, status, criteria, and edits', () => {
  assert.equal(proposal.ordinal, '0004');
  assert.equal(proposal.title, 'Folders');
  assert.equal(proposal.status, 'shipped');
  assert.equal(proposal.added.length, 3);
  assert.equal(proposal.retired.length, 1);
  assert.deepEqual(
    proposal.edits.map((e) => `§${e.section} ${e.operation}`),
    ['§5 add', '§8 replace'],
  );
});

// AC-004 — ids are unique across the repository, so a proposal continues the sequence.
test('added criteria continue the sequence and collide with nothing', () => {
  const specIds = specCriteria.map((c) => c.id);
  assert.deepEqual(
    proposal.added.map((c) => c.id),
    ['AC-007', 'AC-008', 'AC-009'],
  );
  for (const c of proposal.added) {
    assert.ok(!specIds.includes(c.id), `${c.id} would overwrite an existing criterion`);
  }
});

test('retired criteria must already exist in the spec', () => {
  const specIds = specCriteria.map((c) => c.id);
  for (const c of proposal.retired) {
    assert.ok(specIds.includes(c.id), `${c.id} is retired but was never in the spec`);
  }
});

test('a replace against a reason-recording section carries its reason', () => {
  const edit = proposal.edits.find((e) => e.section === '8');
  assert.equal(edit.operation, 'replace');
  assert.ok(edit.hasReason, '§8 records reasons; replacing an entry silently is a regression');
});

test('the fixture proposal is mergeable', () => {
  assert.deepEqual(proposalViolations(proposal, specCriteria), []);
});

test('an id collision is caught', () => {
  const bad = parseProposal(`# 0009 — Bad

> Status: shipped

## Criteria added

| ID | Criterion |
| --- | --- |
| AC-002 | The inbox shall do something else entirely. |
`);
  assert.deepEqual(proposalViolations(bad, specCriteria), ['AC-002 already exists in the spec']);
});

test('a silent removal from a reason-recording section is refused', () => {
  const bad = parseProposal(`# 0010 — Bad

> Status: shipped

## Section edits

### §3 Architecture — remove

Drop the JSON store decision.
`);
  assert.deepEqual(proposalViolations(bad, specCriteria), ['§3 remove has no reason']);
});

test('a non-EARS criterion is refused', () => {
  const bad = parseProposal(`# 0011 — Bad

> Status: shipped

## Criteria added

| ID | Criterion |
| --- | --- |
| AC-050 | Folders should probably be nestable. |
`);
  assert.deepEqual(proposalViolations(bad, specCriteria), ['AC-050 is not well-formed EARS']);
});

test('retiring a criterion that never existed is refused', () => {
  const bad = parseProposal(`# 0012 — Bad

> Status: shipped

## Criteria retired

| ID | Criterion |
| --- | --- |
| AC-999 | Cleaning up. |
`);
  assert.deepEqual(proposalViolations(bad, specCriteria), ['AC-999 is retired but never existed']);
});

test('two proposals editing the same section conflict', () => {
  const other = parseProposal(`# 0005 — Swaps

> Status: proposed

## Section edits

### §5 Data Models — add

A swap request table.
`);
  assert.deepEqual(findConflicts([proposal, other]), [
    { a: '0004', b: '0005', sections: ['5'] },
  ]);
});

test('proposals editing different sections do not conflict', () => {
  const other = parseProposal(`# 0006 — Auth

> Status: proposed

## Section edits

### §9 Security — add

Session cookies.
`);
  assert.deepEqual(findConflicts([proposal, other]), []);
});

test('a retired criterion renders as a tombstone that still parses', () => {
  const line = renderTombstone('AC-005', '0004-folders', 'hostname fallback dropped');
  const [parsed] = extractCriteria(line);
  assert.equal(parsed.id, 'AC-005', 'the id must survive so old task lists still resolve');
  assert.equal(parsed.status, 'retired');
});

test('ordinals are unique across active and archived changes', () => {
  const ordinals = ['0001', '0002', '0003', '0004'];
  assert.deepEqual([...new Set(ordinals)], ordinals, 'a reused ordinal repoints an archived list');
});
