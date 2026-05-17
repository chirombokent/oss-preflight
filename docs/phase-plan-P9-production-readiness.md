# Phase P9 - Production Readiness Hardening

**Session:** S09  
**Status:** Ready for Bob Orchestrator implementation  
**Last updated:** 2026-05-17

---

## Objective

Make OSS Preflight production-ready for three real user paths:

1. Start from scratch with an idea.
2. Audit an existing local or GitHub project.
3. Run the same workflow through Bob as an agentic orchestration layer.

Success means the product no longer depends on hardcoded Discord-only or
demo-only behavior for its core claims. Demo fixtures may remain as fallback
insurance, but live/product paths must use real discovery, real evidence
collectors, deterministic scoring, explicit missing evidence, approval-gated
writes, and reproducible validation.

P9 is a hardening phase, not a submission polish pass. Every green result must
come from executable CLI, Web, or Bob evidence, or from an explicitly labeled
fixture/fallback path.

---

## Target Quality Gates

All four quality scores must finish at **9/10 or better** and each score must
be justified by executable evidence, not narrative claims:

| Quality area | Target | Required proof |
|---|---:|---|
| Agentic workflow maturity | >= 9/10 | Bob, CLI, and Web expose the same workflow trace, decision points, approval gates, and recovery behavior. |
| Demo reliability | >= 9/10 | Three clean local runs complete without manual JSON editing or hidden setup beyond documented prerequisites. |
| Production usefulness for arbitrary projects | >= 9/10 | At least one npm repo fixture and one Python repo fixture audit successfully with real dependency evidence. |
| Hackathon alignment and evidence clarity | >= 9/10 | S09 export, build-report row, Bob activation evidence, production validation, and readiness docs are internally consistent. |

---

## Preconditions

- P1-P7 are present and build locally.
- `pnpm test` and `pnpm build` pass before P9 implementation begins.
- `bob_sessions/build-report.md` contains rows through S08.
- S09 has an official export folder at `bob_sessions/S09-production-readiness/`.
- The following current gaps are blockers unless fixed during P9:
  - `recommend --json` wrapper cannot be passed directly to `scaffold`.
  - Repo audit flow is not implemented.
  - Discovery is catalog-first, not real search-first.
  - UI cache/live labels are not fully truthful.
  - Bob runtime skill evidence is incomplete unless actual activation and CLI workflow are captured.

---

## Clarification Decisions

These decisions are binding for S09. Bob must not stop to ask these questions
again unless implementation proves one impossible.

1. **Fixture repositories:** create minimal fixtures in the repo under:
   - `fixtures/npm-project/`
   - `fixtures/python-project/`

   They must be small, deterministic, and committed. Each fixture should include
   enough metadata for repo analysis and audit validation:
   - npm fixture: `package.json`, README, license or license field, at least two runtime dependencies, one test script.
   - Python fixture: `pyproject.toml` or `requirements.txt`, README, license or classifier/license metadata, at least two dependencies, one test command if practical.

   Do not use external repos as the only acceptance path. External repos can be
   optional exploratory validation after fixture tests are green.

2. **`pnpm validate:production`:** add a new root script that runs the complete
   P9 production-readiness checklist. It should be implemented as a repo script
   rather than as documentation-only instructions. It must fail non-zero when
   any required P9 acceptance gate fails.

3. **Real discovery:** implement search collectors using existing public
   registry/search APIs where available:
   - npm registry/search API for npm packages
   - PyPI-supported metadata/search approach for Python packages, with clear fallback when search is unavailable or weak
   - GitHub Search API for repositories/starters/components

   Static catalog discovery remains as fallback/demo insurance only. Any
   catalog-derived candidate must be marked `fixture` or fallback-derived and
   must not be labeled as live-discovered.

4. **Workflow trace storage:** use context-dependent local storage:
   - idea mode writes under this repo/current working directory:
     `.oss-preflight/runs/<timestamp>/workflow.json`
   - repo-audit mode writes under the requested output directory, defaulting to
     `<audited-project>/.oss-preflight/audits/<timestamp>/workflow.json` for local repos
   - GitHub URL or pasted-manifest audits write under the current working
     directory unless `--out` is supplied

   Never write inside a user's source tree except under `.oss-preflight/`, and
   only when the command target is that project or the user supplied an output
   directory.

5. **Bob skill evidence:** require both forms:
   - manual S09 Bob activation evidence in `bob_sessions/S09-production-readiness/`
   - automated/static test evidence that validates the skill file, CLI command selection, approval wording, and scaffolder fence assumptions

   Manual activation is the proof that Bob really runs the workflow. Automated
   tests are regression guardrails and do not replace the manual S09 evidence.

---

## Scope

### In Scope

- Add production workflow orchestration shared by CLI, Web, and Bob.
- Add real discovery before static catalog fallback.
- Add repo analyzer support for local path, GitHub URL, and pasted manifest.
- Fix recommendation-to-scaffold handoff.
- Add truthful `live`, `cache`, `cache-fallback`, `fixture`, and `not-available` propagation into Evidence Passports and UI.
- Add `run`, `audit`, `recommend --save`, and `scaffold --rank` CLI behavior.
- Update the Bob skill to run the production CLI flow and ask before writes.
- Add a production validation command/checklist.
- Update README, build report, source ledger, and submission readiness docs to current truth.

