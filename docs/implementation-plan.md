# OSS Preflight — Implementation Plan

> **The build playbook.** Sequential, gated, and opinionated. Read [architecture.md](./architecture.md) first for *what* and *why*; this doc is *how* and *in what order*.
> Bob-specific build mechanics live in [bob-build-guide.md](./bob-build-guide.md); the exact prompts in [bob-prompts.md](./bob-prompts.md).

---

## 1. Feasibility verdict

**Feasible** as a 48-hour solo build *if scope is held to the cutline*.

The strongest feasible version:

- Web UI: idea input, ranked recommendations, Evidence Passport detail, scaffold trigger, `/build-proof`.
- CLI: `oss-preflight recommend` and `oss-preflight scaffold`.
- Real npm + GitHub collectors with a transparent cache.
- Fixture-backed PyPI/OpenSSF if time allows.
- TypeScript Discord-bot scaffold with mocked messages and a green smoke test.
- Bob build proof: custom modes, skills, rules, exported sessions, build report, Bob-assisted commits.

The **highest-risk** version puts live Bob skill demo, live repo audit, live GitHub starter search, OpenSSF, PyPI, deployed UI, and multiple scaffold templates all on the critical path. **Do not do that.**

---

## 2. Scope ledger

| Must ship | Should ship | Cut first if behind |
|---|---|---|
| `oss-preflight recommend` → recommendation JSON | PyPI collector | Hugging Face collector |
| `oss-preflight scaffold` → Discord starter | OpenSSF collector | MCP server |
| npm collector | Repo URL/local-path flow | Bobalytics |
| GitHub collector | GitHub starter-repo search | Multiple scaffold templates |
| Cache with timestamps | Live Bob runtime skill demo | Live judge-repo audit |
| Evidence Passport (fact/inference split) | Bob-generated PR description | Advanced starter similarity scoring |
| Web UI for the main demo | | |
| `/build-proof` page (or local equivalent) | | |
| Bob custom modes / skills / sessions / report | | |
| Smoke test for the generated scaffold | | |

**Cutline philosophy:** every "should" must degrade to a fixture or a static artifact, never to a broken demo. A cut feature that still has a screenshot or a pre-warmed cache is a win; a half-working live feature is a loss.

**Hackathon-guide deltas to close early:**

- Official Bob reports live in `bob_sessions/` and include **both** task-history markdown and task-session consumption screenshots. `bob_sessions/build-report.md` is the single summary ledger.
- Keep a public-data/source ledger at `docs/source-ledger.md`: registry/API source, data used, URL, terms/commercial-use verification status, and whether it is live, cached, or fixture data.
- IBM clarified that the provisioned 40 BobCoins are free to use with the hackathon accounts. Use that flexibility for measurable quality: iterative Plan Council rounds, deeper review/test/fix loops, and additional adversarial checks are allowed when they resolve concrete blockers or improve acceptance criteria, contracts, tests, or evidence.
- IBM Bob IDE must be a core component. Optional watsonx.ai / watsonx Orchestrate can strengthen the IBM story, but they are not on the critical path and must not distract from the demo unless the must-ship path is already green.
- If watsonx.ai is used, avoid out-of-scope models named in the hackathon guide and save/export watsonx work before the hackathon account is deactivated.

---

## 3. Hour-0 readiness gate (do this before any code)

Ten concrete checks, in order. Each has an exact action, a pass criterion, and a fallback if it fails. Do not start P1 until rows 1–9 pass (row 10 is optional). Mechanics and the override model are in [bob-build-guide.md](./bob-build-guide.md) §4–§6.

