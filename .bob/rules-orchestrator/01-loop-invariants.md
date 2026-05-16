# Orchestrator — Loop Invariants (floor; non-negotiable)

These are **invariants**, not the procedure. They hold even if
`custom_modes.yaml` customInstructions are edited or overridden. (The
procedure lives in `custom_modes.yaml` + the loop in
`docs/bob-build-guide.md` §5.)

- **No phase launches without a council PASS.** `docs/phase-plan.md` must
  carry a current `## Council Verdict` = PASS (every team ≥9, zero blockers,
  via the `plan-council` skill). Absent / stale / FAIL ⇒ run the council;
  on FAIL delegate revision to `plan` and re-council; cap 3 rounds, then
  escalate. Never lower the bar to pass.
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
  `bob/build-sessions/<id>/` export + `bob/build-report.md` row first.
- **Delegate to modes, not skills.** Skills fire by `description` in
  skill-enabled modes (`reviewer`/Advanced); they are not delegation targets.
- **Single responsibility.** plan specs · code builds · reviewer reviews.
  Do not collapse steps or let one mode do another's job.
