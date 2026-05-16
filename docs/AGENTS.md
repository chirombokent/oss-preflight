# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Project Context

**This is a 48-hour hackathon build in PLANNING PHASE.** No application code exists yet - only architecture docs and Bob configuration. The actual implementation happens through Bob's Orchestrator loop (see `docs/bob-build-guide.md` §5).

## Non-Obvious Build Constraints

- **Bob custom modes override defaults**: `/plan`, `/code`, `/orchestrator` run PROJECT-SPECIFIC overrides defined in `.bob/custom_modes.yaml`, not stock Bob modes
- **Plan mode is markdown-only by design**: Cannot edit application code - this enforces spec-before-code discipline
- **Skills only run in Advanced/reviewer modes**: `plan` and `code` modes cannot activate skills - they rely on always-on `.bob/rules/` instead
- **Phase specs are GENERATED artifacts**: `docs/phase-plan.md` is created by Plan mode's generator prompt, not hand-written
- **Plan Council is a mandatory gate**: Before any phase builds, 5 adversarial teams must score ≥9/10 with zero blockers (see `docs/implementation-plan.md` §3, row S01.5)

## Evidence Discipline (Non-Negotiable)

From `.bob/rules/01-evidence-discipline.md`:
- Package facts ONLY from collectors/fixtures/cache - never invent downloads, licenses, versions, scores
- Missing evidence must be explicit `null` with "(not available)" label - never silent omission
- Inference must be labeled as "inferred" or "assessment"
- Smoke test results must be truthful - never claim green without running

## Build Workflow (Orchestrator Loop)

The Orchestrator runs a 10-step loop per phase (see `.bob/custom_modes.yaml` lines 99-143):
1. SPEC (delegate to plan) → user approval required
2. IMPLEMENT (delegate to code)
3. REVIEW (delegate to reviewer with skills)
4. TEST (delegate to advanced with skills)
5. FIX (delegate to code)
6. ENHANCE (delegate to code)
7. LOOP GATE (cap 3 iterations, then escalate)
8. EXPORT session
9. HUMAN REVIEW (mandatory approval gate)
10. COMMIT (Bob-generated message, never autonomous)

**Never skip review, test, or human approval steps.**

## File Restrictions by Mode

- `plan`: Only `docs/`, `context/`, `bob/`, `.bob/` markdown/txt/yaml
- `code`: Only `packages/`, `apps/`, `examples/`, `tests/`, `.oss-preflight/`
- `reviewer`: Only `docs/`, `bob/`, `.bob/` markdown/txt (read-only for code)
- `oss-preflight-scaffolder`: Only `.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`

## Decision Gates (Hard Deadlines)

From `docs/implementation-plan.md` §4:
- **Hour 14**: CLI works or drop the UI
- **Hour 24**: UI works or drop repo flow  
- **Hour 38**: Three clean demo runs or record backup video NOW

These are binary decisions answered out loud - "almost working" means cut the feature.

## Testing Must-Test List

From `.bob/rules-code/01-build-floor.md`:
- Scoring determinism (same input → byte-identical output)
- Missing evidence handling
- Cache fallback behavior
- Candidate normalization
- Scaffold smoke test
- Fact/inference label separation

**Determinism failure is a blocker, not a warning.**

## Banned Claims (User-Facing Copy)

From `.bob/rules/04-presentation-claims.md`:
- Never use: "guaranteed safe", "perfect stack", "proves best", "trust graph", "cryptographically verified", "only Bob can do this"
- Use instead: "evidence-backed recommendation", "best fit for stated goal", "facts separated from AI interpretation"