| # | Check | Exact action | Pass criterion | If it fails |
|---|---|---|---|---|
| 1 | Bob opens the repo | Open the repo root in IBM Bob (the actual local checkout path — note it contains **spaces**, so always quote it in any CLI/spawn later) | Repo tree + chat load | Reinstall/relogin Bob; stop until fixed |
| 2 | **Session export works** | Run S00 prompt, then use Bob IDE **Views and More Actions → History → select task → task header → screenshot consumption summary → Export task history** | Task-history markdown + task-session consumption-summary screenshot exist in `bob_sessions/S00-hour0-export-test/`; you can name the UI path, format, and whether it includes tool calls/diffs | This blocks everything — resolve before any build; record findings |
| 3 | Overrides load **and the whole file parses with `skill` present** | Open mode dropdown | All five appear: `📝 Plan`, `💻 Code`, `🔀 Orchestrator` (our descriptions, not stock), `reviewer`, `oss-preflight-scaffolder`. If *any* are missing, `custom_modes.yaml` failed to parse — likely the `skill` group on `reviewer` is unsupported by this Bob build | Slugs must match defaults exactly (`plan`/`code`/`orchestrator`). If parse failed: see row 6 fallback (remove `skill` from `reviewer`) and reload |
| 4 | Always-on rules inject | In `/code`, ask "what are your rules?" | Bob recites evidence/engineering/scope/claims from `.bob/rules/` | Confirm `.bob/rules/` files are committed and non-empty |
| 5 | `fileRegex` fence holds | In overridden `plan`, ask Bob to edit `packages/core/x.ts` | Bob is **blocked** (plan = markdown only) | Fence misconfigured — fix regex (unquoted single-backslash) |
| 6 | Skill activates + `skill`-group fallback ready | In **Advanced**, trigger `oss-preflight-advisor`; separately confirm row 3 showed all five modes | Skill activates in the documented Advanced runtime; `reviewer` also declares the official `skill` group where the build supports it | **If `custom_modes.yaml` failed to parse (row 3) or `reviewer` rejects `skill`:** edit `.bob/custom_modes.yaml`, delete the `- skill` line under `reviewer`'s `groups`, reload Bob, confirm all five modes load. Then the loop's REVIEW recipe runs in **Advanced** instead of `reviewer` (the always-on rules floor still applies in `reviewer`). Record the decision in `bob_sessions/build-report.md` → Export Notes |
| 7 | Bob commit message | Stage a file, click the sparkle icon | A conventional-commit message generates | Note as manual-commit fallback in build report |
| 8 | Checkpoints | Start a task, watch for the checkpoint marker; test "Restore Files & Task" | Checkpoint appears at task start/before edits; restore works | Lean on git commits as the safety net instead |
| 9 | Secret guard | Confirm `.env` is ignored by git and excluded from Bob context; run the secret scan before committing exports | `.gitignore` and `.bobignore` exist; scan finds no committed/exported secrets | Stop and sanitize before making the repo public |
| 10 | Bob Shell *(optional)* | Check if Bob Shell is available | Known either way | Not required — proceed |

After the gate: write the **export format, UI path, screenshot path, markdown path, and whether exports include tool calls/diffs** into `bob_sessions/build-report.md` → *Export Notes*, then commit `.bob/` first (before any app code).

> **Pro tip:** Hour-0 is not setup overhead — it is the single highest-leverage hour. A misunderstood export format discovered at Hour 44 is unrecoverable. Discovered at Hour 0, it is a five-minute fix. Row 2 is the one that can sink the submission — clear it first.

---

## 4. The 48-hour timeline

| Hours | Phase | Key output | Exit gate |
|---|---|---|---|
| 0–1 | **P0** Bob proof + Hour-0 tests | `.bob/*`, `bob_sessions/build-report.md`, export verified | Export format documented |
| 1–2 | **P0** Generate phase-plan (S01) + **Plan Council gate** (S01.5) | `docs/phase-plan.md` + `## Council Verdict = PASS` | Plan approved, council ≥9/10, exported |
| 2–8 | **P1** Core schemas + scoring | `packages/core` + tests | `pnpm test` green, ranking stable |
| 8–14 | **P2** Collectors + cache | `packages/collectors` + tests | Real npm/GitHub data returned |
| 14–17 | **P3** CLI | `packages/cli` | `oss-preflight recommend` prints 3 |
| 17–22 | **P4** Scaffold engine | `packages/scaffold` + template | Smoke test green |
| 22–30 | **P5** Web UI + build-proof | `apps/web` | Full flow in browser |
| 30–37 | **Sleep** | — | **Mandatory** |
| 37–41 | **P6** Bob runtime integration | skill demo working | Skill activates, stays in bounds |
| 41–45 | **P7** Review + harden | build report, 3 clean demo runs | Reviewer finds no blocker |
| 45–48 | **Submit** | export sessions, tag `v1.0.0`, video | GitHub push + submission |

**Decision gates (hard):**

