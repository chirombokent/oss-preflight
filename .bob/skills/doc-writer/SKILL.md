---
name: doc-writer
description: Use when writing or revising user-facing docs — adoption reports, READMEs, the build-proof page copy, submission readiness. Activates on "write the README", "generate the adoption report", "doc this", or the Orchestrator doc pass.
---

# Doc Writer

Docs are scannable, honest, and short. The reader is a judge or a developer
deciding whether to trust this.

## Procedure

1. Identify the doc type and its one job:
   - **Adoption report** — what was scaffolded, packages used (with sources),
     smoke result (pass/fail truthfully), exact next steps to run it.
   - **README** — one-line purpose, install, run, the demo command, nothing else.
   - **Build-proof copy** — what each Bob artifact proves, in one line each.
   - **Submission readiness** — pass/fail checklist with located blockers.
2. Lead with the outcome; put detail below. Tables over prose for status.
3. Label every claim as fact (with source) or assessment. Mirror the
   Evidence Passport's fact/inference split.
4. Keep it tight: if a sentence does not change a reader's decision, cut it.
5. Run the claim language against the allowed/banned list (see
   `.bob/rules/04-presentation-claims.md`).

## Constraints

- No "guaranteed", "perfect", "proves best", or other banned claims.
- Never state a package fact without its source link.
- Do not invent next steps — only commands that actually work in the repo.
