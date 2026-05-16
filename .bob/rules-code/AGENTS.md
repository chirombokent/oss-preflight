# Code Mode - Project-Specific Rules

## Critical Non-Obvious Patterns

**This project has NO application code yet** - it's in planning phase. When code is written:

### Monorepo Structure (Not Yet Created)
- `packages/core/` - Pure logic, ZERO I/O (collectors injected)
- `packages/collectors/` - Single source of package facts
- `packages/cli/` - The ONLY execution path (web/skill/CI spawn it, never import core directly)
- `apps/web/server.ts` - Thin Express bridge that spawns CLI with `--json`, parses stdout

### Evidence Passport Data Model
From `docs/architecture.md` §9:
- Every fact field MUST have: `{ value, source: URL, collectedAt: ISO-8601, sourceType: 'npm'|'github'|'openssf'|'inferred' }`
- Missing fields emit explicit `null`, never omitted
- `@source` JSDoc tags in types.ts distinguish fact vs inferred

### Cache Strategy (Not Standard)
From `docs/architecture.md` §11:
- Cache location: `.oss-preflight/cache/{ecosystem}/{id}.json`
- Cache INCLUDES errors: `{ error: true }` marker prevents retry storms
- TTLs: npm 6h, GitHub 2h, OpenSSF 24h
- Rate-limited GitHub → return cache with `source: 'cache-fallback'` label
- 404 from npm → throw `PackageNotFoundError`, never fake data

### Determinism is a Feature
From `docs/implementation-plan.md` §5 P1:
- Write determinism snapshot test BEFORE scorer logic
- Same input must produce byte-identical JSON output
- Non-deterministic ranking destroys judge trust in live demo

### One Pipeline, Many Surfaces
From `docs/implementation-plan.md` §6 tip #2:
- CLI is the ONLY place the pipeline runs
- Web server MUST `spawn('oss-preflight', ...)`, not `import core`
- Bob skill calls CLI, not core
- This prevents surface-specific divergence

### Smoke Tests Mock at Network Boundary
From `docs/implementation-plan.md` §6 tip #9:
- Discord bot smoke test uses mock message array
- Mock Discord messages, NOT the summarizer interface
- No Discord credentials, no network calls
- Still exercises real code paths

### Commit Discipline
From `.bob/rules-code/01-build-floor.md`:
- NEVER self-initiate commits
- Only commit after Orchestrator relays user approval (loop STEP 10)
- Use Bob-generated conventional-commit message
- No `git` writes outside that flow

## Test Requirements

From `.bob/rules-code/01-build-floor.md`:
- Tests FIRST for behavior, then implement
- No live APIs in unit tests (mock at fetch boundary)
- Must-test list: determinism · missing-evidence · cache-fallback · normalization · smoke · fact/inference labels
- Determinism failure = blocker (not warning)

## Scope Binding

Work ONLY to `docs/phase-plan.md` acceptance criteria. Exceeding spec is a blocker, not a bonus.