# The REFACTORINGS.md Template

The shape of the document, the line format `spec-implement` reads, and the identifier rules.

---

## The line

```
- [ ] R-01 Extract the conflict rules into a rule set — removes SM-004 — preserves AC-003, AC-007 — files: src/scheduler.js, src/api/shifts.js — kind: judgment
- [ ] R-02 Extract `toRange` and delete the two copies — removes SM-002 — preserves AC-003 — files: src/scheduler.js — kind: mechanical
```

| Field | Required | Rule |
| --- | --- | --- |
| `- [ ]` | yes | The checkbox is the only state. `- [x]` means verified green after, not merely applied |
| `R-NN` | yes | Two digits from `R-01`, scoped to this file. `R-`, not `T-` — this list preserves criteria rather than closing them |
| Title | yes | The named refactoring plus its object. "Extract Method" alone says nothing; "Extract `toRange`" does |
| `removes SM-###` | yes | The smell this pays off. A refactoring that removes no recorded smell has no reason to exist |
| `preserves AC-###` | yes | Every criterion covering the touched code. **Verified by hand after the change**, not assumed |
| `files:` | yes | Expected surface. An estimate |
| `kind:` | yes | `mechanical` or `judgment` — see `refactoring-safety.md`. Judgment items are one per commit |
| `depends: R-NN` | when needed | Earlier entries only |

Order in the file is execution order: mechanical before judgment where they touch the same file, so
the judgment diff lands on code that has already been tidied.

**If a line cannot name a criterion to preserve**, the code it touches is uncovered by the spec.
That is worth stating in the document — write `preserves: none recorded` and say in the notes that
verification is by characterization test or by inspection. Never invent a criterion to fill the
field; §2.1 belongs to `spec-architect`, and a criterion invented here would be checked by stage 5
forever.

---

## Identifiers

`SM-` and three digits, `CL-` and two, `R-` and two.

1. **`SM-###` is unique across the repository and never reused**, exactly like `AC-###`. A smell
   that gets paid off stays in the document, struck through, with the `R-NN` that removed it.
2. **That tombstone is the point.** When the same smell reappears in the same file six months later,
   the record that it was already removed once is the strongest argument available for fixing the
   cause rather than the instance.
3. `CL-` and `R-` are scoped to one run of this document and may restart. They cite `SM-` and
   `AC-###`; nothing cites them back.

---

## The document

```markdown
# Refactoring Report

Baseline: `npm test` — **green**, 84 tests, 2026-03-14
Static analysis: `npx knip@5` — 6 unused imports, 1 unused export
Scheduled work considered: `TASKS.md` M3 "rest-period rules" (T-04..T-07)

## 1. Actionable

Smells that block scheduled work. Each is a Change Preventer for the milestone named.

- [ ] R-01 Extract the conflict rules into a rule set — removes SM-004 — preserves AC-003, AC-007 — files: src/scheduler.js, src/api/shifts.js — kind: judgment
- [ ] R-02 Extract `toRange` and delete the two copies — removes SM-002 — preserves AC-003 — files: src/scheduler.js — kind: mechanical

### SM-004 · Shotgun Surgery — one conflict rule edits five places

`src/scheduler.js:88-140`, `src/api/shifts.js:31`, `src/ui/grid.jsx:204`,
`src/export/csv.js:17`, `tests/scheduler.test.js:56`

Adding the rest-period rule in M3 means a new branch in the scheduler, a new field in the API
response, a new badge in the grid, a new column in the export, and a new fixture. Four of those
five edits exist only because the rules are a chain of `if`s rather than a list.

**R-01** turns each rule into an entry in one array with a shared shape, so M3 adds an entry and
touches the grid once for the new label. It preserves AC-003 and AC-007 by keeping the same rules
in the same order, verified case by case after the move.

### SM-002 · Duplicate Code — three copies of the same date arithmetic, already diverged

`src/scheduler.js:41`, `src/export/csv.js:9`, `src/ui/grid.jsx:77`

The scheduler and the export compute a day number in UTC. The grid copy uses the local-time `Date`
constructor. No criterion covers the grid's tooltip, so nothing catches the disagreement — until a
user west of UTC opens a Sunday shift.

## 2. Cleanup

Tool: `npx knip@5`. Evidence for every line; nothing here is a judgment call.

- [ ] CL-01 Remove 6 unused imports — files: src/scheduler.js, src/api/shifts.js
- [ ] CL-02 Delete `formatSlotLabel`, unused export — files: src/ui/grid.jsx:88

## 3. Logged — real, not scheduled

No work proposed. Recorded so the second occurrence has a history.

| ID | Smell | Where | Why it is not actionable |
| --- | --- | --- | --- |
| SM-005 | Long Parameter List — `publishWeek(7 params)` | src/api/shifts.js:112 | Nothing scheduled touches it; callers are 2 |
| SM-006 | Primitive Obsession — `employeeId` is a bare string | throughout | §5 specifies exactly this. Constitution wins |
| SM-007 | Possibly dead — `legacyExport` | src/export/legacy.js | Could not prove it: reached by a config key, not an import |

## 4. Routed to spec-architect

Findings that cannot be fixed without changing behavior. These are not refactorings.

- The overlap check treats a zero-length shift as conflicting with itself. Fixing it changes what
  AC-003 asserts, so it needs a change proposal — not a line in this file.

## Tombstones

- ~~SM-001 Divergent Change — `scheduler.js` handled auth and scheduling~~ — removed by R-01, 2026-02-02
```

---

## Two things this document never contains

- **A verify command.** It names the one from the constitution as a record of what was run. The
  constitution stays the only place a command may come *from*; a command written here would be an
  instruction from an editable file, which is how a Markdown file becomes remote code execution.
- **Code.** Snippets to locate a smell are fine — three lines, quoted. The rewritten version belongs
  in the commit, where it can be reviewed against a test run rather than agreed to in the abstract.
