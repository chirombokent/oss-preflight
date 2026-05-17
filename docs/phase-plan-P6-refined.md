# Phase P6 — Bob Runtime Integration (Refined Spec)

**Session:** S07  
**Status:** Ready for implementation  
**Last updated:** 2026-05-17

---

## Objective

Prove OSS Preflight also ships as a Bob workflow by implementing and demonstrating the `oss-preflight-advisor` skill activation in Advanced mode, presenting recommendations (or the exact CLI sequence), and respecting the sandboxed `oss-preflight-scaffolder` mode's approved-path fence.

**Success measure:** Skill activates in Advanced mode on explicit keyword match (no LLM interpretation); presents top recommendation with Evidence Passport summary; asks before scaffolding; writes only to approved paths (`.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`).

---

## Correlation to Architecture

This phase satisfies:
- [`docs/architecture.md`](docs/architecture.md) §3.3 (Bob-Native Flow)
- [`docs/architecture.md`](docs/architecture.md) §15 (security: no package execution)
- The closing pitch line: "we shipped OSS Preflight *as* a Bob skill"

---

## Self-Contained Context

All required inputs:

1. **Architecture & design:**
   - [`docs/architecture.md`](docs/architecture.md) §3.3 (Bob-Native Flow), §15 (security)
   - [`docs/implementation-plan.md`](docs/implementation-plan.md) §5 P6 (notes, exit gate, pro tips)
   - [`docs/bob-build-guide.md`](docs/bob-build-guide.md) §2 (verified capability matrix: skills guaranteed in Advanced), §3 (Way 2: OSS Preflight runs inside Bob), §7 (S07 session)

2. **Existing artifacts:**
   - [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md) (workflow protocol)
   - [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml) lines 208-227 (`oss-preflight-scaffolder` mode `fileRegex`)
   - [`packages/cli/`](packages/cli/) (P3 output: CLI to invoke)

3. **Preconditions verified:**
   - P3 complete: [`packages/cli/`](packages/cli/) exports `recommend` and `scaffold` commands
   - P4 complete: [`packages/scaffold/`](packages/scaffold/) produces working scaffolds
   - `oss-preflight recommend` prints 3 recommendations
   - `oss-preflight scaffold` produces files with green smoke test

---

## Scope

### In Scope

1. **Skill implementation:**
   - Update [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md) `description` field to contain exact keyword triggers
   - Implement keyword-based activation (no LLM interpretation)
   - Read repo context ([`package.json`](package.json), [`README.md`](README.md), language, framework, test command)
   - Present CLI sequence or run it
   - Display top recommendation with Evidence Passport summary
   - Ask before scaffolding

2. **Scaffolder mode fence:**
   - Verify `oss-preflight-scaffolder` mode writes only to approved paths
   - Test fence blocks unapproved writes (including path traversal)
   - Test fence allows approved writes

3. **Expanded fence test coverage:**
   - Test all blocked paths: `src/`, `packages/`, `apps/`, `.bob/`
   - Test all approved paths: `.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`
   - Test path traversal attempts
   - Test edge cases (directory writes, etc.)

4. **Evidence export:**
   - Record task-history markdown to [`bob_sessions/S07-runtime-skill-demo/`](bob_sessions/S07-runtime-skill-demo/)
   - Capture consumption screenshot
   - Update [`bob_sessions/build-report.md`](bob_sessions/build-report.md)

5. **Optional fallback:**
   - 30-second activation clip if live demo risky

### Out of Scope (Cutline)

- Live repo audit
- GitHub starter search
- Advanced similarity scoring
- Multiple scaffold templates
- Bobalytics integration
- MCP server wrapper

### Should/Cut Decision

Runtime skill is **should-ship, not must-ship**. If risky live, record a 30-second activation clip and demo the standalone flow. A clean recorded skill activation beats a flaky live one.

---

## Acceptance Criteria

