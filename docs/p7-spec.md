# Phase P7 Specification — Review + Harden + Submit

> **Objective:** Ensure submission readiness by running a comprehensive review over the demo path, tests, Bob evidence, exported sessions, README, risk register, and presentation claims, producing a blocker-free verdict and completing the final submission checklist.

**Phase:** P7 (Review + Harden + Submit)  
**Session:** S08  
**Preconditions:** P1–P6 complete and committed (per [`bob_sessions/build-report.md`](../bob_sessions/build-report.md))

---

## 1. Acceptance Criteria Checklist

All 14 criteria are **binary** (pass/fail). Each must be validated with explicit evidence.

### AC1: Demo path green
- [ ] Run Discord-bot demo end-to-end: idea input → 3 recommendations → discord.js rank 1 → scaffold → smoke test passes
- [ ] Assert no crashes, no errors in terminal or browser console
- **Validation:** Execute full flow; capture terminal output; verify exit code 0

### AC2: Bob evidence complete
- [ ] Verify `bob_sessions/` contains folders: S00, S01, S01.5, S03, S04, S05, S06, S07, S08
- [ ] Each folder contains: task-history markdown + consumption screenshot
- [ ] [`bob_sessions/build-report.md`](../bob_sessions/build-report.md) has a row per session
- **Validation:** `ls bob_sessions/` and check each subfolder; open build-report.md and count rows

### AC3: Build-proof page renders
- [ ] `/build-proof` (or local equivalent) shows `.bob/custom_modes.yaml` summary
- [ ] Shows skills list
- [ ] Shows `bob_sessions/` exports
- [ ] Shows git log with Bob-assisted commits
- **Validation:** Open URL or local page; verify all sections render

### AC4: Risk register addressed
- [ ] Every risk in [`docs/implementation-plan.md`](../docs/implementation-plan.md) §9 has status: [resolved with evidence] OR [mitigated with documented control] OR [accepted with written rationale] OR [documented fallback with passing test]
- [ ] Each status is verifiable from artifacts
- **Validation:** Read §9 table; for each risk, locate the artifact proving its status

### AC5: Submission checklist complete
- [ ] Every item in [`docs/implementation-plan.md`](../docs/implementation-plan.md) §10 checked off
- **Validation:** Open §10; verify all checkboxes marked

### AC6: Deployment verified
- [ ] Deployment URL returns HTTP 200 and renders UI  
  **OR**
- [ ] README contains step-by-step local-demo instructions with expected output at each step
- **Validation:** `curl -I <URL>` OR follow README instructions and verify output matches

### AC7: Secret scan passes
- [ ] Run: `rg -n "token|secret|api[_-]?key|password|Authorization|Bearer|SUPABASE|GITHUB_TOKEN|NPM_TOKEN|IBM_CLOUD|WATSONX" bob_sessions docs`
- [ ] Assert no secrets found
- **Validation:** Execute command; verify exit code and empty output

### AC8: Source ledger complete
- [ ] [`docs/source-ledger.md`](../docs/source-ledger.md) lists: npm, GitHub, PyPI, OpenSSF, Anthropic Claude
- [ ] Each entry has: source URL, data used, terms/commercial-use verification status
- **Validation:** Open source-ledger.md; verify all sources listed with complete metadata

### AC9: Presentation claims validated
- [ ] Scan user-facing copy (README, UI, demo script, build-proof) for banned words
- [ ] Banned list: `guaranteed`, `perfect`, `proves best`, `trust graph`, `cryptographically verified`, `only Bob can do this`
- [ ] Assert none found
- **Validation:** `rg -i "guaranteed|perfect|proves best|trust graph|cryptographically verified|only Bob can do this" README.md apps/web/src docs/implementation-plan.md`

### AC10: README links to Bob evidence
- [ ] README contains link to [`bob_sessions/build-report.md`](../bob_sessions/build-report.md)
- **Validation:** Open README.md; verify link exists and is clickable

### AC11: Pitch deck exists
- [ ] PDF or PPTX file exists
- [ ] File size > 100KB (not empty)
- [ ] Contains minimum 5 slides: (1) problem statement, (2) solution overview, (3) demo screenshots, (4) Bob evidence (modes/skills/sessions), (5) team/tech stack
- **Validation:** `ls -lh *.pdf *.pptx`; open file and count slides

