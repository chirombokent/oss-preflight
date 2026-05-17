# OSS Preflight

OSS Preflight helps a developer turn an app idea into an evidence-backed open
source starting point: ranked package recommendations, an Evidence Passport,
and a scaffolded starter with a smoke test.

This repository is being built for the IBM Bob Hackathon. Bob is used as the
visible SDLC partner through project modes, rules, skills, checkpoints,
session exports, and build-report evidence.

## Project Docs

- [Architecture](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [IBM Bob build guide](docs/bob-build-guide.md)
- [Bob prompts](docs/bob-prompts.md)
- [Phase P9 production readiness plan](docs/phase-plan-P9-production-readiness.md)
- [Source ledger](docs/source-ledger.md)
- [Submission deck](docs/oss-preflight-submission-deck.pdf)

## Bob Evidence

- Single evidence ledger: [bob_sessions/build-report.md](bob_sessions/build-report.md)
- Official hackathon export folder (per-session subfolders): [bob_sessions/](bob_sessions/)

## Status

Phase P7 hardening is in progress. The core demo path, build, unit tests, and
browser flow are green locally; final submission still requires the external
video, missing Bob export screenshots, and final tag after human approval.

## Local Demo

These steps are the submission fallback if no public deployment URL is
available.

1. Install dependencies:
   ```powershell
   pnpm install
   ```
   Expected: pnpm completes without dependency resolution errors.

2. Build all workspace packages:
   ```powershell
   pnpm build
   ```
   Expected: `packages/core`, `packages/collectors`, `packages/scaffold`,
   `packages/cli`, and `apps/web` report successful builds.

3. *(Optional)* Configure BYOK intent parsing for higher-quality intent extraction:
   ```powershell
   $env:OSS_PREFLIGHT_AI_PROVIDER="gemini"
   $env:GEMINI_API_KEY="your-api-key"
   ```
   Expected: no terminal output. Supported providers are `anthropic`,
   `openai-compatible`, `gemini`, and `keyword`. Provider choice, model, and
   base URL can also be placed in `.oss-preflight/config.json`; real API keys
   must stay in environment variables. If no provider is configured, OSS
   Preflight uses deterministic keyword intent parsing, so the demo runs on a
   fresh clone with no credentials. Evidence facts (npm/GitHub/OpenSSF) are
   independent of this key and are served from the committed cache when
   upstream APIs are unavailable.

4. Start the API server in one terminal:
   ```powershell
   pnpm --filter @oss-preflight/web server
   ```
   Expected: `OSS Preflight API server running on http://localhost:3001`.

5. Start the web UI in a second terminal:
   ```powershell
   pnpm --filter @oss-preflight/web dev -- --host 127.0.0.1
   ```
   Expected: Vite prints `Local: http://localhost:3000/`.

6. Open `http://localhost:3000`, enter:
   ```text
   Discord bot that summarizes channel activity
   ```
   Expected: three recommendations appear and `discord.js` is rank 1.

7. Click `Generate Scaffold`.
   Expected: generated files are listed and the smoke test shows a passing
   status. The scaffold uses mocked Discord messages and does not require
   credentials.

8. Open `Build Proof` in the top navigation.
   Expected: Bob modes, skills, session exports, build report, and Bob-assisted
   commit evidence are visible.

## Verification

Current local verification commands:

```powershell
pnpm test
pnpm build
pnpm --filter @oss-preflight/web test:e2e
```