### Out Of Scope

- More scaffold templates beyond the existing Discord starter.
- Auth, billing, hosted multi-user storage, marketplace, MCP server, trust graph.
- Claiming unsupported ecosystems are fully production-ready.
- Writing into a user's existing source tree without explicit approval.

---

## Required Implementation Changes

### 1. Shared Workflow Trace

Create a workflow result shape used by CLI, Web, and Bob:

- `workflowId`
- `mode`: `idea` or `repo-audit`
- `input`
- `repoContext`
- `discoveryPlan`
- `candidates`
- `recommendations`
- `evidenceGaps`
- `actions`
- `verification`
- `generatedArtifacts`

Every stage must be serializable to:

```text
.oss-preflight/runs/<timestamp>/workflow.json
```

The trace is the product's audit log. It must be generated by the production
workflow code path, not assembled only for the demo.

### 2. CLI Contract

Add or update these commands:

```text
oss-preflight recommend --idea "<idea>" --json --save
oss-preflight scaffold --recommendation <file> --rank 1 --out <dir>
oss-preflight run --idea "<idea>" --out <dir>
oss-preflight audit --repo <path-or-url> --out <dir>
oss-preflight audit --manifest <path> --out <dir>
```

Rules:

- `scaffold` must accept a full `recommend --json` wrapper, an array of recommendations, or one recommendation object.
- `--save` writes `.oss-preflight/recommendations/latest.json`.
- `run` performs recommend, selected scaffold or adoption pack, smoke verification, and workflow report generation.
- `audit` never writes into the audited repo unless explicitly approved. The default output is `.oss-preflight/audits/`.
- Every CLI command must have deterministic exit codes and actionable error output.

### 3. Repo Analyzer

Add `packages/repo-analyser`.

It must detect:

- package manager
- ecosystem
- language
- framework
- scripts/test command
- direct dependencies
- dev dependencies
- license
- README presence

Supported inputs:

- local directory
- GitHub URL metadata in clone/download-free mode where possible
- pasted or uploaded manifest JSON in Web

The analyzer must output a typed `RepoContext`/`RepoStack` object that can be
passed into scoring. If a field cannot be detected, it must be explicit
`null` or `unknown`, never omitted.

### 4. Real Discovery

Discovery order must be:

1. AI or keyword intent query expansion.
2. npm, PyPI, and GitHub search collectors.
3. Evidence collection for resolved candidates.
4. Deterministic scoring.
5. Static catalog fallback only when search is unavailable.

Every fallback candidate must be labeled as fallback-derived. A fallback
candidate may be recommended, but it must not be presented as live-discovered
evidence.

### 5. Evidence Passport Upgrade

Add retrieval source to facts:

- `sourceType`: `npm`, `github`, `pypi`, `openssf`, `inferred`
- `retrievalSource`: `live`, `cache`, `cache-fallback`, `fixture`, `not-available`

UI must display `retrievalSource` directly. It must not infer cached/live
status from a source URL.

No package fact can exist without:

- value or explicit `null`
- source URL or explicit `not-available`
- collected timestamp or explicit `not-available`
- source type
- retrieval source

### 6. Bob Runtime Workflow

Update `.bob/skills/oss-preflight-advisor/SKILL.md` so the skill:

- inspects repo context
- chooses `run` for idea flow or `audit` for repo flow
- runs or presents the exact CLI command
- shows workflow trace summary
- shows top recommendation and evidence gaps
- asks before scaffold/write
- delegates writes only to `oss-preflight-scaffolder`

S09 evidence must include actual Bob activation, not only regex or skill-file
inspection.

---

## Acceptance Criteria

All criteria are binary and must be validated with explicit evidence.

1. `pnpm test` passes.
2. `pnpm build` passes.
3. `recommend --json --save` creates `.oss-preflight/recommendations/latest.json`.
4. `scaffold --recommendation .oss-preflight/recommendations/latest.json --rank 1` works without manual JSON extraction.
5. `run --idea "Discord bot that summarizes channel activity"` completes recommendation, scaffold, smoke test, and report.
6. `audit --repo <fixture npm repo>` detects stack and audits dependencies.
7. `audit --repo <fixture python repo>` detects Python/PyPI dependencies and audits them.
8. Web idea flow uses local API and the real CLI path in at least one Playwright test.
9. Web repo-audit flow works with pasted manifest or GitHub URL fixture.
10. Evidence Passport shows truthful `live`, `cache`, `cache-fallback`, `fixture`, or `not-available`.
11. Bob skill activates and runs/presents the exact production CLI workflow.
12. No hardcoded candidate can be presented as live-discovered evidence.
13. No package fact can exist without source URL, collected timestamp, and retrieval source.
14. Missing evidence remains explicit `null` or `not-available`.
15. `pnpm validate:production` runs the complete production-readiness gate.
16. `docs/submission-readiness.md` and `bob_sessions/build-report.md` reflect current truth.

