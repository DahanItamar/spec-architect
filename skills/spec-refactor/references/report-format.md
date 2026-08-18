# The Refactoring Directory

Where a run is written, how smells are numbered across runs, and the line format `spec-implement`
reads.

---

## The directory

```
docs/refactorings/
├── SMELLS.md                     ← the registry. Every SM-### ever allocated, including dead ones
├── 0003-m3-rest-period/
│   └── REPORT.md                 ← one run: what it found, what it proposes
└── archive/
    ├── 0001-extract-scheduler/
    └── 0002-dead-export-sweep/
```

This is the same shape as `docs/changes/`, deliberately. A reader who has seen one can read the
other without being told.

**Ordinals** are four digits, monotonic, never reused — including across `archive/`. Find the next
one by scanning both directories; do not guess from the highest you happen to see.

**Slugs** are ASCII kebab-case, truncated at 40 characters, naming what the run is *for* — the
milestone it unblocks, or the sweep it performs.

**A run is archived** once every entry in it is ticked or explicitly abandoned. Move the directory
to `archive/`, and record the outcome of each `SM-###` in the registry before you do.

## Why a registry, and not just the reports

`SM-###` has to be unique across the whole repository and survive its report being archived —
otherwise the tombstone rule is a promise nothing keeps. One file holds that, for exactly the reason
`docs/SPEC.md` §2.1 holds every `AC-###` in one place: **allocation and history need a single
address**, or the second person to allocate an id picks one already in use.

So the analogy is worth stating plainly, because it is the whole design:

| | Criteria | Smells |
| --- | --- | --- |
| The registry | `docs/SPEC.md` §2.1 | `docs/refactorings/SMELLS.md` |
| The unit of work | `docs/changes/NNNN-slug/` | `docs/refactorings/NNNN-slug/` |
| Retired entries | tombstoned, id kept | tombstoned, id kept |
| Cited by | tasks, implement, drift | refactoring reports |

---

## SMELLS.md

Every smell ever recorded, in one table, newest last. **Nothing is ever deleted from it** — a smell
that was paid off becomes a tombstone, and a smell that was judged not worth fixing keeps its row
so the next run does not re-litigate it.

```markdown
# Smell Registry

Allocation: next id is **SM-009**. Never reuse a retired id.

| ID | Smell | Where | Status |
|:-:|---|---|---|
| SM-001 | Divergent Change — auth and scheduling in one file | `src/scheduler.js` | ~~removed~~ R-01 of 0001 |
| SM-004 | Shotgun Surgery — one rule kind in four places | `src/scheduler.js:88` | **open** — actionable in 0003 |
| SM-005 | Long Parameter List — `publishWeek(7)` | `src/api/shifts.js:112` | logged, 0002 · nothing scheduled touches it |
| SM-006 | Primitive Obsession — `employeeId` is a bare string | throughout | **won't fix** — §5 specifies exactly this |
| SM-007 | Possibly dead — `legacyExport` | `src/export/legacy.js` | logged, 0002 · reached by a config key, unproven |
```

Four statuses, and no others: **open** (found, not yet paid), **removed** (with the entry that did
it), **logged** (real, not scheduled), **won't fix** (the constitution or the spec says otherwise).

The `Allocation:` line is the one thing to update before writing any new id. A run that allocates
from memory eventually collides with an archived report nobody had open.

---

## REPORT.md

One per run. It holds the work; the registry holds the identity.

