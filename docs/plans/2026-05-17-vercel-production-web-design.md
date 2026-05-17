# Vercel Production Web — Design

**Date:** 2026-05-17
**Status:** Validated (brainstorming complete), ready for implementation planning

## Goal

Deploy a production-grade OSS Preflight web app to Vercel that works
generically with any input — a public GitHub URL **or** an idea prompt —
auto-detecting which, running real (non-mocked, non-cache-first) API calls,
with a session-only BYOK settings panel for the AI provider and token.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Scaffold on serverless | Generate the starter in-memory and return a downloadable `.zip`. No server-side install/execute. |
| Credential model | Session-only: provider + token kept in `sessionStorage`, sent per-request over HTTPS, never persisted server-side or logged. |
| Repo scope | Public GitHub repositories only; limitation stated explicitly in the UI; private/404 returns a friendly error. |
| Data posture | Real live API hits every request (npm, PyPI, GitHub, OpenSSF, AI provider). Cache demoted to last-resort circuit breaker, clearly labeled. |
| GitHub rate limits | Optional owner-set server-side `GITHUB_TOKEN` env var to lift to 5000/hr. App works unauthenticated without it (throttled). |
| Testing | Light: one real end-to-end smoke check (live recommend + live audit). No new mocked suites. |

## Architecture

- `apps/web` stays a Vite React SPA → Vercel static output.
- `apps/web/server.ts` (Express + `child_process.spawn`) is **removed from the
  deploy path**. Replaced by Vercel serverless functions in `apps/web/api/`.
- Functions import `@oss-preflight/core`, `@oss-preflight/collectors`, and the
  extracted recommend/audit pipeline **in-process** — no CLI spawn, no disk.
- Two endpoints:
  - `POST /api/analyze` — unified entry (auto-detect URL vs prompt).
  - `POST /api/scaffold` — returns a `.zip` of the generated starter.

### Request routing (auto-detect)

`/api/analyze` classifies the input string:

- GitHub URL (`github.com/owner/repo`, incl. `.git`/`tree` paths) **or** bare
  `owner/repo` → **audit path** (public, metadata-only).
- Otherwise → **recommend path** (idea prompt).
- Detected mode returned in the response and shown as a UI chip with a
  one-click override toggle if detection guesses wrong.

### Public-repo scoping

Before audit, one unauthenticated GitHub API call confirms the repo exists and
is public. Private/404 → `"OSS Preflight only analyzes public GitHub
repositories."` The UI states this near the input.

## Data flow & serverless port

**Filesystem decoupling.** `recommend-command.ts` / `audit-command.ts` today
mix the real pipeline with artifact writes (`workflow.json`, `REPORT.md`,
recommendations). Extract the **pure pipeline** into in-memory entry points
returning the full result object (recommendations + Evidence Passports +
workflow trace). The CLI keeps its file-writing wrapper unchanged (no CLI
behavior change). The serverless function just serializes the returned object.

**`/api/analyze` steps:**
1. Parse body `{ input, provider?, token?, model?, baseUrl?, mode? }`.
2. Classify input → `recommend` | `audit` (or honor explicit `mode`).
3. Recommend: build `AiConfigOptions` from request provider+token; fall back to
   deterministic `keywordParser` if absent (works with zero credentials). Run
   in-memory recommend pipeline.
4. Audit: validate public repo; run in-memory audit pipeline (GitHub +
   registry + OpenSSF collectors).
5. Errors → structured `{ error, mode, hint }` JSON + correct HTTP status.
   Never leak spawn/stderr/token.

**Timeouts.** `maxDuration: 60` on functions. Live recommend/audit fit
comfortably; circuit-breaker keeps worst case bounded.

## Scaffold (downloadable zip)

- Body: `{ recommendation }` carried from the analyze response (no server
  state).
- Only template-backed recommendations (Discord starter today) scaffold;
  others return the existing **adoption pack** markdown (matches CLI P9
  behavior — no invalid generated code).
- Template materialized **in memory** (files + variable substitution), no disk.
- Streamed back as `.zip` (`Content-Type: application/zip`,
  `Content-Disposition: attachment`). One small dep (`jszip`) used only here.
- Zip includes a README with the exact local `pnpm install` + smoke-test
  commands. The web app **never** displays a smoke-test "passed" it did not
  run — preserves measured-vs-asserted discipline.

## Config UI & UX

**Settings panel** (gear in top nav):
- Provider dropdown: `Keyword (no key, default)`, `Anthropic`,
  `OpenAI-compatible`, `Gemini` — surfaces existing `packages/cli/src/ai/`
  providers; no new AI code.
- Token field (`type=password`, masked); shown only for non-keyword providers.
- Optional model + base URL (for `openai-compatible`), mirroring
  `AiConfigOptions`.
- Notice: token is session-only, sent securely per request, never stored
  server-side.
- "Test connection" → lightweight validation ping; surfaces
  `isAiConfigError` clearly.
- "Clear credentials" wipes `sessionStorage` immediately.

**Main flow.** Single input: *"Paste a public GitHub URL or describe your app
idea…"*, helper *"Public GitHub repos only."* On submit: mode chip + override
toggle → live workflow-trace loading state (existing trace UI, real data) →
results rendered with existing `EvidencePassport`, `RecommendationList`,
`ScoreBar` components wired to the new endpoint.

**Graceful degradation.** No token → keyword path runs with a banner; app
usable with zero setup on first visit.

## Real-data posture

- Collectors run live every request, keyed off actual input. No fixtures, no
  cache-first.
- Cache = last-resort circuit breaker only (upstream 5xx/timeout → degraded
  real data, labeled `retrievalSource: cache`, never passed as fresh). Option
  to disable entirely and fail loud instead.
- AI intent parsing hits the real configured provider with the session token.

## GITHUB_TOKEN safety

- **Server-only:** read via `process.env.GITHUB_TOKEN` inside `apps/web/api/*`
  only. Vite bundles only `VITE_`-prefixed vars → never reaches client.
- **Never echoed:** structured error responses with a field allowlist; token
  never logged, never in any response or workflow trace.
- **Least privilege:** fine-grained PAT, public-repos read-only, zero account
  scopes (or classic token, no scopes — still 5000/hr for public data).
- **Never committed:** set only in Vercel dashboard env; `.env.local`
  gitignored for local dev; not in `vercel.json` or code.
- **Optional:** absent → unauthenticated (throttled) but functional; presence
  invisible to users.

## Migration

1. Extract in-memory pipeline entry points from `recommend-command.ts` /
   `audit-command.ts` (CLI wrapper unchanged).
2. Add `apps/web/api/{analyze,scaffold}.ts`.
3. Add `vercel.json` (functions config, `maxDuration: 60`, build settings).
4. Retire `server.ts` from deploy path (keep for local dev or use
   `vercel dev`).
5. Settings panel + unified input wiring in the SPA.

## Testing (light)

- No new mocked suites.
- One real end-to-end smoke check: live recommend on a prompt + live audit on
  a known public repo, asserting real evidence returns.
- Existing tests stay green.

## Rollout

Build locally → `vercel dev` real-call check → deploy → verify a real public
repo URL and a real prompt against the live deployment → set `GITHUB_TOKEN` in
Vercel env.

## Open / deferred

- Whether to keep the cache circuit breaker or fail loud — defaulting to
  labeled fallback; revisit if it muddies the "real hits" story.
- Non-Discord scaffold templates remain out of scope (adoption pack only).