### AC12: Tag `v1.0.0` created
- [ ] Git tag `v1.0.0` exists
- [ ] Points to final commit
- **Validation:** `git tag -l v1.0.0`; `git show v1.0.0`

### AC13: Video recorded
- [ ] Demo video exists
- [ ] Duration ≤ 4 minutes
- [ ] Shows: idea → recommendations → scaffold → Bob evidence
- **Validation:** Check video file metadata; watch video and verify content

### AC14: Submission readiness doc produced
- [ ] [`docs/submission-readiness.md`](../docs/submission-readiness.md) exists
- [ ] Contains: pass/fail verdict, blocker list (empty if pass), deployment URL or fallback, submission checklist status
- **Validation:** Open file; verify all required sections present

---

## 2. Artifacts to Review

### 2.1 Demo Path
- **Files:** `apps/web/src/`, `packages/cli/src/`, `packages/scaffold/templates/`
- **Validation steps:**
  1. Start web server: `pnpm dev`
  2. Enter Discord-bot idea in UI
  3. Verify 3 recommendations appear
  4. Verify discord.js ranks #1
  5. Click scaffold button
  6. Verify files generated in `examples/discord-summary-bot/`
  7. Run smoke test: `cd examples/discord-summary-bot && npm test`
  8. Assert exit code 0

### 2.2 Bob Evidence
- **Files:** `bob_sessions/S00-hour0-export-test/`, `bob_sessions/S01-plan-architecture/`, `bob_sessions/S01.5-plan-council/`, `bob_sessions/S03-core-schemas-scoring/`, `bob_sessions/S04-collectors-cache/`, `bob_sessions/S05-cli-scaffold/`, `bob_sessions/S06-web-build-proof/`, `bob_sessions/S07-runtime-skill-demo/`, `bob_sessions/S08-review-submission/`
- **Validation steps:**
  1. List all session folders
  2. For each folder, verify task-history.md exists
  3. For each folder, verify screenshot exists (PNG/JPG)
  4. Open [`bob_sessions/build-report.md`](../bob_sessions/build-report.md)
  5. Verify row count matches session count
  6. Verify each row has: ID, timestamp, mode, skills, summary, files, tests, export path, evidence value, status

### 2.3 README
- **File:** [`README.md`](../README.md)
- **Validation steps:**
  1. Verify link to [`bob_sessions/build-report.md`](../bob_sessions/build-report.md) exists
  2. Verify deployment URL or local-demo instructions present
  3. Scan for banned words (AC9)
  4. Verify project description is clear and accurate

### 2.4 Risk Register
- **File:** [`docs/implementation-plan.md`](../docs/implementation-plan.md) §9
- **Validation steps:**
  1. Read each risk row
  2. For each risk, locate the artifact proving status:
     - Bob session export format → `bob_sessions/build-report.md` Export Notes
     - Official `bob_sessions/` deliverable → folder structure + build-report.md
     - Bob skill activation → `.bob/skills/oss-preflight-advisor/SKILL.md` + S07 export
     - Live APIs fail → cache implementation + fixtures
     - Scaffold smoke test fails → mocked messages + committed example
     - Recommendation looks arbitrary → Evidence Passport UI + scorer tests
     - Scope creep → phase-plan.md cutline + gates
     - Scorer non-determinism → determinism.test.ts
     - Plan has build gaps → S01.5 Plan Council exports
     - Skill won't activate → verified Advanced-mode constraint in bob-build-guide.md

### 2.5 Source Ledger
- **File:** [`docs/source-ledger.md`](../docs/source-ledger.md)
- **Validation steps:**
  1. Verify lists: npm registry, GitHub API, PyPI API, OpenSSF Scorecard API, Anthropic Claude API
  2. For each source, verify: URL, data used, terms/commercial-use status
  3. Verify no missing sources (cross-check with collectors code)

### 2.6 Presentation Claims
- **Files to scan:** [`README.md`](../README.md), `apps/web/src/**/*.tsx`, [`docs/implementation-plan.md`](../docs/implementation-plan.md) §8 (demo script), `apps/web/src/pages/BuildProof.tsx`
- **Validation steps:**
  1. Run regex search for banned words
  2. Manually review any matches for context
  3. Assert zero banned words in user-facing copy

