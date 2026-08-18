---
name: spec-drift
description: Stage 5 of 6 in the spec chain. Check whether the code still matches the project's technical spec, and realign whichever side is wrong. Use when the user asks if the spec is still accurate, wants a spec audit or drift check, says the docs are stale or out of date, is returning to a project after a break, is about to onboard someone (or a fresh Claude session) onto a codebase with a spec, or has just finished a milestone. Also use before writing a new feature against an existing spec, to confirm the ground it assumes is still real. Reads docs/SPEC.md (or SPEC.md) and reports gaps as regressions or staleness — never silently rewrites either side. Also closes out finished work: merges shipped change proposals into the spec, and archives completed refactoring runs after verifying the smells they claimed to remove are actually gone.
---

# Spec Drift

**Stage 5 of 6 — Drift.** Before doing anything else, print this banner so the user
can see where they are in the chain, filled in for this run:

```markdown
> **The spec chain — stage 5 of 6 · Drift**
>
> `1 constitution` · `2 spec` · `3 tasks` · `4 implement` · **▶ 5 drift** · `6 refactor`
>
> **Behind you:** code built against the spec — by this pipeline or by hand.
> **After this:** `/spec-refactor` if the code is right and the structure is what hurts — otherwise back to `/spec-architect` in delta mode for the next change. The chain loops; it does not end.
```

The chain starts at `/spec-constitution`. Then begin the workflow below, naming each phase as you enter it.
A user who cannot tell which step they are on cannot tell whether to interrupt.

A spec is only worth having if it's true. The moment the code and the document disagree, the document stops being a reference and becomes a liability — because people still trust it.

Your job is to find every place they disagree and, for each one, answer the only question that matters: **which side is wrong?**

## The rule that makes this safe

**Updating the spec to match the code is the dangerous default.** It is fast, it always "resolves" the gap, and it silently blesses every regression as intended behavior. Do it wrongly once and the spec now documents the bug.

So:

> **A gap against a section that recorded a *reason* is a regression until proven otherwise.**

§3 Decisions, §8 Edge Cases, and §9 Security exist precisely because someone thought about them and wrote down why. If the code contradicts one of those, the overwhelmingly likely story is that a later session didn't know. Treat it as a bug in the code, and make the user actively override you to rule otherwise.

A gap against a section that merely *describes* — a field that got added, an endpoint that got renamed — is ordinary staleness. Update the spec.

---

## Workflow

### Phase 0 — Find the spec

Look for `docs/SPEC.md`, then `SPEC.md`, then any `*.spec.md` in `docs/`. If there's more than one, ask which.

Then list `docs/changes/` for proposals that are not archived. Each one is either **pending** (tasks unfinished — its criteria are not yet promises the code must keep) or **shipped** (every task ticked — it is ready to merge in Phase 6). Read `docs/CONSTITUTION.md` too, if present; §4 claims are checked against it rather than against the spec.

List `docs/refactorings/` the same way, if it exists. A run whose `REPORT.md` entries are all ticked is ready to sweep in Phase 7; one with unchecked entries is in progress and is left alone. Read `docs/refactorings/SMELLS.md` now — the `preserves AC-###` lines in an unarchived run tell you which criteria to look at hardest in Phase 2.

If there is none, stop and say so — offer `spec-architect` to write one. Do not invent a spec to check against; a reconstructed spec compared to the code it was reconstructed from finds nothing.

Note the spec's `Status:` line if it has one. A spec last touched six months and forty commits ago will drift heavily, and the report should open by saying so rather than dumping ninety findings.

### Phase 1 — Extract checkable claims

Most of a spec is prose that no tool can verify — *"shift managers rebuild the schedule in Excel"* is context, not an assertion about the code.

Read `references/checkable-claims.md`. It lists, per section, exactly what can be mechanically confirmed and how to confirm it. Work only from that list. Inventing checks produces confident findings about things the spec never claimed, which is the fastest way to make this skill untrustworthy.

Roughly, the checkable surface is:

| Section | What can actually be verified |
| --- | --- |
| §2.1 Criteria | **Each active `AC-###` holds in the code.** The largest and sharpest surface — these are assertions, not description |
| §3 Architecture | Named components exist; forbidden dependencies absent |
| §4 Conventions | Directory layout, dependency direction, naming, size limits |
| §5 Data Models | Every field, type, nullability, constraint, index |
| §6 Interfaces | Every endpoint / channel / command, and its payload |
| §8 Edge Cases | The handling each case specifies is present in code |
| §9 Security | The stated enforcement point exists and is actually used |

### Phase 2 — Verify

For each claim, go find the truth in the code. Read files; don't infer from names. A finding you cannot point at a file and line for is not a finding — drop it.

Search widely before concluding something is missing. An endpoint absent from `routes/` may be registered in a plugin file; a constraint absent from the model may live in a migration. Reporting a false "missing" trains the user to ignore the whole report.

### Phase 3 — Classify each gap

Read `references/verdicts.md`. Every gap lands in exactly one bucket:

**Regression** — the code contradicts a section that recorded a reason. The spec is right; the code broke. Highest priority, always reported first, and each one names the reason it violated so the user can see what was lost.

**Staleness** — the code did something new or different, and no stated reason forbade it. The spec is out of date. Update the document.

**Undecided** — both sides changed, or the spec's own intent is ambiguous. Do not guess. Present both readings and let the user pick.

If a gap doesn't clearly fit, it's Undecided. Forcing a verdict is worse than admitting one is needed.

### Phase 4 — Report before touching anything

Show the whole picture first. Regressions at the top, then staleness, then undecided. For each:

