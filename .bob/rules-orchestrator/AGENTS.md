# Orchestrator Mode - Project-Specific Rules

## Orchestrator Loop Invariants

From `.bob/custom_modes.yaml` lines 89-143 and `.bob/rules-orchestrator/01-loop-invariants.md`:

### The 10-Step Loop (Non-Negotiable)

**STEP 0 - PLAN GATE (Before ANY phase):**
- `docs/phase-plan.md` MUST have current `## Council Verdict = PASS`
- If absent/stale/FAIL: run `plan-council` skill (5 adversarial teams via `new_task`)
- Gate = MIN team score ≥9 AND zero blockers (never averaged)
- On FAIL: delegate revision to `plan`, re-convene fresh council
- Cap 3 council rounds, then STOP and escalate lowest team + exact unmet criteria
- Never lower the bar

**STEP 1 - SPEC:**
- Delegate to `plan` mode (no skills; rules-plan applies)
- Produce spec + testable acceptance criteria + gated todo
- Get user approval BEFORE proceeding to STEP 2
- Mandatory gate - never skip

**STEP 2 - IMPLEMENT:**
- Delegate to `code` mode (no skills; rules-code applies)
- Implement next todo slice to spec, tests first
- Pass tight scope, instruction to do only this work

**STEP 3 - REVIEW:**
- Delegate to `reviewer` mode (skills available: `code-review`, `evidence-discipline`)
- Blocker-first review against spec, evidence discipline, engineering standards
- Cannot be skipped

**STEP 4 - TEST:**
- Delegate to `advanced` mode (skills available: `test-runner`, `evidence-discipline`)
- Run/author tests, validate must-test list
- Capture pass/fail truthfully
- Cannot be skipped

**STEP 5 - FIX:**
- Delegate to `code` mode
- Resolve every review blocker and failing test
- Clear scope - only fixes, no enhancements

**STEP 6 - ENHANCE:**
- Delegate to `code` mode for performance, patterns, cleanliness (within scope only)
- If slice produced user-facing docs (adoption report, README, build-proof), delegate doc pass to `advanced` (skill: `doc-writer`)

**STEP 7 - LOOP GATE:**
- Compare against acceptance criteria
- If any unmet: return to STEP 3
- Hard cap 3 full loops
- If still unmet after cap: STOP and escalate precise gap to user
- Never spin indefinitely

**STEP 8 - EXPORT:**
- When satisfied, instruct user to export session to `bob/build-sessions/<id>/`
- Add row to `bob/build-report.md`
- Part of the loop, not afterthought

**STEP 9 - HUMAN REVIEW:**
- STOP and present concise summary + met acceptance criteria
- Explicitly ask user to approve
- Never proceed without approval
- Mandatory gate

**STEP 10 - COMMIT:**
- Only after approval, delegate to `code` to stage scoped files
- Use Bob's generated conventional-commit message
- Note in report that message was Bob-generated
- Never commit autonomously

## Delegation Protocol

From `.bob/custom_modes.yaml` lines 99-106:
- Use `new_task` for each step
- Pass all needed context
- Tightly scoped goal
- Instruction to do only that work, not deviate
- Requirement to finish with `attempt_completion` (that summary is source of truth)
- State that instructions supersede conflicting general mode instructions

## Skill Activation Awareness

From `.bob/custom_modes.yaml` lines 104-106:
- Skills activate only in skill-enabled modes: Advanced and `reviewer`
- `plan` and `code` cannot run skills - their always-on rules carry discipline floor
- Don't try to activate skills in wrong modes

## Phase Spec Source

From `docs/bob-build-guide.md` §7:
- Each P03-P08 phase detail lives in `docs/phase-plan.md` (generated in S01)
- NOT hand-copied prompts
- `docs/phase-plan.md` is a generated artifact
- One self-contained, Orchestrator-ready spec per P-phase

## Hard Guarantees (Encoded in Mode)

From `docs/bob-build-guide.md` §5:
- Spec approved by user BEFORE any code (STEP 1→2 gate)
- Review and test stages CANNOT be skipped
- Loop cap of 3 full iterations
- If still unmet, STOPS and escalates precise gap (never spins)
- NEVER commits autonomously (STEP 9 mandatory approval gate)
- Every completed feature leaves exported session (STEP 8)

## When Orchestrator is Used

From `docs/bob-build-guide.md` §5:
- Any non-trivial feature or build phase
- Full spec-to-commit loop with review and test gates
- NOT for simple questions (use `/ask`)
- NOT for small well-specified changes (use `/code` directly)
- NOT for just a spec (use `/plan`)