```markdown
# 0003 — M3 rest-period rules

> Status: proposed · 2026-03-14 · baseline `npm test` green, 84 tests
> Static analysis: `npx knip@5` — 6 unused imports, 1 unused export
> Scheduled work considered: `TASKS.md` M3 (T-04..T-07)

## 1. Actionable

- [ ] R-01 Extract the conflict rules into a rule set — removes SM-004 — preserves AC-003, AC-007 — files: src/scheduler.js, src/api/shifts.js — kind: judgment
- [ ] R-02 Extract `toRange` and delete the two copies — removes SM-002 — preserves AC-003 — files: src/scheduler.js — kind: mechanical

### SM-004 · Shotgun Surgery — one conflict rule edits five places

`src/scheduler.js:88-140`, `src/api/shifts.js:31`, `src/ui/grid.jsx:204`, `src/export/csv.js:17`

Adding the rest-period rule in M3 means a new branch in the scheduler, a new field in the API
response, a new badge in the grid, and a new column in the export. Three of those four exist only
because the rules are a chain of `if`s rather than a list.

**R-01** turns each rule into an entry in one array, so M3 adds an entry and touches the grid once.
It preserves AC-003 and AC-007 by keeping the same rules in the same order, verified case by case
after the move.

## 2. Cleanup

Tool: `npx knip@5`. Evidence for every line; nothing here is a judgment call.

- [ ] CL-01 Remove 6 unused imports — files: src/scheduler.js, src/api/shifts.js
- [ ] CL-02 Delete `formatSlotLabel`, unused export — files: src/ui/grid.jsx:88

## 3. Logged this run

New smells that failed the gate. Recorded in `SMELLS.md`; no work proposed here.

| ID | Smell | Why not actionable |
| --- | --- | --- |
| SM-008 | Message Chains in the export path | Nothing scheduled touches it |

## 4. Routed to spec-architect

Findings that cannot be fixed without changing behaviour. These are not refactorings.

- The overlap check treats a zero-length shift as conflicting with itself. Fixing it changes what
  AC-003 asserts, so it needs a change proposal — not a line in this file.
```

---

## The line

```
- [ ] R-01 Extract the conflict rules into a rule set — removes SM-004 — preserves AC-003, AC-007 — files: src/scheduler.js — kind: judgment
```

| Field | Required | Rule |
| --- | --- | --- |
| `- [ ]` | yes | The checkbox is the only state. `- [x]` means verified green after, not merely applied |
| `R-NN` | yes | Two digits from `R-01`, scoped to this report. `R-`, not `T-` — this list preserves criteria rather than closing them |
| Title | yes | The named refactoring plus its object. "Extract Method" alone says nothing; "Extract `toRange`" does |
| `removes SM-###` | yes | The registry id this pays off. A refactoring that removes no recorded smell has no reason to exist |
| `preserves AC-###` | yes | Every criterion covering the touched code. **Verified by hand after the change**, not assumed |
| `files:` | yes | Expected surface. An estimate |
| `kind:` | yes | `mechanical` or `judgment` — see `refactoring-safety.md`. Judgment entries land one per commit |
| `depends: R-NN` | when needed | Earlier entries in this report only |

Order in the file is execution order: mechanical before judgment where they touch the same file, so
the judgment diff lands on code that has already been tidied.

**If a line cannot name a criterion to preserve**, the code it touches is uncovered by the spec.
Write `preserves: none recorded` and say in the notes that verification is by characterization test
or by inspection. Never invent a criterion to fill the field — §2.1 belongs to `spec-architect`, and
one invented here would be checked by stage 5 forever.

`CL-` and `R-` are scoped to one report and restart at 01 in the next one. They cite `SM-` and
`AC-###`; nothing cites them back, which is why they can restart and `SM-###` cannot.

---

## Two things a report never contains

- **A verify command.** It names the one from the constitution as a record of what was run. The
  constitution stays the only place a command may come *from*; a command written here would be an
  instruction from an editable file, which is how a Markdown file becomes remote code execution.
- **Code.** Snippets to locate a smell are fine — three lines, quoted. The rewritten version belongs
  in the commit, where it can be reviewed against a test run rather than agreed to in the abstract.

## Upgrading from a single REFACTORINGS.md

Version 3.0 wrote one `docs/REFACTORINGS.md` that each run overwrote. If one exists, move it to
`docs/refactorings/0001-<slug>/REPORT.md`, lift its smells into a new `SMELLS.md` keeping their ids,
and set the `Allocation:` line above the highest one. Do it once, say that you did it, and never
write the old path again.
