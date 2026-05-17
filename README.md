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
- [Source ledger](docs/source-ledger.md)
- [Submission deck](docs/oss-preflight-submission-deck.pdf)

## Bob Evidence

- Single evidence ledger: [bob_sessions/build-report.md](bob_sessions/build-report.md)
- Official hackathon export folder (per-session subfolders): [bob_sessions/](bob_sessions/)

## Status

Phase P7 hardening is in progress. The core demo path, build, unit tests, and
browser flow are green locally; final submission still requires the external
video, missing Bob export screenshots, and final tag after human
approval.

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

3. Configure the Claude API key for the recommendation parser:
   ```powershell
   $env:ANTHROPIC_API_KEY="your-api-key"
   ```
   Expected: no terminal output. If the key is invalid or unavailable, the CLI
   falls back to keyword parsing and labels the result as reduced capability.

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
