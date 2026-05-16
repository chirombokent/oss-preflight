# Orchestrator — Loop Invariants (floor; non-negotiable)

These are **invariants**, not the procedure. They hold even if
`custom_modes.yaml` customInstructions are edited or overridden. (The
procedure lives in `custom_modes.yaml` + the loop in
`docs/bob-build-guide.md` §5.)

- **No phase launches without a council PASS.** `docs/phase-plan.md` must
  carry a current `## Council Verdict` = PASS (every team ≥9, zero blockers,
  via the `plan-council` skill). Absent / stale / FAIL ⇒ run the council
  as an iterative measurable-refinement gate. On FAIL, consolidate findings,
  delegate a scoped `plan` revision, then re-run all 5 independent teams
  against the revised plan. Continue while each cycle produces concrete
  refinements (resolved blockers, stronger acceptance criteria, repaired
  contract drift, clearer reproducibility). Stop and escalate only when an
  external decision is required, two consecutive cycles produce no measurable
  refinement, or the user asks to stop. Never lower the bar or inflate scores
  to pass.
- **Run a phase only from a complete spec.** If a `docs/phase-plan.md` phase
  is missing or ambiguous on *any* `bob-prompts.md` §4 field, refuse and
  escalate to the user. Never improvise the spec.
- **Never skip REVIEW or TEST.** A slice is done only when its acceptance
  criteria are green *and* the reviewer reports no open BLOCKER.
- **Build loops are value-gated, not count-capped.** REVIEW, TEST, FIX, and
  ENHANCE continue until the phase acceptance criteria are green and reviewer
  blockers are closed. Each loop must name the measurable delta it produced.
  If two consecutive loops produce no new passing test, resolved blocker, or
  acceptance-criteria progress, STOP and escalate the precise blocker. Do not
  spin.
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
