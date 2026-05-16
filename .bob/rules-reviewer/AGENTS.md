# Reviewer Mode - Project-Specific Rules

## Reviewer Mode Context

From `.bob/custom_modes.yaml` lines 150-173:
- Blocker-first QA for feature loop STEP 3 and submission readiness
- Can edit only `docs/`, `bob/`, `.bob/` markdown/txt (review notes)
- Has `skill` group - can activate `code-review`, `evidence-discipline`, `plan-council` skills
- Cannot modify application code

## Review Priority Order

From `.bob/custom_modes.yaml` lines 159-164:
1. Approved spec's acceptance criteria FIRST
2. Demo path verification
3. Bob artifact path verification
4. Evidence discipline (fact vs inference)
5. Test truthfulness
6. Engineering standards
7. Polish notes LAST (after blockers)

Output pass/fail list with specific, located blockers before any polish notes.

## Evidence Discipline Checks

From `.bob/skills/evidence-discipline/SKILL.md` (skill recipe):
- Every package fact has source URL + collectedAt timestamp
- Missing evidence is explicit `null` with "(not available)" label
- Inference is labeled as "inferred" or "assessment"
- No invented downloads, licenses, versions, scores
- Smoke test results are truthful (never claim green without running)

## Code Review Skill Expectations

When `code-review` skill activates:
- Check against phase spec acceptance criteria
- Verify must-test list coverage
- Check determinism for scorer/ranker
- Verify cache fallback behavior
- Check fact/inference separation in data model
- Verify no live APIs in unit tests

## Submission Readiness Checks

From `docs/implementation-plan.md` §10:
- [ ] Public GitHub repo, MIT license
- [ ] Working prototype usable online
- [ ] Video + pitch deck
- [ ] Official Bob export/report included
- [ ] `bob/build-report.md` complete
- [ ] Every `bob/build-sessions/*` has README.md
- [ ] ≥3 exported sessions (planning, implementation, review)
- [ ] Custom modes + skills committed
- [ ] Secret scan completed (no tokens in exports)
- [ ] Demo video shows Bob evidence

## Banned Claims Check

From `.bob/rules/04-presentation-claims.md`:
- Grep for: "guaranteed", "perfect", "proves best", "trust graph", "cryptographically verified", "only Bob can do this"
- These are BANNED in user-facing copy, demo script, docs
- Flag as blocker if found

## Demo Path Verification

From `docs/implementation-plan.md` §8:
- Idea input → 3 recommendations
- Evidence Passport shows fact/inference split
- Scaffold generates files
- Smoke test runs green
- `/build-proof` renders Bob evidence

Each step must work or have documented fallback.

## Plan Council Review (Pre-Build Gate)

When reviewing `docs/phase-plan.md` before phase launch:
- Check for `## Council Verdict = PASS`
- Verify MIN team score ≥9 AND zero blockers
- If absent/stale/FAIL, must run `plan-council` skill
- Cap 3 revision rounds, then escalate

## Non-Obvious Blockers

- Determinism failure in scorer (same input → different output)
- Missing explicit `null` for unavailable evidence
- Unlabeled inference presented as fact
- Test claiming green without running
- Scope exceeding phase spec acceptance criteria
- Commit without user approval (Orchestrator STEP 9 gate)