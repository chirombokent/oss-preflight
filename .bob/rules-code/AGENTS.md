# Code Mode — pointer (not the source of truth)

The canonical Code-mode floor is **`.bob/rules-code/01-build-floor.md`**
(loaded with this file). Do not duplicate or paraphrase it here — a second
copy is how the two drift apart.

For project context, read the source docs directly (do not restate):

- `docs/architecture.md` — data model, scoring, cache strategy, API contracts,
  the one-pipeline boundary (web/skill/CI call the CLI, never import core).
- `docs/implementation-plan.md` — phase order, gates, engineering pro tips.
- `docs/phase-plan.md` — the generated per-phase contract you build to.
- `.bob/rules/` — the always-on floor (evidence, engineering, scope, claims).

If this file and `01-build-floor.md` ever disagree, `01-build-floor.md` wins.
