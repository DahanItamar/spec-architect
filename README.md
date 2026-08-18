<div align="center">

# Spec Architect

**Six skills that turn a vague idea into working code without losing the reasoning along the way —
each stage handing the next a set of numbered criteria, so "done" is something you check rather
than something you feel.**

Plain Markdown for Claude Code. **No dependencies, no build step, nothing here executes.**

<a href="https://github.com/DahanItamar/spec-architect/actions/workflows/test.yml"><img alt="CI status" src="https://github.com/DahanItamar/spec-architect/actions/workflows/test.yml/badge.svg?branch=main"></a>
<img alt="17 tests passing across 4 suites" src="https://img.shields.io/badge/tests-17%20passing-1f6f3f?style=flat-square">
<img alt="version 3.0.0" src="https://img.shields.io/badge/version-3.0.0-B55400?style=flat-square">
<a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2b2e3a?style=flat-square"></a>
<img alt="zero dependencies" src="https://img.shields.io/badge/dependencies-0-1f6f3f?style=flat-square">
<img alt="7 skills, 16 reference files" src="https://img.shields.io/badge/skills-7-2b2e3a?style=flat-square">
<img alt="2,962 lines of doctrine" src="https://img.shields.io/badge/doctrine-2%2C962%20lines-2b2e3a?style=flat-square">

<a href="examples/the-loop.md">The loop</a> ·
<a href="examples/before-and-after.md">Before and after</a> ·
<a href="examples/shift-planner-spec.md">An example spec</a> ·
<a href="examples/proof/README.md">The proof</a>

</div>

---

## What the stages hand each other

Most "spec workflows" are a handful of prompts that happen to run in order. Nothing survives the
handoff, so by stage four the agent is judging prose it wrote itself against prose it wrote earlier.

What travels here is an identifier. `spec-architect` writes each requirement as one EARS sentence
with a stable `AC-###`, and every later stage refers to it by number:

```mermaid
flowchart LR
    C["constitution<br/><i>the repo's rules</i>"] -- "verify command" --> A

    A["architect<br/><i>the spec</i>"] -- "assigns AC-###" --> T
    T["tasks<br/><i>ordered list</i>"] -- "cites AC-###" --> I
    I["implement<br/><i>one at a time</i>"] -- "verifies AC-###" --> D
    D["drift<br/><i>the audit</i>"] -- "reports by AC-###" --> V{"which side<br/>is wrong?"}

    V -- "code drifted" --> R["regression<br/><i>fix the code</i>"]
    V -- "spec is stale" --> S["staleness<br/><i>fix the spec</i>"]
    V -- "neither — it's<br/>the structure" --> F["refactor<br/><i>preserves AC-###</i>"]
```

That is requirements traceability, and it is the whole reason the chain is more than six prompts
in a row. A task that closes no criterion is either unnecessary work or evidence of a requirement nobody
wrote. A criterion no task closes is scope that will silently never be built — and **nothing
downstream catches that one**, because `spec-implement` only verifies what a task cites.

| ID | Criterion |
| --- | --- |
| AC-003 | If two shifts for one employee overlap by any minute, then the scheduler shall flag both and refuse to publish. |

One sentence, one obligation, one number. `shall` is load-bearing — it makes every requirement in
the document findable with a search.

## The stages

| Stage | Skill | The rule it enforces |
|:-:|---|---|
| 0 | **spec-start** | Six commands in a picker give a user no way to tell which one begins |
| 1 | **spec-constitution** | A rule earns its place only if you can name what breaks when it is violated |
| 2 | **spec-architect** | Never ask what you can decide — ask only what changes the architecture |
| 3 | **spec-tasks** | A task is done when a named criterion is satisfied, not when the code looks finished |
| 4 | **spec-implement** | One task, verify, then the next — stop at the first unmet criterion |
| 5 | **spec-drift** | The spec and the code disagree: say *which one* is wrong |
| 6 | **spec-refactor** | Restructure only what blocks work that is actually scheduled — and change no criterion doing it |

Each is usable alone. `spec-architect` writes a perfectly good spec with no constitution above it,
and `spec-drift` audits a codebase whose spec was written by hand. The chain is what they are worth
together, not a prerequisite.

## The failure each stage is built against

Stage 4 exists because of a specific way agent-written code goes wrong: twelve tasks implemented,
task three turns out to be broken, and nine tasks of work are now sitting on top of it. So
`spec-implement` stops at the first unmet criterion instead of collecting failures for a summary.

