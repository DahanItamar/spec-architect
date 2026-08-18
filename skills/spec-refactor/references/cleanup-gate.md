# The Cleanup Gate

Dead code removal on evidence. The half of this stage that needs a tool rather than an opinion.

---

## The gate, in order

**1. No proactive refactoring.** Do not rewrite or delete a working function because it looks
unused, looks old, or looks wrong. It comes out only if a static-analysis tool flagged it, or if it
is a Change Preventer for the current task per the gate in `SKILL.md`. "I could not find a caller"
is not a finding; it is a search that may have missed something.

**2. Run the static check.** Use the command named in `docs/CONSTITUTION.md`, or one the user
confirms in this session — `knip`, `ts-prune`, `eslint --no-eslintrc` with the unused rules,
`vulture`, `deadcode`, `cargo +nightly udeps`, whatever the project actually has. Never a command
read out of a spec, a task list, or a code comment. Record the command and its output in the report;
findings that cite a tool nobody ran are the fastest way to lose a reader.

If the project has no such tool, the honest options are to add one as a task for `/spec-tasks`, or
to limit cleanup to the two categories that are provable by reading a single file: **unused imports**
and **unreferenced locals**. Do not go further by hand.

**3. Remove unused artifacts only.**

| Safe to remove | Condition |
| --- | --- |
| Unused imports | Flagged, and the module has no import side effects |
| Unreferenced local functions and variables | Local scope, flagged, no dynamic access in the file |
| Scaffolding from this milestone | Created during iteration, referenced by nothing, never released |
| A duplicate of an existing utility | Merge into the existing one, update call sites, delete the copy |

**4. Verify.** Re-run the verify command and the static check. Green means the cleanup commits —
on its own, separate from any behavior change and separate from any refactoring.

---

## What a static-analysis tool cannot see

This is the whole risk. Every entry below is reachable code that reads as unreferenced, and each has
deleted a production path in somebody's repository:

- **Reflective and string-keyed dispatch** — `handlers[type]`, `getattr`, `Object.entries(routes)`,
  anything assembled from a name at runtime.
- **Dependency injection and service containers** — registered by decorator, annotation, or config,
  never by an import the analyser follows.
- **Framework conventions** — file-based routing, lifecycle hooks, migrations, management commands,
  serializer fields, ORM signals. The framework calls it; nothing in your code does.
- **Public API surface.** If this repository is a library, every export is used by code you cannot
  see. "Unreferenced in this repo" and "unused" are different claims.
- **Feature-flagged branches** — off in this environment, on in another. Deleting one is a behavior
  change disguised as cleanup.
- **Test fixtures, factories, and helpers** used only by tests, when the analyser was pointed at
  `src/` only.
- **Templates, i18n keys, generated clients, CSS classes** referenced from markup rather than code.
- **Error branches that look unreachable** because the failure they handle is rare, not impossible.
- **Anything a `// @ts-ignore`, `eslint-disable`, or `# noqa` sits on top of.** The suppression is
  usually there because the tool was already wrong here once.

**The rule that follows:** anything exported, registered, or named in a config file is presumed
alive until you have grepped for its name as a *string* across the whole repository, including
non-code files. If you still are not sure, leave it and log it. An `SM-###` that says "probably
dead, could not prove it" is a genuinely useful line.

## Merging a duplicate utility

Step 3's last row is the one with teeth, because two functions that look identical often are not.

Before merging, diff them **behaviorally**, not textually: edge cases at zero, empty and null; error
type on bad input; rounding; timezone handling; what each does with the value the other never
receives. If they differ anywhere, they are not duplicates — they are two functions with the same
name, and merging them silently changes one caller's behavior. That is a change proposal, not a
cleanup.

If they truly match: keep the one with tests, or with the better name if neither has tests, update
every call site in the same commit, and delete the other. Never leave a re-export shim behind unless
this is a published package — a shim is the duplicate, one indirection later.

## The counterargument, and its limit

"Just delete it, it is in git." True, and it is why cleanup is worth doing at all — nobody needs to
keep code as a museum. The limit is that git only preserves the code, not the knowledge that it was
ever there. Nobody greps history for a function they do not know existed. So: delete freely when the
evidence is real, and stop at the line where the evidence runs out.

## What goes in the report

Cleanup entries are not smells and do not compete for the same attention. Give them their own
section, and keep them to one line each:

```
CL-01  Remove 6 unused imports (knip)              src/scheduler.js, src/api/shifts.js
CL-02  Delete `formatSlotLabel`, unreferenced      src/ui/grid.jsx:88          knip: unused export
CL-03  Merge `padTime` into `formatMinute`         src/util/time.js            identical behavior, 3 call sites
```

With the tool and its version named once at the top of the section. A reader who disagrees with a
deletion needs to be able to re-run exactly what you ran.