- **Hour 14** — CLI works or **drop the UI** and demo via terminal.
- **Hour 24** — UI works or **drop the repo flow**.
- **Hour 38** — three clean demo runs recorded or **record the backup video now**.

These are product/timeline cutlines, not Bob usage caps. Use the extra Bob
flexibility before each gate to improve measurable quality, but do not keep a
late feature alive past the gate just because more agent cycles are available.

> **Pro tip:** the gates are commitments, not aspirations. At each gate, the question is binary and answered out loud. "Almost working" at Hour 14 means the UI is dropped. Sentimental scope-keeping is how solo hackathons fail.

---

## 5. Phase-by-phase build playbook

Each phase: **goal → files → implementation notes → tests → exit gate → pro tips.** Build order is dependency-ordered: nothing downstream starts until its upstream gate is green.

### P0 — Bob proof foundation

**Goal:** make Bob's contribution provable from minute one.

**Files:** `.bob/custom_modes.yaml` (overrides `plan`/`code`/`orchestrator` + additive `reviewer`/`oss-preflight-scaffolder`), `.bob/rules/` (always-on), `.bob/rules-{plan,code,reviewer,orchestrator}/`, `.bob/skills/{oss-preflight-advisor,evidence-discipline,code-review,test-runner,doc-writer}/SKILL.md`, official `bob_sessions/S00-S09/` export folders, `bob_sessions/build-report.md`.

**Notes:** these already exist in the repo — P0 is *verifying* them against the Hour-0 gate (§3) and recording the exact export format in `bob_sessions/build-report.md`. The May 2026 hackathon guide requires each relevant Bob IDE task session to be exported from History, with the task-session consumption-summary screenshot and task-history markdown uploaded in a root `bob_sessions/` folder. P0 then runs **S01: the Plan-mode phase-plan generator** ([bob-prompts.md](./bob-prompts.md) §3) → `docs/phase-plan.md`, one self-contained, Orchestrator-ready spec per P-phase. Then **S01.5: the Plan Council** ([bob-prompts.md](./bob-prompts.md) §5a) — 5 independent adversarial teams gate the plan at **MIN ≥9/10, zero blockers**. If the council fails, it records blockers, delegates a scoped Plan-mode revision, and re-runs all 5 teams while each cycle produces measurable refinements; no score may rise unless the written plan concretely resolves a cited issue. No phase launches without `## Council Verdict = PASS`. **Every later P-phase is then launched with a single `/orchestrator` line** ([bob-prompts.md](./bob-prompts.md) §5); the encoded loop (spec→implement→review→test→fix→enhance→export→human review→commit) runs from the phase spec and continues while it produces measurable acceptance-criteria progress — see [bob-build-guide.md](./bob-build-guide.md) §5. `docs/phase-plan.md` is a generated artifact, not part of the authored 3+1 doc set.

**Exit gate:** every Hour-0 check passes; export format written down.

> **Pro tip:** commit `.bob/` *before* writing app code so the very first build commit already shows the governed-mode setup. Evidence ordering in git history is itself evidence.

### P1 — Core schemas + scoring (`packages/core`)

**Goal:** deterministic decision engine, pure logic, zero I/O.

**Files:** `types.ts` (zod + JSDoc `@source` tags), `intent-parser.ts` (Claude Haiku, low temp), `scorer.ts`, `normalizer.ts`, `serializer.ts`, `*.test.ts`.

**Notes:**

- **Workspace bootstrap (first slice of P1):** before any `packages/core`
  code, create the monorepo root manifest — `package.json`,
  `pnpm-workspace.yaml`, `tsconfig*.json`, `vitest.config.ts`. The overridden
  `code` mode's `fileRegex` explicitly permits these root config files (see
  `.bob/custom_modes.yaml`), so this slice is in-scope and does not need a
  separate mode. `pnpm test` cannot be green without it — treat it as P1
  acceptance criterion #0.
- Every `IdeaBrief` field from the LLM is tagged `@source: 'inferred'`.
- `scorer.ts` input: `Candidate[]`, `IdeaBrief`, optional `RepoStack`; output: `Recommendation[]` with per-dimension subscores. **Every subscore independently computable.**
- `normalizer.ts` returns a `CanonicalId` (npm lowercase, PyPI dash/underscore-normalised, GitHub `owner/repo` lowercase) — this is the cache key, so it must be stable.
- `serializer.ts` emits missing fields as explicit `null`, rejects silently-omitted evidence.

