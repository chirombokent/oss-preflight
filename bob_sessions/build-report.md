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