---

## 3. Must-Test Scenarios

Per [`docs/phase-plan.md`](../docs/phase-plan.md) lines 551-563:

1. **Demo path:** Full flow green (idea → 3 recs → scaffold → smoke test)
2. **Bob evidence:** All S00–S08 folders exist with markdown + screenshot
3. **Build-proof:** `/build-proof` renders Bob artifacts
4. **Deployment:** URL returns HTTP 200 and UI loads OR local-demo instructions work
5. **Secret scan:** `rg` command finds no secrets
6. **Source ledger:** Lists npm, GitHub, PyPI, OpenSSF, Claude with verification status
7. **Banned words:** No `guaranteed`, `perfect`, `proves best` in user-facing copy
8. **README link:** Links to [`bob_sessions/build-report.md`](../bob_sessions/build-report.md) and deployment URL
9. **Pitch deck:** PDF/PPTX exists, >100KB, ≥5 slides
10. **Risk register:** Each risk has verifiable status artifact
11. **Git tag:** `v1.0.0` exists
12. **Video:** ≤4 minutes, shows demo + Bob evidence

---

## 4. Submission Readiness Document Structure

[`docs/submission-readiness.md`](../docs/submission-readiness.md) must contain:

### 4.1 Header
```markdown
# OSS Preflight — Submission Readiness

**Phase:** P7 (Review + Harden + Submit)  
**Session:** S08  
**Date:** <timestamp>  
**Reviewer:** <mode>
```

### 4.2 Verdict Section
```markdown
## Verdict

**Status:** PASS | FAIL  
**Blockers:** <count>

<If FAIL, list each blocker with file:line location>
```

### 4.3 Acceptance Criteria Status
```markdown
## Acceptance Criteria (14/14)

- [x] AC1: Demo path green
- [x] AC2: Bob evidence complete
- [x] AC3: Build-proof page renders
- [x] AC4: Risk register addressed
- [x] AC5: Submission checklist complete
- [x] AC6: Deployment verified
- [x] AC7: Secret scan passes
- [x] AC8: Source ledger complete
- [x] AC9: Presentation claims validated
- [x] AC10: README links to Bob evidence
- [x] AC11: Pitch deck exists
- [x] AC12: Tag v1.0.0 created
- [x] AC13: Video recorded
- [x] AC14: Submission readiness doc produced

<For each failed criterion, provide evidence location and fix needed>
```

### 4.4 Deployment Section
```markdown
## Deployment

**URL:** <deployment URL> OR **Local Demo:** See README.md for instructions  
**Status:** <HTTP 200 | Local instructions verified>  
**Verified:** <timestamp>
```

### 4.5 Submission Checklist Section
```markdown
## Submission Checklist

Reference: docs/implementation-plan.md §10

- [x] Public GitHub repo, MIT licence
- [x] Working prototype usable online
- [x] Video presentation + pitch deck
- [x] Official Bob export/report included
- [x] Root bob_sessions/ folder with task-history markdown
- [x] Root bob_sessions/ folder with consumption screenshots
- [x] bob_sessions/build-report.md complete
- [x] ≥3 exported sessions (planning, implementation, review)
- [x] Runtime skill activation evidence
- [x] Custom modes + skills committed
- [x] Secret scan completed
- [x] docs/source-ledger.md complete
- [x] README links to bob_sessions/build-report.md
- [x] Demo video shows Bob evidence
```

### 4.6 Evidence Summary
```markdown
## Evidence Summary

- **Bob sessions:** <count> sessions exported
- **Build report:** bob_sessions/build-report.md
- **Custom modes:** .bob/custom_modes.yaml
- **Skills:** <list skill names>
- **Git tag:** v1.0.0
- **Video:** <filename>, <duration>
- **Pitch deck:** <filename>, <file size>
```

---

## 5. Quality Gates

Per [`docs/phase-plan.md`](../docs/phase-plan.md) lines 544-549:

1. **Evidence discipline** → [`.bob/rules/01-evidence-discipline.md`](../.bob/rules/01-evidence-discipline.md) + [`evidence-discipline`](../.bob/skills/evidence-discipline/SKILL.md) skill
   - No invented facts in final demo
   - Inference labeled as inference
   - Missing evidence explicit

