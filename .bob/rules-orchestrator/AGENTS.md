# Orchestrator Mode — pointer (not the source of truth)

The canonical Orchestrator floor is
**`.bob/rules-orchestrator/01-loop-invariants.md`** (loaded with this file).
The full 10-step procedure lives in `.bob/custom_modes.yaml` (orchestrator
`customInstructions`) and `docs/bob-build-guide.md` §5. Do not duplicate or
paraphrase the loop here — a second copy is how they drift.

Invariant reminders (authoritative text is in `01-loop-invariants.md`):

- STEP 0 Plan Council is iterative: on FAIL, consolidate findings, delegate a
  scoped `plan` revision, and re-run all 5 independent teams while each cycle
  produces measurable plan refinements. Never lower the bar or inflate scores.
- Never skip REVIEW or TEST; the feature loop is value-gated rather than
  count-capped. Continue while loops resolve blockers or acceptance criteria;
  stop only when progress stalls or a real external decision is required.
- Never commit autonomously — STEP 9 human approval is mandatory.
- Each completed phase leaves a `bob_sessions/S<id>-<slug>/` folder
  (task-history markdown + consumption-summary screenshot) and its
  `bob_sessions/build-report.md` row. There is no `bob/` directory.

If this file and `01-loop-invariants.md` ever disagree,
`01-loop-invariants.md` wins.
