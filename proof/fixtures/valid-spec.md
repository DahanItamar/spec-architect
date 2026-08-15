# Bookmark Inbox — Technical Spec

> Status: Draft · 2026-01-01 · Spec version 1.0

A minimal but complete spec, used as the positive fixture for the proof suite.
Every rule the suite enforces holds here, so a failure means the rule changed —
not that this document drifted.

## 1. Problem & Users

Links pile up in twelve browser tabs and get lost on restart.

**Primary user:** a developer who reads later, not now.
**Success looks like:** a tab closed without losing the link.

## 2. Scope

### In scope

- Capture a URL from the terminal
- List and open what was captured

### Explicitly out of scope

- Sync across machines — v2; requires a server and conflict resolution
- Full-text search of page contents — the index is not worth its maintenance yet

### 2.1 Acceptance Criteria

| ID | Criterion |
| --- | --- |
| AC-001 | The inbox shall store each bookmark with a URL, a title, and a captured timestamp. |
| AC-002 | When the user adds a URL that is already stored, the inbox shall update the existing entry rather than create a second one. |
| AC-003 | If a URL cannot be fetched within 5 seconds, then the inbox shall store it with an empty title and mark it unresolved. |
| AC-004 | While the archive is open, the inbox shall accept no writes. |
| AC-005 | Where a title is absent, the inbox shall display the hostname instead. |
| ~~AC-006~~ | *Retired in 0002-drop-tags — tags replaced by folders (AC-011).* |

## 3. Architecture

### Overview

One CLI process over a JSON file. No server, because nothing is shared.

### Decisions

**Storage** — a single JSON file under the user's data directory
Because: one user, one machine, a few hundred rows (§1)
Instead of: SQLite — lost because it adds a dependency to save a millisecond nobody measures
Revisit if: the file exceeds ~5,000 entries or a second writer appears

## 5. Data Models

```ts
interface Bookmark {
  url: string; // canonical, trailing slash stripped — the dedup key (AC-002)
  title: string; // "" when unresolved (AC-003)
  capturedAt: string; // ISO 8601 UTC
  unresolved: boolean;
}
```

**Constraints**

- unique: `url` — prevents the duplicate entry AC-002 forbids

## 8. Edge Cases & Failure Modes

| Case | Consequence if unhandled | Handling | AC |
| --- | --- | --- | --- |
| Fetch times out | The add hangs and the user loses the URL | Store unresolved after 5s | AC-003 |
| Same URL added twice | Two rows, two titles, neither authoritative | Update in place | AC-002 |

## 10. Build Order

**M1 — Capture and list**
*Demo: add a URL, restart the shell, list it back.*

- [ ] T-01 Create the JSON store with load and save — closes AC-001 — files: src/store.js
- [ ] T-02 Deduplicate on add — closes AC-002 — files: src/store.js — depends: T-01
- [ ] T-03 Fetch titles with a timeout — closes AC-003, AC-005 — files: src/fetch.js
- [ ] T-04 Refuse writes while the archive is open — closes AC-004 — files: src/store.js — depends: T-01

## 11. Assumptions

1. A single machine — no sync path exists in this spec. If wrong, §3 gains a server.
