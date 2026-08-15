# FlowSystem

Spec-driven development in five stages. Each stage is a Markdown file of instructions — read the one you need and follow it.

```
constitution → spec → tasks → implement → drift
```

| Stage | Read this | When |
| --- | --- | --- |
| 1. Constitution | `skills/spec-constitution/SKILL.md` | New repo, or conventions are undocumented |
| 2. Spec | `skills/spec-architect/SKILL.md` | An idea to specify, or a feature to add to an existing spec |
| 3. Tasks | `skills/spec-tasks/SKILL.md` | A spec exists and work is about to start |
| 4. Implement | `skills/spec-implement/SKILL.md` | A task list exists with unchecked tasks |
| 5. Drift | `skills/spec-drift/SKILL.md` | After a milestone, before a feature, on returning to a project |

Each `SKILL.md` opens with a `description` saying exactly when it applies, then gives the workflow. Its `references/` directory is loaded on demand, only when the workflow says to.

## Artifacts

```
docs/
├── CONSTITUTION.md              stage 1
├── SPEC.md                      stage 2 — the truth
└── changes/
    ├── NNNN-slug/
    │   ├── PROPOSAL.md          stage 2, delta mode
    │   └── TASKS.md             stage 3
    └── archive/                 merged by stage 5
```

## This file holds no rules

Every rule lives in `skills/`. This is a pointer so that nothing here can drift from what the skills actually say — if the two disagreed, you would have no way to know which was current.

Read the stage file itself before acting on it.