**Tests:** fixture-based units per module · **determinism test** (same input → byte-identical output) · evidence test (missing signal does not crash, is labelled).

**Exit gate:** `pnpm test` green; the Discord-bot fixture produces a stable top-3 ranking across repeated runs.

> **Pro tip:** write the determinism test *first*. A scorer that ranks differently across runs will destroy judge trust in the live demo, and the bug is nearly invisible without a snapshot test pinning the exact output.

### P2 — Collectors + cache (`packages/collectors`)

**Goal:** the single source of factual truth, with a transparent cache.

**Files:** `index.ts` (registry: ecosystem → collector), `npm.ts`, `github.ts`, `pypi.ts` (should), `openssf.ts` (should), `cache/index.ts`, `*.test.ts`.

**Notes:**

- `cache/index.ts` stores `{ data, collectedAt, source }`; TTLs: npm 6h, GitHub 2h, OpenSSF 24h, discovery 1h. Every call cached **including errors** (`error: true` marker).
- `npm.ts` 404 → `PackageNotFoundError` (never null, never fake). `github.ts` rate-limited → return cache with `source: 'cache-fallback'`. `openssf.ts` unavailable → `null`, not a failure.
- Collector error class carries `ecosystem`, `packageName`, `originalError`, optional `fallbackData`.

**Tests:** mock fetch per collector validated against real response shapes · cache-invalidation tests · error paths (404, rate limit, timeout) · cache-fallback test.

**Exit gate:** real npm + GitHub data returned live or from fixtures; cache fallback proven by test.

> **Pro tip:** seed `.oss-preflight/cache/` with a committed snapshot of the *exact* demo packages (discord.js, discord.py, the starter repo) early. This is your live-API insurance for the demo and costs nothing to keep warm.

### P3 — CLI (`packages/cli`)

**Goal:** the automation spine — the same path the Bob skill, the web server, and CI all call.

**Files:** `index.ts` (Commander), `recommend-command.ts`, `scaffold-command.ts`, `output-formatter.ts`, `*.test.ts`.

**Notes:**

- `oss-preflight recommend --idea <s> [--lang --license --repo --json --refresh]` runs the full pipeline and prints a 3-row table (or JSON with `--json`). Reads `ANTHROPIC_API_KEY` (required) and `GITHUB_TOKEN` (optional, higher rate limits).
- `oss-preflight scaffold --recommendation <json> --out <dir>` loads, scaffolds, smoke-tests, prints adoption report.
- `output-formatter.ts` supports table / `--json` / `--format md`. Passport always in JSON, optional in human output.
- Exit codes per [architecture.md](./architecture.md) §14.

**Tests:** mock collectors + mock Claude · table output is exactly 3 rows · JSON schema compliance · exit-code matrix.

**Exit gate (HOUR 14):** `oss-preflight recommend --idea "<discord bot idea>"` prints 3 ranked recommendations. If not green → drop UI, demo via terminal.

> **Pro tip:** make the CLI the *only* place the pipeline runs. The web server must `spawn('oss-preflight', ...)`, not import core directly. One code path means the demo, the skill, and CI cannot diverge — and a CLI bug surfaces in every surface at once instead of hiding in one.

### P4 — Scaffold engine (`packages/scaffold`)

**Goal:** close the loop from recommendation to *running* code.

**Files:** `engine.ts`, `runner.ts`, `templates/discord-summary-bot/` (`src/index.ts`, `src/summarizer.ts` mock, `smoke-test.ts`), generates into `examples/discord-summary-bot/`.

**Notes:**

- `engine.ts` copies the template, interpolates package names/versions into `.ts/.json/.md`, generates `README.md` + `ADOPTION_REPORT.md` (timestamp, packages used, smoke result, next steps).
- `runner.ts` runs `npm install` if needed, executes the smoke test, captures stdout/stderr, asserts exit 0, returns `{ pass, output, duration }`.
- Smoke test uses a **mock message array and a mock summariser — no Discord credentials, no network.**

**Tests:** scaffold generation + smoke test for the Discord template · variable interpolation correctness · adoption report metadata.

**Exit gate:** `oss-preflight scaffold ...` produces files and the smoke test passes green.

