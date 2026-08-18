// spec-derived.mjs, six months and four features later.
//
// Nothing here is wrong. Every criterion in the spec still holds, the overnight
// case still works, identity is still an id, time is still integer minutes —
// `spec-drift` runs over this file and reports a clean bill.
//
// It is still the worst file in the project, for two reasons that no behavioural
// check can see:
//
//   1. Shotgun Surgery. The conflict kind `overlap` is known in four places —
//      the detector, the label, the badge, and the export. Adding the
//      rest-period rule scheduled for M3 means four more edits, none of which
//      the compiler will ask for.
//
//   2. Duplicate Code, already diverged. The day-number arithmetic was copied
//      twice as the export and the grid grew. Two copies still agree. The third
//      does not — and it sits in the tooltip, the one path §2.1 makes no claim
//      about, so nothing anywhere turns red.
//
// This is what stage 6 is for. Stage 5 cannot see any of it.

const MINUTES_PER_DAY = 1440;

// ── copy 1 of 3 — the scheduler ───────────────────────────────────────────────
function dayNumber(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function toRange(shift) {
  const start = dayNumber(shift.date) * MINUTES_PER_DAY + shift.startMinute;
  return { start, end: start + (shift.endMinute - shift.startMinute) };
}

export function detectConflicts(candidate, existing) {
  const conflicts = [];
  const a = toRange(candidate);

  const overlapping = existing.filter((s) => {
    if (s.id === candidate.id) return false;
    if (s.employeeId !== candidate.employeeId) return false;
    const b = toRange(s);
    return a.start < b.end && a.end > b.start;
  });

  if (overlapping.length > 0) {
    conflicts.push({
      kind: 'overlap', // ← 1 of 4
      shiftIds: [candidate.id, ...overlapping.map((s) => s.id)],
      message: 'Already scheduled during this time',
    });
  }

  return conflicts;
}

// ── copy 2 of 3 — the CSV export. Same arithmetic, pasted. ────────────────────
function exportDayNumber(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function exportRow(shift, conflicts) {
  const flagged = conflicts.some((c) => c.kind === 'overlap'); // ← 2 of 4
  return {
    day: exportDayNumber(shift.date),
    minutes: shift.endMinute - shift.startMinute,
    flag: flagged ? 'OVERLAP' : '',
  };
}

// ── copy 3 of 3 — the grid tooltip. Same arithmetic, and one edit later. ──────
//
// A session fixing "the tooltip shows 1800 for a 22:00 shift" wrapped the end
// minute at midnight. It reads as obviously right, and for every shift inside
// one day it is. For a shift that crosses midnight the duration goes negative.
//
// No criterion covers the tooltip, so no test asserts it and drift stays silent.
function gridDayNumber(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function tooltipDuration(shift) {
  return (shift.endMinute % MINUTES_PER_DAY) - shift.startMinute; // ← the divergence
}

export function exportDuration(shift) {
  return shift.endMinute - shift.startMinute;
}

export function gridSlot(shift) {
  return gridDayNumber(shift.date) * MINUTES_PER_DAY + shift.startMinute;
}

// ── The rest of what knows the conflict kind ─────────────────────────────────

export function conflictLabel(conflict) {
  if (conflict.kind === 'overlap') return 'Double-booked'; // ← 3 of 4
  return 'Problem';
}

export function badgeClass(conflict) {
  return conflict.kind === 'overlap' ? 'badge badge--warn' : 'badge'; // ← 4 of 4
}

export function rename(employees, id, name) {
  return employees.map((e) => (e.id === id ? { ...e, name } : e));
}

export function shiftsFor(employee, shifts) {
  return shifts.filter((s) => s.employeeId === employee.id);
}
