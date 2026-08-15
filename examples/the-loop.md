# The Loop

One project, five stages, five weeks. The example is a shift planner; the shape is the point.

---

## Week 0 — Constitution

```
"Set up the conventions for this repo before we start."
```

`spec-constitution` reads the repo — empty except a `package.json` — and asks four questions. The one that matters:

> **What command proves the code works?** → `npm test`

That single line becomes the only command any later stage will execute. It is written to `docs/CONSTITUTION.md` along with the layout, dependency direction (`ui → services → domain ← db`), and six principles, each stating what breaks if violated.

Ten minutes. Never touched again except when a rule genuinely changes.

---

## Week 1 — Spec

```
"I want a desktop app for planning shifts at a small restaurant."
```

`spec-architect` asks one round of five questions. Two decide the architecture:

> **Does more than one person edit the same week?** → *No, one manager*
> → No server. No auth. Local SQLite. Roughly a third of the scope disappears.
>
> **Do shifts ever cross midnight?** → *Yes, the kitchen closes at 2am*
> → This one is why the spec is worth writing.

The spec records the decision **with its reason**:

```
§8 Edge Cases
| Overnight shift | Overlap detection silently stops working | endMinute may exceed
  1440; a 22:00→06:00 shift is otherwise unrepresentable | AC-012 |

§2.1
| AC-012 | When a shift crosses midnight, the scheduler shall store an end minute
           greater than 1440. |
```

Forty criteria, `AC-001` through `AC-040`.

---

## Week 2 — Tasks, then build

```
"What should I build first?"
```

`spec-tasks` takes **only M1** and emits eight tasks, each citing what it closes:

```
- [ ] T-03 Detect overlaps across the midnight boundary — closes AC-012, AC-013 — files: src/domain/shift.ts — depends: T-01
```

Before writing the file it checks coverage both ways. One criterion — `AC-019`, exporting the week as PDF — is closed by no task. It belongs to M3, so that is a schedule, not an omission. It says so.

```
"Build M1."
```

`spec-implement` runs the loop: read the criterion verbatim, implement, run `npm test`, confirm the criterion specifically, tick the box. On `T-03` it stops:

```
T-03 ✗  closes AC-012, AC-013   STOPPED

   AC-012: "When a shift crosses midnight, the scheduler shall store an
   end minute greater than 1440."

   Observed: shift.ts:47 rejects endMinute > 1439. npm test passes —
   no test covers the overnight path.

   → The criterion is right and the validation is wrong.
```

Four minutes into week 2, not four weeks in.

---

## Week 4 — Drift

```
"Is the spec still true?"
```

`spec-drift` checks every active criterion against the code. Two findings:

```
REGRESSION  AC-012  src-core/domain/shift.rs:47 rejects endMinute > 1439

   The spec recorded why: a 22:00→06:00 shift is otherwise unrepresentable
   and overlap detection silently stops working. This validation reintroduces
   exactly that bug.

   → Fix the code (remove the upper bound, keep 0 ≤ startMinute ≤ 1439)
   → Or: the requirement changed — update §8 and say what replaced it

STALENESS   §5 Data Models — employees.phone exists in the schema, not in the spec

   → Add the field to §5
```

The difference is the whole point. The first gap contradicts a recorded reason, so the **code** is wrong. The second contradicts nothing, so the **spec** is wrong. Updating the spec in both cases — the fast, tempting default — would have documented the overnight bug as intended behavior.

---

## Week 5 — The second feature

```
"Add shift templates."
```

`docs/SPEC.md` exists, so `spec-architect` enters delta mode and writes `docs/changes/0004-shift-templates/PROPOSAL.md` — a one-page diff. The spec is not touched.

Reading §8 before proposing, it notices the template path can produce the same double-booking §8 already solved once, and writes `AC-042` to cover it. That check costs nothing here and would have cost a week after release.

When M4 ships, `spec-drift` merges the proposal, promotes its motivation into §3 Decisions, marks the criteria it retired as tombstones, and archives the directory.

Week 12's reader can still see why `endMinute` exceeds 1440.

---

## The loop, without the story

```
constitution   once per repo
spec           once per project
   tasks           per milestone
   implement       per milestone
   drift           after each milestone
spec (delta)   per feature, thereafter
```

Nothing here requires all five. A spec alone beats no spec; a drift check on a project that never had a task list still works. The stages degrade — they do not refuse.
