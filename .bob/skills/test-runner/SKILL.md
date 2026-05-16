---
name: test-runner
description: Use when running, authoring, or validating the test suite — determinism checks, coverage of the must-test list, truthful pass/fail interpretation, and scaffold smoke-test validation. Activates on "run the tests", "validate this", "is the suite green", or the Orchestrator TEST step.
---

# Test Runner

Run reality, report it honestly, then judge it against what must be covered.

## Procedure

1. Run the suite (`pnpm test` / package scripts). Capture real output — never
   claim green without an actual run.
2. Report pass/fail truthfully, including flakes and skipped tests. A failing
   or skipped test is a finding, not a footnote.
3. Validate coverage of the must-test list:
   - scoring determinism (same input → byte-identical output)
   - missing-evidence handling
   - cache fallback
   - package candidate normalization
   - scaffold smoke test
   - fact vs inference labels
4. For the scaffold smoke test: confirm it runs with mocked messages, no
   network, no credentials, and exits 0.
5. If a must-test item is uncovered, author the minimal test for it (no broad
   snapshot tests until the core demo path is stable).
6. Output: command run, raw result summary, the must-test checklist with
   covered/uncovered, and any new tests added.

## Constraints

- No live APIs in unit tests.
- Never mark a step green on partial or unrun evidence.
- Determinism failures are BLOCKERs — surface them explicitly.
