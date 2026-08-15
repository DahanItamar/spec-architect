# M1 Capture and list — Tasks

> Source: proof/fixtures/valid-spec.md §10 M1 · Constitution: docs/CONSTITUTION.md
> Verify: `npm test`

- [x] T-01 Create the JSON store with load and save — closes AC-001 — files: src/store.js
- [x] T-02 Deduplicate on add by canonical URL — closes AC-002 — files: src/store.js — depends: T-01
- [ ] T-03 Fetch titles with a 5s timeout, storing unresolved on expiry — closes AC-003, AC-005 — files: src/fetch.js
- [ ] T-04 Refuse writes while the archive is open — closes AC-004 — files: src/store.js — depends: T-01
