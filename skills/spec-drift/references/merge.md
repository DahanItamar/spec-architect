# Merge

Folding a shipped change proposal into the spec without losing a reason.

---

## When a proposal is mergeable

All four must hold:

1. **Every task in its `TASKS.md` is ticked.** A pending proposal describes intent, not obligation.
2. **The code actually satisfies its criteria.** Verify them like any other claim — a ticked checkbox is a report, not proof. A criterion the code doesn't meet is a regression to report, and it blocks the merge.
3. **No unarchived proposal edits the same section.** See Conflicts below.
4. **Every `replace` or `remove` against §3, §8, or §9 carries a reason.** Without one, the proposal is asking you to delete a recorded decision silently. Refuse, and say which edit is missing its reason.

---

## Applying edits

**Edit the section in place, in the spec's own voice.** The merged spec must read as though it was always written that way — no "Added in 0004" annotations, no changelog section at the bottom. A component belongs in §3's table; a field belongs in §5's interface; an edge case belongs in §8's table.

| Operation | How |
| --- | --- |
| `add` | Insert into the right section, in the existing order convention (usually the order things happen, not alphabetical) |
| `replace` | Swap the content; carry the reason into §3 Decisions if it was a decision |
| `remove` | Delete the item — but never the reason. See below |

### Never delete a reason

When a §3 Decision reverses, the old one does not disappear. Rewrite it as a decision with the new choice and what changed:

```
**Storage** — Postgres
Because: two writers now exist (0004), which SQLite's single-writer model cannot serve
Instead of: SQLite — the original choice, correct while the app was single-user
Revisit if: the second writer is removed
```

The record of *why* is the most valuable content in the document. A merge that quietly drops it turns the spec back into prose, and the next `spec-drift` run has nothing to distinguish a regression from an intended change.

### Promote the motivation

The proposal's `## Motivation` was written for a reviewer who is about to disappear — the directory is being archived. If the change made an architectural choice, that motivation becomes the `Because:` line of a §3 Decision. If it made no architectural choice, it is discarded, and that is correct.

---

## Criteria

- **Added criteria keep their IDs.** They were allocated from the repo-wide sequence when the proposal was written. Never renumber to close gaps — gaps are normal and every archived task list still cites these IDs.
- **Retired criteria become tombstones** in §2.1, struck through, naming the ordinal that retired them:

  ```markdown
  | ~~AC-018~~ | *Retired in 0004-shift-templates — weekly copy replaced by templates.* |
  ```

  One line. It keeps every old citation resolvable and tells a reader the requirement was dropped deliberately rather than lost.

- **Never reuse a retired ID.** This is the constraint that makes archived task lists safe to read years later.

---

## Conflicts

Two unarchived proposals editing the same spec section is a **sequencing decision, not a merge**.

```
0004-shift-templates  edits §5 Data Models, §8 Edge Cases
0005-shift-swaps      edits §5 Data Models

   CONFLICT on §5. Neither merges.

   → Merge 0004 first, then rebase 0005's §5 edit onto the result
   → Or: 0005 is the wanted shape — withdraw 0004's §5 edit and say why
```

Report it and stop. Choosing an order silently is how one feature's data model quietly overwrites another's, and the loser leaves no trace.

Proposals touching different sections merge in any order and need no coordination. That is the common case.

---

## After merging

1. Move the directory to `docs/changes/archive/`, keeping its ordinal and slug. Never delete it — it holds the review trail and the `TASKS.md` whose citations must stay resolvable.
2. Record the ordinal in the spec's merged-changes line.
3. Bump the spec's version and date.
4. Report, per proposal: sections edited, criteria added, criteria retired, and anything you declined to merge with the reason.

## What a merge is not

- **Not a rewrite.** Only the sections the proposal names.
- **Not a cleanup.** Fixing unrelated staleness during a merge produces a diff nobody can review. That is ordinary drift; report it separately.
- **Not automatic.** Report first, apply what the user accepts. A merge that silently blesses a regression is the exact failure this skill exists to prevent — the direction is just different.
