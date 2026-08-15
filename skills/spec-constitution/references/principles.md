# Principles

What a principle has to survive to be worth writing, and a catalog to draw from.

---

## The test

A candidate principle passes only if **all four** are true:

1. **You can name what breaks.** Not "quality suffers" — a specific failure. "Business logic becomes untestable." "A hang propagates to every caller." "The next reader deletes the guard because they don't know why it's there."
2. **It could be violated.** A rule the codebase cannot break is describing a fact, not setting a constraint. "We use TypeScript" is a fact; put it under Tooling.
3. **It applies repo-wide.** If it only governs the payments module, it belongs in that module's spec section, not the constitution.
4. **Someone will notice the violation.** A linter, a reviewer, or `spec-drift`. A rule with no observer is a wish.

Anything failing all four is a mission statement. Anything failing one is usually salvageable by making it more specific.

### Rewrites

| Rejected | Why it fails | Accepted form |
| --- | --- | --- |
| Write clean, maintainable code | Names no failure | Files over 500 lines are split before merge — a file that long is two modules sharing a name |
| Prefer immutability | Cannot be observed | Domain entities are constructed valid and never mutated in place; invalid states are unrepresentable |
| Handle errors properly | Names no failure | No empty `catch`. If an error genuinely doesn't matter, a comment says why |
| Be secure | Not repo-wide, not observable | Every query is scoped by owner at the repository layer, never by hiding UI |
| Test thoroughly | No observer | Business rules, authorization checks, and date/money arithmetic must have tests. Getters and framework wiring must not |
| Use modern practices | Meaningless | New code targets ES2022; no new CommonJS modules |

---

## Catalog

Draw from these. Take what applies, phrase it for this repo, and leave the rest — a constitution that copies the whole catalog has chosen nothing.

### Universal

- **`domain/` imports no framework.** No HTTP types, no ORM, no UI library. It must be testable with no app running. This is the single rule that keeps business logic from dissolving into controllers.
- **Every call leaving the process has an explicit timeout.** A missing timeout is a hang that propagates upward until something unrelated falls over.
- **Nullability is a decision.** Every optional field states why it can be absent. An unexplained nullable is a bug waiting for its first null.
- **No commented-out code.** Git remembers; the reader doesn't know whether it's a plan or a corpse.
- **Comment why, never what.** `// increment i` is noise. `// vendor 500s on empty arrays` is the reason the next reader won't delete the guard.
- **Every TODO carries an owner or an issue link.** An anonymous TODO is permanent.
- **Formatting is never a review comment.** The formatter wins; there is no style discussion.

### Data

- **Money is integer minor units plus an explicit currency code.** A float is a rounding error with a deployment date.
- **Timestamps are UTC with timezone; conversion happens only at the display edge.** Mixing zones inside the domain produces bugs that reproduce only in October.
- **Enums are enums** — a constrained union or DB enum, never a free string with a comment.
- **Migrations exist from day one.** Any schema outliving one deploy needs a named migration tool.
- **Soft delete only with a stated recovery or audit requirement.** Otherwise delete, and say the data is unrecoverable.

### Security

- **Every query is scoped by owner, enforced server-side per request.** The most common real vulnerability is an ID in a URL nobody checked belonged to the caller.
- **Authorization is enforced in one named place** — middleware, RLS, or a repository layer. Re-implemented per handler, it leaks eventually.
- **No secrets in the repo.** `.env` is ignored; `.env.example` is committed with empty values.
- **Client-facing errors are generic; logs carry the detail.** A stack trace in a response hands over the internals.

### Frontend

- **Logical CSS properties only** (`margin-inline-start`, not `margin-left`) where any RTL language is in scope. Nearly free on day one; a full sweep in month three.
- **Shared components don't fetch.** Data loading lives at the route or feature boundary, so a component can be rendered anywhere.
- **Every async surface has a loading, empty, and error state.** The empty state is the most-seen and least-designed screen in most products.

### Agent-specific

*Worth stating explicitly in a repo where an AI agent writes code — these are the rules agents break most.*

- **No new dependency without a named problem it solves.** Agents add libraries reflexively; each one is a permanent maintenance obligation.
- **No new abstraction layer until the third caller exists.** Two callers is a coincidence.
- **Changes stay inside the task's stated file list.** An unrequested drive-by refactor in an unrelated file is how a small diff becomes unreviewable.
- **Existing patterns beat better patterns.** Code that matches the file around it is worth more than code that is marginally cleaner and looks foreign.

---

## The verify command

The most valuable line in the document, because it is the only one that runs.

| Situation | Record as |
| --- | --- |
| A test suite exists | The exact command, e.g. `npm test`, `pytest -q`, `cargo test` |
| Tests plus typecheck and lint | Chain them: `npm run lint && npm run typecheck && npm test` |
| A build but no tests | The build command, and state plainly that it proves compilation, not behavior |
| Nothing automated | `none — verified by reading` |

Two rules:

- **It must be a command already in the repository** (a script in `package.json`, a documented make target). A command invented by this skill is one nobody has ever run.
- **State what it does not cover.** "Runs unit tests; does not start the app or touch the database" tells `spec-implement` exactly how much a green run is worth.

This value is the only command `spec-implement` will execute. That is deliberate: it means a spec or task list — files anyone with commit access can edit — can never introduce a command to be run.
