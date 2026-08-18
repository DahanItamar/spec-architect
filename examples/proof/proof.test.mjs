// Run with:  node --test examples/proof/
//
// Every test below passes. The ones under "naive" pass by asserting the broken
// behaviour — that is the point. They are executable evidence that the bugs are
// real, not rhetoric in a README.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { naiveHasConflict, naiveRename, naiveShiftsFor } from './naive.mjs';
import { detectConflicts, rename, shiftsFor } from './spec-derived.mjs';
import { validateShift, save } from './drifted.mjs';
import {
  detectConflicts as smellyDetect,
  tooltipDuration,
  exportDuration,
} from './smelly.mjs';

const sourceOf = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const countOf = (text, pattern) => (text.match(pattern) ?? []).length;

// ── The same three scenarios, expressed in each model's shape ──────────────────

// 1. Plain same-day overlap. 09:00–17:00 against 13:00–21:00.
const plain = {
  naive: {
    existing: [{ employee: 'Dana', day: '2026-08-03', start: '09:00', end: '17:00' }],
    candidate: { employee: 'Dana', day: '2026-08-03', start: '13:00', end: '21:00' },
  },
  spec: {
    existing: [{ id: 's1', employeeId: 'e1', date: '2026-08-03', startMinute: 540, endMinute: 1020 }],
    candidate: { id: 's2', employeeId: 'e1', date: '2026-08-03', startMinute: 780, endMinute: 1260 },
  },
};

// 2. A night shift running into the next morning.
//    22:00–06:00 on the 3rd, against 05:00–13:00 on the 4th. They overlap by an hour.
const overnight = {
  naive: {
    existing: [{ employee: 'Dana', day: '2026-08-03', start: '22:00', end: '06:00' }],
    candidate: { employee: 'Dana', day: '2026-08-04', start: '05:00', end: '13:00' },
  },
  spec: {
    existing: [{ id: 's1', employeeId: 'e1', date: '2026-08-03', startMinute: 1320, endMinute: 1800 }],
    candidate: { id: 's2', employeeId: 'e1', date: '2026-08-04', startMinute: 300, endMinute: 780 },
  },
};

// 3. The same plain overlap, typed without zero-padding — "9:00" instead of "09:00".
//    Nothing in the naive model forbids this; the field is a string.
const unpadded = {
  naive: {
    existing: [{ employee: 'Dana', day: '2026-08-03', start: '9:00', end: '17:00' }],
    candidate: { employee: 'Dana', day: '2026-08-03', start: '13:00', end: '21:00' },
  },
  // No spec equivalent exists: 540 is 540. There is no unpadded integer.
};

describe('naive — no spec, shapes chosen by whatever was convenient', () => {
  test('detects a plain same-day overlap', () => {
    assert.equal(naiveHasConflict(plain.naive.candidate, plain.naive.existing), true);
  });

  test('MISSES a night shift running into the next morning — the manager sees no warning', () => {
    // `day` differs, so the check never even compares the times.
    assert.equal(naiveHasConflict(overnight.naive.candidate, overnight.naive.existing), false);
  });

  test('MISSES the same overlap when a time is not zero-padded — "9:00" < "21:00" is false', () => {
    // String comparison. '9' > '2', so the lexical test says these do not overlap.
    assert.equal('9:00' < '21:00', false);
    assert.equal(naiveHasConflict(unpadded.naive.candidate, unpadded.naive.existing), false);
  });

  test('orphans every shift when an employee is renamed', () => {
    const employees = [{ name: 'Dana', role: 'lead' }];
    const shifts = [{ employee: 'Dana', day: '2026-08-03', start: '09:00', end: '17:00' }];

    assert.equal(naiveShiftsFor(employees[0], shifts).length, 1);

    const renamed = naiveRename(employees, 'Dana', 'Dana Cohen');
    assert.equal(naiveShiftsFor(renamed[0], shifts).length, 0); // her history is gone
  });
});

