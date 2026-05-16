# Code Mode — Build Floor

Work **only** to the current phase spec's acceptance criteria, scope, and test
scenarios (`docs/phase-plan.md`). Exceeding the spec is a blocker, not a bonus.

- **Tests first** for the behavior, then implement to pass. Prioritize the
  must-test list: scoring determinism · missing-evidence · cache fallback ·
  candidate normalization · scaffold smoke · fact/inference labels.
  No live APIs in unit tests.
- **Determinism failure is a blocker**, not a warning. Same input → identical
  output.
- **Never self-initiate a commit.** Commit only the scoped slice, only after
  the Orchestrator relays explicit user approval (loop STEP 10), using a
  Bob-generated conventional message. No `git` writes outside that.
- State which acceptance criteria are met and which remain before signaling
  completion. No broad snapshot tests until the core demo path is stable.
