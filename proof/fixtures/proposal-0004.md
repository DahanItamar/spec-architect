# 0004 — Folders

> Status: shipped · 2026-02-01 · Against spec version 1.0

## Motivation

A flat inbox stops being readable somewhere past two hundred entries, which the
first users hit in three weeks. Folders are the smallest structure that fixes it
without introducing a query language.

## Criteria added

| ID | Criterion |
| --- | --- |
| AC-007 | The inbox shall assign every bookmark to exactly one folder. |
| AC-008 | When no folder is given, the inbox shall assign the bookmark to `unsorted`. |
| AC-009 | If a folder is deleted while it holds bookmarks, then the inbox shall move them to `unsorted` rather than delete them. |

## Criteria retired

| ID | Reason |
| --- | --- |
| AC-005 | Hostname fallback replaced by always showing the canonical URL (AC-007 display path). |

## Section edits

### §5 Data Models — add

```ts
interface Folder {
  name: string; // unique, lowercase
}
```

### §8 Edge Cases — replace

**Before:** | Same URL added twice | Two rows, neither authoritative | Update in place | AC-002 |
**After:** | Same URL added twice | Two rows, neither authoritative | Update in place, keeping the original folder | AC-002 |
**Reason:** dedup now has to decide what happens to the folder assignment, and
silently reassigning to the new folder would lose a user's filing.

## Impact

- Milestones affected: M2
- Criteria added: 3 · retired: 1
- No change to §9 Security
