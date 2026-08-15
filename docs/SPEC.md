# FlowSystem v2 — Technical Spec

> Status: Draft · 2026-08-15 · Spec version 2.0
> Supersedes: FlowSystem v1 (skills `spec-architect`, `spec-drift`)

## 1. Problem & Users

FlowSystem v1 writes a good spec and can audit one, but it governs nothing in between. A user runs `spec-architect`, gets `docs/SPEC.md`, and then the agent builds freely for two weeks — after which `spec-drift` reports the damage. The skill that finds regressions has no counterpart that prevents them.

Two structural gaps make this worse. The spec is prose an agent must *judge* against, not criteria it can *verify* against — `spec-drift` says so itself: "most of a spec is prose that no tool can verify." And v1 is greenfield-only: a project that already shipped feature 1 has no path to feature 2 except re-running `spec-architect` and overwriting the reasoning that made feature 1 correct.

**Primary user:** a developer running an AI coding agent on a project they intend to keep for months, across sessions that share no memory.

**Success looks like:** a fresh agent session, given only `docs/`, ships feature N without asking what the system is — and every task it closes names the acceptance criterion it satisfied.

## 2. Scope

### In scope

- Five invocable stages: constitution → spec → tasks → implement → drift.
- Acceptance criteria written in EARS notation, carrying stable `AC-###` identifiers.
- A base spec plus numbered change proposals, so feature N+1 never overwrites feature 1's reasoning.
- A drift audit that also merges shipped proposals back into the base spec.
- Adapters that make all five stages runnable under Claude Code, Cursor, and any agent that reads `AGENTS.md`.
- A migration path for existing v1 specs.

### Explicitly out of scope

- **A CLI or npm package** — would end zero-dependency installation. The mechanical checks it would enable are real; revisit as v3 (see §3 Decisions, D6).
- **A CI action / pre-commit hook** — depends on the CLI above.
- **Test generation** — acceptance criteria are the contract; turning them into test files is the user's stack decision, not FlowSystem's.
- **A machine-readable spec format (JSON/YAML)** — Markdown is the portability guarantee. A second serialization is a second source of truth.
- **Importing Spec Kit / Kiro artifacts** — worth doing, but it is adoption work, not architecture. See §12.
- **Monorepo spec federation** — one `docs/` per repo. Multi-package repos get one spec until someone proves they can't.
- **Implementing without a task list** — deliberately unsupported. That is the failure mode this project exists to end.

### 2.1 Acceptance Criteria

*The contract. Every task in §10 closes one or more of these; `spec-drift` verifies against them. Written in EARS — the same notation v2 will teach users to write.*

| ID | Criterion |
| --- | --- |
| AC-001 | The system shall expose exactly five invocable stages, each writing at most one artifact type. |
| AC-002 | When `spec-architect` runs in a repository containing no `docs/SPEC.md`, it shall write a base spec containing a flat, numbered acceptance-criteria list. |
| AC-003 | When `spec-architect` runs in a repository that already contains `docs/SPEC.md`, it shall write a change proposal under `docs/changes/NNNN-slug/PROPOSAL.md` and shall not modify `docs/SPEC.md`. |
| AC-004 | Every acceptance criterion shall carry an identifier matching `^AC-\d{3}$`, unique within the repository, never reused after retirement. |
| AC-005 | When `spec-tasks` emits a task list, every task shall reference at least one AC identifier present in its source spec or proposal. |
| AC-006 | If `spec-tasks` reads a spec containing no acceptance-criteria section, then it shall emit tasks with inline criteria and state that the spec predates v2. |
| AC-007 | While executing a task list, `spec-implement` shall verify each task against its referenced criteria before beginning the next task. |
| AC-008 | If a task's referenced criteria are unmet after implementation, then `spec-implement` shall stop and report, rather than proceed to the next task. |
| AC-009 | When `spec-drift` finds a gap against a section that records a reason, it shall classify that gap as a regression. |
| AC-010 | When every task in a change proposal is complete, `spec-drift` shall merge the proposal into `docs/SPEC.md` and move its directory to `docs/changes/archive/`. |
| AC-011 | Where the host agent provides no interactive question tool, each skill shall ask its questions as one numbered list in a single message. |
| AC-012 | A skill shall read no file belonging to another skill. |
| AC-013 | The repository shall declare no runtime dependency; installation shall consist of copying Markdown files. |
| AC-014 | Where `docs/CONSTITUTION.md` exists, `spec-architect` shall reference its conventions rather than restating them. |
| AC-015 | If no constitution exists, then `spec-architect` shall write §4 inline, as v1 did. |
| AC-016 | An adapter file shall contain no behavioral rule absent from `skills/`. |
| AC-017 | `spec-implement` shall run only the verification command named in the constitution; where none is named, it shall verify by reading code and say so. |

