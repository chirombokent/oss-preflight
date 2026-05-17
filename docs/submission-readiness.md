# OSS Preflight - Submission Readiness Report

**Review Date:** 2026-05-17
**Phase:** P9 - Production Readiness Hardening

## Verdict

**Status:** Production workflow implemented and verified by executable evidence.
**Validation gate:** `pnpm validate:production` runs the real product (build,
full test suite, and live CLI execution) and reports **13/13 checks, 0
blockers**. Captured output:
`bob_sessions/S09-production-readiness/validation-results.txt`.

Every claim below is backed by a command whose real output was inspected. OSS
Preflight now supports three real user paths:

1. Idea -> recommend -> scaffold or adoption pack -> verification (`run`).
2. Audit an existing npm or Python project (`audit`).
3. The same CLI driven by the Web bridge or the Bob skill.

Discovery is search-first: the recommend pipeline calls
`discoverCandidatesWithSearch` against npm/PyPI/GitHub, then blends visibly
labeled catalog fallback candidates for recognized domains so broad registry
results cannot crowd out known-fit packages.

## Honest Quality Reassessment

Scored against the prior external audit's baseline (in parentheses):

| Quality area | Score | Evidence |
|---|---:|---|
| Agentic workflow maturity | 8/10 (was ~6) | Workflow traces record the actual discovery method (`registry-search` / `search-with-catalog-fallback` / `manifest`) and the real candidate list with source labels. CLI/Web/Bob share one trace contract. |
| Discord CLI demo reliability | 9/10 (was ~8) | `recommend --save`, `run`, `scaffold --rank`, typecheck, and smoke test are green in the gate. |
| Full product demo reliability | 8/10 (was ~6) | `/api/audit` is implemented; web bridge spawns the real CLI for recommend/scaffold/audit; browser e2e passed but remains a mocked UI smoke. |
| Production usefulness for arbitrary projects | 8/10 (was ~4) | Generic Node API ideas now rank known web frameworks (`express`, `fastify`, `koa`) instead of unrelated registry hits; Python data-science ideas return PyPI packages with real PyPI/GitHub/OpenSSF evidence where available. `run` only scaffolds template-backed recommendations and emits an adoption pack for non-scaffoldable matches. |
| Hackathon evidence clarity | 8/10 (was ~5) | The validation gate executes the product and fails loudly on regression; its real output is committed as an artifact. |

These are deliberately not all 9/10. Remaining gaps are listed under **Known
Limitations**.

## Acceptance Criteria

The gate consolidates the 16 ACs into 13 executed checks. Each runs a real
command and asserts on its exit code and/or output.

| Check | Status | How it is verified |
|---|---|---|
| AC1: `pnpm build` | PASS | Runs `pnpm build`; asserts exit 0. |
| AC2: `pnpm test` | PASS | Runs the full vitest suite (181 tests incl. unmocked CLI integration); asserts exit 0. |
| AC3: `recommend --json --save` | PASS | Executes the CLI in a temp cwd; asserts exit 0, JSON has recommendations, `latest.json` written. |
| AC4/5: `run` workflow | PASS | Executes `run`; asserts exit 0, `discord.js` scaffold selection, typecheck/smoke pass, and `REPORT.md` + `workflow.json` written. |
| P9: arbitrary idea recommendations | PASS | Executes generic Node API and Python data-science ideas; asserts known-fit packages are present and unrelated npm hits do not outrank web frameworks. |
| AC6: audit npm repo | PASS | `audit --repo fixtures/npm-project --json`; asserts `ecosystem === npm` and structured deps. |
| AC7: audit Python repo | PASS | `audit --repo fixtures/python-project --json`; asserts `ecosystem === pypi` and the workflow trace records `pypi`/`manifest` discovery. |
| AC8/9: Web CLI bridge | PASS | Asserts `apps/web/server.ts` exposes `/api/recommend`, `/api/scaffold`, and `/api/audit`, all spawning the real CLI. |
| AC10/13/14: Evidence schema | PASS | Static invariant: `EvidenceFact` carries value/source/collectedAt/sourceType/retrievalSource, nullable, with explicit `not-available`. |
| AC11: Bob skill | PASS | `.bob/skills/oss-preflight-advisor/SKILL.md` defines the Production Workflow. |
| AC12: Search-first discovery | PASS | Asserts the pipeline calls `discoverCandidatesWithSearch` and discovery labels sources. |
| AC15: Validation script runs | PASS | The gate itself executes real commands. |
| AC16: Documentation | PASS | Required docs present. |

