# Task Format

Sizing, ordering, and the exact line shape `spec-implement` reads.

---

## The line

```
- [ ] T-01 Create the JSON store with load and save — closes AC-001 — files: src/store.js
- [ ] T-02 Deduplicate on add — closes AC-002 — files: src/store.js — depends: T-01
```

| Field | Required | Rule |
| --- | --- | --- |
| `- [ ]` | yes | The checkbox is the only state. `- [x]` means verified, not merely written |
| `T-NN` | yes | Two digits, sequential from `T-01`, scoped to this file |
| Title | yes | What changes, in the imperative. Not "store handling" — "deduplicate on add" |
| `closes AC-###` | yes | One or more, comma-separated. Must exist in the source spec |
| `files:` | yes | Paths expected to be created or modified. An estimate, not a contract |
| `depends: T-NN` | when needed | Earlier tasks only. A forward reference is invalid |

Order in the file **is** execution order. `spec-implement` walks the list top to bottom and does not reorder.

---

## Sizing

**One task is one sitting and one verifiable outcome.**

| Symptom | Diagnosis | Fix |
| --- | --- | --- |
| The title contains "and" joining unrelated work | Two tasks | Split |
| It closes six criteria across three files | Too big to verify as one thing | Split by criterion group |
| It cannot be verified without finishing the next task | Not independently verifiable | Merge with the next |
| It closes nothing | Unnecessary, or the spec is missing a requirement | Delete, or go fix the spec |
| It's "set up the project" | Not demoable, and it hides real decisions | Fold the setup into the first real task |

Twelve tasks is a comfortable ceiling for one milestone. Past twenty, the milestone is too big — say so and propose the split rather than writing a wall.

### What is not a task

- **"Write tests for X."** Tests are part of the task that makes X true, not a separate step. A task list where testing is deferred to the end produces a codebase where testing is deferred forever.
- **"Refactor Y."** Unless a criterion requires it, this is drive-by work. Out of scope.
- **"Research Z."** If a decision is unmade, it belongs in the spec's Open Questions, blocking this milestone — not hidden as a task.

---

## Ordering

Sort by dependency first, then by demo value.

1. **Dependency.** `depends:` may reference only earlier tasks. This is what lets `spec-implement` be a single forward pass with no scheduler — the simplest thing that works, and the reason a stopped run resumes cleanly.
2. **Demo value.** Among tasks with no dependency between them, do the one that makes something visible first. A milestone whose first three tasks produce nothing observable is a milestone nobody can course-correct.

Data models usually come first, not because of layering dogma, but because every later task's verification reads them.

---

## Coverage matrix

Build this before writing the file. Two directions, two different failures:

```
                    AC-001  AC-002  AC-003  AC-004  AC-005
T-01 store            ●
T-02 dedup                    ●
T-03 fetch                            ●               ●
T-04 archive lock                             ●
```

- **A row with no dot** → the task closes nothing. Delete it, or find the missing criterion.
- **A column with no dot** → the criterion is unbuilt. Nothing downstream will catch this: `spec-implement` verifies only what a task cites, so an uncited criterion is never checked and never implemented. Report it explicitly.

A criterion may legitimately have no column in *this* slice if it belongs to a later milestone. Say which one, so the gap is a schedule, not an omission.

---

## Specs without §2.1

For a v1 spec with no criteria, keep the format and replace citations with an inline statement of done:

```
- [ ] T-01 Create the JSON store with load and save — done when: a URL survives a restart — files: src/store.js
```

Rules that still hold: one sitting, one outcome, forward-only dependencies, order is execution order.

Say once, in the handover, that the spec predates §2.1 and `spec-architect` can backfill it. Do not repeat the warning per task, and do not refuse to work.

---

## Worked example

```markdown
# M1 Capture and list — Tasks

> Source: docs/SPEC.md §10 M1 · Constitution: docs/CONSTITUTION.md
> Verify: `npm test`

- [ ] T-01 Create the JSON store with load and save — closes AC-001 — files: src/store.js
- [ ] T-02 Deduplicate on add by canonical URL — closes AC-002 — files: src/store.js — depends: T-01
- [ ] T-03 Fetch titles with a 5s timeout, storing unresolved on expiry — closes AC-003, AC-005 — files: src/fetch.js
- [ ] T-04 Refuse writes while the archive is open — closes AC-004 — files: src/store.js — depends: T-01
```

Four tasks, five criteria, no orphans in either direction. `T-03` closes two criteria because both are satisfied by the same fetch path — splitting them would create a task that cannot be verified alone.