> **Pro tip:** keep a known-good generated scaffold committed in `examples/discord-summary-bot/`. If the live scaffold fails on stage, you open the committed one and the smoke test still runs green — the audience cannot tell the difference, and you never demo into a red terminal.

### P5 — Web UI + build-proof (`apps/web`)

**Goal:** the judge-facing experience.

**Files:** `src/App.tsx`, `pages/{IdeaInput,RecommendationList,EvidencePassport,ScaffoldProgress,BuildProof}.tsx`, `components/{ScoreBar,FactBadge,SourceLink,HighlightCode}.tsx`, `api/client.ts`, `server.ts` (Express), Vite + Tailwind config. Design tokens from `ui-reference/oss-preflight-design-tokens.css`.

**Notes:**

- Flow: idea input → 3 cards → Passport modal (fact vs inferred visibly split) → scaffold progress (file tree + live smoke status) → `/build-proof` (sessions, modes, git log).
- `server.ts` spawns the CLI with `--json`, parses stdout, returns it. No business logic in the server.
- No component library, no heavy state lib (Context + hooks). Dark mode via `class="dark"`; respect `prefers-reduced-motion`; calm mode via `[data-calm=true]`.

**Tests:** lightweight component snapshots (optional) · API integration against a mock CLI.

**Exit gate (HOUR 24):** full flow completes in the browser. If not green → drop the repo flow, keep the idea flow.

> **Pro tip:** build `/build-proof` as a static render of `bob_sessions/build-report.md` early, not last. It is the lowest-risk page (no APIs), it is pure Bob evidence, and having it done by Hour 24 means the Bob narrative is demo-ready even if a later phase slips.

### P6 — Bob runtime integration

**Goal:** prove OSS Preflight also ships *as* a Bob workflow.

**Notes:** finish/test `oss-preflight-advisor` (skill) and `oss-preflight-scaffolder` (custom mode, writes only to approved paths). The skill reads repo context, runs the CLI, presents the top recommendation, and asks before scaffolding. Exact activation mechanics and the verified Advanced-mode constraint are in [bob-build-guide.md](./bob-build-guide.md).

**Exit gate:** skill activates, presents recommendations (or the exact CLI sequence), and never writes outside approved paths.

> **Pro tip:** the runtime skill is a "should", not a "must". If it is risky live, record a 30-second activation clip and demo the standalone flow. A clean recorded skill activation beats a flaky live one every time.

### P7 — Review + harden + submit

**Goal:** no surprises on stage or in judging.

**Notes:** Reviewer-mode pass over demo path, tests, Bob evidence, exported sessions, README, this plan's risk register, and presentation claims. Produce `docs/submission-readiness.md`, finalise `bob_sessions/build-report.md`, export the final session, tag `v1.0.0`, record the video.

**Exit gate:** reviewer finds no critical blocker; submission checklist (§10) complete.

---

## 6. Cross-cutting engineering pro tips

Uncommon, high-leverage, learned-the-hard-way:

1. **Pin the demo with a fixture, run the demo live.** The live path proves it works; the committed fixture/cache guarantees it works on stage. Ship both, always.
2. **One pipeline, many surfaces.** CLI is the only execution path. Web/skill/CI are thin wrappers. Divergence is impossible if there is nothing to diverge.
3. **Determinism is a feature, test it like one.** Snapshot the exact ranked output. A scorer that drifts between runs silently destroys judge trust.
4. **Cache is the demo's seatbelt.** Pre-warm the exact demo packages and commit the cache. Label live vs cached honestly — the honesty *is* the pitch.
5. **Explicit nulls beat clean objects.** Omitting a missing field looks tidy and reads as a hallucination risk. Emit `null` and label it `(not available)`.
6. **Evidence ordering in git is evidence.** Commit `.bob/` first, then build. The history itself shows a governed process.
7. **Build the safest page early.** `/build-proof` has no external deps and carries the entire Bob narrative — front-load it.
8. **Banned-words lint.** A tiny grep test using the presentation-claims rule prevents the single worst class of overclaim in front of judges.
9. **Mock at the network boundary, never above it.** Smoke tests mock Discord messages, not the summariser interface — you still exercise real code paths.
10. **Time-box every "should".** A should-ship feature gets a hard clock. When it rings, it degrades to a fixture and you move on. No exceptions.

