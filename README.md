# FlowSystem

**Spec-driven development for AI coding agents. Five Markdown skills, zero runtime dependencies.**

Agents write vague code from vague prompts — not because the model is weak, but because *"build me a desktop app for shifts"* isn't a specification.

FlowSystem is the discipline that fixes it, as five files an agent reads:

```
constitution  →  spec  →  tasks  →  implement  →  drift
```

Each stage writes one artifact and reads the last one's. Nothing else is shared, so any agent that can read Markdown and edit files can run the whole pipeline.

---

## The five stages

| Stage | Skill | Reads | Writes |
| --- | --- | --- | --- |
| 1 | `spec-constitution` | the repo | `docs/CONSTITUTION.md` |
| 2 | `spec-architect` | constitution, existing spec | `docs/SPEC.md` **or** a change proposal |
| 3 | `spec-tasks` | spec or proposal | `TASKS.md` |
| 4 | `spec-implement` | tasks + cited criteria | source code |
| 5 | `spec-drift` | everything | a report, then fixes or a merge |

### What holds it together

**Acceptance criteria with stable IDs.** §2.1 of every spec is a flat list of [EARS](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax) sentences, each with an `AC-###` identifier:

```
| AC-003 | If two shifts for one employee overlap by any minute, then the scheduler shall flag both. |
```

Tasks cite those IDs. `spec-implement` verifies against them before moving on. `spec-drift` reports against them. It is the difference between a document an agent *judges* and one it *checks* — and citations mean there is exactly one source of truth, because a task never restates a criterion.

**Stopping at the first failure.** `spec-implement` does one task, verifies it, then starts the next. A wrong task three becomes one report, not nine tasks of work built on top of it.

**Changes as proposals, not rewrites.** Once `docs/SPEC.md` exists, a new feature becomes `docs/changes/0004-slug/PROPOSAL.md` — a reviewable diff. The spec is amended only when the work ships. Removing anything from §3 Decisions, §8 Edge Cases, or §9 Security requires a stated reason, because those sections record *why*, and an unexplained reversal is indistinguishable from a later session not knowing.

---

## Install

**Claude Code — plugin**

```
/plugin marketplace add DahanItamar/flowsystem
/plugin install flowsystem
```

In the VS Code extension the command is `/plugins` (plural).

**Any agent — copy the files**

```bash
git clone https://github.com/DahanItamar/flowsystem.git
cp -r flowsystem/skills/* ~/.claude/skills/
```

Copy skill **directories**, never individual files — a skill's `references/` is part of it, and no skill reads outside its own directory.

**Cursor, Codex, or anything reading `AGENTS.md`**

Copy `adapters/AGENTS.md` to your repo root and `skills/` alongside it. The adapter names the five stages and where to read each; it holds no rules of its own, so it cannot drift from what the skills say.

---

## Using it

```
"Set up the conventions for this repo"     → stage 1
"I want to build a shift planner"          → stage 2, writes docs/SPEC.md
"What should I build first?"               → stage 3, writes TASKS.md
"Build M1"                                 → stage 4, one task at a time
"Is the spec still true?"                  → stage 5
"Add shift templates"                      → stage 2 again, delta mode
```

You do not have to run all five. A spec alone is worth having; so is a drift check on a project that never had tasks. Stages degrade rather than refuse.

---

## Coming from v1

v1 specs are valid v2 specs — nothing is gated on a version.

- **No §2.1?** Every stage still works. `spec-tasks` writes inline "done when" statements instead of citations and says so once. `spec-drift` offers a one-time backfill.
- **No constitution?** `spec-architect` writes §4 inline exactly as it did before.
- **`spec-architect` and `spec-drift` kept their names** and their behavior. What changed: criteria, delta mode, and the merge phase.

---

## Design rules

Three rules produced most of this repository:

1. **Never ask what you can decide.** A question earns its place only if two plausible answers produce two different systems.
2. **Could this be deleted and the product still work?** If yes, delete it.
3. **A gap against a section that recorded a reason is a regression until proven otherwise.** Updating the spec to match the code is the dangerous default — it always "resolves" the gap, and it silently blesses every bug as intended.

---

## Development

```bash
npm test          # no install required — node --test only
npm run lint      # markdownlint (dev dependency)
```

The proof suite checks artifact *shapes*, not agent prose: skill frontmatter and size limits, `AC-###` format and uniqueness, EARS well-formedness, task citations and ordering, proposal merge safety, and that adapters carry no rules. Asserting what a model writes would be a flaky test; asserting the contract between stages is not.

---

MIT · Itamar Dahan