All criteria are **binary** (pass/fail) and **testable**.

### AC #1: Skill file contains keyword triggers

**Pass condition:** [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md) exists with:
- `name: oss-preflight-advisor` in frontmatter
- `description` field contains ALL of these exact phrases:
  - "run OSS Preflight"
  - "oss-preflight"
  - "package recommendation"
  - "stack recommendation"
  - "OSS starter"

**Test:** Read the file; verify frontmatter structure; grep for each keyword phrase.

**Fail condition:** Any keyword missing from description, or frontmatter malformed.

---

### AC #2: Skill activates on keyword match (no LLM interpretation)

**Pass condition:** In Advanced mode, when user says "Run OSS Preflight on this idea: Discord bot that summarizes channel activity", the skill activates based on exact keyword match ("Run OSS Preflight").

**Test:**
1. Open Advanced mode
2. Enter: "Run OSS Preflight on this idea: Discord bot that summarizes channel activity"
3. Observe skill activation message
4. Verify activation was triggered by keyword match, not LLM interpretation

**Fail condition:** Skill does not activate, or activates via LLM interpretation instead of keyword match.

**Implementation note:** Bob's skill activation uses the `description` field for matching. The description must contain the exact trigger phrases. When a user message contains any of these phrases, Bob activates the skill.

---

### AC #3: Skill reads repo context

**Pass condition:** Skill inspects and reports:
- [`package.json`](package.json) (if exists): package manager, dependencies
- [`README.md`](README.md) (if exists): project description
- Language (detected from file extensions or package.json)
- Framework (detected from dependencies)
- Test command (from package.json scripts)

**Test:**
1. Activate skill in a repo with package.json and README.md
2. Verify skill output mentions detected language, framework, or test command
3. Verify skill does not hallucinate context that doesn't exist

**Fail condition:** Skill does not read context, or invents context not present in files.

---

### AC #4: Skill presents CLI sequence or runs it

**Pass condition:** Skill either:
- **Option A:** Runs `oss-preflight recommend --idea "<idea>"` and displays output, OR
- **Option B:** States the exact command: `oss-preflight recommend --idea "<idea>"` and instructs user to run it

If CLI not available in PATH, skill states the intended command and stops (does not fail).

**Test:**
1. Activate skill with an idea
2. Verify skill either runs the command or states it exactly
3. If CLI unavailable, verify skill states command and stops gracefully

**Fail condition:** Skill runs wrong command, states wrong command, or fails silently when CLI unavailable.

---

### AC #5: Skill presents top recommendation

**Pass condition:** Skill displays rank 1 recommendation with:
- Score (numeric)
- Evidence Passport summary (facts vs interpretation visibly separated)
- Missing evidence notes (explicit "not available" for missing data)
- Tradeoffs (AI-derived assessment)
- Scaffold availability (yes/no)

**Test:**
1. Run skill with Discord bot idea
2. Verify output contains all 5 elements
3. Verify facts are labeled as sourced
4. Verify interpretation is labeled as AI-derived
5. Verify missing data is explicit, not omitted

**Fail condition:** Any element missing, or facts/interpretation not separated.

---

### AC #6: Skill asks before scaffolding

**Pass condition:** After presenting recommendations, skill:
1. Asks "Scaffold the top option?" (or similar clear question)
2. Waits for user approval
3. Does not write any files until approval received

**Test:**
1. Run skill through recommendation presentation
2. Verify skill asks before scaffolding
3. Verify no files written before approval
4. Approve scaffold
5. Verify files written only after approval

**Fail condition:** Skill writes files without asking, or asks but writes before approval.

---

### AC #7: Scaffolder mode fence holds

**Pass condition:** When user approves scaffold:
- Skill switches to `oss-preflight-scaffolder` mode OR delegates to it
- All writes go only to approved paths: `.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`
- Attempts to write to `src/`, `packages/`, `apps/`, `.bob/` are blocked with `FileRestrictionError`