---

## 7. Testing strategy

- **Unit (vitest):** scorer determinism · intent parser (mocked Claude) · collectors (mocked fetch) · cache invalidation · template interpolation.
- **Integration:** CLI end-to-end with fixtures · web API against a mock CLI.
- **Smoke (per template):** scaffold generates files · template smoke test passes · README is readable.
- **Manual / demo:** live Discord-bot idea → 3 recs → scaffold → green smoke · `/build-proof` renders · git log shows Bob-assisted commits.

**Rule:** no live APIs in unit tests. Live calls are exercised only in the manual demo pass and the pre-warm step.

---

## 8. Demo script & checklist

**Narrative (≤ 4 min):** problem (15s) → type the Discord-bot idea (10s) → three ranked recs appear (20s) → open Evidence Passport, point at the fact/inference split (30s) → click scaffold, watch smoke test go green (40s) → open generated README/adoption report (15s) → `/build-proof`: custom modes, skill, exported sessions, Bob commits (≤ 45s) → closing line.

**Core flow checklist:**

- [ ] Open web app
- [ ] Enter Discord-bot idea
- [ ] Show three recommendations
- [ ] Open Evidence Passport
- [ ] Show fact vs inference split
- [ ] Click scaffold
- [ ] Show generated files
- [ ] Run smoke test (green)
- [ ] Open generated README / adoption report

**Bob proof checklist:**

- [ ] Open `/build-proof` (or local build report)
- [ ] Show `.bob/custom_modes.yaml`
- [ ] Show `.bob/skills/oss-preflight-advisor/SKILL.md`
- [ ] Show official exported task histories + consumption screenshots in `bob_sessions/`
- [ ] Show Bob-generated commit messages

**Fallbacks (prepared in advance):**

- [ ] Cached evidence pre-warmed for the exact demo packages
- [ ] Scaffold already generated in `examples/discord-summary-bot/`
- [ ] Smoke test output saved
- [ ] 30-second Bob skill activation clip recorded
- [ ] Full backup demo video recorded by Hour 38

> Spend **≤ 45 seconds** on Bob evidence in the live demo. The report exists for judges to inspect afterward.

---

## 9. Risk register

| Risk | Impact | Mitigation | Status |
|---|---|---|---|
| Bob session export format unclear | High | Test in Hour 0; document exact format in `bob_sessions/build-report.md` | [RESOLVED] S00 includes `task-history.md` and `consumption-summary.png`; build-report records the export procedure. |
| Official `bob_sessions/` deliverable missing | High | Export every relevant Bob task directly into `bob_sessions/S<id>-<slug>/` with task-history markdown + consumption-summary screenshot | [MITIGATED] Session folders exist and the remaining S06/S07 export gaps are explicit P7 blockers in `docs/submission-readiness.md`; no placeholder evidence is accepted. |
| Bob skill activation fails live | Medium | Skill file is itself the artifact; demo standalone + show intended workflow + recorded clip | [MITIGATED] `.bob/skills/oss-preflight-advisor/SKILL.md` has explicit keyword triggers; S07 task history documents the activation protocol; live clip remains optional. |
| Live APIs fail during demo | Medium | Pre-warm + commit cache; label cached facts honestly | [MITIGATED] CLI falls back from Claude errors to keyword parsing; npm collection falls back to deterministic demo metadata; collectors have cache-fallback tests. |
| Scaffold smoke test fails live | High | Mocked Discord messages; keep known-good generated scaffold committed | [RESOLVED] Generated scaffold smoke test passed in P7; template and committed example now include embedded mock-message fallback data. |
| Recommendation looks arbitrary | High | Show scoring weights + fact/inference split in UI | [RESOLVED] `ScoreBar`, `EvidencePassport`, and scorer tests expose subscores, fact/inference split, and deterministic ranking. |
| Scope creep | High | Cut Hugging Face, MCP, multi-template, repo audit first; enforce gates | [MITIGATED] P7 changes stayed inside demo hardening, docs, tests, packaging, and submission evidence; no new templates or live repo audit were added. |
| Scorer non-determinism | High | Determinism snapshot test written before scorer logic | [RESOLVED] `packages/core/__tests__/determinism.test.ts` is part of the green root suite. |
| Plan has build gaps / not reproducible | High | Plan Council (S01.5): 5 adversarial teams gate at ≥9/10, zero blockers, before any phase builds; failed rounds trigger scoped plan revisions and re-council until measurable refinements produce a real PASS or progress stalls | [RESOLVED] S01.5 includes two Plan Council rounds with final PASS artifacts in `bob_sessions/S01.5-plan-council/`. |
| Skill won't activate outside Advanced mode | Medium | Verified constraint — demo skill in Advanced mode; see [bob-build-guide.md](./bob-build-guide.md) | [ACCEPTED] Advanced mode is the documented skill runtime; S07 evidence uses that constraint rather than requiring custom-mode skill activation. |

