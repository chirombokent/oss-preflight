# Ask Mode - Project-Specific Context

## Project State

**This is a 48-hour hackathon build in PLANNING PHASE.** No application code exists yet. When answering questions:

## Non-Obvious Documentation Structure

- `docs/architecture.md` - Single source of truth for WHAT and WHY
- `docs/implementation-plan.md` - Build sequence, gates, pro tips (HOW and WHEN)
- `docs/bob-build-guide.md` - Bob-specific mechanics (verified capabilities)
- `docs/bob-prompts.md` - Exact prompts for each session (not yet created)
- `docs/phase-plan.md` - GENERATED artifact (created by Plan mode generator, not hand-written)

## Counterintuitive Architecture Decisions

From `docs/architecture.md`:

### CLI is the Only Execution Path
- Web server spawns CLI with `--json`, parses stdout
- Bob skill calls CLI, not core
- CI will call CLI
- This prevents surface-specific divergence (non-standard pattern)

### Core Engine is Pure Logic, Zero I/O
- `packages/core/` has NO network calls, NO file I/O
- Collectors are injected dependencies
- This enables deterministic testing (unusual for recommendation systems)

### Cache Includes Errors
- `.oss-preflight/cache/` stores `{ error: true }` for failed fetches
- Prevents retry storms on persistent failures
- Not typical cache behavior

### Evidence Passport Fact/Inference Split
- Every fact has `{ value, source: URL, collectedAt, sourceType }`
- Interpretation is visibly separate column in UI
- Missing data = explicit `null` with "(not available)" label, never omitted
- This enforces transparency (core innovation)

## Bob Configuration Context

From `.bob/custom_modes.yaml`:
- `plan`, `code`, `orchestrator` are PROJECT OVERRIDES of default Bob modes
- Skills only run in Advanced or `reviewer` (has `skill` group)
- `plan` and `code` cannot activate skills - they use always-on `.bob/rules/` floor
- This is verified behavior from official docs

## Scope Cutline

From `docs/implementation-plan.md` §2:
- **Must ship**: npm/GitHub collectors, Discord scaffold, web UI, CLI, Bob proof
- **Should ship**: PyPI, OpenSSF, repo flow, GitHub starter search
- **Cut first**: Hugging Face, MCP server, Bobalytics, multiple templates

## Decision Gates (Hard Deadlines)

- Hour 14: CLI works or drop UI
- Hour 24: UI works or drop repo flow
- Hour 38: Three clean demos or record backup NOW

These are binary - "almost working" means cut the feature.

## Banned Claims

Never use in explanations about user-facing features:
- "guaranteed safe", "perfect stack", "proves best"
- "trust graph", "cryptographically verified"
- "only Bob can do this"

Use instead: "evidence-backed", "best fit for stated goal", "facts separated from interpretation"