## 3. Architecture

### Overview

Five Markdown skills and no runtime. All state lives in files under `docs/` in the user's repository — there is no database, no daemon, and no process that outlives a single agent turn. Each stage reads the previous stage's artifact and writes exactly one of its own; the agent is the interpreter. This is what makes the system portable: an agent that can read Markdown and edit files can run the whole pipeline.

```
                         docs/CONSTITUTION.md
  spec-constitution ───────────► (principles, conventions, verify command)
                                      │ read by
                                      ▼
   idea ──► spec-architect ──► docs/SPEC.md          [base mode]
                    │                 ▲
                    │ [delta mode]    │ merge on ship
                    ▼                 │
            docs/changes/NNNN-slug/PROPOSAL.md
                    │ read
                    ▼
              spec-tasks ──► docs/changes/NNNN-slug/TASKS.md
                    │              │ each task cites AC-###
                    ▼              ▼
            spec-implement ──► source code (edits)
                    │
                    ▼ after milestone
               spec-drift ──► report ──► code fix | spec update | archive
```

### Components

| Component | Responsibility | Technology |
| --- | --- | --- |
| `spec-constitution` | Writes repo-wide principles, conventions, and the verification command, once. Does not describe any feature. | Markdown skill |
| `spec-architect` | Idea → base spec (greenfield), or existing spec + new feature → change proposal. Decides architecture; does not write task lists. | Markdown skill |
| `spec-tasks` | Spec or proposal → ordered task list, each task citing AC IDs and the files it touches. Writes no code. | Markdown skill |
| `spec-implement` | Executes a task list in order, verifying each task against its cited criteria. Does not amend the spec. | Markdown skill |
| `spec-drift` | Audits code against spec; classifies gaps; merges shipped proposals into the base spec. Does not refactor. | Markdown skill |
| Artifact store | `docs/` in the user's repo. The only state the system has. | Plain files |
| Adapters | Make the five stages invocable on non-Claude agents. Hold no rules of their own. | Markdown pointer files |

### Decisions

**D1 — Five stages, but `specify` and `plan` stay merged.**
Because: v1's core rule is "never ask what you can decide." Spec Kit separates *what* (spec.md) from *how* (plan.md), which costs a full user round-trip to produce choices `spec-architect` already makes in one pass. Merging them keeps FlowSystem's identity; the freed fifth slot goes to `drift`, which Spec Kit has no equivalent of.
Instead of: Spec Kit's `constitution/specify/plan/tasks/implement` — lost because a standalone plan stage would be a second interrogation for answers already on paper.
Revisit if: users report that spec-architect's single pass makes stack decisions too early to be reversible.

**D2 — Change proposals are numbered directories, not edits to `SPEC.md`.**
Because: `SPEC.md` must stay loadable as a whole into one context. Editing it in place for every feature grows it without bound and destroys the record of when a decision reversed. A proposal is reviewable before it is true.
Instead of: per-feature spec folders (Kiro) — lost because no single document then describes the system; and one living file (v1) — lost because it clobbers.
Revisit if: a project accumulates more than ~30 archived proposals and merge conflicts become routine.

**D3 — Acceptance criteria in EARS with stable `AC-###` IDs.** *(the keystone)*
Because: it converts the spec from prose an agent judges into claims an agent checks. Every downstream stage gets sharper for free — tasks cite IDs, implement verifies IDs, drift reports against IDs. EARS specifically because its five patterns are unambiguous to both humans and models, and because every major SDD tool converged on it.
Instead of: Given/When/Then — lost because it is test-shaped, and pulls the spec toward describing tests rather than behavior.
Revisit if: users find EARS phrasing stilted enough that they stop writing criteria at all.

**D4 — Tasks cite criteria by ID; they never restate them.**
Because: a restated criterion is a second source of truth that drifts from the first. Citation means `spec-implement` verifies against the spec's own words, and a criterion edited in `SPEC.md` is instantly in force for every task that cites it.
Instead of: self-contained task files — lost because they duplicate.
Revisit if: never; this one is load-bearing for the whole verification chain.

