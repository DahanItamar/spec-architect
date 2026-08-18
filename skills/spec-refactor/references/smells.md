# Code Smells

The five families, what makes each one detectable, and the false positives an agent reaches for first.

> The taxonomy and the names — *Long Method*, *Feature Envy*, *Shotgun Surgery* — are the standard
> refactoring catalogue (Fowler and Beck, as organised on
> [refactoring.guru](https://refactoring.guru/refactoring/smells)). They are used here as shared
> vocabulary so that a finding names something a reader can look up. Nothing below is copied from
> that source, and none of it overrides `docs/CONSTITUTION.md`.

---

## Work the families in this order

Not alphabetically, and not in catalogue order. In descending order of how likely a member is to
pass the gate in `SKILL.md`:

| # | Family | What it costs | Hit rate at the gate |
| --- | --- | --- | --- |
| 1 | **Change Preventers** | One change forces many edits | Almost always actionable |
| 2 | **Couplers** | Modules that cannot move or be tested apart | Often |
| 3 | **Bloaters** | Things that grew until nobody reads them whole | Sometimes |
| 4 | **Dispensables** | Weight with no function | Cleanup, not refactoring — see `cleanup-gate.md` |
| 5 | **OO Abusers** | The language's structures used against their grain | Rarely, and easy to overfit |

A report that opens with a Bloater when a Change Preventer is present has buried its own finding.

---

## 1. Change Preventers — start here

The only family defined by *what it does to future work*, which is exactly what the gate asks for.

| Smell | The signal | The move |
| --- | --- | --- |
| **Divergent Change** | One file is edited for unrelated reasons — auth changes touch it, and so do CSV export changes | Split by reason for change: *Extract Class* along the seams |
| **Shotgun Surgery** | One conceptual change edits five files. Adding a rule means a branch here, a column there, a case in the export | *Move* the scattered pieces together; the rule becomes one object |
| **Parallel Inheritance Hierarchies** | Every new subclass here forces a matching subclass there | Collapse one side, or fold the pair into composition |

**How to see it without guessing:** look at git. Files that change together in most commits are one
concept wearing two names; a file that appears in commits with unrelated messages is Divergent
Change. `git log --name-only` over the last fifty commits is usually enough, and it is evidence
rather than impression.

---

## 2. Couplers

| Smell | The signal | The move |
| --- | --- | --- |
| **Feature Envy** | A function reads five fields of another object and one of its own | *Move Method* to where the data lives |
| **Inappropriate Intimacy** | Two modules reach into each other's internals; neither can be tested alone | Extract the shared part, or make one own the relationship |
| **Message Chains** | `a.getB().getC().getD().doIt()` — the caller knows the whole shape of the graph | *Hide Delegate*, or ask the first object for what you actually want |
| **Middle Man** | A class whose every method forwards somewhere else | Remove it and let callers talk directly |

Couplers are the family most worth catching before a milestone that adds a second implementation of
anything, because coupling is what makes "add a second one" a rewrite.

---

## 3. Bloaters

| Smell | The signal | The move |
| --- | --- | --- |
| **Long Method** | You cannot state what it does in one sentence without "and" | *Extract Method* along the comments already in it |
| **Large Class** | Fields that are only used by half the methods — two classes sharing a file | *Extract Class* on that split |
| **Long Parameter List** | Callers pass values they had to fetch just to pass | *Introduce Parameter Object*, or pass the object it came from |
| **Primitive Obsession** | A money amount is a float, a date is a string, an id is any string at all | Give the concept a type; the spec's §5 usually already named it |
| **Data Clumps** | The same three parameters travel everywhere in the same order | They are one thing that has no name yet — name it |

**Primitive Obsession is the one worth taking seriously**, because it is the smell the proof in
this repository is about: a shift time stored as `'9:00'` compares lexically, and the overlap check
silently stops working. When a data-shape smell contradicts §5 of the spec, it is not a smell at
all — it is drift, and stage 5 owns it.

---

## 4. Dispensables

| Smell | The signal | Where it goes |
| --- | --- | --- |
| **Dead Code** | Nothing reaches it | `cleanup-gate.md` — evidence required |
| **Duplicate Code** | The same logic in three places, already diverging in one | *Extract Method* / pull up — **actionable when the copies disagree** |
| **Speculative Generality** | An abstraction with one implementation, "for when we need it" | Inline it. The second case will not look like the guess |
| **Comments** | A comment explaining *what* a confusing block does | Extract the block and let its name carry the sentence |
| **Lazy Class** | A class that no longer earns its file | Inline it |

**Duplicate Code deserves the most care.** Two copies that are identical are cheap and honest. Two
copies that have *already drifted apart* are a defect waiting for whichever call site is unlucky —
that divergence is the finding, and it is worth reporting with both versions side by side.

Duplication across a real boundary — two services, two bounded contexts — is usually correct.
Merging it couples two things that were deliberately separated, and produces a shared utility that
neither side can change.

---

## 5. Object-Orientation Abusers

| Smell | The signal | The move |
| --- | --- | --- |
| **Switch Statements** | The same `switch` on the same type, in several places | *Replace Conditional with Polymorphism* — **only if it repeats** |
| **Temporary Field** | A field set only during one operation and null the rest of the time | It is a local variable, or a parameter object |
| **Refused Bequest** | A subclass that inherits and then throws on half of it | The relationship is not "is a" — use composition |
| **Alternative Classes with Different Interfaces** | Two classes do the same job with different method names | Unify the interface, then remove one |

This family is where an agent most reliably overfires, because its members are recognisable from a
single file while the cost they claim only exists across many.

---

## The false positives — check these before reporting

An agent with a catalogue finds smells everywhere. Each of these looks like a hit and is not:

| Looks like | Actually | Report it only if |
| --- | --- | --- |
| Long Method | A flat sequence of steps with no branching — a hundred readable lines with one job | It has branching or repeated blocks you must hold in your head at once |
| Switch Statements | A single dispatch table, in one place, at the boundary where data becomes objects | The same switch appears a second time |
| Duplicate Code | Two similar-looking blocks in different bounded contexts that change for different reasons | The copies have already diverged, or one change must be applied to all of them |
| Primitive Obsession | An id that is a string in a language where that is idiomatic and §5 says so | The primitive loses information the spec requires — ordering, precision, timezone |
| Large Class | A framework-mandated shape — a Django model, a controller, a reducer | The constitution's size limit is exceeded, or the fields split cleanly in two |
| Speculative Generality | An extension point the spec's §3 explicitly decided on | No decision record mentions it and only one implementation exists |
| Comments | A comment recording *why*, or a link to a decision | The comment explains *what* the next five lines do |

**A configuration file, a generated file, a vendored dependency, and a migration are not smelly.**
Skip them; a report that flags `schema.prisma` for Long Parameter List teaches the reader to stop
reading.

---

## Cheap first pass

Before reading anything closely, get the shape of the codebase — these cost seconds and point at
where to look:

- **Size outliers.** The five longest files and functions. Not a finding on its own; a starting point.
- **Co-change.** `git log --name-only` over the recent history — which files always move together.
- **Repeated literals.** The same magic number or string key in many files is usually a Data Clump
  or a missing type.
- **Churn.** The files with the most commits are where structure costs the most, and where a
  refactoring pays back fastest.

Then read the actual code. Every finding in the report must be something you read, not something a
heuristic suggested.
