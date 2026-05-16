# S04 — Collectors + Cache Implementation

**Session:** S04-collectors-cache  
**Phase:** P2 — Collectors + Cache  
**Mode:** Code → Reviewer → Advanced  
**Timestamp:** 2026-05-16T22:05:24Z to 2026-05-16T22:20:16Z  
**Duration:** ~15 minutes

## Objective

Establish the single source of factual truth by implementing live collectors for npm and GitHub registries with a transparent local cache, explicit TTLs, and graceful degradation to cached data on rate limits.

## Acceptance Criteria Status

### Blocking (AC 1-10): ✅ ALL GREEN

1. ✅ **Registry mapping** — [`packages/collectors/src/index.ts`](../../packages/collectors/src/index.ts) exports `collectors` object mapping `npm`, `github`, `pypi` to collector functions
2. ✅ **npm collector** — [`packages/collectors/src/npm.ts`](../../packages/collectors/src/npm.ts) with 404 → `PackageNotFoundError`, never returns null/fake data
3. ✅ **GitHub collector** — [`packages/collectors/src/github.ts`](../../packages/collectors/src/github.ts) with rate-limit → cached data fallback with `source: 'cache-fallback'`
4. ✅ **Cache structure** — [`packages/collectors/src/cache/index.ts`](../../packages/collectors/src/cache/index.ts) stores in `.oss-preflight/cache/{ecosystem}/{canonical-id}.json` with TTLs: npm 6h, GitHub 2h, PyPI 6h, OpenSSF 24h
5. ✅ **Error classes** — [`packages/collectors/src/errors.ts`](../../packages/collectors/src/errors.ts) with `CollectorError(ecosystem, packageName, originalError, fallbackData?)`, `PackageNotFoundError`, `RateLimitError`
6. ✅ **Cache-fallback test** — passes (GitHub rate-limit returns cached data)
7. ✅ **404 test** — passes (npm 404 throws `PackageNotFoundError`, no null/fake data)
8. ✅ **Cache-invalidation test** — passes (expired cache triggers live fetch + update)
9. ✅ **Prewarm script** — [`packages/collectors/scripts/prewarm-cache.ts`](../../packages/collectors/scripts/prewarm-cache.ts) idempotent (checks timestamps, skips if fresh)
10. ✅ **Demo fixtures** — committed [`npm-discord.js.json`](../../packages/collectors/fixtures/demo-packages/npm-discord.js.json), [`github-discordjs-discord.js.json`](../../packages/collectors/fixtures/demo-packages/github-discordjs-discord.js.json)

### Non-Blocking (AC 11-12): ✅ BOTH IMPLEMENTED

11. ✅ **PyPI collector** — [`packages/collectors/src/pypi.ts`](../../packages/collectors/src/pypi.ts) implemented with same patterns as npm
12. ✅ **OpenSSF collector** — [`packages/collectors/src/openssf.ts`](../../packages/collectors/src/openssf.ts) implemented, missing score → `null` (not failure)

## Test Results

**Command:** `pnpm test`  
**Exit Code:** 0 ✅  
**Summary:** 10 test files, 77 tests passed, 0 failed

### Must-Test Coverage (from [`docs/phase-plan.md`](../../docs/phase-plan.md:210-218))

1. ✅ **Cache fallback** — GitHub rate-limit returns cached data with `source: 'cache-fallback'`
2. ✅ **404 handling** — npm 404 throws `PackageNotFoundError`, no null/fake data
3. ✅ **Cache invalidation** — cache entry older than TTL triggers live fetch + cache update
4. ✅ **Missing evidence (OpenSSF unavailable)** — returns `null` for score field, does not crash
5. ✅ **Fixture fallback (npm)** — loads `npm-discord.js.json` with valid license, version, weeklyDownloads, sourceUrl, collectedAt
6. ✅ **Fixture fallback (GitHub)** — loads `github-discordjs-discord.js.json` with valid stars, lastCommit, contributors, sourceUrl
7. ✅ **Error caching** — npm timeout cached with `error: true` marker; second call returns cached error without retry
8. ✅ **Parallel fetch** — npm + GitHub fetched in parallel via `Promise.all`, no serial blocking

