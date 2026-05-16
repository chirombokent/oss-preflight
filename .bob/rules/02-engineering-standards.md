# Engineering Standards (always on)

Every code change in this repo must meet these. Reviewer blocks on violations.

## Scope (bind to the phase spec)
- Work only to the current phase spec's acceptance criteria and scope
  (`docs/phase-plan.md`). Exceeding the spec is a blocker the reviewer rejects.

## Correctness & tests
- Write or update tests for the behavior before/with the implementation.
- Report test results truthfully; never claim green without running.
- Determinism is a feature: same input must produce the same output.
  A determinism failure is a blocker, not a warning.

## Clean, modern, maintainable
- Follow the language's current idioms; consistent patterns across the codebase.
- Smallest change that satisfies the spec. No speculative abstractions, no
  features, error handling, or config for cases that cannot occur.
- Names carry intent; default to no comments unless the WHY is non-obvious.
- No half-finished code, no dead code, no backwards-compat shims for code we control.

## Security
- Never log or commit secrets, passwords, tokens, keys, or `.env`.
- Validate input only at system boundaries (user input, external APIs).
- No command injection, no string-built shell/SQL, no unsanitized interpolation.
- Only metadata is fetched from public registries; never install or execute
  discovered packages.

## Performance (sane, not premature)
- Cache external calls with timestamps; respect TTLs; no needless refetch.
- Parallelize independent I/O; do not block on serial network calls.
- Optimize only with a measured reason; clarity first.

## Boundary
- One pipeline, many surfaces: web and skill call the CLI, never import core
  directly. Keep that single execution path.
