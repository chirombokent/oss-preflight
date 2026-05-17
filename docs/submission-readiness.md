# OSS Preflight - Submission Readiness Report

**Review Date:** 2026-05-17  
**Reviewer:** Bob (P7 continuation)  
**Phase:** P7 - Review + Harden + Submit  

## Verdict

**Status:** FAIL - external submission artifacts still required  
**Failed acceptance criteria:** 4 of 14  
**Root blockers:** 3

The implementation path is now locally green: the built CLI recommends three
packages with `discord.js` ranked first, generated a scaffold, installed
dependencies, and passed the scaffold smoke test. `pnpm test`, `pnpm build`,
and the Playwright browser flow also pass.

Submission is not ready because these artifacts/actions are still missing and
should not be fabricated:

1. **Bob evidence gap:** `bob_sessions/S06-web-build-proof/` has no task-history
   markdown or consumption screenshot; `bob_sessions/S07-runtime-skill-demo/`
   has no consumption screenshot.
2. **Demo video missing:** no recorded demo video exists.
3. **Final tag missing:** `v1.0.0` is not created yet; it should point to the
   final approved commit, so it must wait for human approval and commit.

## Acceptance Criteria

| AC | Status | Evidence |
|---|---|---|
| AC1 Demo path green | PASS | Built CLI run returned 3 recommendations with `discord.js` rank 1; scaffold generated to `C:\tmp\oss-preflight-demo-scaffold-20260517100217`; smoke test passed in 16.517s. |
| AC2 Bob evidence complete | FAIL | Required folders exist, but S06 lacks markdown + screenshot and S07 lacks consumption screenshot. |
| AC3 Build-proof page renders | PASS | `apps/web/src/pages/BuildProof.tsx` embeds `bob_sessions/build-report.md`; Playwright `should navigate to build proof page` passed. |
| AC4 Risk register addressed | PASS | `docs/implementation-plan.md` section 9 now has status evidence for every risk. |
| AC5 Submission checklist complete | FAIL | Checklist remains unchecked for public deployment, video, S06/S07 evidence gaps, and final tag. |
| AC6 Deployment verified or fallback documented | PASS | Root `README.md` now contains step-by-step local-demo fallback instructions with expected output. |
| AC7 Secret scan passes | PASS | P7 secret scan found only documentation references to secret/token names, not committed credentials; npm/PyPI metadata is sanitized before return/cache. |
| AC8 Source ledger complete | PASS | `docs/source-ledger.md` now lists npm, GitHub, PyPI, OpenSSF, and Claude with official source URLs and verification status. |
| AC9 Presentation claims validated | PASS | Banned-claims scan found no user-facing overclaim blockers. |
| AC10 README links to Bob evidence | PASS | Root `README.md` links to `bob_sessions/build-report.md` and `bob_sessions/`. |
| AC11 Pitch deck exists | PASS | Project deck exists at `docs/oss-preflight-submission-deck.pdf` (101,379 bytes); source is `docs/submission-deck.html`. |
| AC12 Tag `v1.0.0` created | FAIL | `git tag` returned no `v1.0.0`; tag must wait for approved final commit. |
| AC13 Video recorded | FAIL | No demo video artifact found. |
| AC14 Submission readiness doc produced | PASS | This report exists at `docs/submission-readiness.md`. |

## Verification

Commands completed during P7 continuation:

```powershell
pnpm test
pnpm build
pnpm --filter @oss-preflight/web test:e2e
```

Results:

- `pnpm test`: 16 test files passed, 134 tests passed.
- `pnpm build`: all build scripts completed successfully.
- `pnpm --filter @oss-preflight/web test:e2e`: 4 Playwright tests passed.
- CLI demo: `node packages\cli\dist\index.js recommend --idea "Discord bot that summarizes channel activity" --json` returned 3 recommendations with `discord.js` at rank 1.
- Scaffold demo: `node packages\cli\dist\index.js scaffold ...` generated a starter and reported `Smoke test PASSED`.

## Deployment

**Deployment URL:** none yet  
**Fallback:** root `README.md` local-demo instructions  
**Status:** fallback documented and build/test verified locally

## Submission Checklist

Reference: `docs/implementation-plan.md` section 10.

- [x] Public GitHub repo, MIT licence
- [ ] Working prototype usable online (local fallback documented; public URL absent)
- [ ] Video presentation
- [x] Pitch deck exists at `docs/oss-preflight-submission-deck.pdf`
- [x] Official Bob export/report included
- [ ] Root `bob_sessions/` folder with all relevant task-history markdown files
- [ ] Root `bob_sessions/` folder with all relevant consumption screenshots
- [x] `bob_sessions/build-report.md` has a row for every required session
- [x] At least 3 exported sessions: planning, implementation, review
- [x] Runtime skill activation evidence
- [x] Custom modes + skills committed
- [x] Secret scan completed
- [x] `docs/source-ledger.md` complete
- [x] README links to `bob_sessions/build-report.md`
- [ ] Demo video shows Bob evidence
- [ ] Git tag `v1.0.0` created
- [x] Pitch deck exists

## Evidence Summary

- **Bob sessions:** S00, S01, S01.5, S03, S04, S05, S06, S07, S08 folders exist.
- **Complete session exports:** S00, S01, S01.5, S03, S04, S05, S08.
- **Incomplete session exports:** S06 missing task-history + screenshot; S07 missing consumption screenshot.
- **Build report:** `bob_sessions/build-report.md`
- **Custom modes:** `.bob/custom_modes.yaml`
- **Skills:** `evidence-discipline`, `code-review`, `test-runner`, `doc-writer`, `plan-council`, `oss-preflight-advisor`
- **Git tag:** missing `v1.0.0`
- **Video:** missing
- **Pitch deck:** `docs/oss-preflight-submission-deck.pdf`

## Required Human Actions

1. Export the real S06 Bob task history and consumption screenshot into
   `bob_sessions/S06-web-build-proof/`.
2. Export or add the real S07 consumption screenshot into
   `bob_sessions/S07-runtime-skill-demo/`.
3. Record the <=4 minute demo video showing idea -> recommendations -> scaffold
   -> Bob evidence.
4. After reviewing this work, approve commit. Only after the final commit should
   `v1.0.0` be created against that commit.
