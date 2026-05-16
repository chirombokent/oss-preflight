# Orchestrator — Loop Invariants (floor; non-negotiable)

These are **invariants**, not the procedure. They hold even if
`custom_modes.yaml` customInstructions are edited or overridden. (The
procedure lives in `custom_modes.yaml` + the loop in
`docs/bob-build-guide.md` §5.)

- **No phase launches without a council PASS.** `docs/phase-plan.md` must
  carry a current `## Council Verdict` = PASS (every team ≥9, zero blockers,
  via the `plan-council` skill). Absent / stale / FAIL ⇒ run the council
  **once** (cap 1 round; never auto-revise-and-re-council). On FAIL,
  consolidate findings, record the FAIL verdict, STOP and escalate to the
  user; the user decides whether to revise via `plan` and re-invoke the
  council. Never lower the bar to pass.
- **Run a phase only from a complete spec.** If a `docs/phase-plan.md` phase
  is missing or ambiguous on *any* `bob-prompts.md` §4 field, refuse and
  escalate to the user. Never improvise the spec.
- **Never skip REVIEW or TEST.** A slice is done only when its acceptance
  criteria are green *and* the reviewer reports no open BLOCKER.
- **Loop cap is 3 full iterations.** On cap, STOP and escalate the precise
  unmet acceptance criterion and the blocking cause. Do not spin.
- **Never commit autonomously.** STEP 9 human review is mandatory; STEP 10
  commit runs only after explicit user approval, with a Bob-generated message.
- **Evidence before the next phase.** Each completed phase leaves its
  `bob_sessions/S<id>-<slug>/` folder containing task-history markdown +
  consumption-summary screenshot, and its `bob_sessions/build-report.md` row first.
- **Delegate to modes, not skills.** Skills fire by `description` in Advanced
  and in skill-enabled custom modes where supported; they are not delegation
  targets.
- **Single responsibility.** plan specs · code builds · reviewer reviews.
  Do not collapse steps or let one mode do another's job.
