# Refactoring Safety

Behavior preservation as a property you check rather than a promise you make.

---

## The invariance test

Before proposing any refactoring, answer three questions. A "no" to any of them means it is not a
refactoring and does not belong in the report.

1. **Does every `AC-###` covering this code stay true, word for word?**
   Not "still roughly holds". The criterion is a sentence with a trigger and a response; both must
   survive unchanged.
2. **Would a caller notice?** Return shapes, error types, thrown vs returned failures, ordering,
   timing, log lines someone parses, the wire format of anything persisted. A refactoring that
   changes a public signature is fine only if every call site moves with it in the same commit.
3. **Can it be reverted with `git revert` alone?** If it needs a data migration, a config change, or
   a deploy step, it is a change, not a refactoring.

If the answer is no, stop and write down which criterion would have to change. That sentence is the
input `/spec-architect` needs, and it is worth more than the refactoring you were about to do.

## The tells that it is really a change proposal

| What you are about to do | Why it is not a refactoring |
| --- | --- |
| "Also fix the off-by-one while I'm here" | A behavior change. It needs a criterion, and probably a test that fails first |
| "Tighten this validation" | Rejects input that used to be accepted — visible to a caller |
| "Make this async" | Changes ordering and error propagation for everyone downstream |
| "Normalise this table" | Needs a migration; cannot be reverted by reverting the diff |
| "Replace this library" | Different behavior at the edges, always, and nobody knows which edges yet |
| "Remove this unused endpoint" | Cleanup, and only with the evidence `cleanup-gate.md` requires |
| "Rename this concept everywhere" | A refactoring — but the spec uses the old name, so §3 and §5 move too. Say so |

That last row is the common one. A rename that leaves the spec talking about `Employee.name` while
the code says `displayName` has manufactured drift for stage 5 to find. Rename in both, in one
commit, and note it in the handover.

## Mechanical or judgment

Split every proposed refactoring into one of two kinds, and treat them differently in the document.

| | **Mechanical** | **Judgment** |
| --- | --- | --- |
| Examples | Extract Method, Rename, Inline Variable, Move Method, Introduce Parameter Object | Extract Class, Replace Conditional with Polymorphism, collapsing a hierarchy |
| Correctness | Readable in the diff — the same statements, in a new place | Needs a reviewer who knows the domain |
| Failure mode | A missed call site, caught by the verify command | A wrong seam, which is harder to undo than it was to do |
| Batch size | Several per commit is acceptable if they are one kind | **One per commit, always** |

If a judgment refactoring cannot be described in two sentences — what moves, and what the new seam
is — it is not understood well enough to propose.

## The procedure

For each accepted line, in order:

1. **Verify green.** The baseline from Phase 1, re-confirmed if anything has changed since.
2. **Do exactly one refactoring.** Nothing else in the diff — no formatting sweeps, no renamed
   variables you noticed, no import reordering that the tool did not require.
3. **Verify again.** Same command, and read each cited `AC-###` against the new code specifically.
   A green suite is not the same as a satisfied criterion — it only proves nothing *tested* changed.
4. **Commit on its own**, naming the `SM-###` it removes and the criteria it preserves.
5. **On red: revert, do not fix forward.** The whole value of one-refactoring-per-commit is that a
   failure has exactly one cause. Debugging your way out of it forfeits that and usually produces
   the behavior change you were avoiding.

## When there are no tests

This is the common case in the code most worth refactoring, and it needs saying out loud rather
than working around.

**Without a verify command that covers the area, a refactoring is unverified — say so plainly.**
Then choose one of three, in this order of preference:

1. **Write a characterization test first.** It pins current behavior, including behavior nobody
   intended. It is not an acceptance criterion and must never be added to §2.1 as one — it records
   what the code *does*, not what the spec *requires*. Say which it is in the test's own name.
2. **Narrow the refactoring** to moves whose correctness is fully readable in the diff — extract,
   rename, inline. Skip anything that changes control flow.
3. **Do nothing and report that.** Untested code with no scheduled change against it is not an
   emergency. Untested code with a milestone landing on it needs the test, and that is a task for
   `/spec-tasks`, not something to smuggle into a refactoring.

## Diff discipline

The reviewable diff is the deliverable. Three rules produce one:

- **Never mix a move with an edit.** Move a function in one commit, change it in the next. A diff
  that does both shows the whole function as new and hides the edit inside it.
- **Never mix formatting with structure.** If the formatter has never run on this file, run it in
  its own commit, first, and say so.
- **Never bundle the cleanup with the refactoring.** Dead code removal is a separate commit with a
  separate justification, per `cleanup-gate.md`.

## The one thing to report either way

Whether the run ends with five refactorings or none, the handover states: the baseline result, what
was accepted, what was left logged, and **which criteria were re-verified by hand** after each
change. That last item is what makes the claim of behavior preservation checkable by someone who
was not here.
