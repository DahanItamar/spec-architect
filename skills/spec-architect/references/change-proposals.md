# Change Proposals

Delta mode. What to write when `docs/SPEC.md` already exists.

---

## Why not just edit the spec

Three reasons, in order of how much they cost when ignored:

1. **The reasoning is the asset.** §3 Decisions, §8 Edge Cases, and §9 Security record *why*. Rewriting the spec for feature 4 deletes the reasons that made features 1–3 correct — silently, with no diff anyone reads.
2. **A proposal is reviewable.** A rewritten spec is a 900-line diff nobody reads. A proposal is one page, and the reviewer can see exactly what changes.
3. **The spec must stay loadable.** It exists to be read whole into a fresh context. Growing it by a full feature description every time ends that.

So: the spec is the truth, and a proposal is a pending amendment. `spec-drift` merges it once the work ships.

---

## The directory

```
docs/changes/
├── 0004-shift-templates/
│   ├── PROPOSAL.md
│   └── TASKS.md            ← written later by spec-tasks
└── archive/
    ├── 0001-m1-scheduling/
    └── 0002-pdf-export/
```

**Ordinals** are four digits, monotonic, never reused — including across `archive/`. Find the next one by scanning both directories; do not guess from the highest you happen to see.

**Slugs** are ASCII kebab-case, truncated at 40 characters. The full title lives in the document.

---

## The document

```markdown
# 0004 — Shift templates

> Status: proposed · <date> · Against spec version 2.0

## Motivation

<Why now. Two or three sentences. This is the part that survives into §3 Decisions
after the merge — write it as the reason a future reader needs, not as a ticket summary.>

## Criteria added

| ID | Criterion |
| --- | --- |
| AC-041 | When a manager applies a template, the scheduler shall create one shift per template row. |
| AC-042 | If a template row conflicts with an existing shift, then the scheduler shall skip that row and report it. |

## Criteria retired

| ID | Reason |
| --- | --- |
| AC-018 | Weekly copy replaced by templates; the copy path no longer exists. |

## Section edits

### §3 Architecture — Components — add

| Component | Responsibility | Technology |
| --- | --- | --- |
| Template store | Holds reusable shift patterns. Does not schedule. | SQLite table |

### §5 Data Models — add

```ts
interface ShiftTemplate {
  id: string;
  name: string;
  rows: TemplateRow[];
}
```

### §8 Edge Cases — replace

**Before:** | Duplicate week copy | Two identical shifts | Reject the second |
**After:** | Template row conflicts | Silent double-booking | Skip the row, report it | AC-042 |
**Reason:** the copy path this row described is retired by this change; the same
failure now arrives through templates and needs the reporting behavior AC-042 states.

## Impact

- Milestones affected: M4
- Criteria added: 2 · retired: 1
- No change to §9 Security
```

---

## Section edits

Every edit names its section, its operation, and — for the sections that record reasons — why.

| Operation | Requires a reason | Note |
| --- | --- | --- |
| `add` | no | New content, nothing displaced |
| `replace` | **yes**, for §3, §8, §9 | Show before and after; a reader must see what was lost |
| `remove` | **yes**, always | The most dangerous operation in the system |

### The rule that makes this safe

> **Removing or replacing an item in §3 Decisions, §8 Edge Cases, or §9 Security without a stated reason is not permitted.**

Those three sections exist because someone thought about a problem and wrote down the conclusion. An unexplained reversal is indistinguishable from a later session not knowing — which is precisely what `spec-drift` classifies as a regression. Stating the reason converts it into a decision on the record.

When a §3 Decision genuinely reverses, do not delete it. Write the new decision with what changed:

```
**Storage** — Postgres
Because: two writers now exist (0004), which SQLite's single-writer model cannot serve
Instead of: SQLite — the original choice; correct while the app was single-user
Revisit if: the second writer is removed
```

The old reason stays visible. That is the whole point.

---

## Criteria in a proposal

- **Continue the repo-wide sequence.** If the spec ends at `AC-040`, this proposal starts at `AC-041`. Never restart at 001 per feature — IDs are unique across the repository, including archived proposals, because an archived task list still cites them.
- **Retiring is not deleting.** A retired criterion becomes a tombstone in §2.1 on merge, keeping its ID forever. One line, and every old citation still resolves.
- **Retire explicitly, never by omission.** A criterion the proposal simply stops mentioning is still active, and `spec-drift` will keep checking it.

---

## Conflicts with other open proposals

Before writing, list the other directories under `docs/changes/` that are not archived, and read their `Section edits`.

If another open proposal edits a section you are about to edit:

- **Say so in `## Impact`**, naming the ordinal and the section.
- **Do not resolve it yourself.** Two proposals editing §5 in incompatible ways is a sequencing decision the user makes, not a merge you perform.
- `spec-drift` refuses to merge either one until the overlap is resolved.

Independent proposals touching different sections merge in any order. That is the common case, and it needs no coordination.

---

## What delta mode does not change

Everything else in `spec-architect` still applies: one round of questions, decide rather than ask, delete anything that could be removed with the product still working, numbered assumptions for calls the user did not authorize.

Two additions specific to this mode:

- **Question budget is lower.** The spec already answered the architectural forks. Three questions is generous; often none are needed, because the constraint set is already written down.
- **Check the change against §8 before proposing it.** A new feature that reintroduces a failure mode §8 already solved is the single most common regression, and it is cheapest to catch here — before a task list exists, before code is written, and before `spec-drift` has to explain what was lost.
