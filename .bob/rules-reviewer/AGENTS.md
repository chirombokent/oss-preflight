# Reviewer Mode — pointer (not the source of truth)

The canonical Reviewer floor is **`.bob/rules-reviewer/01-review-floor.md`**
(loaded with this file). It defines the two distinct jobs (per-phase loop
review · final submission review), the blocker-first order, and the
submission checks. Do not duplicate or paraphrase it here.

For project context, read the source docs directly (do not restate):

- `docs/implementation-plan.md` §8 (demo path), §9 (risk register), §10
  (submission checklist).
- `.bob/skills/code-review/SKILL.md`, `.bob/skills/evidence-discipline/SKILL.md`
  — the review recipes (the floor holds even if a skill does not fire).
- `.bob/rules/04-presentation-claims.md` — banned-claims list to grep for.

Evidence layout is single-location: `bob_sessions/` holds per-session
task-history markdown + consumption-summary screenshots; the single ledger
is `bob_sessions/build-report.md`. There is no `bob/` directory.

If this file and `01-review-floor.md` ever disagree, `01-review-floor.md` wins.