describe('spec-derived — shapes chosen in §5 and §8', () => {
  test('detects a plain same-day overlap', () => {
    const c = detectConflicts(plain.spec.candidate, plain.spec.existing);
    assert.equal(c.length, 1);
    assert.equal(c[0].kind, 'overlap');
  });

  test('catches the night shift running into the next morning', () => {
    const c = detectConflicts(overnight.spec.candidate, overnight.spec.existing);
    assert.equal(c.length, 1);
    assert.deepEqual(c[0].shiftIds.sort(), ['s1', 's2']);
  });

  test('has no padding failure mode — minutes are integers, not text', () => {
    assert.equal(typeof plain.spec.candidate.startMinute, 'number');
  });

  test('survives a rename — identity is an id, not a display name', () => {
    const employees = [{ id: 'e1', name: 'Dana' }];
    const shifts = plain.spec.existing;

    assert.equal(shiftsFor(employees[0], shifts).length, 1);

    const renamed = rename(employees, 'e1', 'Dana Cohen');
    assert.equal(shiftsFor(renamed[0], shifts).length, 1); // history intact
  });

  test('does not flag a different employee in the same slot', () => {
    const other = { ...plain.spec.candidate, id: 's3', employeeId: 'e2' };
    assert.deepEqual(detectConflicts(other, plain.spec.existing), []);
  });
});

// ── Three weeks later ─────────────────────────────────────────────────────────
//
// The spec is still correct. The code stopped matching it. Nothing failed,
// nothing crashed, and no test in the project turned red — which is the whole
// reason drift survives.

describe('drifted — the code three weeks after the spec was written', () => {
  const night = overnight.spec.existing[0]; // 22:00 → 06:00, endMinute 1800

  test('still handles ordinary shifts, so nothing looks wrong', () => {
    assert.doesNotThrow(() => validateShift(plain.spec.candidate));
  });

  test('but the night shift can no longer be saved — §8 is contradicted', () => {
    assert.throws(() => validateShift(night), RangeError);
  });

  test('and the rejection is silent: the overlap is simply never detected', () => {
    // The manager types the night shift, sees a validation error on the form,
    // shortens it to 22:00–23:59, and moves on. Nothing warns anyone.
    const { saved, store } = save(night, []);
    assert.equal(saved, false);
    assert.deepEqual(store, []);

    // The morning shift now conflicts with nothing, because its counterpart
    // was never stored. Same silence as the naive version, five weeks later.
    assert.deepEqual(detectConflicts(overnight.spec.candidate, store), []);
  });

  test('the spec still says the opposite — this is what spec-drift reports', () => {
    // §5:  endMinute: number;   // may exceed 1440 for overnight shifts
    // code: throws above 1439
    const specAllows = night.endMinute > 1440;
    const codeAllows = (() => {
      try { validateShift(night); return true; } catch { return false; }
    })();

    assert.equal(specAllows, true);
    assert.equal(codeAllows, false);
    assert.notEqual(specAllows, codeAllows); // the gap, asserted
  });
});

// ── Six months later ──────────────────────────────────────────────────────────
//
// The opposite failure. Here the code is *right* — every criterion holds, the
// overnight case works, drift comes back clean — and the file is still the one
// nobody wants to open. Correctness and changeability are different properties,
// and only one of them has a stage before this.

describe('smelly — passes every criterion and is still unshippable', () => {
  const smelly = sourceOf('./smelly.mjs');
  const derived = sourceOf('./spec-derived.mjs');
  const night = overnight.spec.existing[0]; // 22:00 → 06:00, endMinute 1800

  test('behaves exactly like the spec-derived version — spec-drift finds nothing', () => {
    for (const scenario of [plain.spec, overnight.spec]) {
      assert.deepEqual(
        smellyDetect(scenario.candidate, scenario.existing),
        detectConflicts(scenario.candidate, scenario.existing),
      );
    }
    const other = { ...plain.spec.candidate, id: 's3', employeeId: 'e2' };
    assert.deepEqual(smellyDetect(other, plain.spec.existing), []);
  });

  test('SM-001 Shotgun Surgery: one rule kind is known in four places', () => {
    // Adding M3's rest-period rule means four more edits, and nothing will ask
    // for them — the detector, the export flag, the label, and the badge.
    assert.equal(countOf(smelly, /'overlap'/g), 4);
    assert.equal(countOf(derived, /'overlap'/g), 1);
  });

  test('SM-002 Duplicate Code: the same day arithmetic, copied three times', () => {
    assert.equal(countOf(smelly, /Date\.UTC\(/g), 3);
    assert.equal(countOf(derived, /Date\.UTC\(/g), 1);
  });

  test('and the copies have already diverged, in the one path no criterion covers', () => {
    // Both are the duration of the same shift. One of them is wrong, and it is
    // wrong only for the case the spec went to the trouble of allowing.
    assert.equal(exportDuration(night), 480); // 22:00 → 06:00 is eight hours
    assert.equal(tooltipDuration(night), -960); // the grid says minus sixteen

    // Nothing in §2.1 mentions the tooltip, so this is not drift and stage 5 is
    // right to stay silent. It is a smell, and it is already a defect.
    assert.notEqual(exportDuration(night), tooltipDuration(night));
  });
});