**D5 — Conventions graduate out of the spec into the constitution.**
Because: §4 in v1 is repo-wide, not feature-wide. Restating it in every change proposal is noise, and letting each proposal restate it differently is how conventions rot.
Instead of: keeping §4 in `SPEC.md` — retained only as the fallback when no constitution exists (AC-015).
Revisit if: users skip `spec-constitution` often enough that the fallback becomes the main path.

**D6 — Zero dependencies; adapters are pointer files, not generated copies.**
Because: "agent-neutral" and "zero-dep" collide the moment you generate per-platform outputs — generation needs a build step, and copies drift. Resolved by making adapters ~20-line files that point at `skills/` and contain no rule of their own (AC-016). Nothing to build, nothing to desynchronize.
Instead of: a generator script producing per-platform rule files — lost because it makes the repo a package with a release process.
Revisit if: a target platform cannot follow a pointer to another file, forcing inlined content.

**D7 — `spec-implement` stops at the first unmet criterion.**
Because: the failure mode being designed out is an agent that plows through twelve tasks and leaves a mess. Stopping converts a silent 12-task divergence into a single reported one.
Instead of: collect-all-failures-then-report — lost because later tasks build on the broken earlier one, so their results are meaningless.
Revisit if: users report the pipeline halting on criteria that were merely mis-worded.

## 4. Project Layout & Conventions

*These govern the FlowSystem repository itself. They are separate from the constitution FlowSystem writes for its users.*

### Directory layout

```
flowsystem/
├── skills/                    # canonical source. every behavioral rule lives here and nowhere else
│   ├── spec-constitution/
│   ├── spec-architect/
│   ├── spec-tasks/
│   ├── spec-implement/
│   └── spec-drift/
│       ├── SKILL.md           # workflow, phases, calibration. always loaded — keep it short
│       └── references/        # loaded on demand only. never inlined into SKILL.md
├── adapters/
│   ├── AGENTS.md              # pointer file. no rule of its own (AC-016)
│   └── cursor/                # .mdc pointer files
├── .claude-plugin/            # plugin + marketplace manifests. the repo itself is the plugin,
│                              # so skills/ is never copied and cannot desynchronise
├── examples/                  # worked runs. no rules — examples that teach behavior belong in references/
├── proof/                     # node --test suite. asserts artifact shapes, not agent prose
└── docs/                      # FlowSystem's own spec. dogfood; this file
```

### Dependency direction

`SKILL.md → its own references/ only.` No skill reads another skill's files (AC-012). Cross-stage communication happens exclusively through artifacts in the user's `docs/`. This is what lets any single skill directory be copied out and still work.

### Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Skill directory | `spec-<verb-or-noun>`, kebab-case | `spec-tasks` |
| Reference file | kebab-case noun phrase | `acceptance-criteria.md` |
| Acceptance criterion | `AC-` + 3 digits, zero-padded | `AC-007` |
| Change directory | 4-digit ordinal + kebab slug | `0003-shift-templates` |
| Task | `T-` + 2 digits, scoped to its task list | `T-04` |
| Spec section reference | `§` + number | `§8 Edge Cases` |

### Size limits

*SKILL.md is loaded on every invocation; references are loaded only when the workflow says to. The limits follow that asymmetry.*

| Unit | Soft | Hard |
| --- | --- | --- |
| `SKILL.md` | 150 lines | 220 lines |
| Reference file | 200 lines | 300 lines |
| Skill directory | 4 reference files | 6 reference files |

### Tooling

| Concern | Tool |
| --- | --- |
| Lint | `markdownlint-cli2`, config committed |
| Format | `prettier` (Markdown only) |
| Tests | `node --test` over `proof/` — no framework |
| CI | GitHub Actions: lint + proof on push |

## 5. Data Models

*This system's "data" is its artifacts. These interfaces describe the parsed shape each skill must produce and consume — they are the contract that makes stages interchangeable, not types to be implemented in code.*