```
§8 Edge Cases — "endMinute may exceed 1440 for overnight shifts"
   src-core/domain/shift.rs:47   rejects endMinute > 1439

   REGRESSION. The spec recorded why: a night shift that runs 22:00 → 06:00
   is otherwise unrepresentable, and overlap detection silently stops working.
   The validation added here reintroduces exactly that bug.

   → Fix the code (remove the upper bound, keep 0 ≤ startMinute ≤ 1439)
   → Or: the requirement genuinely changed — update §8 and say what replaced it
```

Every entry carries: the spec claim, the file and line, the verdict, and the concrete fix for each direction. Never present a gap without a recommendation — an unranked list of forty differences is the same as no report.

Then let the user choose. Batch the decisions into one `AskUserQuestion` call where the host agent provides it; where it does not, present them as one numbered list in a single message and wait for one reply. Never walk through them one at a time.

### Phase 5 — Apply

Fix only what the user accepted.

- **Fixing code:** make the minimal change that satisfies the spec claim. If the fix is larger than a few lines, say so and stop — a drift check is not a refactor, and `/spec-refactor` is the stage that owns structural work.
- **Updating the spec:** edit the section in place, keep its voice and structure, and never delete a recorded reason. If a Decision genuinely reversed, rewrite it as a Decision with the new choice and what changed — the record of *why* is the most valuable thing in the document, and quietly dropping it is how a spec turns back into prose.
- **New things with no home:** a component or endpoint the spec never mentioned gets added to the right section, not appended to the end.

Finally, bump the spec's version or date line if it has one, and report what you changed on each side.

### Phase 6 — Merge shipped changes

A change proposal whose tasks are all ticked has earned its way into the spec. Read `references/merge.md`, then for each shipped proposal:

1. **Check for conflicts.** If another unarchived proposal edits a section this one edits, merge neither. Report the overlap and let the user sequence them — resolving it yourself is a design decision wearing a merge's clothing.
2. **Apply each section edit** in place, in the spec's own voice. Never append a "Changes" section at the end; a component belongs in §3, a field in §5.
3. **Promote the motivation** into §3 Decisions if the change made an architectural choice. This is the reason a future reader needs, and the proposal is about to be archived.
4. **Add and retire criteria.** New ones keep their IDs. Retired ones become tombstones in §2.1 — struck through, with the ordinal that retired them. Never renumber; every archived task list still cites these.
5. **Move the directory** to `docs/changes/archive/` and record the ordinal in the spec's merged-changes line.

**Never merge a pending proposal.** Its criteria describe intent, not obligation, and checking code against them produces findings for work nobody has started.

### Phase 7 — Sweep finished refactoring runs

A refactoring run has nothing to merge — it added no criteria and retired none, which is what `preserves` means. What it needs is the opposite of a merge: **someone checking that the work it ticked off actually happened.**

That is this skill's job and no other stage can do it. `spec-refactor` proposed the work and `spec-implement` applied it; both were inside the change. This is the only stage that reads the document and the code as two separate sources.

Read `references/refactoring-sweep.md`, then for each run whose entries are all ticked or explicitly abandoned:

1. **Re-check each smell it claimed to remove.** The report said where to look and how many places — go and count again. A smell that merely moved is not removed.
2. **Cross-reference the `preserves` lines against Phase 2.** You already checked every criterion. If a failing one is cited by an `R-NN` that promised to preserve it, the regression gets its cause named — a far better finding than the same failure reported anonymously.
3. **Update `SMELLS.md`.** Confirmed removals become tombstones naming the entry and ordinal that did it. Abandoned entries return to **logged** with the reason. Rows marked **won't fix** are never touched by a sweep. Never lower the `Allocation:` line.
4. **Move the directory** to `docs/refactorings/archive/`.

**A run whose claims do not hold is not archived**, whatever its checkboxes say. Report what the report promised, what the code shows, and stop — marking an unremoved smell `removed` in the registry would make that untruth permanent, and the registry is the one file the next six months of runs will trust.

**Never sweep a run that is still in progress.** Two entries taken this week and three left for next is normal. Archiving it strands the remainder where nobody will look again.

If the spec has no §2.1 at all — a v1 spec — offer a one-time backfill: rewrite the assertions already present in §2, §7, §8, and §9 as EARS criteria without inventing behavior the spec never claimed. Offer it once, do it only if accepted, and never fold it into an unrelated drift report.

---

## Calibration

Match the report to the drift. A spec checked weekly should usually come back clean — say so in one line and stop. A spec untouched for months against an active codebase will have real divergence; lead with the three findings that matter and summarize the rest rather than producing a wall.

**Silence is a valid result.** "No drift found across §4, §5, §6, §8, §9" is a useful thing to be told. Never manufacture findings to look thorough.

## Reference files

- `references/checkable-claims.md` — per section: what is verifiable, and how to verify it
- `references/verdicts.md` — classifying each gap, and how to write the fix on either side
- `references/merge.md` — folding a shipped proposal into the spec without losing a reason
- `references/refactoring-sweep.md` — verifying, recording and archiving a finished refactoring run

## Related

`spec-architect` writes the spec this skill checks, and the change proposals it merges. `spec-tasks` and `spec-implement` sit between them. If the project has no spec yet, `spec-architect` is the one to run first.

`spec-refactor` answers the question this skill cannot: whether code that satisfies every criterion is still shaped to accept the next one. A clean drift report is its precondition — structure is only worth arguing about once behavior is right — and this skill closes its runs out afterwards, so the lifecycle of a change and the lifecycle of a refactoring both end in the same place.
