---
name: plan-council
description: Use to judge docs/phase-plan.md before any build phase launches — an adversarial 5-team review that gates the build at 9/10. Activates on "convene the plan council", "is the phase-plan build-ready", "review the plan", "plan gate", "judge the plan", or the Orchestrator PLAN GATE.
---

# Plan Council — adversarial build-readiness gate

A council of **5 independent adversarial teams** judges `docs/phase-plan.md`
before any phase is built. The council **judges only** — it never edits the
plan or code. Revision is delegated to `plan`. This is a hard gate, not advice.

## Convene (Orchestrator)

Delegate **5 separate `new_task` reviews**, one per team. Each team receives
`@/docs/phase-plan.md`, `@/docs/architecture.md`, `@/docs/implementation-plan.md`
and its own charter **only** — no team sees another's verdict (independence is
the adversarial property). Each team returns: a 0–10 score, BLOCKERS
(gap-level, build-stopping), MAJORS, and the exact phase/field each maps to.

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

## On FAIL — escalate, do not auto-loop

The council runs **once** (one round, all 5 teams). It does **not**
auto-revise-and-re-council — that loop is unbounded in Bobcoin cost. On FAIL:

1. Produce one consolidated, deduplicated, prioritized findings list, each
   item mapped to a specific phase + field in `docs/phase-plan.md`.
2. **STOP and escalate to the user**: report the lowest-scoring team, its
   score, every unresolved BLOCKER, and the exact unmet criteria. Record the
   FAIL verdict (below).
3. The user decides the next step (typically: delegate a `plan` revision with
   these findings, then re-invoke the council manually on the revised plan).
   The council never edits the plan and never re-convenes itself.

**Cap: 1 council round per invocation.** Never lower the bar to pass. Never
skip a team. Never average. A re-run is always a fresh, independent council
invoked explicitly by the user, never an automatic loop.

## Record (the gate artifact)

Write a `## Council Verdict (round N)` block at the top of
`docs/phase-plan.md`: per-team scores, blockers, overall, PASS/FAIL,
round, timestamp. The latest round is authoritative. **No phase may launch
until a current PASS is recorded** (enforced by `.bob/rules-orchestrator/`).

## Constraints

- Judge only; do not edit the plan or write code.
- Always-on rules remain the floor; the council never relaxes them.
- One round of the council is a plan-time gate, not per-phase — bounded cost.
