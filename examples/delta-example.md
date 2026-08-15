# A Change, End to End

What happens when a project that already shipped gets its next feature. This is the path v1 had no answer for.

---

## The starting point

```
docs/
├── CONSTITUTION.md
├── SPEC.md                  40 criteria, AC-001 … AC-040
└── changes/archive/
    ├── 0001-m1-scheduling/
    ├── 0002-m2-conflicts/
    └── 0003-m3-pdf-export/
```

Three shipped changes. The spec is 380 lines and still loads whole into one context — because the detail lives in the archived proposals, not in the spec.

---

## 1. The request

```
"Add shift templates — managers rebuild the same Tuesday every week."
```

`spec-architect` finds `docs/SPEC.md`, so it is in **delta mode**. No question about it, and no question to the user: the mode is detected.

It reads the spec in full first — §3 Decisions, §8 Edge Cases, §9 Security especially. Then it asks **one** question, not five, because the architectural forks were settled in week 1 and are written down:

> **Does applying a template overwrite existing shifts, or skip the conflicts?**
> → *Skip and report. Overwriting has lost people's work before.*

---

## 2. The proposal

`docs/changes/0004-shift-templates/PROPOSAL.md`:

```markdown
# 0004 — Shift templates

> Status: proposed · 2026-03-02 · Against spec version 2.1

## Motivation

Managers rebuild the same Tuesday every week by hand. Templates are the smallest
structure that removes the retyping without introducing a scheduling language.

## Criteria added

| AC-041 | When a manager applies a template, the scheduler shall create one shift per row. |
| AC-042 | If a template row conflicts with an existing shift, then the scheduler shall skip that row and report it. |

## Criteria retired

| AC-018 | Weekly copy replaced by templates; the copy path no longer exists. |

## Section edits

### §5 Data Models — add
### §8 Edge Cases — replace
**Reason:** the double-booking this row described now arrives through templates
instead of the copy path, and needs the reporting behavior AC-042 states.

## Impact
- Milestones affected: M4 · Criteria added: 2 · retired: 1
- No change to §9 Security
```

Three things this shape buys:

- **`docs/SPEC.md` is untouched.** The reviewer reads one page, not a 380-line diff.
- **`AC-041` continues the sequence.** Not `AC-001` — ids are unique across the repo, including the three archived directories, whose task lists still cite theirs.
- **The §8 replace carries a reason.** Without one, the proposal would be refused: §8 records reasons, and an unexplained reversal is indistinguishable from a later session not knowing.

**AC-042 exists because of a check that happens here and nowhere else.** Reading §8 before proposing, `spec-architect` found that templates can reintroduce the double-booking the copy path already solved. Catching it now costs a sentence.

---

## 3. Tasks and build

```
docs/changes/0004-shift-templates/TASKS.md
```

```
- [ ] T-01 Add the template store — closes AC-041 — files: src/db/templates.ts
- [ ] T-02 Apply a template, skipping conflicts — closes AC-042 — files: src/domain/apply.ts — depends: T-01
```

`spec-implement` runs them in order. On `T-02` it has to force the unwanted condition — an actual conflicting row, not an assumption that the skip works. That is what the `If … then …` pattern is for.

---

## 4. The merge

```
"Everything's ticked. Is the spec still true?"
```

`spec-drift` verifies the criteria against the code, then merges:

| Step | Result |
| --- | --- |
| Conflict check | No other unarchived proposal edits §5 or §8 — clear to merge |
| Section edits | Applied in place, in the spec's own voice |
| Motivation | Promoted into §3 Decisions as the `Because:` line |
| `AC-041`, `AC-042` | Added to §2.1, keeping their ids |
| `AC-018` | `~~AC-018~~ *Retired in 0004-shift-templates — weekly copy replaced by templates.*` |
| Directory | Moved to `docs/changes/archive/0004-shift-templates/` |

The spec grew by about twenty lines and gained two criteria, one tombstone, and one decision with its reason attached.

---

## What the conflict case looks like

If `0005-shift-swaps` were also open and also editing §5:

```
CONFLICT on §5 Data Models

   0004-shift-templates  edits §5, §8
   0005-shift-swaps      edits §5

   Neither merges.

   → Merge 0004 first, then rebase 0005's §5 edit onto the result
   → Or: 0005 is the wanted shape — withdraw 0004's §5 edit and say why
```

Reported, not resolved. Picking an order silently is how one feature's data model quietly overwrites another's, leaving no trace of the loser.
