---
name: code-review
description: Use when reviewing code changes, a pull request, or a build slice for blockers before approval — correctness, security, scope, consistency, and test coverage. Activates on "review this", "is this ready", "check this PR/slice", or the Orchestrator REVIEW step.
---

# Code Review

Blocker-first review. Lead with what must change, not with praise.

## Procedure

1. Restate the slice's acceptance criteria from the approved spec. If none are
   visible, stop and ask for them — do not review against a guessed intent.
2. Walk the diff and classify every finding as **BLOCKER**, **SHOULD**, or
   **NOTE**. Only BLOCKERs gate approval.
3. Check, in this order:
   - **Correctness vs spec** — does it meet each acceptance criterion?
   - **Evidence discipline** — no invented package facts; inference labeled;
     missing evidence explicit. (See the `evidence-discipline` skill.)
   - **Security** — no secrets/keys/`.env`; input validated at boundaries;
     no command/SQL injection or unsanitized interpolation.
   - **Scope** — nothing beyond the spec (no speculative abstractions,
     features, or error handling for impossible cases).
   - **Consistency** — matches existing patterns and the language's modern
     idioms; names carry intent; no dead/half-finished code.
   - **Tests** — behavior is covered; determinism where relevant; no live
     APIs in unit tests; pass/fail reported truthfully.
4. Output: a pass/fail verdict, then the BLOCKER list with `file:line` and the
   specific required change, then SHOULD/NOTE items.

## Constraints

- Do not modify application code in this pass; produce the blocker list.
- Do not approve with open BLOCKERs.
- No overclaim language in the review summary.
