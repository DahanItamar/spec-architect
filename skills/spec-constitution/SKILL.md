---
name: spec-constitution
description: Stage 1 of 5 in the spec chain. Write the repository's constitution — the principles, conventions, and verification command that every later spec, task list, and implementation inherits. Use at the start of a project, before running spec-architect on a new repo, when conventions live only in reviewers' heads, when a team keeps re-litigating the same review comments, or when an agent keeps producing code that doesn't match the house style. Writes docs/CONSTITUTION.md. Does not describe features — that is spec-architect's job.
---

# Spec Constitution

**Stage 1 of 5 — Constitution.** Before doing anything else, print this banner so the user
can see where they are in the chain, filled in for this run:

```markdown
> **The spec chain — stage 1 of 5 · Constitution**
>
> **▶ 1 constitution** · `2 spec` · `3 tasks` · `4 implement` · `5 drift`
>
> **Behind you:** nothing — this is the start of the chain.
> **After this:** `/spec-architect` writes the spec that inherits this document.
```

Skip straight to `/spec-architect` if the repo's conventions are already settled. Then begin the workflow below, naming each phase as you enter it.
A user who cannot tell which step they are on cannot tell whether to interrupt.

A constitution answers one question: *what is true about this repository regardless of what we are building this week?*

That is a narrow question, and keeping it narrow is the whole job. The moment a constitution starts describing features, it becomes a spec that nobody updates. The moment it lists aspirations nobody enforces, it becomes decoration — and a document readers have learned to ignore is worse than no document, because the next reader still trusts it.

## The one rule

**A rule earns its place only if you can name what breaks when it's violated.**

- *"Write clean code"* — nothing breaks, because nothing is specified. Delete it.
- *"`domain/` imports no framework"* — business logic dissolves into controllers and becomes untestable. Keep it.
- *"Prefer functional style"* — a preference, not a rule. Delete it or make it enforceable.
- *"Every outbound call has a timeout"* — a missing timeout is a hang that propagates. Keep it.

If you cannot state the consequence, you are writing a mission statement.

---

## Workflow

### Phase 0 — Read the repository first

Existing practice outranks your preferences. Before proposing anything, look at:

- `package.json` / `pyproject.toml` / `go.mod` / `*.csproj` — the stack, and the scripts that already exist
- The directory tree — what layering is already implied
- 3–5 representative source files — actual naming, actual file sizes, actual error handling
- `.eslintrc` / `ruff.toml` / `.editorconfig` — rules already being enforced
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` — rules already written down

**A constitution that contradicts the codebase it governs is a bug report, not a constitution.** Where the repo already does something consistently, document that. Where it does something inconsistently, that is a decision to surface — pick one and say which files are now non-conforming.

For an empty repository, skip to Phase 1 and derive from the stack instead.

### Phase 1 — Questions, at most four

Use `AskUserQuestion` where the host agent provides it — one call, all questions batched. Where it does not exist, ask them as a single numbered list in one message and wait for one reply. Never ask one at a time.

Only these four are ever worth asking, and only when the repo doesn't already answer them:

1. **What command proves the code works?** (`npm test`, `cargo test`, `pytest -q`, or "nothing automated yet") — this becomes `verifyCommand`, and it is the single most valuable line in the document. `spec-implement` runs it after every task and nothing else.
2. **Which existing inconsistency should become the rule?** Only when Phase 0 found the repo doing the same thing two ways.
3. **What is non-negotiable here that an outsider wouldn't guess?** Regulatory constraint, a performance budget, a platform that must keep working, a dependency that may never be added.
4. **Who reads this code?** Solo · a small team · outside contributors. Decides how much the document explains versus states.

If the user says "you decide", decide. Record it under **Standing decisions** and move on.

### Phase 2 — Draft the principles

Three to seven. Fewer than three means you had nothing to say; more than seven means it is a wish list and readers will skim it.

Read `references/principles.md` for the test a principle has to pass and the catalog to draw from.

Each principle is one sentence stating the rule, plus one clause stating the consequence of breaking it. Nothing else.

### Phase 3 — Fill the mechanical sections

These come from the repository, not from taste. Layout, dependency direction, naming, size limits, tooling, and the verify command. State only rules this repo will actually follow.

**Size limits are the section most often written and least often honored.** Include only limits the linter enforces, or that you are willing to have `spec-drift` report as a finding. A limit nobody checks teaches readers the rest of the document is optional too.

### Phase 4 — Write `docs/CONSTITUTION.md`

Follow this structure exactly:

```markdown
# <Repo Name> — Constitution

> Status: Active · <date> · Constitution version 1.0

## Principles
1. **<Rule.>** — <what breaks if violated.>

## Layout
<Top-level tree, one comment per directory: what may live there and what may not.>

## Dependency direction
<One line, then mechanical. e.g. "ui → services → domain ← db. domain/ imports no framework.">

## Naming
| Kind | Convention | Example |

## Size limits
| Unit | Soft | Hard |

## Tooling
| Concern | Tool |

## Verification
**Verify command:** `<the command, or "none — verified by reading">`
<What it covers, and what it does not.>

## Standing decisions
<Choices made without explicit confirmation, numbered so any one can be rejected.>
1. <decision> — <what changes if it's wrong>
```

Then tell the user the path and the verify command you recorded.

---

## Boundaries

**This skill never describes a feature.** No entities, no endpoints, no user stories. If you find yourself writing about shifts or invoices or users, you have crossed into `spec-architect`.

**This skill never writes code.** It documents what code must look like.

**One constitution per repository.** Not one per package, not one per feature.

## Calibration

A solo weekend project gets principles, verify command, and naming — three sections, one page. A repo with outside contributors gets all of them, with layout and dependency direction carrying real weight because those are what a stranger gets wrong first.

## Reference files

- `references/principles.md` — the test a principle must pass, and a catalog by project shape

## Related

`spec-architect` writes the spec that inherits this document. Run this one first on a new repo; where no constitution exists, `spec-architect` falls back to writing conventions inline.