```ts
/** Frontmatter required on every skills/<name>/SKILL.md */
interface SkillFrontmatter {
  name: string;          // must equal the containing directory name
  description: string;   // trigger conditions, 3rd person. ≤ 1024 chars — the only text
                         // a host agent sees before deciding to load the skill
}

/** docs/CONSTITUTION.md — written once by spec-constitution */
interface Constitution {
  principles: string[];        // repo-wide, non-negotiable. 3–7 items; more is a wish list
  layout: string;              // directory tree with per-directory rules
  dependencyDirection: string;
  naming: Array<{ kind: string; convention: string; example: string }>;
  sizeLimits: Array<{ unit: string; soft: number; hard: number }>;
  tooling: Array<{ concern: string; tool: string }>;
  verifyCommand: string | null; // null = no automated verification; spec-implement then
                                // verifies by reading code and must say so (AC-017)
}

/** One acceptance criterion. The atom the whole pipeline references. */
interface AcceptanceCriterion {
  id: `AC-${string}`;          // ^AC-\d{3}$, unique per repo, never reused (AC-004)
  pattern: EarsPattern;
  text: string;                // the full EARS sentence, verbatim
  status: 'active' | 'retired'; // retired criteria stay in the document as tombstones,
                                // so a task list citing an old ID still resolves
}

type EarsPattern =
  | 'ubiquitous'    // The <system> shall <response>.
  | 'event'         // When <trigger>, the <system> shall <response>.
  | 'state'         // While <state>, the <system> shall <response>.
  | 'unwanted'      // If <condition>, then the <system> shall <response>.
  | 'optional'      // Where <feature>, the <system> shall <response>.
  | 'complex';      // a combination of the above

/** docs/SPEC.md — the base spec. One per repository. */
interface Spec {
  status: 'Draft' | 'Active' | 'Superseded';
  specVersion: string;              // "2.0"
  sections: Record<1|2|3|4|5|6|7|8|9|10|11|12, string>; // §4 present only when no constitution (AC-015)
  criteria: AcceptanceCriterion[];  // §2.1. flat, not nested under features
  mergedChanges: string[];          // ordinals of proposals folded in, e.g. ["0001","0002"]
}

/** docs/changes/NNNN-slug/PROPOSAL.md — a delta against the base spec */
interface ChangeProposal {
  ordinal: string;                  // "0003", monotonic, never reused
  slug: string;                     // kebab-case
  status: 'proposed' | 'in-progress' | 'shipped';
  motivation: string;               // why now — the part that survives into §3 Decisions
  edits: SectionEdit[];
  newCriteria: AcceptanceCriterion[];   // IDs continue the repo-wide sequence, no restart
  retiredCriteria: `AC-${string}`[];    // ids retired by this change, with reasons in `edits`
}

interface SectionEdit {
  section: number;                       // 1–12
  operation: 'add' | 'replace' | 'remove';
  before: string | null;                 // null when operation is 'add'
  after: string | null;                  // null when operation is 'remove'
  reason: string;                        // required on 'replace' and 'remove' of a §3/§8/§9
                                         // item — those record reasons, and spec-drift
                                         // treats an unexplained reversal as a regression
}

/** docs/changes/NNNN-slug/TASKS.md — written by spec-tasks */
interface TaskList {
  ordinal: string;                  // matches its containing directory
  tasks: Task[];                    // ordered; execution follows array order exactly
}

interface Task {
  id: `T-${string}`;                // ^T-\d{2}$, scoped to this list
  title: string;
  closes: `AC-${string}`[];         // ≥ 1 required (AC-005). resolved against the spec at run time
  files: string[];                  // paths expected to be created or modified
  dependsOn: `T-${string}`[];       // must be earlier in the array; a forward reference is invalid
  done: boolean;                    // rendered as a checkbox — the task list is its own state
}
```

**Relationships**

- `Spec` 1:N `AcceptanceCriterion` — criteria live in the spec; proposals only add and retire.
- `ChangeProposal` 1:1 `TaskList` — a proposal without tasks is not implementable; a task list without a proposal has no criteria to cite.
- `Task` N:M `AcceptanceCriterion` by ID — resolved at read time, never copied (D4).
- `ChangeProposal` N:1 `Spec` — on merge, edits apply and the proposal moves to `archive/` (AC-010).

**Constraints**

- Unique: `AcceptanceCriterion.id` across the repository *including archived proposals* — prevents an archived task list from resolving to a criterion that now means something else.
- Unique: `ChangeProposal.ordinal` across `changes/` and `changes/archive/`.
- Ordered: `Task.dependsOn` may reference only earlier tasks — makes `spec-implement` a single forward pass with no scheduler.