2. **Engineering standards** → [`.bob/rules/02-engineering-standards.md`](../.bob/rules/02-engineering-standards.md)
   - Security: no secrets in exports
   - Tests report truthfully
   - Determinism maintained

3. **Presentation claims** → [`.bob/rules/04-presentation-claims.md`](../.bob/rules/04-presentation-claims.md)
   - No banned words in user-facing copy

4. **Review depth** → [`code-review`](../.bob/skills/code-review/SKILL.md) skill + [`.bob/rules-reviewer/01-review-floor.md`](../.bob/rules-reviewer/01-review-floor.md) §B
   - Final submission review checklist complete

5. **Doc pass** → [`doc-writer`](../.bob/skills/doc-writer/SKILL.md) skill
   - Submission readiness doc is clear and complete

---

## 6. Loop Configuration

Per [`docs/phase-plan.md`](../docs/phase-plan.md) lines 567-571:

**Steps:** SPEC → IMPLEMENT → REVIEW → TEST → FIX (conditional) → ENHANCE (conditional) → LOOP GATE → EXPORT → HUMAN REVIEW → COMMIT

**Delegated modes:**
- SPEC → `plan` (this document)
- IMPLEMENT → `reviewer` (writes submission-readiness doc), `code` (tags, finalizes)
- REVIEW → `reviewer`
- TEST → `advanced` (`test-runner`, `evidence-discipline`)
- FIX → `code`, `reviewer` (conditional)
- ENHANCE → `advanced` (`doc-writer`) (conditional)
- COMMIT → `code`

**Loop continuation:**
- Clean pass (all 14 AC green, zero blockers, full must-test green) → exit to EXPORT
- Unmet criterion → scoped FIX + re-verification of affected criteria only
- Shared/core contract touched → full REVIEW+TEST re-run
- Each loop names measurable delta
- Escalate if progress stalls for 2 consecutive loops

**Human gate:** Mandatory before commit

---

## 7. Definition of Done

All 14 acceptance criteria green AND:

- Reviewer finds no critical blockers
- Demo path green (idea → scaffold → smoke test passes)
- Bob evidence complete (S00–S08 with markdown + screenshots)
- Risk register addressed (every risk has verifiable status)
- Submission checklist complete (all items checked)
- Deployment live OR fallback documented with working instructions
- Secret scan passes (no tokens/keys found)
- Source ledger complete (all sources listed with verification)
- Presentation claims validated (no banned words)
- README links to Bob evidence and deployment
- Pitch deck exists (PDF/PPTX, >100KB, ≥5 slides)
- Tag `v1.0.0` created
- Video recorded (≤4 min, shows demo + Bob evidence)
- [`docs/submission-readiness.md`](../docs/submission-readiness.md) produced with PASS verdict
- Evidence exported to [`bob_sessions/S08-review-submission/`](../bob_sessions/S08-review-submission/)
- Human approved
- Committed with Bob-generated message: `docs: finalize submission readiness`

---

## 8. Out of Scope

Per [`docs/phase-plan.md`](../docs/phase-plan.md) line 523:

- New features
- Refactoring
- Scope expansion
- Live API changes
- Additional templates

P7 is a **must-ship submission gate** — no should/cut items.

---

## 9. Integration Success

P7 outputs:
- [`docs/submission-readiness.md`](../docs/submission-readiness.md) with PASS verdict and zero blockers
- Finalized [`bob_sessions/build-report.md`](../bob_sessions/build-report.md)
- Git tag `v1.0.0`
- Recorded demo video
- Submission ready for upload to GitHub and hackathon platform

---

## 10. References

- Phase plan: [`docs/phase-plan.md`](../docs/phase-plan.md) lines 507-576
- Implementation plan: [`docs/implementation-plan.md`](../docs/implementation-plan.md) §8 (demo script), §9 (risk register), §10 (submission checklist)
- Architecture: [`docs/architecture.md`](../docs/architecture.md) §17 (judge success criteria)
- Bob build guide: [`docs/bob-build-guide.md`](../docs/bob-build-guide.md) §6 (evidence strategy), §9 (privacy & secret review)
- Review floor: [`.bob/rules-reviewer/01-review-floor.md`](../.bob/rules-reviewer/01-review-floor.md) §B (final submission review)
- Build report: [`bob_sessions/build-report.md`](../bob_sessions/build-report.md)