**Test:**
1. Approve scaffold in skill workflow
2. Verify mode switch to `oss-preflight-scaffolder`
3. Verify writes succeed only to approved paths
4. Verify writes to unapproved paths fail with `FileRestrictionError`

**Fail condition:** Writes succeed to unapproved paths, or approved writes fail.

---

### AC #8: Fence test passes (blocked paths)

**Pass condition:** In `oss-preflight-scaffolder` mode, attempt to write to each path below; ALL must be blocked with `FileRestrictionError`:
- `src/app.ts`
- `packages/core/types.ts`
- `apps/web/App.tsx`
- `.bob/custom_modes.yaml`

**Test:**
1. Switch to `oss-preflight-scaffolder` mode
2. Attempt to write to each blocked path
3. Verify each attempt fails with `FileRestrictionError`
4. Verify error message indicates file restriction

**Fail condition:** Any blocked path allows write, or error is not `FileRestrictionError`.

---

### AC #9: Fence test passes (approved paths)

**Pass condition:** In `oss-preflight-scaffolder` mode, write to each path below; ALL must succeed:
- `.oss-preflight/test.md`
- `docs/oss-preflight/guide.md`
- `examples/my-scaffold/index.ts`
- `oss-preflight-output/report.json`

**Test:**
1. Switch to `oss-preflight-scaffolder` mode
2. Write to each approved path
3. Verify each write succeeds
4. Verify files exist with correct content

**Fail condition:** Any approved path write fails.

---

### AC #10: Fence test passes (edge cases)

**Pass condition:**
- **Path traversal:** Attempt to write to `.oss-preflight/../src/app.ts` → BLOCKED
- **Directory write:** Attempt to write to `examples/` (directory, not file) → SUCCEEDS (creates directory)

**Test:**
1. Switch to `oss-preflight-scaffolder` mode
2. Attempt path traversal write: `.oss-preflight/../src/app.ts`
3. Verify blocked with `FileRestrictionError`
4. Attempt directory creation: `examples/new-dir/`
5. Verify succeeds

**Fail condition:** Path traversal succeeds, or directory creation fails.

---

### AC #11: Activation clip recorded (OPTIONAL)

**Pass condition:** 30-second screen recording exists showing:
1. Skill activation in Advanced mode
2. Recommendation presentation
3. Fence respect (approved writes succeed, unapproved blocked)

**Test:** Play recording; verify all 3 elements visible.

**Fail condition:** Recording missing or incomplete (but this is optional, not a blocker).

---

## Quality Gates

Each gate names its enforcing rule or skill:

1. **Evidence discipline** (no invented package facts in skill output)  
   Enforcer: [`.bob/rules/01-evidence-discipline.md`](.bob/rules/01-evidence-discipline.md)

2. **Engineering standards** (security: skill never writes to existing source without approval)  
   Enforcer: [`.bob/rules/02-engineering-standards.md`](.bob/rules/02-engineering-standards.md)