## Real, Unmocked Test Coverage

`packages/cli/__tests__/integration.test.ts` spawns the built CLI with no mocks
and asserts:

- npm fixture audit -> structured JSON, artifacts written to disk.
- Python fixture audit -> `ecosystem === pypi`, workflow trace records
  `searchMethod: manifest` and `source: manifest` candidates.
- `recommend --json` -> ranked recommendations with discovery metadata.
- Node API recommendation -> known web frameworks (`express`, `fastify`, `koa`).
- Python data-science recommendation -> known PyPI data packages.

These run inside `pnpm test` and therefore inside the production gate.

## Known Limitations

1. **Browser e2e is still a mocked UI smoke.** `apps/web/__tests__/e2e/flow.spec.ts`
   passed, but it stubs `/api/*`; a non-mocked live-server + CLI browser test
   remains future work.
2. **Live search quality varies by ecosystem.** npm registry search is robust
   JSON; PyPI search is an HTML scrape and can degrade. Catalog fallback/top-up
   is labeled whenever it contributes candidates.
3. **Only Discord has a code scaffold template.** Other recommendation domains
   now produce an adoption pack instead of invalid generated code.
4. **Bob IDE evidence** under `bob_sessions/S09-production-readiness/` is
   author-supplied and not re-verified by the validation script. The
   machine-checkable artifact is `validation-results.txt`.
5. **No git tag / deployment.** Versioning and public deployment require human
   approval.

## Verification Commands

```powershell
pnpm validate:production
pnpm build
pnpm test
pnpm --filter @oss-preflight/web test:e2e
node packages\cli\dist\index.js recommend --idea "Node TypeScript web API framework" --json
node packages\cli\dist\index.js recommend --idea "Python data science notebook for CSV analysis" --json
node packages\cli\dist\index.js run --idea "Discord bot that summarizes channel activity" --out C:\tmp\ossp-run
node packages\cli\dist\index.js audit --repo fixtures\npm-project --json --out C:\tmp\ossp-npm
node packages\cli\dist\index.js audit --repo fixtures\python-project --json --out C:\tmp\ossp-py
```

`recommend --save` and `run` write `.oss-preflight/` relative to the working
directory. The validation gate runs them in a temp directory and cleans up, so
it never pollutes the repo.

## Workflow Trace

`discoveryPlan.searchMethod` is one of `{ ai-expanded, keyword,
catalog-fallback, registry-search, search-with-catalog-fallback, manifest }`
and reflects the method actually used. `candidates[]` carries the real
discovered/manifest packages with `source` in `{ npm-search, pypi-search,
github-search, catalog-fallback, manifest }`. Traces are written to
`.oss-preflight/runs/<timestamp>/workflow.json` for idea runs and to the audit
output directory for repo-audit runs.

## Definition of Done (P9)

- PASS: Real discovery is wired into the recommend pipeline.
- PASS: Real PyPI audit and recommendation evidence is collected where available.
- PASS: Workflow traces record the actual discovery method and candidates.
- PASS: `validate:production` executes the product and asserts outcomes, including generic Node/Python idea quality.
- PASS: `run` no longer scaffolds non-template recommendations; it selects a scaffoldable package or writes an adoption pack.
- PASS: Web `/api/audit` is implemented; the bridge spawns the real CLI.
- PASS: Evidence UI is hardened against missing `retrievalSource`.
- DEFERRED: Non-mocked browser e2e against live server + CLI.
- PENDING: Human approval before commit.
