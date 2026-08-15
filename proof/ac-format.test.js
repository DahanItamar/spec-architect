import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  read,
  extractCriteria,
  hasCriteriaSection,
  classifyEars,
  AC_ID,
} from './lib/parse.js';

const SPECS = {
  'proof/fixtures/valid-spec.md': read('proof', 'fixtures', 'valid-spec.md'),
  'docs/SPEC.md': read('docs', 'SPEC.md'),
};

for (const [name, body] of Object.entries(SPECS)) {
  test(`${name}: has a §2.1 Acceptance Criteria section`, () => {
    assert.ok(hasCriteriaSection(body), 'missing "### 2.1 Acceptance Criteria"');
  });

  test(`${name}: §2.1 is not empty`, () => {
    assert.ok(extractCriteria(body).length > 0, 'no criteria rows found');
  });

  // AC-004 — the identifier format the whole pipeline cites.
  test(`${name}: every criterion id matches AC-###`, () => {
    for (const c of extractCriteria(body)) {
      assert.match(c.id, AC_ID, `"${c.id}" is not a valid identifier`);
    }
  });

  test(`${name}: criterion ids are unique`, () => {
    const ids = extractCriteria(body).map((c) => c.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual([...new Set(dupes)], [], 'duplicate ids would repoint existing citations');
  });

  // AC-003 in the fixture is a tombstone: retired criteria keep their id and drop the sentence.
  test(`${name}: every active criterion is well-formed EARS`, () => {
    for (const c of extractCriteria(body).filter((x) => x.status === 'active')) {
      assert.ok(
        classifyEars(c.text),
        `${c.id} is not a recognised EARS pattern: "${c.text}"`,
      );
    }
  });
}

test('EARS classifier recognises all five patterns', () => {
  assert.equal(classifyEars('The system shall persist every entry.'), 'ubiquitous');
  assert.equal(classifyEars('When a shift is saved, the scheduler shall revalidate.'), 'event');
  assert.equal(classifyEars('While offline, the client shall queue writes.'), 'state');
  assert.equal(classifyEars('If the token is expired, then the API shall return 401.'), 'unwanted');
  assert.equal(classifyEars('Where PDF export is enabled, the app shall show the button.'), 'optional');
});

test('EARS classifier rejects prose that only looks like a requirement', () => {
  assert.equal(classifyEars('The app should be fast.'), null, '"should" is not an obligation');
  assert.equal(classifyEars('Handle overlapping shifts'), null, 'no obligation, no period');
  assert.equal(classifyEars('Users can export to PDF.'), null, 'describes a capability');
  assert.equal(classifyEars('If the token is expired the API shall fail.'), null, 'missing "then"');
  assert.equal(classifyEars('When saving the scheduler shall revalidate.'), null, 'missing comma');
});

test('malformed identifiers are rejected', () => {
  const bad = `### 2.1 Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AC-1 | The system shall do a thing. |
`;
  const [first] = extractCriteria(bad);
  assert.equal(first.id, 'AC-1');
  assert.doesNotMatch(first.id, AC_ID, 'AC-1 must fail: identifiers are zero-padded to three digits');
});

test('retired criteria are parsed as tombstones, not active requirements', () => {
  const criteria = extractCriteria(read('proof', 'fixtures', 'valid-spec.md'));
  const retired = criteria.filter((c) => c.status === 'retired');
  assert.equal(retired.length, 1, 'the fixture carries exactly one tombstone');
  assert.equal(retired[0].id, 'AC-006');
});
