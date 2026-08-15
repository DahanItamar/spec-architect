# Acceptance Criteria

How to write §2.1 — the section that turns a spec from prose an agent judges into claims an agent checks.

---

## Why this section exists

Every other section describes. This one **asserts**. The difference matters downstream:

| Stage | What it does with a criterion |
| --- | --- |
| `spec-tasks` | Every task cites the IDs it closes. A task closing nothing is unnecessary. |
| `spec-implement` | Verifies the cited criteria before starting the next task; stops if unmet. |
| `spec-drift` | Checks each criterion against the code and reports by ID. |

A spec with no criteria still works — every stage degrades to judging prose — but it gives up the only mechanically checkable surface the document has.

---

## EARS

Five sentence patterns. Every criterion uses exactly one. They exist because ambiguity in a requirement becomes a defect in the code, and these shapes have nowhere for ambiguity to hide.

| Pattern | Template | Use when |
| --- | --- | --- |
| **Ubiquitous** | *The `<system>` shall `<response>`.* | Always true, no trigger |
| **Event-driven** | *When `<trigger>`, the `<system>` shall `<response>`.* | Something happens |
| **State-driven** | *While `<state>`, the `<system>` shall `<response>`.* | Continuously, during a state |
| **Unwanted behavior** | *If `<condition>`, then the `<system>` shall `<response>`.* | Errors, invalid input, failure |
| **Optional feature** | *Where `<feature is present>`, the `<system>` shall `<response>`.* | Conditional on configuration |

Complex cases combine them — *"While offline, when the user saves, the system shall queue the change locally."* Use sparingly; two simple criteria usually beat one compound.

### The words are load-bearing

- **shall** — the obligation. Not "should", not "will", not "must". One word, so a reader can find every requirement with a search.
- **When / While / If / Where** — the trigger type. Swapping them changes the meaning: *When* fires once on an event; *While* holds continuously during a state; *If* marks the unwanted path.
- Always name the actor. *"The scheduler shall…"*, not *"It shall…"* or *"The system shall…"* when a specific component owns it.

### Rewrites

| Rejected | Why | Accepted |
| --- | --- | --- |
| The app should be fast | No trigger, no measure, no obligation | When a week view is requested, the scheduler shall render within 200ms for up to 500 shifts |
| Handle overlapping shifts | Not a sentence, no actor, no response | If two shifts for one employee overlap by any minute, then the scheduler shall flag both and refuse to publish |
| Users can export to PDF | Describes a capability, not an obligation | When the user requests an export, the system shall produce a PDF of the visible week |
| The system shall be secure | Unverifiable | The API shall reject any request whose session does not own the referenced record, with 404 |
| Support offline mode | No behavior stated | While the network is unavailable, the client shall accept edits and queue them for replay |

---

## Identifiers

Format: `AC-` followed by three digits, zero-padded — `AC-001`, `AC-042`.

Four rules, all load-bearing:

1. **Unique across the whole repository**, including archived change proposals. A task list from a shipped change still cites its IDs; reuse would silently repoint it at a different requirement.
2. **Never reused after retirement.** A criterion that no longer applies is marked `retired` and stays in the document as a tombstone. It costs one line and preserves every old citation.
3. **Assigned in one sequence, continuing across change proposals.** Feature 4's criteria start where feature 3's ended. Never restart at 001 per feature.
4. **Stable.** Renumbering to tidy up breaks every citation in every task list. Gaps are fine and expected.

### In the spec

```markdown
### 2.1 Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AC-001 | The scheduler shall represent a shift as start and end minutes from midnight. |
| AC-002 | When a shift crosses midnight, the scheduler shall store an end minute greater than 1440. |
| AC-003 | If two shifts for one employee overlap by any minute, then the scheduler shall flag both. |
| ~~AC-004~~ | *Retired in 0007-drop-csv — CSV export replaced by PDF (AC-031).* |
```

---

## How many, and about what

**Roughly one criterion per behavior a user or another system can observe.** Ten to forty for a normal feature spec. Fewer than five usually means the spec described a system without stating what it must do; more than sixty usually means implementation detail leaked in.

Write criteria for:

- Every capability listed in §2 In Scope
- Every step in §7 Core Flows that can be observed from outside
- Every row in §8 Edge Cases — these are almost always *If… then…* criteria and they are the ones most likely to be violated later
- Every enforcement point in §9 Security

Do **not** write criteria for:

- Internal structure — "the repository layer shall use prepared statements" is a convention; it belongs in the constitution
- Anything in §11 Assumptions — an assumption is not yet a requirement
- Anything you cannot observe from outside the unit that implements it

---

## Coverage test

Before delivering the spec, check both directions:

1. **Every §10 task closes ≥ 1 criterion.** A task closing nothing is either unnecessary work or evidence of a criterion you failed to write.
2. **Every criterion is closed by ≥ 1 task.** An unclosed criterion is scope nobody has planned to build — either schedule it or move it to §2 Out of Scope.

Both directions matter. The first catches invented work; the second catches silently dropped requirements. `spec-tasks` re-runs this test, but finding a gap here is cheaper than finding it after the task list is written.

---

## Migrating a v1 spec

A spec written before §2.1 existed is still valid — nothing downstream requires criteria, and every stage degrades gracefully. To backfill:

1. Read §2 In Scope, §7 Core Flows, §8 Edge Cases, and §9 Security — these already contain the assertions, in prose.
2. Rewrite each as one EARS sentence. Do not invent behavior the spec never claimed; a criterion the code was never meant to satisfy will be reported as a regression forever.
3. Number from `AC-001` in document order, then add §2.1.
4. Leave the prose sections alone. They explain; §2.1 asserts. Both are wanted.
