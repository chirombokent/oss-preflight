---
name: plan-council
description: Use to judge and iteratively harden docs/phase-plan.md before any build phase launches — an adversarial 5-team review gate that must reach real measurable 9/10 build-readiness, not inflated scores. Activates on "convene the plan council", "is the phase-plan build-ready", "review the plan", "plan gate", "judge the plan", or the Orchestrator PLAN GATE.
---

# Plan Council — adversarial build-readiness gate

A council of **5 independent adversarial teams** judges `docs/phase-plan.md`
before any phase is built. The council **judges only** — it never edits the
plan or code. Revision is delegated to `plan`. This is a hard gate, not advice.

## Convene (Orchestrator)

Delegate **5 separate `new_task` reviews**, one per team. Each team receives
`@/docs/phase-plan.md`, `@/docs/architecture.md`, `@/docs/implementation-plan.md`,
`@/.bob/custom_modes.yaml`, `@/.bob/rules-orchestrator/` (the enforcement layer
the plan will actually execute under — flag any plan↔runtime drift as a
BLOCKER), and its own charter **only** — no team sees another's verdict
(independence is the adversarial property). Each team returns: a 0–10 score,
BLOCKERS (gap-level, build-stopping), MAJORS, and the exact phase/field each
maps to.

## The 5 teams (orthogonal lenses)

1. **Reproducibility & Idempotency** — could *any* model, agent, or human
   reproduce every phase from its spec alone, deterministically? No hidden
   context, no "obvious" omitted step, every input an `@/` reference,
   re-running yields the same result, no undeclared order-dependence.
2. **Architecture Fidelity** — does every phase honor `architecture.md` (data
   model, scoring weights, API contracts, fact/inference split, one-pipeline
   boundary)? Flag any drift, contradiction, or invented contract.
3. **AC & Test Rigor** — is every acceptance criterion binary and testable?
   Do test scenarios cover the must-test list **plus** negative, edge,
   failure, and empty-input cases? Any vague or untestable criterion is a
   BLOCKER.
4. **Integration & Data-Contract Continuity** — does phase N's output exactly
   satisfy phase N+1's preconditions? Are data shapes/contracts consistent
   end-to-end, interfaces named and stable, the sequence truly gapless?
5. **Gap & Risk Red Team** — attack the plan as a hostile reviewer: missing
   prerequisites, ambiguous ownership, scope creep vs the cutline, unhandled
   failure/empty/error paths, schedule/gate violations, anything that stalls
   a clean sequential build.

## Gate (aggregate adversarially — no averaging)

`overall = MIN(all five team scores)`.

**PASS** only if `overall ≥ 9` **AND** zero unresolved BLOCKERS across all
teams. A single build-stopping gap fails the gate — it is never averaged away.

## On FAIL — revise measurably, then re-council

IBM clarified that the provisioned BobCoins are free for the hackathon
accounts, so the council is no longer capped to one round for cost reasons.
The council may run as many rounds as needed to reach the gate, but every
round after the first must produce measurable plan improvement before another
PASS/FAIL judgment is accepted.

On FAIL:

1. Produce one consolidated, deduplicated, prioritized findings list, each
   item mapped to a specific phase + field in `docs/phase-plan.md`.
2. Delegate a `plan` revision that edits `docs/phase-plan.md` only to address
   those findings. The revision must add a `Measurable refinements` note under
   the Council Verdict naming the exact changed sections and which blockers or
   major risks those changes resolve.
3. Re-convene all 5 independent teams against the revised plan. Teams must
   score from the written plan and the listed refinements only; they must not
   raise a score unless a previously cited issue is concretely resolved.
4. Continue this FAIL -> plan revision -> full 5-team re-council loop while
   each cycle removes blockers, converts vague acceptance criteria into
   testable criteria, repairs contract drift, or strengthens reproducibility.
5. Escalate to the user only when an external decision is required, two
   consecutive cycles produce no measurable refinement, or the user asks to
   stop.

Never lower the bar to pass. Never skip a team. Never average. Never inflate a
score to finish the process. A PASS requires real, reviewable improvements that
make the plan more buildable.

## Record (the gate artifact)

Write a `## Council Verdict (round N)` block at the top of
`docs/phase-plan.md`: per-team scores, blockers, overall, PASS/FAIL,
round, timestamp, and measurable refinements since the previous round. The
latest round is authoritative. **No phase may launch until a current PASS is
recorded** (enforced by `.bob/rules-orchestrator/`).

## Constraints

- Judge only; do not edit the plan or write code.
- Always-on rules remain the floor; the council never relaxes them.
- Iteration is allowed, but every extra round must be justified by concrete
  plan improvements, not by a desire to force a higher score.
