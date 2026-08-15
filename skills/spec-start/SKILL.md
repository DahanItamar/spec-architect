---
name: spec-start
description: Start here. The front door to the five-stage spec chain — shows the whole map, works out which stage fits what you already have, and hands you the one command to run next. Use when you know you want to work spec-first but not which stage to enter, when you have inherited a repository and do not know what exists, when you are returning to a project after a break, or whenever the list of spec commands is longer than your memory of what they do. Writes nothing.
---

# Spec Start

**Stage 0 of 5 — the front door.** This skill writes nothing and decides nothing. It looks at what
the repository already has, tells the user where they are in the chain, and hands them one command.

Its whole reason to exist: five commands in a picker give a user no way to tell which one begins,
and the wrong entry wastes a whole stage. `/spec-tasks` on a repo with no spec produces nothing but
an error, and `/spec-architect` on a repo that already has a spec silently rewrites the reasoning
that made the first version correct.

---

## Always print the map first

```markdown
> **The spec chain**
>
> `1 constitution` → `2 spec` → `3 tasks` → `4 implement` → `5 drift` → *(loops back to 2)*
>
> | Stage | Command | Produces | Run it when |
> |:-:|---|---|---|
> | 1 | `/spec-constitution` | `docs/CONSTITUTION.md` | The repo's rules live only in your head. **Optional** |
> | 2 | `/spec-architect` | `docs/SPEC.md` | You have an idea, or a change to an existing spec |
> | 3 | `/spec-tasks` | `TASKS.md` | A spec exists and you want an ordered build list |
> | 4 | `/spec-implement` | code | A task list exists with unchecked boxes |
> | 5 | `/spec-drift` | a report | Code and spec may have diverged |
```

## Then look, and route

Check the repository — do not ask the user what it contains, because the whole point is that they
may not know:

| Found | Say | Hand them |
| --- | --- | --- |
| Nothing — empty or no docs | This is a new project | `/spec-constitution`, or `/spec-architect` to skip straight to the spec |
| A codebase, no `docs/SPEC.md` | The spec can be reverse-engineered from what exists | `/spec-architect` |
| `docs/SPEC.md`, no `TASKS.md` | The spec is written and nothing is scheduled | `/spec-tasks` |
| `TASKS.md` with unchecked boxes | Work is scheduled and unfinished | `/spec-implement` |
| `TASKS.md` all ticked | The milestone is done | `/spec-drift`, then `/spec-architect` for the next change |
| Unmerged `docs/changes/*/PROPOSAL.md` | Pending amendments the spec does not carry yet | `/spec-drift` to merge them |
| Spec exists, code has moved on | These may have diverged | `/spec-drift` |

**Name exactly one command.** A user who arrives not knowing where to start is not helped by three
options and a discussion of trade-offs. Where two genuinely fit, name the one that is cheaper to
undo and say in one clause why.

## The two mistakes worth naming

- **Stage 1 is optional and stage 2 is not.** A repo whose conventions are already settled should
  skip the constitution. A repo with no spec cannot skip stage 2 — every later stage reads it.
- **The chain loops at 5, it does not end.** After drift, the next change re-enters at
  `/spec-architect`, which writes a change proposal rather than rewriting the spec. Users who think
  stage 5 is the finish line start their next feature with no spec coverage at all.

## Boundaries

**Writes nothing.** No spec, no tasks, no constitution, no files of any kind. It reads the
repository, prints the map, and names one command.

**Does not do the next stage's work.** Even when the answer is obvious and the work is small, it
stops after naming the command. A front door that occasionally walks you through the building is a
front door nobody can predict.

## Related

Every stage of the chain: `spec-constitution` · `spec-architect` · `spec-tasks` · `spec-implement`
· `spec-drift`. Each prints its own position in the chain when it runs.