## Code Review Findings

**Verdict:** PASS ✅  
**Blockers:** 0  
**Should Items:** 3 (polish, not blocking)

### Review Summary

- **Correctness:** All 12 acceptance criteria met
- **Evidence discipline:** All collectors store `sourceUrl` and `collectedAt`; no invented facts; missing data handled explicitly
- **Security:** No secrets logged; `GITHUB_TOKEN` from env only; no command injection; input validated at boundaries
- **Scope:** No features beyond spec; error handling matches architecture table
- **Tests:** All must-test scenarios covered; mocked fetch (no live APIs); pass/fail reported truthfully
- **Consistency:** Modern TypeScript idioms; names carry intent; parallel I/O used; no dead code

## Files Created/Modified

### Created
- `packages/collectors/package.json`
- `packages/collectors/tsconfig.json`
- `packages/collectors/src/index.ts`
- `packages/collectors/src/errors.ts`
- `packages/collectors/src/cache/index.ts`
- `packages/collectors/src/npm.ts`
- `packages/collectors/src/github.ts`
- `packages/collectors/src/pypi.ts`
- `packages/collectors/src/openssf.ts`
- `packages/collectors/__tests__/collectors.test.ts`
- `packages/collectors/__tests__/fixtures.test.ts`
- `packages/collectors/scripts/prewarm-cache.ts`
- `packages/collectors/fixtures/demo-packages/npm-discord.js.json`
- `packages/collectors/fixtures/demo-packages/github-discordjs-discord.js.json`

### Modified
- None (new package)

## Loop Execution

**Loop:** SPEC → IMPLEMENT → REVIEW → TEST → (FIX skipped - clean first pass) → (ENHANCE skipped - clean first pass) → EXPORT → HUMAN REVIEW → COMMIT

1. **SPEC** — Read [`docs/phase-plan.md`](../../docs/phase-plan.md) P2 specification (lines 169-231)
2. **IMPLEMENT** — Code mode: created collectors package with npm, GitHub, PyPI, OpenSSF collectors; cache infrastructure; error classes; tests; prewarm script; fixtures
3. **REVIEW** — Reviewer mode with `code-review` skill: PASS verdict, 0 blockers, all AC met
4. **TEST** — Advanced mode with `test-runner` skill: 77/77 tests green, all must-test scenarios covered
5. **FIX** — Skipped (clean first pass)
6. **ENHANCE** — Skipped (clean first pass)
7. **EXPORT** — This document + consumption screenshot
8. **HUMAN REVIEW** — Awaiting approval
9. **COMMIT** — Pending human approval

## Evidence Discipline

- ✅ Package facts only from collectors/fixtures/cache
- ✅ Never invented downloads, licenses, versions, scores
- ✅ Missing evidence explicit with null + "(not available)" labels
- ✅ Inference labeled (N/A for this phase - collectors are pure I/O)
- ✅ Source links stored with facts (`sourceUrl` field)
- ✅ Scores explainable from visible inputs (N/A for this phase)
- ✅ Pass/fail reported truthfully (77/77 green, exit code 0)

## Quality Gates Passed

1. ✅ **Evidence discipline** — No invented facts; explicit nulls; source attribution
2. ✅ **Engineering standards** — Security (no secrets logged); cache external calls; parallel I/O; clean code
3. ✅ **Scope binding** — No live APIs in unit tests; no features beyond spec
4. ✅ **Code review** — PASS verdict, 0 blockers
5. ✅ **Test execution** — 77/77 green, all must-test scenarios covered

## Next Steps

1. Human approval of this implementation
2. Commit with Bob-generated message: `feat(collectors): add npm and GitHub collectors with cache`
3. Proceed to Phase P3 — CLI implementation

---

**Built with IBM Bob** — Session S04, Phase P2 complete