---

## Must-Test Scenarios

Run all on the first Bob TEST pass:

```powershell
pnpm test
pnpm build
pnpm validate:production
node packages\cli\dist\index.js recommend --idea "Discord bot that summarizes channel activity" --json --save
node packages\cli\dist\index.js scaffold --recommendation .oss-preflight\recommendations\latest.json --rank 1 --out C:\tmp\oss-preflight-p9-scaffold
node packages\cli\dist\index.js run --idea "Discord bot that summarizes channel activity" --out C:\tmp\oss-preflight-p9-run
node packages\cli\dist\index.js audit --repo fixtures\npm-project --out C:\tmp\oss-preflight-p9-npm-audit
node packages\cli\dist\index.js audit --repo fixtures\python-project --out C:\tmp\oss-preflight-p9-python-audit
pnpm --filter @oss-preflight/web test:e2e
```

The TEST step must capture the actual command results. Do not claim a pass for
commands that were not run.

---

## Quality Gates

- **No hardcoded short-circuit gate:** static catalog and fixtures are fallback-only and visibly labeled.
- **Evidence discipline gate:** facts only come from collectors, cache, or fixtures with source metadata.
- **Agentic workflow gate:** Bob, CLI, and Web expose the same workflow trace and decision points.
- **Write safety gate:** no writes into user source without approval.
- **Production clone gate:** a fresh clone works with keyword parser and cache; BYOK improves intent parsing but is not required.
- **Random project gate:** at least one npm and one Python fixture prove repo audit is not Discord-only.
- **Submission gate:** S09 export, screenshot, build-report row, and readiness docs are complete.

---

## Loop Configuration

**Steps:** SPEC -> IMPLEMENT -> REVIEW -> TEST -> FIX -> ENHANCE -> LOOP GATE -> EXPORT -> HUMAN REVIEW -> COMMIT

**Delegated modes:**

- SPEC -> `plan`
- IMPLEMENT -> `code`
- REVIEW -> `reviewer`
- TEST -> `advanced` with `test-runner` and `evidence-discipline`
- FIX -> `code`
- ENHANCE -> `code` or `advanced` with `doc-writer` for docs-only polish
- COMMIT -> `code`

**Loop continuation:**

- A clean pass exits to EXPORT only when all 16 acceptance criteria are green, zero reviewer blockers remain, and the full must-test list is green.
- Any unmet criterion triggers a scoped FIX and re-verification of only the affected criteria plus changed-file tests.
- Widen to a full REVIEW+TEST re-run only when a shared contract changes.
- Escalate if two consecutive loops produce no measurable progress or an external decision is required.

**Human gate:** mandatory before commit. Never commit autonomously.

---

## Definition Of Done

P9 is complete only when:

- all 16 acceptance criteria pass
- reviewer finds zero blockers
- production validation is green
- Bob S09 evidence is exported to `bob_sessions/S09-production-readiness/`
- `bob_sessions/build-report.md` records the S09 result
- `docs/submission-readiness.md` includes the production-readiness verdict
- the final quality-score table shows all four target areas at 9/10 or better with executable evidence
- human approval is given before commit

Suggested commit message after approval:

```text
feat: harden OSS Preflight production workflow
```

---

## Bob Launch Prompt

Use this as the S09 launcher:

```text
/orchestrator Run Phase 9 from docs/phase-plan-P9-production-readiness.md as a single Bob session.
Honor every acceptance criterion as binding. Do not implement hardcoded demo-only shortcuts.
Run the full must-test list on the first pass. Any fixture or fallback must be labeled as fixture/fallback in output and UI.
When all quality gates are green, delegate the build-report.md row to reviewer, export S09 evidence, then stop for human approval before commit.
Never commit autonomously.
```

---

## Evidence Artifact

Official export folder:

```text
bob_sessions/S09-production-readiness/
```

Expected contents after the Bob session:

- `task-history.md`
- `consumption-summary.png`
- optional `task-summary.md`
- workflow/test artifacts referenced by `docs/submission-readiness.md`

Build report row template:

```text
S09 | <timestamp> | Orchestrator -> Code/Reviewer/Advanced | evidence-discipline, code-review, test-runner, doc-writer, oss-preflight-advisor | Production readiness hardening: workflow trace, real discovery, repo audit, CLI/Web/Bob integration, validation gate | docs/phase-plan-P9-production-readiness.md, packages/, apps/web/, .bob/skills/, docs/ | pnpm test; pnpm build; pnpm validate:production; CLI run/audit/scaffold; web e2e | bob_sessions/S09-production-readiness/ | Production readiness raised to >=9/10 with executable evidence | Awaiting implementation/export |
```

---

## Assumptions

- Phase 9 is post-P7 hardening, not a replacement for the hackathon submission phase.
- S09 maps to `bob_sessions/S09-production-readiness/`.
- Existing Discord scaffold remains the only guaranteed scaffold template.
- Other matches may produce an adoption report instead of generated code.
- Production readiness means cloneable and verifiable locally, not necessarily hosted multi-tenant SaaS.