3. **Scope binding** (work only to this spec's acceptance criteria)  
   Enforcer: [`.bob/rules/03-scope-and-gates.md`](.bob/rules/03-scope-and-gates.md)

4. **Review depth** (code review before commit)  
   Enforcer: [`code-review`](.bob/skills/code-review/SKILL.md) skill

---

## Test Scenarios

Explicit test cases (must-test list):

### Test 1: Skill activation
- **Setup:** Open Advanced mode
- **Action:** Say "Run OSS Preflight on this idea: Discord bot"
- **Assert:** Skill activates on keyword match ("Run OSS Preflight")

### Test 2: Repo context read
- **Setup:** Repo with package.json and README.md
- **Action:** Activate skill
- **Assert:** Skill reports language, framework, or test command from files

### Test 3: CLI sequence
- **Setup:** Activate skill with idea
- **Action:** Skill processes idea
- **Assert:** Skill states `oss-preflight recommend --idea "<idea>"` or runs it

### Test 4: Recommendation presentation
- **Setup:** Skill runs CLI
- **Action:** CLI returns recommendations
- **Assert:** Skill displays rank 1 with score, passport summary, tradeoffs

### Test 5: Ask before scaffold
- **Setup:** Recommendations presented
- **Action:** Skill completes presentation
- **Assert:** Skill asks "Scaffold?" and waits for approval

### Test 6: Fence blocks unapproved writes
- **Setup:** `oss-preflight-scaffolder` mode
- **Action:** Attempt to write to `src/`, `packages/`, `apps/`, `.bob/`
- **Assert:** All blocked with `FileRestrictionError`

### Test 7: Fence allows approved writes
- **Setup:** `oss-preflight-scaffolder` mode
- **Action:** Write to `.oss-preflight/`, `docs/oss-preflight/`, `examples/`, `oss-preflight-output/`
- **Assert:** All succeed

### Test 8: Fence blocks path traversal
- **Setup:** `oss-preflight-scaffolder` mode
- **Action:** Attempt to write to `.oss-preflight/../src/app.ts`
- **Assert:** Blocked with `FileRestrictionError`

---

## Implementation Notes

### Keyword-Based Skill Activation (AC #2)

Bob's skill activation mechanism uses the `description` field in the skill's frontmatter. When a user message contains any phrase from the description, Bob activates the skill.

**Current description (line 3 of SKILL.md):**
```
description: Help a developer choose a stack, evaluate packages, find open-source starters, or scaffold an OSS Preflight recommendation inside their repo.
```

**Required update:**
The description must contain ALL of these exact phrases:
- "run OSS Preflight"
- "oss-preflight"
- "package recommendation"
- "stack recommendation"
- "OSS starter"

**Suggested revised description:**
```
description: Run OSS Preflight to get package recommendations, stack recommendations, or OSS starter scaffolds. Activate with "run OSS Preflight", "oss-preflight", "package recommendation", "stack recommendation", or "OSS starter".
```

This ensures keyword-based activation without LLM interpretation.

---

### Fence Test Implementation (AC #8-10)

The fence is defined in [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml) lines 224-225:

```yaml
- edit
- fileRegex: ^(\.oss-preflight/|docs/oss-preflight/|examples/|oss-preflight-output/).*
  description: OSS Preflight outputs only
```

**Regex breakdown:**
- `^` = start of path
- `(\.oss-preflight/|docs/oss-preflight/|examples/|oss-preflight-output/)` = approved prefixes
- `.*` = any characters after prefix

**Test coverage expansion:**

1. **Blocked paths (AC #8):**
   - `src/app.ts` → does not match regex → blocked
   - `packages/core/types.ts` → does not match regex → blocked
   - `apps/web/App.tsx` → does not match regex → blocked
   - `.bob/custom_modes.yaml` → does not match regex → blocked

2. **Approved paths (AC #9):**
   - `.oss-preflight/test.md` → matches `\.oss-preflight/` → allowed
   - `docs/oss-preflight/guide.md` → matches `docs/oss-preflight/` → allowed
   - `examples/my-scaffold/index.ts` → matches `examples/` → allowed
   - `oss-preflight-output/report.json` → matches `oss-preflight-output/` → allowed

3. **Edge cases (AC #10):**
   - `.oss-preflight/../src/app.ts` → path traversal attempt → should be blocked (verify Bob normalizes paths before regex check)
   - `examples/` → directory creation → should succeed (matches `examples/`)

**Test implementation approach:**
- Use Bob's file writing tools in `oss-preflight-scaffolder` mode
- Attempt each write
- Verify error type for blocked paths
- Verify file existence for allowed paths

---

## Integration Success

P6 outputs:
1. Working `oss-preflight-advisor` skill that any developer can activate in Bob Advanced mode
2. Sandboxed `oss-preflight-scaffolder` mode that writes only to approved paths
3. Expanded fence test coverage (AC #8-10)
4. Evidence exported to [`bob_sessions/S07-runtime-skill-demo/`](bob_sessions/S07-runtime-skill-demo/)

This satisfies:
- "OSS Preflight ships *as* a Bob skill" pitch line
- Responsible, fenced AI workflow packaging
- Bob-Native Flow (architecture §3.3)

---

## Loop Configuration

### Steps
SPEC → IMPLEMENT → REVIEW → TEST → FIX (conditional) → ENHANCE (conditional) → LOOP GATE → EXPORT → HUMAN REVIEW → COMMIT

### Delegated Mode Per Step
- SPEC → `plan`
- IMPLEMENT → `code`
- REVIEW → `reviewer`
- TEST → `advanced`
- FIX → `code`
- ENHANCE → `code`
- COMMIT → `code`

### Loop Continuation Rules

**First pass:** Full review + full must-test list (all 8 test scenarios)

**Clean pass exits immediately:**
- All 11 acceptance criteria green (AC #11 optional)
- Zero reviewer blockers
- Full must-test list green
- → Skip FIX and ENHANCE
- → Exit to EXPORT

**Unmet criterion triggers scoped re-verification:**
- FIX the specific issue
- Re-verify only affected criteria + changed-file tests + regression sanity
- Widen to full REVIEW+TEST only if shared/core contract touched (types, scorer, serializer, CLI boundary, public schema)

**Each loop must:**
- Name its measurable delta
- Show progress toward acceptance criteria
- Escalate if progress stalls for 2 consecutive loops
- Escalate if external decision required

**No fixed iteration cap:** Continue while producing measurable progress

---

## Evidence Artifact

**Location:** [`bob_sessions/S07-runtime-skill-demo/`](bob_sessions/S07-runtime-skill-demo/)

**Contents:**
- Task-history markdown (exported from Bob IDE)
- Consumption screenshot (task-session summary)
- Optional: 30-second activation clip

**Build report row:**
```
S07 | <timestamp> | advanced | oss-preflight-advisor, evidence-discipline | Runtime skill demo + fence test | .bob/skills/oss-preflight-advisor/, .bob/custom_modes.yaml | skill activation, fence test | bob_sessions/S07-runtime-skill-demo/ | OSS Preflight as Bob workflow | Exported
```

---

## Definition of Done

Phase P6 is complete when:

1. ✅ All 11 acceptance criteria pass (AC #11 optional)
2. ✅ Skill activates on keyword match (no LLM interpretation)
3. ✅ Skill presents recommendations with Evidence Passport summary
4. ✅ Skill asks before scaffolding
5. ✅ Fence holds: blocks unapproved writes (including path traversal)
6. ✅ Fence holds: allows approved writes
7. ✅ Expanded fence test coverage verified (AC #8-10)
8. ✅ Optional activation clip recorded (if live demo risky)
9. ✅ Evidence exported to [`bob_sessions/S07-runtime-skill-demo/`](bob_sessions/S07-runtime-skill-demo/)
10. ✅ Human approved
11. ✅ Committed with Bob-generated message: `feat(skill): add keyword-triggered OSS Preflight advisor with expanded fence tests`

---

## Handoff to Code Mode

This spec is complete and ready for implementation. Code mode should:

1. Read this spec in full
2. Update [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md) description with keyword triggers
3. Implement fence tests (AC #8-10)
4. Verify skill workflow (AC #2-7)
5. Export evidence to [`bob_sessions/S07-runtime-skill-demo/`](bob_sessions/S07-runtime-skill-demo/)
6. Request review before commit

**Critical:** Do not exceed scope. Work only to these 11 acceptance criteria. Do not add features, error handling, or config for cases that cannot occur per the spec.

---

**Spec author:** Plan mode  
**Spec status:** ✅ Ready for implementation  
**Next step:** Switch to code mode or hand to Orchestrator