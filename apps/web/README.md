# OSS Preflight Web UI

Evidence-backed package recommendations with Bob-powered SDLC acceleration.

## Features

- **Idea-to-Scaffold Flow**: Enter an idea, get 3 ranked recommendations, generate working starter code
- **Evidence Passport**: Fact/inference split showing sourced evidence vs AI interpretation
- **Build Proof**: Bob evidence rendering (modes, skills, sessions, commits)
- **Dark Mode**: Respects system preference, manual toggle
- **Accessibility**: Reduced motion support, calm mode

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (Vite)
pnpm dev

# Start API server (Express)
pnpm server

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build
```

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express server (thin bridge spawning CLI)
- **State**: Context + hooks (no heavy state lib)
- **Routing**: Client-side page state
- **Design**: Token-first system from `context/ui-reference/oss-preflight-design-tokens.css`

## API Endpoints

### POST /api/recommend
Spawns `oss-preflight recommend --json` with the provided idea.

**Request:**
```json
{
  "idea": "Discord bot that summarizes channel activity"
}
```

**Response:**
```json
{
  "recommendations": [...],
  "ideas_parsed": {...}
}
```

**Error Response (CLI spawn failure):**
```json
{
  "error": "Failed to spawn CLI. Run manually: oss-preflight recommend --idea \"...\" --json",
  "command": "oss-preflight recommend --idea \"...\" --json"
}
```

### POST /api/scaffold
Spawns `oss-preflight scaffold` with the provided recommendation.

**Request:**
```json
{
  "recommendation": {...}
}
```

**Response:**
```json
{
  "files": ["package.json", "src/index.ts", ...],
  "passed": true,
  "output": "..."
}
```

## Pages

- **IdeaInput**: Text input + submit (AC2)
- **RecommendationList**: 3 cards with scores (AC3)
- **EvidencePassport**: Modal with fact/inference split (AC4)
- **ScaffoldProgress**: File tree + smoke test status (AC5)
- **BuildProof**: Bob evidence rendering (AC6)

## Components

- **ScoreBar**: 0-100 score bar with color gradient (AC8)
- **FactBadge**: Fact with source link and live/cached label (AC9)
- **SourceLink**: Clickable source URL with icon (AC10)
- **HighlightCode**: Code display

## Tests

- **API Integration** (`__tests__/api.test.ts`): Mock CLI spawn, assert valid JSON (AC14)
- **Server** (`__tests__/server.test.ts`): CLI spawn failure handling (AC13)
- **E2E** (`__tests__/e2e/flow.spec.ts`): Full flow in Playwright (AC12)

## Acceptance Criteria Status

All 14 acceptance criteria implemented:

- [x] AC1: App.tsx renders main flow
- [x] AC2: IdeaInput accepts text + submit
- [x] AC3: RecommendationList displays 3 cards
- [x] AC4: EvidencePassport modal with fact/inference split
- [x] AC5: ScaffoldProgress displays files + smoke test
- [x] AC6: BuildProof renders Bob evidence
- [x] AC7: server.ts spawns CLI with error handling
- [x] AC8: ScoreBar component
- [x] AC9: FactBadge component
- [x] AC10: SourceLink component
- [x] AC11: Dark mode + accessibility
- [x] AC12: Automated browser test
- [x] AC13: CLI spawn failure test
- [x] AC14: API integration test

## Built with Bob

This web UI was built in Phase P5 using IBM Bob's code mode with:
- Custom modes: code, reviewer, orchestrator
- Skills: evidence-discipline, code-review, test-runner
- One-pipeline contract: server spawns CLI, never imports core

See `/build-proof` page for full Bob evidence.