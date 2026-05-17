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
| S05 | 2026-05-17 03:00 | Orchestrator → Code/Reviewer/Advanced | always-on rules, rules-code, rules-reviewer, evidence-discipline, code-review, test-runner | Implement Phase P3 CLI + Phase P4 Scaffold: recommend command with Claude fallback, scaffold engine with idempotent generation, Discord bot template, mocked smoke test, adoption report | packages/cli/, packages/scaffold/, templates/, examples/, fixtures/ | pnpm test (CLI + scaffold), oss-preflight recommend, oss-preflight scaffold, npm test in scaffold | bob_sessions/S05-cli-scaffold/ | Automation spine + idea-to-running-code loop closed | Exported - awaiting human approval before commit |
| S04 | 2026-05-17 01:21 | Orchestrator -> Code/Reviewer/Advanced | always-on rules, rules-code, rules-reviewer, evidence-discipline, code-review, test-runner | Re-run/fix Phase P2 collectors + cache: npm/GitHub/PyPI/OpenSSF collectors, explicit null evidence, source-labeled cache fallback, isolated cache tests, prewarm script | packages/collectors/ (src, __tests__, scripts, fixtures), packages/core/src/scorer.ts | pnpm --filter @oss-preflight/core test (69/69); pnpm --filter @oss-preflight/collectors test (13/13); pnpm --filter @oss-preflight/collectors build | bob_sessions/S04-collectors-cache/ | P2 precondition green; all 12 AC green; GitHub rate-limit returns source=cache-fallback; npm 404 and errors cached; OpenSSF unavailable -> null; fixtures committed; no live APIs in unit tests | Complete / Exported - awaiting human approval before commit |
| S03 | 2026-05-16 23:44 | Orchestrator → Code/Reviewer/Advanced | always-on rules, rules-code, rules-reviewer, evidence-discipline, code-review, test-runner | Implement Phase P1 core schemas, deterministic discovery, scoring, normalization, and serializer | package.json, pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json, vitest.config.ts, packages/core/ | pnpm install; pnpm test in packages/core (69/69 tests, 8 files, no skipped tests, no live/LLM calls) | bob_sessions/S03-core-schemas-scoring/ | Deterministic recommendation core complete; all 10 P1 acceptance criteria green; discord.js fixture ranks #1 | Complete / Exported |