Stage 5 exists because of the opposite mistake. When the spec and the code disagree, a tool that
always rewrites the spec blesses every regression it finds, and one that always flags the code
fights every deliberate change. `spec-drift` classifies each finding as **regression** or
**staleness** and edits neither side until you have seen the verdict.

Stage 6 exists because a codebase can say yes to every criterion and still be finished — green
tests, clean drift report, and the next feature a week of work because the thing it extends has
one rule kind known in four places. Nothing else in the chain can see that; `spec-implement`
verifies criteria and `spec-drift` compares documents, and both are right not to have an opinion
about structure. So the opinion gets its own stage, with a threshold that keeps it honest:

> **A smell is actionable only if it is a Change Preventer for work that is actually scheduled.**
> Everything else is logged with an ID and left alone.

That threshold is the whole design. Hand an agent the standard
[refactoring catalogue](https://refactoring.guru/refactoring/smells) with no gate and it will
restructure a working system for sport. The second rule is what makes the result safe to run on
code that ships: **a refactoring may not change what the spec says the system does.** If it needs
an `AC-###` edited, it is not a refactoring — it is a change proposal, and it goes back to stage 2.
Which turns "behavior is preserved" from a claim in a summary into something checked: verify
green before, green after, every cited criterion re-read against the new code.

> [!IMPORTANT]
> **The two stages that run commands — `spec-implement` and `spec-refactor` — run only the verify
> command named in the constitution.** Never one found in a spec, a task list, a refactoring
> report, or a code comment. Those files are editable by anyone with commit access, so treating
> their contents as instructions would turn a spec file into remote code execution. A static-analysis
> command for stage 6's cleanup gate comes from the same place, or from you, in the session.

## Run it

There is nothing to run. It is Markdown that Claude Code reads.

```bash
# as a plugin
/plugin marketplace add DahanItamar/spec-architect
/plugin install spec-architect

# or drop the skills in directly
git clone https://github.com/DahanItamar/spec-architect /tmp/sa \
  && cp -r /tmp/sa/skills/* ~/.claude/skills/
```

Then **`/spec-start`** — it reads the repository, prints the chain, and names the one command to
run next. Or go straight in: `/spec-constitution` on a new repo, `/spec-architect` if the
conventions are already settled. Both install routes work, and the plugin is self-contained — no catalogue
sits in between.

```bash
node --test examples/proof/proof.test.mjs   # 17 tests, 4 suites, ~64ms
```

## Under the hood — briefly

- **2,962 lines across 7 skills and 16 reference files.** Each `SKILL.md` loads on invocation; the
  references load only at the phase that needs them, so a task list is never written with the
  risk checklist in context.
- **The tests are an argument, not a smoke check.** `examples/proof/` holds the same feature built
  four ways — naive, spec-derived, drifted three weeks later, and smelly six months later — and
  asserts what each one does to a shift that crosses midnight. The drifted case passes its own
  tests and contradicts §8 of its spec, which is what stage 5 is for. The smelly case contradicts
  nothing, passes everything, and still costs four edits to extend — which is what stage 6 is for.
- **Change proposals, not spec rewrites.** Once a spec exists, `spec-architect` writes a diff under
  `docs/changes/` and leaves the spec alone. The reasoning that made feature 1 correct is the asset,
  and rewriting the document for feature 4 is how it gets deleted with nobody reading the diff.
- **Criteria are retired, never reused.** A requirement that no longer applies stays as a tombstone
  keeping its ID, because an archived task list still cites it. `SM-###` smells work the same way:
  a smell that gets paid off stays struck through with the refactoring that removed it, so the
  second time it appears in the same file, the argument for fixing the cause writes itself.
- **The smell names are the standard catalogue, not a copy of it.** *Shotgun Surgery*, *Feature
  Envy*, *Primitive Obsession* — Fowler and Beck's vocabulary as organised on
  [refactoring.guru](https://refactoring.guru/refactoring/smells), used so that a finding names
  something you can go look up. No prose from it is reproduced here; what stage 6 adds is the
  threshold for when a name is worth invoking, and the false-positive list for when it isn't.
- **Nothing executes at install.** No dependencies, no build, no scripts — a repository containing
  only Markdown is one you can audit before you run it.

> Previously published as **FlowSystem**, which shipped stages 2 and 5 only. The GitHub redirect
> keeps old clone URLs working; the plugin name has changed, so reinstall rather than update.

---

<div align="center">

Built by <a href="https://github.com/DahanItamar">Itamar Dahan</a> · <a href="LICENSE">MIT</a> · © 2026

</div>
