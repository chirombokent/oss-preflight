**User:**

<task>
Summarize this repo in five bullets and create docs/hour0-bob-export-test.md (≤10 lines). Touch no other file.
</task>
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:32:33.112Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.00

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>


# Current Workspace Directory (c:/Users/Computer/Documents/Dreamverse Holdings/Main Projects/oss-preflight) Files
.gitignore
LICENSE
README.md
.bob/
bob_sessions/
bob_sessions/build-report.md
bob_sessions/README.md
context/
context/COMPONENT_GUIDE.md
context/ui-reference/
context/ui-reference/app.jsx
context/ui-reference/colors_and_type.css
context/ui-reference/components.jsx
context/ui-reference/DESIGN_SYSTEM.md
context/ui-reference/ledger.html
context/ui-reference/oss-preflight-design-tokens.css
context/ui-reference/pages-main.jsx
context/ui-reference/pages-secondary.jsx
context/ui-reference/styles.css
context/ui-reference/tweaks-panel.jsx
context/ui-reference/vouchers.js
context/ui-reference/fonts/
context/ui-reference/fonts/JetBrainsMono-Italic-VariableFont.ttf
context/ui-reference/fonts/JetBrainsMono-VariableFont.ttf
context/ui-reference/fonts/Satoshi-Medium.woff
context/ui-reference/fonts/Satoshi-Medium.woff2
docs/
docs/AGENTS.md
docs/architecture.md
docs/bob-build-guide.md
docs/bob-prompts.md
docs/implementation-plan.md
docs/Lablab-IBM-Bob-hackathon-guide-May-2026.pdf
docs/source-ledger.md
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll analyze the repository structure and documentation to create a concise summary, then create the requested file.

<read_file>
<args>
  <file>
    <path>README.md</path>
  </file>
  <file>
    <path>docs/architecture.md</path>
  </file>
  <file>
    <path>docs/implementation-plan.md</path>
    <line_range>1-100</line_range>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'README.md', 'docs/architecture.md', 'docs/implementation-plan.md'] Result:
<files>
<file><path>README.md</path>
<content lines="1-27">
 1 | # OSS Preflight
 2 | 
 3 | OSS Preflight helps a developer turn an app idea into an evidence-backed open
 4 | source starting point: ranked package recommendations, an Evidence Passport,
 5 | and a scaffolded starter with a smoke test.
 6 | 
 7 | This repository is being built for the IBM Bob Hackathon. Bob is used as the
 8 | visible SDLC partner through project modes, rules, skills, checkpoints,
 9 | session exports, and build-report evidence.