## 6. Interfaces

### Stage invocation

| Stage | Invoked when | Reads | Writes |
| --- | --- | --- | --- |
| `spec-constitution` | New repo, or conventions are undocumented | repo files (to infer existing practice) | `docs/CONSTITUTION.md` |
| `spec-architect` | "I want to build…", "add feature X" | `docs/CONSTITUTION.md`, `docs/SPEC.md` (if any) | `docs/SPEC.md` *or* `docs/changes/NNNN-slug/PROPOSAL.md` |
| `spec-tasks` | A spec or proposal exists and work is about to start | `docs/SPEC.md`, `PROPOSAL.md`, `CONSTITUTION.md` | `docs/changes/NNNN-slug/TASKS.md` |
| `spec-implement` | A task list exists with unchecked tasks | `TASKS.md`, cited criteria, `CONSTITUTION.md` | source code; checkboxes in `TASKS.md` |
| `spec-drift` | After a milestone, before a feature, on return | `docs/**`, source code | report; then code fixes, spec edits, or archive move |

### Stage handoff contract

Each stage is a pure function of files to files. Three rules make them interchangeable:

1. **A stage reads only artifacts, never another skill's instructions** (AC-012).
2. **A stage writes exactly one artifact type.** `spec-implement` is the sole writer of source code; `spec-drift` is the sole writer that may touch both sides.
3. **A stage that finds its input missing names the stage that produces it and stops.** No stage silently synthesizes its own input — a reconstructed spec compared against the code it was reconstructed from finds nothing.

### AC reference protocol

```
In TASKS.md:     - [ ] T-04 Add overnight-shift validation — closes: AC-012, AC-013 — files: src/domain/shift.ts
Resolution:      grep '^| AC-012 |' docs/SPEC.md  →  the criterion's verbatim text
On failure:      criterion ID not found → the task is invalid; spec-implement stops (AC-008)
                 criterion found but 'retired' → warn, proceed, flag in the drift report
```

### Host-agent capability fallback

| Capability | Claude Code | Elsewhere |
| --- | --- | --- |
| Batched questions | `AskUserQuestion` | One numbered list, single message (AC-011) |
| Skill auto-trigger | frontmatter `description` | User names the stage explicitly; `AGENTS.md` lists the five names and when to use each |
| File edits | Edit / Write | Whatever the host provides — no stage depends on a specific tool name |

## 7. Core Flows

### Greenfield: idea → shipped M1

1. User describes an idea → `spec-constitution` reads the repo (usually empty), asks up to 4 questions, writes `docs/CONSTITUTION.md`.
2. User describes the product → `spec-architect` reads the constitution, asks its one round, writes `docs/SPEC.md` with §2.1 criteria `AC-001…AC-0NN`. §4 is a one-line pointer to the constitution (AC-014).
3. `spec-tasks` reads §10 Build Order, emits `docs/changes/0001-m1/TASKS.md` — each task citing the criteria it closes.
4. `spec-implement` walks the list in order. Per task: implement → run the constitution's verify command → confirm cited criteria → tick the checkbox.
5. All tasks green → `spec-drift` confirms code matches spec, marks `0001` shipped, archives it.

**Failure branches:** step 4 stops on the first unmet criterion (D7) and reports which task, which AC, and what it observed. Step 2 with a genuinely ambiguous idea produces numbered assumptions rather than a second round of questions.

### Feature N+1

1. User: "add shift templates" → `spec-architect` detects `docs/SPEC.md` and enters **delta mode** (AC-003).
2. It reads the existing spec — *especially §3 Decisions and §8 Edge Cases* — and writes `docs/changes/0004-shift-templates/PROPOSAL.md`: the sections it edits, the reason for each, and new criteria continuing the repo sequence from `AC-041`.
3. `docs/SPEC.md` is untouched. The user reviews a diff-shaped document, not a rewritten spec.
4. `spec-tasks` → `spec-implement` as above.
5. `spec-drift` merges the proposal's `edits` into `SPEC.md`, appends `"0004"` to `mergedChanges`, moves the directory to `archive/`.

**Failure branches:** a proposal editing a section another open proposal also edits → both are reported, neither merges, user sequences them. A proposal that would remove a §3/§8/§9 item without a `reason` is rejected at write time.

### Drift audit

