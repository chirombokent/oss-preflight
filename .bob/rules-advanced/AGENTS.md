# Advanced Mode - Project-Specific Rules

## Advanced Mode Context

Advanced mode has full tool access (read, edit, command, browser, mcp, **skills**). Used for:
- TEST/validate step (Orchestrator STEP 4) with `test-runner` skill
- Doc passes with `doc-writer` skill  
- Runtime skill demo (S07) with `oss-preflight-advisor` skill
- Plan Council adversarial teams with `plan-council` skill

## Non-Obvious Skill Activation

From `docs/bob-build-guide.md` §2 verified matrix:
- Skills ONLY activate in Advanced mode or custom modes with `skill` group (here: `reviewer`)
- `plan` and `code` modes CANNOT run skills - they rely on always-on `.bob/rules/` floor
- This is verified behavior, not assumption

## Evidence Discipline Skill vs Rule

From `.bob/rules/01-evidence-discipline.md`:
- `evidence-discipline` exists as BOTH a rule AND a skill
- Rule = floor (applies in all modes including plan/code)
- Skill = richer fact-check procedure (only in Advanced/reviewer)
- Not duplication - floor vs recipe

## Test Runner Expectations

When `test-runner` skill activates (Orchestrator STEP 4):
- Must run actual tests, capture real pass/fail
- Never claim green without running
- Report truthfully even if tests fail
- Missing tests for must-test list = blocker

## Doc Writer Scope

When `doc-writer` skill activates (Orchestrator STEP 6 doc pass):
- Only user-facing docs: adoption reports, READMEs, build-proof copy
- Not internal code comments
- Must follow banned-claims rules (no "guaranteed", "perfect", "proves best")

## Runtime Skill Demo (S07)

From `docs/implementation-plan.md` §5 P6:
- `oss-preflight-advisor` skill reads repo context, runs CLI, presents recommendations
- Asks before scaffolding
- Never writes outside approved paths (`.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`)
- If risky live, record 30-second clip instead

## Plan Council Protocol

From `docs/bob-build-guide.md` §5 STEP 0:
- 5 independent adversarial teams via `new_task`
- Teams: reproducibility/idempotency · architecture fidelity · AC/test rigor · integration/data-contract · gap/risk red team
- Gate = MIN team score ≥9 AND zero blockers (never averaged)
- Cap 3 rounds, then escalate lowest team + exact unmet criteria
- Never lower the bar

## Same Evidence Discipline as Code Mode

All evidence rules from `.bob/rules/01-evidence-discipline.md` apply:
- Package facts only from collectors/fixtures/cache
- Never invent downloads, licenses, versions, scores
- Missing evidence = explicit null with "(not available)" label
- Inference must be labeled