10 | 
11 | ## Project Docs
12 | 
13 | - [Architecture](docs/architecture.md)
14 | - [Implementation plan](docs/implementation-plan.md)
15 | - [IBM Bob build guide](docs/bob-build-guide.md)
16 | - [Bob prompts](docs/bob-prompts.md)
17 | - [Source ledger](docs/source-ledger.md)
18 | 
19 | ## Bob Evidence
20 | 
21 | - Single evidence ledger: [bob_sessions/build-report.md](bob_sessions/build-report.md)
22 | - Official hackathon export folder (per-session subfolders): [bob_sessions/](bob_sessions/)
23 | 
24 | ## Status
25 | 
26 | Planning and Bob evidence scaffolding are in progress. The build follows the
27 | phase gates in `docs/implementation-plan.md`.
</content>
</file>
<file><path>docs/architecture.md</path>
<content lines="1-366">
  1 | # OSS Preflight — Architecture (Source of Truth)
  2 | 
  3 | > **This is the single source of truth for what OSS Preflight is and how it is designed.**
  4 | > Build sequencing lives in [implementation-plan.md](./implementation-plan.md).
  5 | > How we use IBM Bob to build it lives in [bob-build-guide.md](./bob-build-guide.md).
  6 | 
  7 | | | |
  8 | |---|---|
  9 | | **Event** | IBM Bob Hackathon (lablab.ai) |
 10 | | **Window** | 15 May 2026 17:00 SAST → 17 May 2026 17:00 SAST (48h) |
 11 | | **Builder** | Solo, with IBM Bob as the SDLC partner |
 12 | | **License** | MIT (hackathon requirement) |
 13 | | **Version** | 2.0 — consolidated |
 14 | 
 15 | ---
 16 | 
 17 | ## 1. One sentence
 18 | 
 19 | **You have an idea. OSS Preflight (Open Source Software Preflight) uses IBM Bob and live open-source evidence to hand you the right stack — recommendations, tradeoffs, and a working starter — before you lose the energy to build it.**
 20 | 
 21 | Closing line for the pitch:
 22 | 
 23 | > We built OSS Preflight in 48 hours with Bob. And we shipped OSS Preflight *as* a Bob skill, so you can run the same workflow inside your own repo.
 24 | 
 25 | ---
 26 | 
 27 | ## 2. Problem
 28 | 
 29 | AI made code generation cheap. It did **not** make dependency and architecture decisions cheap. Developers lose momentum in the gap between *"I have an idea"*, *"I know what to build with"*, and *"I have a working starter"*.
 30 | 
 31 | The pain has three parts:
 32 | 
 33 | - **Option overload** — npm, PyPI, GitHub, Hugging Face, and OSS starters create more choices than anyone can vet by hand.
 34 | - **Fork-first blind spot** — many ideas are already partly built in open source, but finding the right starter is its own research task.
 35 | - **Trust gap** — before adding a dependency you need evidence on maintenance, license, compatibility, and safety.
 36 | 
 37 | OSS Preflight closes that gap **at the moment of decision**.
 38 | 
 39 | ---
 40 | 
 41 | ## 3. Product — three flows
 42 | 
 43 | ### 3.1 Idea Flow (primary demo)
 44 | 
 45 | Developer enters a rough idea:
 46 | 
 47 | > I want to build a Discord bot that summarises the last 24 hours of channel activity.
 48 | 
 49 | OSS Preflight converts the idea into a structured intent, discovers candidates across OSS sources, gathers evidence, ranks options, and returns **three recommendations**. The developer picks one; OSS Preflight scaffolds a working starter with a README, smoke test, and adoption report.
 50 | 
 51 | ### 3.2 Repo Flow
 52 | 
 53 | Developer points OSS Preflight at a GitHub URL or local repo. OSS Preflight detects the stack, runs Evidence Passports over dependencies, flags risks, and surfaces safer or better-fit alternatives.
 54 | 
 55 | ### 3.3 Bob-Native Flow
 56 | 
 57 | Developer opens IBM Bob and asks *"Run OSS Preflight on this idea."* The `oss-preflight-advisor` skill activates, reads repo context, invokes the OSS Preflight CLI, presents recommendations, and uses a sandboxed custom mode for approved scaffold writes.
 58 | 
 59 | ---
 60 | 
 61 | ## 4. What OSS Preflight is **not**
 62 | 
 63 | Not a guarantee. Not a replacement for engineering judgment. Not a cryptographic proof system. Not a public ledger. Not a trust graph. Not an LLM-only recommender.
 64 | 
 65 | OSS Preflight gives **evidence-backed confidence, not certainty.**
 66 | 
 67 | ---
 68 | 
 69 | ## 5. The core innovation: the fact/inference split
 70 | 
 71 | Every recommendation carries an **Evidence Passport** with two visibly separated columns:
 72 | 
 73 | | Facts (sourced) | Interpretation (AI-derived) |
 74 | |---|---|
 75 | | source URL | goal-fit summary |
 76 | | registry metadata | compatibility narrative |
 77 | | license | tradeoffs |
 78 | | latest version | warnings |
 79 | | last commit | scaffold availability |
 80 | | downloads / stars | |
 81 | | OpenSSF score (where available) | |
 82 | | fetch timestamp | |
 83 | 
 84 | A judge sees at a glance what is a measured fact and what is OSS Preflight's assessment. This split is enforced in the data model, the scoring engine, and the UI — not just by convention.
 85 | 
 86 | ---
 87 | 
 88 | ## 6. System architecture
 89 | 
 90 | ```mermaid
 91 | graph TB
 92 |     Dev["Developer"]
 93 |     UI["Web UI (React/Vite)"]
 94 |     CLI["OSS Preflight CLI (Node)"]
 95 |     Bob["IBM Bob"]
 96 |     Skill["oss-preflight-advisor skill"]
 97 |     Modes["Bob custom modes"]
 98 |     Core["Core Engine — packages/core"]
 99 |     Context["Repo Analyser — packages/repo-analyser"]
100 |     Discovery["Discovery Service"]
101 |     Evidence["Collectors — packages/collectors"]
102 |     Ranker["Deterministic Scorer + Ranker"]
103 |     Scaffold["Scaffold Engine — packages/scaffold"]
104 |     Cache["Local Evidence Cache (.oss-preflight/cache)"]
105 |     Proof["Build-Proof Page"]
106 | 
107 |     Dev --> UI
108 |     Dev --> Bob
109 |     UI --> Core
110 |     CLI --> Core
111 |     Bob --> Skill
112 |     Skill --> CLI
113 |     Skill --> Modes
114 |     Core --> Context
115 |     Core --> Discovery
116 |     Discovery --> Evidence
117 |     Evidence --> Cache
118 |     Core --> Ranker
119 |     Ranker --> UI
120 |     Ranker --> CLI
121 |     Ranker --> Scaffold
122 |     UI --> Proof
123 | ```
124 | 
125 | **System context (external):** the only outbound calls are to public registries — npm registry, GitHub REST API, PyPI JSON API, OpenSSF Scorecard — plus the Anthropic Claude API for intent parsing and tradeoff narration. No package is installed or executed; only metadata is fetched.
126 | 
127 | ---
128 | 
129 | ## 7. Repository structure
130 | 
131 | ```text
132 | oss-preflight/
133 |   apps/web/                     # React/Vite UI + Express bridge
134 |   packages/
135 |     core/                       # decision engine, pure logic, no I/O
136 |     collectors/                 # live API calls — single source of facts
137 |     repo-analyser/              # detect stack from an existing repo
138 |     scaffold/                   # template engine + smoke runner
139 |     cli/                        # terminal interface (Bob + CI target)
140 |   examples/discord-summary-bot/ # known-good generated scaffold (demo fallback)
141 |   .bob/                         # Bob configuration (committed, see bob-build-guide.md)
142 |     custom_modes.yaml           # overrides plan/code/orchestrator + reviewer/scaffolder
143 |     rules/                      # always-on discipline (all modes, every conversation)
144 |     rules-plan/  rules-code/  rules-reviewer/  rules-orchestrator/
145 |     skills/{oss-preflight-advisor,evidence-discipline,code-review,test-runner,doc-writer,plan-council}/SKILL.md
146 |   bob_sessions/                 # official Bob deliverable folder (single location)
147 |     build-report.md             # living submission ledger (single summary)
148 |     S00-hour0-export-test/      # per-session: task-history.md + consumption-summary.png
149 |   docs/
150 |     architecture.md             # THIS FILE — source of truth
151 |     implementation-plan.md      # build sequence, pro tips, risks, demo, submission
152 |     bob-build-guide.md          # how we use IBM Bob (verified)
153 |     bob-prompts.md              # supercharged Bob prompts + uncommon pro tips
154 | ```
155 | 
156 | ---
157 | 
158 | ## 8. Core engine — five stages
159 | 
160 | The engine in `packages/core/` is **pure logic, no I/O**. It runs five stages:
161 | 
162 | 1. **Intent extraction** — convert the raw idea string into an `IdeaBrief`. Uses the Claude API (Haiku, low temperature). Every inferred field is tagged `@source: 'inferred'`.
163 | 2. **Candidate discovery** — find packages, frameworks, SDKs, components, and starter repos.
164 | 3. **Evidence gathering** — fetch registry, GitHub, OpenSSF, and optional model metadata via collectors.
165 | 4. **Ranking** — score candidates against intent and constraints using a deterministic function.
166 | 5. **Recommendation output** — produce ranked options and write `.oss-preflight/recommendations/latest.json`.
167 | 
168 | ---
169 | 
170 | ## 9. Data model
171 | 
172 | Defined in `packages/core/src/types.ts` with JSDoc `@source` tags (`fact` | `inferred`). Validated with `zod`.
173 | 
174 | - **`IdeaBrief`** — parsed user intent: `capabilities` (inferred), `domain` (inferred), `targetUser` (inferred), `ecosystem` (inferred), `constraints` (user-provided).
175 | - **`Candidate`** — a package found in a registry: `name`, `version`, `ecosystem` (`npm` | `pypi` | `github`), `homepageUrl`, `repositoryUrl`.
176 | - **`EvidencePassport`** — `facts` (all sourced, see §5) + `interpretation` (AI-derived).
177 | - **`Recommendation`** — final ranked output: `rank`, `score`, `candidate`, `subscores` (6 dimensions), `passport`, `scaffoldAvailable`, `templateId`.
178 | 
179 | Serialization rules: missing passport fields are emitted as explicit `null`, never omitted. The serializer rejects incomplete evidence rather than hiding it.
180 | 
181 | ---
182 | 
183 | ## 10. Scoring model
184 | 
185 | Six dimensions, transparent weights, every subscore independently computable and 0–100. Weights are visible in the UI and user-overridable.
186 | 
187 | | Dimension | Weight | Source |
188 | |---|---:|---|
189 | | Goal fit | 30% | inference |
190 | | Repo compatibility | 25% | fact (stack detector) |
191 | | Maintenance health | 15% | fact (GitHub commits/releases) |
192 | | Safety signals | 15% | fact (OpenSSF + license check) |
193 | | Community signal | 10% | fact (downloads + stars) |
194 | | Docs & starter quality | 5% | mixed |
195 | 
196 | The **"underrated pick"** is a *badge, not a hidden weight*. It applies when a candidate has strong fit but lower social signal.
197 | 
198 | **Hard rule:** no fact is asserted without a collector source. If evidence for a dimension is missing, the candidate is still scored, the subscore is marked *incomplete*, and the UI shows the gap.
199 | 
200 | ---
201 | 
202 | ## 11. Collectors and cache strategy
203 | 
204 | Collectors in `packages/collectors/` are the **single source of truth for facts**. Every external response is cached in `.oss-preflight/cache/{ecosystem}/{id}.json` with `data`, `collectedAt` (ISO-8601), and `source: 'live' | 'cache'`.
205 | 
206 | | Collector | Endpoint | Cache TTL | Notes |
207 | |---|---|---:|---|
208 | | npm | `registry.npmjs.org/{name}/latest` | 6h | 404 → `PackageNotFoundError`, never fake data |
209 | | GitHub | REST `/repos/{owner}/{repo}` (+ contributors) | 2h | rate-limited → cached + `source: 'cache-fallback'` |
210 | | PyPI | `pypi.org/pypi/{name}/json` | 6h | should-ship |
211 | | OpenSSF | Scorecard API | 24h | missing → `null`, not a failure |
212 | 
213 | The UI labels every fact as **live** or **cached** (and `(rate-limited)` / `(not available)` where relevant). `--refresh` (CLI) and a per-card Refresh button force live calls.
214 | 
215 | ---
216 | 
217 | ## 12. Hallucination controls
218 | 
219 | - LLMs **may** infer intent and explain tradeoffs.
220 | - LLMs **may not** assert package facts.
221 | - Candidate names must resolve in a registry or on GitHub.
222 | - Missing evidence must be shown explicitly ("no data" / "not available", never silence).
223 | - Smoke tests must report pass/fail truthfully.
224 | - Banned words in any user-facing copy: "guaranteed", "perfect", "proves best".
225 | 
226 | These are enforced by the `evidence-discipline` Bob skill during the build (see [bob-build-guide.md](./bob-build-guide.md)).
227 | 
228 | ---
229 | 
230 | ## 13. API contracts
231 | 
232 | ### 13.1 CLI — `oss-preflight recommend --idea "..." --json`
233 | 
234 | ```json
235 | {
236 |   "recommendations": [
237 |     {
238 |       "rank": 1,
239 |       "score": 87.5,
240 |       "candidate": {
241 |         "name": "discord.js",
242 |         "version": "14.11.0",
243 |         "ecosystem": "npm",
244 |         "homepageUrl": "https://discord.js.org",
245 |         "repositoryUrl": "https://github.com/discordjs/discord.js"
246 |       },
247 |       "subscores": {
248 |         "goalFit": 95, "repoCompat": 85, "maintenance": 85,
249 |         "safety": 80, "community": 95, "docsQuality": 80
250 |       },
251 |       "passport": {
252 |         "facts": {
253 |           "license":         { "value": "Apache-2.0", "source": "https://...", "collectedAt": "2026-05-15T10:30:00Z", "sourceType": "npm" },
254 |           "weeklyDownloads": { "value": 1200000,      "source": "https://...", "collectedAt": "2026-05-15T10:30:00Z", "sourceType": "npm" },
255 |           "lastCommit":      { "value": "2026-05-14T15:22:00Z", "source": "https://...", "sourceType": "github" },
256 |           "stars":           { "value": 27500,        "source": "https://...", "sourceType": "github" }
257 |         },
258 |         "interpretation": {
259 |           "goalFit": "Excellent match for Discord bot development; de-facto standard.",
260 |           "compatibility": "Works in TypeScript or JavaScript. Strong ES2020+ support.",
261 |           "tradeoffs": [
262 |             "Largest download footprint of the three; consider discord.py for a lighter bundle.",
263 |             "TypeScript-first; plain JS needs transpilation for production."
264 |           ],
265 |           "warnings": [],
266 |           "recommendedAlongside": ["typescript", "dotenv"]
267 |         }
268 |       },
269 |       "scaffoldAvailable": true,
270 |       "templateId": "discord-summary-bot"
271 |     }
272 |   ],
273 |   "ideas_parsed": {
274 |     "capabilities": ["message processing", "scheduled summarization"],
275 |     "domain": "discord community management",
276 |     "targetUser": "solo developer",
277 |     "ecosystem": "javascript/typescript"
278 |   }
279 | }
280 | ```
281 | 
282 | **Contract guarantees:** every `facts` field has `source` (URL or `"inferred"`), `collectedAt` (ISO-8601), and `sourceType` (`npm|github|openssf|inferred`). Every subscore is 0–100. `tradeoffs` is a string array. `warnings` is populated only when something is concerning.
283 | 
284 | `oss-preflight scaffold --recommendation <json> --out <dir>` loads a recommendation, generates the starter, runs the smoke test, prints the adoption report, and exits `0` (pass) or `1` (smoke fail).
285 | 
286 | ### 13.2 Web API (Express bridge in `apps/web/server.ts`)
287 | 
288 | - `POST /api/recommend` → spawns `oss-preflight recommend --json`, parses stdout, returns `{ recommendations, error? }`.
289 | - `POST /api/scaffold` → runs the scaffold engine, returns `{ files, passed, output }`.
290 | 
291 | The web server is a thin bridge — all logic lives in the CLI/core so the Bob skill and CI hit the same path.
292 | 
293 | ---
294 | 
295 | ## 14. Error handling
296 | 
297 | | Situation | Behaviour | UI label |
298 | |---|---|---|
299 | | Live API fails, cache exists | return cached | `(cached, rate-limited)` |
300 | | Package not found | throw, skip candidate (never fake) | candidate omitted |
301 | | Missing signal (e.g. no OpenSSF) | `null` in that field | `(not available)` |
302 | | Scorer has incomplete data | score anyway, mark dimension incomplete | gap shown on score bar |
303 | | Smoke test fails | adoption report states failure; exit 1 | red smoke status |
304 | 
305 | **CLI exit codes:** `0` success · `1` collector/API error · `2` user-input error · `3` config error (no `ANTHROPIC_API_KEY`).
306 | 
307 | ---
308 | 
309 | ## 15. Security and privacy
310 | 
311 | - No user data logged or persisted beyond the session.
312 | - API keys (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`) read from env, never logged.
313 | - Cache files are local-only, never uploaded.
314 | - Collector sources are public registries; no package is installed or executed — metadata only.
315 | - Scaffold templates are read-only; generated output is plaintext.
316 | 
317 | ---
318 | 
319 | ## 16. Deployment model
320 | 
321 | | Path | Command |
322 | |---|---|
323 | | Standalone CLI | `npm i -g oss-preflight` → `oss-preflight recommend --idea "..."` |
324 | | Web UI | `npm install && npm run build && npm run start:web` → `http://localhost:3000` |
325 | | Bob IDE (runtime) | Open Bob → "Run OSS Preflight on this idea" → `oss-preflight-advisor` skill activates |
326 | | CI/CD (future) | GitHub Action runs `oss-preflight scaffold --validate-deps` on PR |
327 | 
328 | > **Toolchain note (intentional, not a contradiction):** the **monorepo
329 | > itself is built and tested with pnpm** (`pnpm-workspace.yaml`, `pnpm test`
330 | > in the phase exit gates). The **generated end-user scaffolds use plain
331 | > `npm`** (`npm install`, `npm test` in the smoke runner) so a developer
332 | > adopting a starter inherits no workspace assumptions. Both are correct for
333 | > their layer — never "normalize" one to the other.
334 | 
335 | ---
336 | 
337 | ## 17. Wow moments & judge success criteria
338 | 
339 | **Wow moments:** (1) idea → three ranked options with Evidence Passports; (2) one click → working scaffold + green smoke test; (3) Bob build receipts — exported sessions, custom modes, skills, rules, build report, Bob-assisted commits.
340 | 
341 | **Judges should be able to verify:**
342 | 
343 | 1. The recommendation feels right — discord.js surfaces as top pick, reasoning is transparent.
344 | 2. No hallucination — every fact is sourced; every inference is labeled.
345 | 3. The demo works live — no hidden pre-recording except the documented fallback.
346 | 4. Bob is visible — sessions exported, build report in repo, modes/skills/rules committed.
347 | 5. The UI is clear — fact/inference split obvious at a glance.
348 | 6. The scaffold works — generated code runs the smoke test green.
349 | 
350 | ---
351 | 
352 | ## 18. Scope cutline
353 | 
354 | **Must ship:** idea→recommendation JSON · Evidence Passport with fact/inference split · ranked top-3 · npm + GitHub collectors · cache with timestamps · Discord-bot scaffold · smoke test · web UI for the demo · `/build-proof` · Bob custom modes/skills/rules · `bob_sessions/` exports + build report · demo script.
355 | 
356 | **Should ship:** PyPI collector · OpenSSF collector · repo flow · fork-first GitHub starter search · live Bob skill demo · Bob-generated PR description.
357 | 
358 | **Does not ship:** Hugging Face collector · MCP server · Bobalytics integration · multiple scaffold templates · live judge-repo audit · vouchers · signing · ledger · trust graph · marketplace · auth · billing.
359 | 
360 | Decision gates (full timeline in [implementation-plan.md](./implementation-plan.md)): **Hour 14** CLI must work or drop UI · **Hour 24** UI must work or drop repo flow · **Hour 38** three clean demo runs or record backup.
361 | 
362 | ---
363 | 
364 | ## 19. Final principle
365 | 
366 | > Bob is not a logo in the pitch. Bob is the visible SDLC partner that made this project possible in 48 hours, and the workflow-packaging layer that makes it useful to every developer who installs it.
</content>
</file>
<file><path>docs/implementation-plan.md</path>
<content lines="1-100">
  1 | # OSS Preflight — Implementation Plan
  2 | 
  3 | > **The build playbook.** Sequential, gated, and opinionated. Read [architecture.md](./architecture.md) first for *what* and *why*; this doc is *how* and *in what order*.
  4 | > Bob-specific build mechanics live in [bob-build-guide.md](./bob-build-guide.md); the exact prompts in [bob-prompts.md](./bob-prompts.md).
  5 | 
  6 | ---
  7 | 
  8 | ## 1. Feasibility verdict
  9 | 
 10 | **Feasible** as a 48-hour solo build *if scope is held to the cutline*.
 11 | 
 12 | The strongest feasible version:
 13 | 
 14 | - Web UI: idea input, ranked recommendations, Evidence Passport detail, scaffold trigger, `/build-proof`.
 15 | - CLI: `oss-preflight recommend` and `oss-preflight scaffold`.
 16 | - Real npm + GitHub collectors with a transparent cache.
 17 | - Fixture-backed PyPI/OpenSSF if time allows.
 18 | - TypeScript Discord-bot scaffold with mocked messages and a green smoke test.
 19 | - Bob build proof: custom modes, skills, rules, exported sessions, build report, Bob-assisted commits.
 20 | 
 21 | The **highest-risk** version puts live Bob skill demo, live repo audit, live GitHub starter search, OpenSSF, PyPI, deployed UI, and multiple scaffold templates all on the critical path. **Do not do that.**
 22 | 
 23 | ---
 24 | 
 25 | ## 2. Scope ledger
 26 | 
 27 | | Must ship | Should ship | Cut first if behind |
 28 | |---|---|---|
 29 | | `oss-preflight recommend` → recommendation JSON | PyPI collector | Hugging Face collector |
 30 | | `oss-preflight scaffold` → Discord starter | OpenSSF collector | MCP server |
 31 | | npm collector | Repo URL/local-path flow | Bobalytics |
 32 | | GitHub collector | GitHub starter-repo search | Multiple scaffold templates |
 33 | | Cache with timestamps | Live Bob runtime skill demo | Live judge-repo audit |
 34 | | Evidence Passport (fact/inference split) | Bob-generated PR description | Advanced starter similarity scoring |
 35 | | Web UI for the main demo | | |
 36 | | `/build-proof` page (or local equivalent) | | |
 37 | | Bob custom modes / skills / sessions / report | | |
 38 | | Smoke test for the generated scaffold | | |
 39 | 
 40 | **Cutline philosophy:** every "should" must degrade to a fixture or a static artifact, never to a broken demo. A cut feature that still has a screenshot or a pre-warmed cache is a win; a half-working live feature is a loss.
 41 | 
 42 | **Hackathon-guide deltas to close early:**
 43 | 
 44 | - Official Bob reports live in `bob_sessions/` and include **both** task-history markdown and task-session consumption screenshots. `bob_sessions/build-report.md` is the single summary ledger.
 45 | - Keep a public-data/source ledger at `docs/source-ledger.md`: registry/API source, data used, URL, terms/commercial-use verification status, and whether it is live, cached, or fixture data.
 46 | - Treat Bobcoins as a finite build budget. The guide grants 40 Bobcoins; use one context/task per session ID, use Enhance Prompt before expensive sessions, avoid re-running the Plan Council unless needed, and record consumption screenshots as part of the export.
 47 | - IBM Bob IDE must be a core component. Optional watsonx.ai / watsonx Orchestrate can strengthen the IBM story, but they are not on the critical path and must not consume the demo budget unless already green.
 48 | - If watsonx.ai is used, avoid out-of-scope models named in the hackathon guide and save/export watsonx work before the hackathon account is deactivated.
 49 | 
 50 | ---
 51 | 
 52 | ## 3. Hour-0 readiness gate (do this before any code)
 53 | 
 54 | Ten concrete checks, in order. Each has an exact action, a pass criterion, and a fallback if it fails. Do not start P1 until rows 1–9 pass (row 10 is optional). Mechanics and the override model are in [bob-build-guide.md](./bob-build-guide.md) §4–§6.
 55 | 
 56 | | # | Check | Exact action | Pass criterion | If it fails |
 57 | |---|---|---|---|---|
 58 | | 1 | Bob opens the repo | Open the repo root in IBM Bob (the actual local checkout path — note it contains **spaces**, so always quote it in any CLI/spawn later) | Repo tree + chat load | Reinstall/relogin Bob; stop until fixed |
 59 | | 2 | **Session export works** | Run S00 prompt, then use Bob IDE **Views and More Actions → History → select task → task header → screenshot consumption summary → Export task history** | Task-history markdown + task-session consumption-summary screenshot exist in `bob_sessions/S00-hour0-export-test/`; you can name the UI path, format, and whether it includes tool calls/diffs | This blocks everything — resolve before any build; record findings |
 60 | | 3 | Overrides load **and the whole file parses with `skill` present** | Open mode dropdown | All five appear: `📝 Plan`, `💻 Code`, `🔀 Orchestrator` (our descriptions, not stock), `reviewer`, `oss-preflight-scaffolder`. If *any* are missing, `custom_modes.yaml` failed to parse — likely the `skill` group on `reviewer` is unsupported by this Bob build | Slugs must match defaults exactly (`plan`/`code`/`orchestrator`). If parse failed: see row 6 fallback (remove `skill` from `reviewer`) and reload |
 61 | | 4 | Always-on rules inject | In `/code`, ask "what are your rules?" | Bob recites evidence/engineering/scope/claims from `.bob/rules/` | Confirm `.bob/rules/` files are committed and non-empty |
 62 | | 5 | `fileRegex` fence holds | In overridden `plan`, ask Bob to edit `packages/core/x.ts` | Bob is **blocked** (plan = markdown only) | Fence misconfigured — fix regex (unquoted single-backslash) |
 63 | | 6 | Skill activates + `skill`-group fallback ready | In **Advanced**, trigger `oss-preflight-advisor`; separately confirm row 3 showed all five modes | Skill activates in the guaranteed Advanced runtime; `reviewer` also declares the official `skill` group where the build supports it | **If `custom_modes.yaml` failed to parse (row 3) or `reviewer` rejects `skill`:** edit `.bob/custom_modes.yaml`, delete the `- skill` line under `reviewer`'s `groups`, reload Bob, confirm all five modes load. Then the loop's REVIEW recipe runs in **Advanced** instead of `reviewer` (the always-on rules floor still applies in `reviewer`). Record the decision in `bob_sessions/build-report.md` → Export Notes |
 64 | | 7 | Bob commit message | Stage a file, click the sparkle icon | A conventional-commit message generates | Note as manual-commit fallback in build report |
 65 | | 8 | Checkpoints | Start a task, watch for the checkpoint marker; test "Restore Files & Task" | Checkpoint appears at task start/before edits; restore works | Lean on git commits as the safety net instead |
 66 | | 9 | Secret guard | Confirm `.env` is ignored by git and excluded from Bob context; run the secret scan before committing exports | `.gitignore` and `.bobignore` exist; scan finds no committed/exported secrets | Stop and sanitize before making the repo public |
 67 | | 10 | Bob Shell *(optional)* | Check if Bob Shell is available | Known either way | Not required — proceed |
 68 | 
 69 | After the gate: write the **export format, UI path, screenshot path, markdown path, and whether exports include tool calls/diffs** into `bob_sessions/build-report.md` → *Export Notes*, then commit `.bob/` first (before any app code).
 70 | 
 71 | > **Pro tip:** Hour-0 is not setup overhead — it is the single highest-leverage hour. A misunderstood export format discovered at Hour 44 is unrecoverable. Discovered at Hour 0, it is a five-minute fix. Row 2 is the one that can sink the submission — clear it first.
 72 | 
 73 | ---
 74 | 
 75 | ## 4. The 48-hour timeline
 76 | 
 77 | | Hours | Phase | Key output | Exit gate |
 78 | |---|---|---|---|
 79 | | 0–1 | **P0** Bob proof + Hour-0 tests | `.bob/*`, `bob_sessions/build-report.md`, export verified | Export format documented |
 80 | | 1–2 | **P0** Generate phase-plan (S01) + **Plan Council gate** (S01.5) | `docs/phase-plan.md` + `## Council Verdict = PASS` | Plan approved, council ≥9/10, exported |
 81 | | 2–8 | **P1** Core schemas + scoring | `packages/core` + tests | `pnpm test` green, ranking stable |
 82 | | 8–14 | **P2** Collectors + cache | `packages/collectors` + tests | Real npm/GitHub data returned |
 83 | | 14–17 | **P3** CLI | `packages/cli` | `oss-preflight recommend` prints 3 |
 84 | | 17–22 | **P4** Scaffold engine | `packages/scaffold` + template | Smoke test green |
 85 | | 22–30 | **P5** Web UI + build-proof | `apps/web` | Full flow in browser |
 86 | | 30–37 | **Sleep** | — | **Mandatory** |
 87 | | 37–41 | **P6** Bob runtime integration | skill demo working | Skill activates, stays in bounds |
 88 | | 41–45 | **P7** Review + harden | build report, 3 clean demo runs | Reviewer finds no blocker |
 89 | | 45–48 | **Submit** | export sessions, tag `v1.0.0`, video | GitHub push + submission |
 90 | 
 91 | **Decision gates (hard):**
 92 | 
 93 | - **Hour 14** — CLI works or **drop the UI** and demo via terminal.
 94 | - **Hour 24** — UI works or **drop the repo flow**.
 95 | - **Hour 38** — three clean demo runs recorded or **record the backup video now**.
 96 | 
 97 | > **Pro tip:** the gates are commitments, not aspirations. At each gate, the question is binary and answered out loud. "Almost working" at Hour 14 means the UI is dropped. Sentimental scope-keeping is how solo hackathons fail.
 98 | 
 99 | ---
100 | 
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:33:03.507Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.03

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Based on the repository documentation, here's a five-bullet summary:

## Repository Summary

- **OSS Preflight** converts app ideas into evidence-backed open source recommendations with ranked packages, transparent Evidence Passports (fact/inference split), and working scaffolds with smoke tests
- **48-hour IBM Bob Hackathon build** demonstrating Bob as visible SDLC partner through custom modes, skills, rules, session exports, and build-report evidence
- **Core innovation**: Every recommendation separates sourced facts (registry metadata, licenses, commits, downloads) from AI interpretation (goal-fit, tradeoffs, warnings) in a two-column Evidence Passport
- **Three execution paths**: Web UI for demos, CLI for CI/CD and Bob skill integration, and native Bob skill (`oss-preflight-advisor`) for in-IDE workflow
- **Deterministic scoring** across six dimensions (goal fit 30%, repo compatibility 25%, maintenance 15%, safety 15%, community 10%, docs 5%) with transparent weights and no hallucinated package facts

Now I'll create the requested test file:

<write_to_file>
<path>docs/hour0-bob-export-test.md</path>
<content># Hour-0 Bob Export Test

This

[Response interrupted by a tool use result. Only one tool may be used at a time and should be placed at the end of the message.]

---

**User:**

[write_to_file for 'docs/hour0-bob-export-test.md'] Result:
The tool execution failed with the following error:
<error>
Tool "write_to_file" is not allowed in ask mode.
</error>
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:33:14.131Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.03

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I need to switch to Code mode to create the file, as Ask mode cannot write files.

<switch_mode>
<mode_slug>code</mode_slug>
<reason>Need to create docs/hour0-bob-export-test.md file (Ask mode cannot write files)</reason>
</switch_mode>

---

**User:**

[switch_mode to 'code' because: Need to create docs/hour0-bob-export-test.md file (Ask mode cannot write files)] Result:
Successfully switched from ❓ Ask mode to 💻 Code mode because: Need to create docs/hour0-bob-export-test.md file (Ask mode cannot write files).
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:34:14.523Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.14

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<write_to_file>
<path>docs/hour0-bob-export-test.md</path>
<content># Hour-0 Bob Export Test

This file verifies Bob session export works before the build

[Response interrupted by a tool use result. Only one tool may be used at a time and should be placed at the end of the message.]

---

**User:**

[write_to_file for 'docs/hour0-bob-export-test.md'] Result:
The tool execution failed with the following error:
<error>
Tool 'write_to_file' in mode '💻 Code' can only edit files matching pattern: ^(packages/|apps/|examples/|tests/|\.oss-preflight/).*|^(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|tsconfig(\..+)?\.json|vitest\.config\.[tj]s|turbo\.json|\.npmrc|\.nvmrc|\.gitignore|\.bobignore)$ (App code, examples, tests, OSS Preflight runtime, plus monorepo root config (package.json, pnpm-workspace.yaml, tsconfig*, vitest/turbo config). Needed so P0/P1 can bootstrap the workspace.). Got: docs/hour0-bob-export-test.md
</error>
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:34:18.210Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.14

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Code mode is restricted to app code paths. I need to switch to Plan mode to create documentation files.

<switch_mode>
<mode_slug>plan</mode_slug>
<reason>Need to create docs/hour0-bob-export-test.md (Code mode restricted to app code, Plan mode handles docs/)</reason>
</switch_mode>

---

**User:**

[switch_mode to 'plan' because: Need to create docs/hour0-bob-export-test.md (Code mode restricted to app code, Plan mode handles docs/)] Result:
Successfully switched from 💻 Code mode to 📝 Plan mode because: Need to create docs/hour0-bob-export-test.md (Code mode restricted to app code, Plan mode handles docs/).
<environment_details>
# VSCode Visible Files
.bob\skills\evidence-discipline\SKILL.md,.bob\skills\evidence-discipline\SKILL.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:34:42.701Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.23

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>plan</slug>
<name>📝 Plan</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<write_to_file>
<path>docs/hour0-bob-export-test.md</path>
<content># Hour-0 Bob Export Test

This file verifies Bob session export works before the build starts.

**Repo summary:**
- OSS Preflight: evidence-backed package recommendations with fact/inference split
- 48-hour IBM Bob Hackathon build with visible SDLC partnership
- Three surfaces: Web UI, CLI, and native Bob skill integration
- Deterministic scoring (6 dimensions) with transparent Evidence Passports
- Built with Bob custom modes, skills, rules, and exported session evidence
</content>
<line_count>10</line_count>
</write_to_file>

---

**User:**

[write_to_file for 'docs/hour0-bob-export-test.md'] Result:
<file_write_result>
<path>docs/hour0-bob-export-test.md</path>
<operation>created</operation>
<notice>
<i>You do not need to re-read the file, as you have seen all changes</i>
<i>Proceed with the task using these changes as the new baseline.</i>
</notice>
</file_write_result>

<environment_details>
# VSCode Visible Files
docs\hour0-bob-export-test.md

# VSCode Open Tabs
context/COMPONENT_GUIDE.md,docs/implementation-plan.md,docs/AGENTS.md,docs/architecture.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,docs/hour0-bob-export-test.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md,.bob/rules-reviewer/AGENTS.md,.bob/rules-orchestrator/AGENTS.md,.bob/custom_modes.yaml,.bob/rules-orchestrator/01-loop-invariants.md,.bob/rules-reviewer/01-review-floor.md,bob_sessions/README.md,docs/bob-prompts.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T17:34:58.241Z
User time zone: Africa/Johannesburg, UTC+2:00

# Current Cost
$0.30

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**
- .env
- .env.*
- node_modules/
- dist/
- build/
- coverage/
- .git/
- bob_sessions/**/*.png
- bob_sessions/**/*.jpg
- bob_sessions/**/*.jpeg

# Current Mode
<slug>plan</slug>
<name>📝 Plan</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<attempt_completion>
<result>
Created [`docs/hour0-bob-export-test.md`](docs/hour0-bob-export-test.md:1) with five-bullet repo summary (10 lines total). No other files modified.
</result>
</attempt_completion>