1. `spec-drift` extracts checkable claims — now including every active `AC-###`, which is the largest gain over v1.
2. It verifies each against code, citing file and line.
3. Gaps classify as regression / staleness / undecided, unchanged from v1 (AC-009).
4. Report first, batched decisions second, edits third.

**Failure branches:** no spec → stop, name `spec-architect`. A v1 spec with no §2.1 → audit the prose sections only and offer a one-time criteria backfill.

## 8. Edge Cases & Failure Modes

| Case | Consequence if unhandled | Handling |
| --- | --- | --- |
| Existing v1 spec, no criteria, no constitution | Every downstream stage has nothing to cite; pipeline unusable on real projects | v1 specs are valid v2 specs minus §2.1. `spec-tasks` emits inline criteria and says so (AC-006); `spec-drift` offers a one-time backfill |
| Two open proposals edit the same section | Silent merge clobbers one; the lost one's reasoning vanishes | Both reported, neither merged, user sequences them. Detected by comparing `SectionEdit.section` across open proposals |
| Spec edited while a task list is mid-flight | Tasks cite criteria whose text changed underneath them | Criteria are resolved at read time, not copied (D4), so tasks pick up the new text. `spec-implement` reports any cited ID whose status flipped to `retired` |
| `spec-implement` interrupted (context limit, crash) | Restart re-does completed work or skips it | Checkboxes in `TASKS.md` are the only state. Restart resumes at the first unticked task; no separate status file exists to disagree |
| Criterion ID collision after archiving | An archived task list resolves to a criterion that now means something else | IDs are unique across active *and* archived artifacts; retired IDs stay as tombstones, never reused (AC-004) |
| Spec grows past what fits in one context | The document stops being loadable, which was its whole purpose | The delta model bounds it: proposals carry detail, the base spec carries decisions. If `SPEC.md` exceeds ~1,200 lines, `spec-drift` flags it as a structural finding |
| A skill directory copied out without its `references/` | Skill loads, workflow references a file that isn't there, agent improvises | No skill references anything outside its own directory (AC-012), so a directory is atomic. Install instructions say: copy the directory, not the file |
| Host agent has no interactive question tool | Skill either stalls or asks 8 questions one at a time | One numbered list, single message (AC-011) — specified per skill, not left to the agent |
| No constitution written | `spec-architect` references a file that doesn't exist | Falls back to inline §4, exactly as v1 (AC-015) |
| Unicode / long paste in a slug | Change directory name is unusable on some filesystems | Slugs are ASCII kebab-case, truncated at 40 chars; the full title lives inside `PROPOSAL.md` |

## 9. Security & Permissions

**Authentication:** none. FlowSystem is Markdown operated by an agent the user already trusts with their filesystem. The OS account is the boundary.

**Authorization:** none — but two real exposures follow from what these files *are*.

**Prompt injection through spec artifacts.** `CONSTITUTION.md`, `SPEC.md`, and `PROPOSAL.md` are instructions an agent follows, and they live in the repository where anyone with commit access — or a merged pull request — can edit them. A malicious `verifyCommand` in the constitution is arbitrary command execution at the moment `spec-implement` runs.

**Enforcement point:** `spec-implement`, in a single stated rule — it runs only the command named in `Constitution.verifyCommand`, never a command found in a spec, proposal, or task list (AC-017). Where that value is absent, it verifies by reading code and says so rather than inferring a command. Skills additionally treat all artifact content as data describing a system, not as instructions addressed to them.

**Data handling:** FlowSystem writes only Markdown into `docs/`. It stores no secrets, and skills instruct against pasting credentials, connection strings, or tokens into specs — a spec is committed, world-readable in a public repo, and loaded verbatim into model context. `spec-drift` reports a suspected secret in an artifact as a finding.

**Adapters:** pointer files carry no rules (AC-016), so an adapter cannot become an unreviewed channel for behavior the canonical skills don't have.

## 10. Build Order

**M1 — Verifiable specs**
*Demo: run `spec-architect` on a real idea; get a spec whose §2.1 lists `AC-001…AC-0NN` in EARS. Run v1's `spec-drift` against it — it is already sharper, with no changes to that skill.*
- [ ] `skills/spec-constitution/SKILL.md` + `references/principles.md`
- [ ] `spec-architect`: add §2.1 to `references/spec-template.md`; add `references/acceptance-criteria.md` (the five EARS patterns, with good/bad examples)
- [ ] `spec-architect`: §4 becomes a constitution pointer when one exists (AC-014), inline fallback when not (AC-015)
- [ ] `proof/`: assert AC ID format, uniqueness, and that every generated spec has a non-empty §2.1

