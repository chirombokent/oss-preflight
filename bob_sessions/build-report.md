# OSS Preflight — Bob Build Report (single ledger)

> The single summary of every meaningful Bob task. Each relevant session also
> has a `bob_sessions/S<id>-<slug>/` folder with the exported task-history
> markdown + task-session consumption-summary screenshot. Procedure:
> `docs/bob-build-guide.md` §8.

## Export Notes (fill during Hour-0, row 2)

- **Export UI path:** _(e.g. Views and More Actions → History → select task → task header → Export task history)_
- **Task-history file format:** _(markdown? includes tool calls / diffs? yes/no)_
- **Screenshot saved as:** _(path of the consumption-summary screenshot)_
- **Markdown saved as:** _(path of the exported task-history markdown)_
- **`skill` group on `reviewer` accepted by this Bob build?** _(yes / no — if no, removed `- skill`, REVIEW runs in Advanced)_
- **Checkpoints work? (row 8):** _(yes / no — restore tested?)_
- **Bob commit-message sparkle works? (row 7):** _(yes / no)_
- **Bob Shell available? (row 10, optional):** _(yes / no)_
- **BobCoin usage note:** IBM clarified provisioned BobCoins are free to use with the hackathon accounts; record meaningful session usage and measurable outcomes rather than treating 40 as a hard charge cap.

## Session ledger

| ID | Time (SAST) | Bob mode | Skill/rules | Prompt summary | Files touched | Tests/commands | Export path | Evidence value | Status |
|---|---|---|---|---|---|---|---|---|---|
| S00 | _TBD_ | Ask or Code | always-on rules | Hour-0 export test | docs/hour0-bob-export-test.md | — | bob_sessions/S00-hour0-export-test/ | Proves the export pipeline before the build depends on it | _Pending_ |
| S04 | 2026-05-17 00:05 | Orchestrator → Code/Reviewer/Advanced | always-on rules, rules-code, rules-reviewer, evidence-discipline, code-review, test-runner | Implement Phase P2 collectors + cache with npm, GitHub, PyPI, OpenSSF collectors; transparent cache with TTLs; rate-limit fallback; prewarm script; demo fixtures | packages/collectors/ (src, __tests__, scripts, fixtures) | pnpm test (77/77 tests green, 10 files); all must-test scenarios covered (cache-fallback, 404, invalidation, error caching, fixtures, parallel fetch) | bob_sessions/S04-collectors-cache/ | Single source of factual truth established; all 12 acceptance criteria met (10 blocking + 2 non-blocking); cache structure `.oss-preflight/cache/{ecosystem}/{id}.json`; idempotent prewarm; committed fixtures for demo insurance | Complete / Exported |
| S03 | 2026-05-16 23:44 | Orchestrator → Code/Reviewer/Advanced | always-on rules, rules-code, rules-reviewer, evidence-discipline, code-review, test-runner | Implement Phase P1 core schemas, deterministic discovery, scoring, normalization, and serializer | package.json, pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json, vitest.config.ts, packages/core/ | pnpm install; pnpm test in packages/core (69/69 tests, 8 files, no skipped tests, no live/LLM calls) | bob_sessions/S03-core-schemas-scoring/ | Deterministic recommendation core complete; all 10 P1 acceptance criteria green; discord.js fixture ranks #1 | Complete / Exported |
