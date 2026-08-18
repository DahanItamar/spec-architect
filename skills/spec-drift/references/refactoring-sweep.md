# Refactoring Sweep

Closing out a finished refactoring run: verifying what it claimed, updating the registry, archiving
the directory.

---

## The thing to understand first

**A ticked checkbox records what somebody believed. Archiving it records what is true.**

That distinction is the whole reason this belongs in stage 5 rather than in stage 6. `spec-refactor`
proposes and `spec-implement` applies, and both of them are working from inside the change. This
stage is the only one that reads the document and the code as two separate sources and asks whether
they agree — so it is the only one that can say a refactoring actually happened.

So a sweep is **not** bookkeeping. It is the same verification the rest of this skill performs,
pointed at a different claim: *"`R-01` removed `SM-004`"* rather than *"the code satisfies
`AC-003`"*.

## When a run is sweepable

A directory under `docs/refactorings/` is ready when **every entry in its `REPORT.md` is `- [x]` or
carries an explicit abandonment note**. Nothing else qualifies:

| State | What it means | Do |
| --- | --- | --- |
| Every entry ticked | The work is done and claims to be verified | Sweep it |
| Every entry ticked or abandoned | Some were dropped deliberately | Sweep it, and record the abandonments |
| Any entry still `- [ ]` | The run is in progress | **Leave it alone.** Not a finding, not an error |
| No `REPORT.md` | Someone made the directory by hand | Report it, sweep nothing |

**Never sweep a run that is still in progress.** A half-finished refactoring is normal — someone
took two entries this week and left three for next. Archiving it strands the remaining work in
`archive/`, where nobody will look for it again.

## The three checks

For each sweepable run, in this order. The first two produce findings; only the third writes.

### 1. Is the smell actually gone?

The report located every smell it proposed to remove — a file, a line, often a count. Go back and
look. This is cheap, because the report did the hard part of saying where to look:

```
SM-004 claimed removed by R-01 of 0003
  report: "one conflict kind known in four places"
          src/scheduler.js:48, src/export/csv.js:64, src/ui/grid.jsx:99, :104

  now:    two places — src/rules/conflict.js:12, src/ui/grid.jsx:88
```

Two occurrences where the report said four, in a new file — that is a real extraction, and `SM-004`
becomes a tombstone.

If the count is unchanged, or the smell simply moved, **say so and do not archive the run**. A
ticked box over an unremoved smell is exactly the kind of quiet untruth this whole chain exists to
catch, and marking it `removed` in the registry would make it permanent.

### 2. Did the preserved criteria survive?

You have already checked every active `AC-###` against the code in Phases 1–3. This step costs
nothing extra: **cross-reference any failing criterion against the `preserves` lines in the run.**

A regression is worth more when it names its cause:

```
AC-003 — "…the scheduler shall flag both and refuse to publish"
   src/rules/conflict.js:31   returns [] when the shifts are on different dates

   REGRESSION, and the cause is named: R-01 of run 0003 cites
   `preserves AC-003`. The extraction dropped the continuous-timeline
   comparison, so overnight shifts stopped being compared at all.

   → Revert R-01 and redo it; the entry is one commit
```

That is a materially better finding than the same regression reported anonymously, and it is
available for free because the report wrote down what it promised not to break.

**A run with a broken `preserves` claim is not archived**, whatever its checkboxes say.

### 3. Update the registry, then move the directory

Only once both checks pass. Edit `docs/refactorings/SMELLS.md`:

| The report says | The code says | The row becomes |
| --- | --- | --- |
| `R-NN` ticked, `removes SM-###` | the smell is gone | `~~removed~~ R-NN of NNNN` |
| `R-NN` ticked, `removes SM-###` | the smell is still there | stays **open** — a finding, and the run does not archive |
| An entry was abandoned | — | back to **logged**, naming the ordinal that tried and why |
| The run logged a new smell | — | a **logged** row, if one is not already there |
| A row already marked **won't fix** | — | untouched. That judgement was made once and is not re-made by a sweep |

Then move the directory to `docs/refactorings/archive/`, keeping its ordinal.

**Never lower the `Allocation:` line.** It only ever counts up, including across archived runs —
that is the single guarantee making `SM-###` safe to cite years later.

## Abandonment is a result, not a gap

An entry somebody decided against is a real outcome and the registry should show it:

```
| SM-005 | Long Parameter List — `publishWeek(7)` | src/api/shifts.js:112 | logged · attempted in 0003, dropped: the parameter object leaked into the API contract |
```

The next run to consider `SM-005` now knows it was tried and why it was put back down. Silently
returning it to a bare `logged` throws away the most useful sentence anyone has ever written about
it.

## What a sweep is not

- **It never proposes refactorings.** A smell noticed while checking one is reported in prose and
  left for `/spec-refactor`, which has the gate that decides whether it is worth doing.
- **It never edits code.** Not even to finish an entry that is nearly done. That is
  `spec-implement`'s loop, with its verify-between-each discipline.
- **It never re-runs the smell detector across the repository.** It re-checks only the smells this
  run claimed to remove. A full sweep is stage 6's job and needs stage 6's gate; doing it here
  produces a wish list attached to an audit nobody asked to be a wish list.
- **It never edits `docs/SPEC.md`.** A refactoring adds no criteria and retires none — that is what
  `preserves` means. A run that turns out to need a spec edit was never a refactoring, and the entry
  that requires it is a finding for `/spec-architect`.

## Reporting it

Refactoring sweeps go **after** the regression and staleness sections, under their own heading, and
stay short. A clean sweep is two lines:

```
Refactoring runs
   0003-m3-rest-period — swept. SM-004 and SM-002 confirmed removed, archived.
   0004-dead-export-sweep — in progress (3 of 5 entries), left alone.
```

A sweep that found something gets the same treatment as any other finding: what was claimed, what
the code says, and the fix in each direction.