---

## 10. Final submission checklist

- [x] Public GitHub repo, MIT licence
- [ ] Working prototype usable online (local fallback documented in `README.md`; public URL still absent)
- [ ] Video presentation
- [x] Pitch deck exists at `docs/oss-preflight-submission-deck.pdf`
- [x] Official Bob export/report included
- [ ] Root `bob_sessions/` folder exists with all relevant task-history markdown files (S06 task history still missing)
- [ ] Root `bob_sessions/` folder includes task-session consumption-summary screenshots (S06 and S07 screenshots still missing)
- [x] `bob_sessions/build-report.md` complete with a row for every required session
- [x] ≥ 3 exported sessions: planning, implementation, review
- [x] Runtime skill activation evidence (if skill demo used)
- [x] Custom modes + skills committed
- [x] Secret scan completed (no tokens/keys in exports or `.env`)
- [x] `docs/source-ledger.md` complete for every public data source used
- [x] README links to `bob_sessions/build-report.md`
- [ ] Demo video shows Bob evidence

---

## 11. Phase P9 production-readiness hardening

P9 is the post-submission hardening phase that turns the hackathon prototype
into a cloneable, production-useful workflow. The execution contract is
[`phase-plan-P9-production-readiness.md`](./phase-plan-P9-production-readiness.md).

**Goal:** raise agentic workflow maturity, demo reliability, arbitrary-project
usefulness, and hackathon evidence alignment to at least 9/10 using executable
evidence.

**Must prove:**

- `recommend --json --save` can feed `scaffold --recommendation` without manual JSON editing.
- `run --idea` completes the idea-to-scaffold workflow with a smoke test and workflow report.
- `audit --repo` works for both npm and Python fixture projects.
- Evidence Passports show truthful retrieval source labels: `live`, `cache`, `cache-fallback`, `fixture`, or `not-available`.
- Bob's runtime skill activates and runs or presents the exact production CLI workflow.
- `pnpm validate:production` is the single command for the full production-readiness gate.

**Bob launch:**

```text
/orchestrator Run Phase 9 from docs/phase-plan-P9-production-readiness.md as a single Bob session.
Honor every acceptance criterion as binding. Do not implement hardcoded demo-only shortcuts.
Run the full must-test list on the first pass. Any fixture or fallback must be labeled as fixture/fallback in output and UI.
When all quality gates are green, delegate the build-report.md row to reviewer, export S09 evidence, then stop for human approval before commit.
Never commit autonomously.
```

---

## 12. Post-hackathon roadmap

**High:** more templates (FastAPI, SvelteKit, Rails) · Hugging Face collector · full repo-audit flow · GitHub Action for dependency auditing.
**Medium:** MCP server wrapper · advanced repo similarity search · monorepo support.
**Low / will not ship:** cryptographic signatures · public trust ledger · cross-language canonicalisation.

---

## 13. Immediate next actions

1. Open this repo in IBM Bob.
2. Run the Hour-0 readiness gate (§3); export S00 from Bob IDE History; record the export format, screenshot path, and markdown path in `bob_sessions/build-report.md`.
3. Run the **phase-plan generator** ([bob-prompts.md](./bob-prompts.md) §3) in Plan mode → review/approve `docs/phase-plan.md`.
4. Run the **Plan Council** ([bob-prompts.md](./bob-prompts.md) §5a) → drive it to `## Council Verdict = PASS` (≥9/10, zero blockers).
5. Launch **P1** with the one-line `/orchestrator` launcher ([bob-prompts.md](./bob-prompts.md) §5) — schemas + tests, **not** UI polish.