**M2 — Close the loop**
*Demo: idea → spec → tasks → working code, with every task naming the criteria it closed. This is the hole in v1, shut.*
- [ ] `skills/spec-tasks/` — task list format, ordering rules, `dependsOn` validation, v1 fallback (AC-006)
- [ ] `skills/spec-implement/` — per-task verify loop, stop-on-first-failure (AC-008), resumability via checkboxes
- [ ] `spec-implement`: verify command sourced only from the constitution (AC-017)
- [ ] `proof/`: task lists cite only existing AC IDs; forward `dependsOn` references rejected

**M3 — Deltas**
*Demo: on a project that already shipped feature 1, add feature 2 without touching feature 1's reasoning.*
- [ ] `spec-architect` delta mode: detect existing `SPEC.md`, write `PROPOSAL.md` (AC-003)
- [ ] `docs/changes/` layout, ordinals, `archive/`
- [ ] `spec-drift`: merge shipped proposals, append to `mergedChanges`, archive (AC-010)
- [ ] `spec-drift`: conflict detection across open proposals; criteria backfill for v1 specs
- [ ] `proof/`: merge applies every `SectionEdit`; ordinals and AC IDs never reused

**M4 — Agent-neutral**
*Demo: the same five stages run end to end in Cursor and in a plain `AGENTS.md` agent.*
- [ ] `adapters/AGENTS.md` — five stage names, when to use each, pointers into `skills/`
- [ ] `adapters/cursor/*.mdc`
- [ ] Per-skill fallback wording for hosts with no question tool (AC-011)
- [ ] `proof/`: no adapter contains a rule absent from `skills/` (AC-016)

**M5 — Ship**
*Demo: a stranger installs v2 and runs the pipeline from the README alone.*
- [ ] Rewrite `README.md` for five stages; document v1 → v2 migration
- [ ] Update `examples/the-loop.md`; add a worked delta example
- [ ] Plugin manifest points at `skills/`; verify all three install paths
- [ ] `before-and-after.md` refreshed against v2 output

## 11. Assumptions

1. **This spec is for the `flowsystem` repository, written outside a checkout.** No clone exists on this machine — the installed skills are copies with no `.git`. The file lives at `flowsystem/docs/SPEC.md` under the working directory; move it into a real checkout before M1. *If wrong:* only the path changes.
2. **The `spec-*` naming stays, rather than a new `flow-*` prefix.** Two skill names are already published and installed. *If wrong:* §4 naming and every adapter reference change; no architecture moves.
3. **`spec-architect` gains a mode branch rather than a sibling `spec-change` skill.** One entry point for "I want to build something" is worth more than a clean separation, and delta mode reuses ~80% of the same workflow. *If wrong:* M3 splits into a sixth skill.
4. **v1 specs are valid v2 specs minus §2.1** — no forced migration, no version gate. *If wrong:* a migration stage joins M3.
5. **Acceptance criteria live in a flat repo-wide list, not nested per feature.** Flat keeps IDs globally unique and coverage countable. *If wrong:* AC IDs need a feature prefix and §5's uniqueness constraint is rewritten.
6. **The Node `proof/` suite tests artifact *shapes*, not agent prose.** Asserting what a model writes is a flaky test. *If wrong:* M1's test tasks expand considerably.
7. **`spec-drift` remains the merge point rather than a separate `spec-merge` stage.** It already reads both sides and classifies gaps; merging is the same work. *If wrong:* the pipeline is six stages.

## 12. Open Questions

- **How do Cursor and Codex users trigger a stage without description-based auto-invocation?** A naming convention, a slash command, or an explicit "follow `skills/spec-tasks/SKILL.md`" instruction — each degrades differently, and this needs testing on the actual platforms rather than deciding on paper. — blocks: §6 capability fallback, M4 · needed by: M4
- **Should v2 read existing Spec Kit or Kiro artifacts (`spec.md`, `requirements.md`, `tasks.md`) as input?** It is the cheapest adoption path from the two largest SDD tools, but it commits FlowSystem to tracking two external formats. — blocks: nothing in M1–M4 · needed by: M5, or deferred to v2.1
