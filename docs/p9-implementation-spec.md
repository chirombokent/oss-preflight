# Phase P9 - Production Readiness Implementation Spec

**Session:** S09  
**Status:** Approved for implementation  
**Created:** 2026-05-17  
**Spec Author:** Bob (Plan mode)

---

## Executive Summary

This spec transforms OSS Preflight from a demo-ready prototype into a production-grade tool with three real user paths: idea-to-scaffold, repo audit, and Bob-native workflow. Every acceptance criterion is binding. No hardcoded shortcuts, no demo-only behavior, no placeholder logic.

**Success criteria:** All 16 acceptance criteria pass, all 4 quality scores reach ≥9/10 with executable evidence, production validation is green, and the full must-test suite passes on first TEST execution.

---

## 1. Workflow Trace Architecture

### 1.1 Data Structure

Create [`packages/core/src/workflow.ts`](packages/core/src/workflow.ts):

```typescript
export interface WorkflowTrace {
  workflowId: string;           // UUID v4
  mode: 'idea' | 'repo-audit';
  timestamp: string;            // ISO-8601
  input: {
    idea?: string;
    repoPath?: string;
    repoUrl?: string;
    manifestPath?: string;
  };
  repoContext: RepoContext | null;
  discoveryPlan: {
    ecosystem: Ecosystem;
    domain: string;
    searchQuery: string;
    searchMethod: 'ai-expanded' | 'keyword' | 'catalog-fallback';
  };
  candidates: Array<{
    name: string;
    source: 'npm-search' | 'pypi-search' | 'github-search' | 'catalog-fallback';
    discoveredAt: string;
  }>;
  recommendations: Recommendation[];
  evidenceGaps: Array<{
    candidate: string;
    missingFields: string[];
    reason: string;
  }>;
  actions: Array<{
    type: 'scaffold' | 'audit-report' | 'adoption-pack';
    timestamp: string;
    outputPath: string;
    success: boolean;
  }>;
  verification: {
    smokeTestPassed: boolean | null;
    validationErrors: string[];
  };
  generatedArtifacts: string[];
}

export interface RepoContext {
  path: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'pip' | 'poetry' | 'unknown';
  ecosystem: Ecosystem;
  language: string[];
  framework: string | null;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  license: string | null;
  hasReadme: boolean;
  detectedAt: string;
}
```

### 1.2 Serialization Contract

- Every workflow writes to `.oss-preflight/runs/<timestamp>/workflow.json`
- For idea mode: `.oss-preflight/` in current working directory
- For audit mode: `.oss-preflight/` in the audited repo's root (never writes into source)
- Serialization uses [`packages/core/src/serializer.ts`](packages/core/src/serializer.ts) with explicit null handling
- Missing fields are `null`, never omitted
- All timestamps are ISO-8601 UTC

---

## 2. CLI Command Contracts

### 2.1 Enhanced `recommend` Command

Update [`packages/cli/src/index.ts`](packages/cli/src/index.ts):

```typescript
program
  .command('recommend')
  .description('Get package recommendations for your idea')
  .requiredOption('--idea <string>', 'Your software idea or requirement')
  .option('--json', 'Output as JSON')
  .option('--save', 'Save recommendations to .oss-preflight/recommendations/latest.json')
  .option('--format <type>', 'Output format: table, json, or md', 'table')
  .option('--refresh', 'Force live collector calls, bypass cache')
  .option('--ai-provider <provider>', 'AI provider: anthropic, openai-compatible, gemini, or keyword')
  .option('--ai-model <model>', 'AI model for the selected provider')
  .option('--ai-base-url <url>', 'Base URL for the selected AI provider')
  .option('--config <path>', 'Path to OSS Preflight config JSON')
```

**Behavior:**
- When `--save` is present, write full response wrapper to `.oss-preflight/recommendations/latest.json`
- Response wrapper format:
  ```json
  {
    "workflowId": "uuid",
    "timestamp": "ISO-8601",
    "idea": "original idea string",
    "brief": { IdeaBrief },
    "recommendations": [ Recommendation[] ]
  }
  ```
- Exit code 0 on success, 1 on collector error, 2 on input error, 3 on config error

### 2.2 Enhanced `scaffold` Command

Update [`packages/cli/src/scaffold-command.ts`](packages/cli/src/scaffold-command.ts):

```typescript
program
  .command('scaffold')
  .description('Generate a working starter from a recommendation')
  .option('--recommendation <path>', 'Path to recommendation JSON file')
  .option('--rank <number>', 'Select recommendation by rank (1-3)', '1')
  .option('--out <directory>', 'Output directory for generated code')
```

**Behavior:**
- Accept three input formats:
  1. Full `recommend --json --save` wrapper (extract by rank)
  2. Array of recommendations (select by rank)
  3. Single recommendation object (ignore rank)
- `--rank` is 1-indexed (1, 2, or 3)
- Validate rank is within bounds
- Exit code 0 on success, 1 on scaffold/smoke error, 2 on input error

### 2.3 New `run` Command

Create [`packages/cli/src/run-command.ts`](packages/cli/src/run-command.ts):

```typescript
program
  .command('run')
  .description('Complete workflow: recommend, scaffold, verify, report')
  .requiredOption('--idea <string>', 'Your software idea')
  .option('--out <directory>', 'Output directory', '.oss-preflight/runs/<timestamp>')
  .option('--rank <number>', 'Scaffold rank to use', '1')
  .option('--ai-provider <provider>', 'AI provider')
  .option('--ai-model <model>', 'AI model')
  .option('--config <path>', 'Config path')
```

**Workflow:**
1. Run `recommend` with `--save`
2. Select recommendation by `--rank`
3. Run `scaffold` to `<out>/scaffold/`
4. Run smoke test
5. Write workflow trace to `<out>/workflow.json`
6. Write summary report to `<out>/REPORT.md`
7. Exit code: 0 if smoke passed, 1 if smoke failed, 2 on input error

### 2.4 New `audit` Command

Create [`packages/cli/src/audit-command.ts`](packages/cli/src/audit-command.ts):

```typescript
program
  .command('audit')
  .description('Audit an existing repository or manifest')
  .option('--repo <path-or-url>', 'Local path or GitHub URL')
  .option('--manifest <path>', 'Path to package.json or requirements.txt')
  .option('--out <directory>', 'Output directory', '.oss-preflight/audits/<timestamp>')
```

**Workflow:**
1. Detect repo context using [`packages/repo-analyser`](packages/repo-analyser)
2. Extract dependencies
3. Run evidence collection on each dependency
4. Score dependencies against repo context
5. Flag risks (missing license, low OpenSSF, stale maintenance)
6. Suggest safer/better alternatives
7. Write audit report to `<out>/AUDIT_REPORT.md`
8. Write workflow trace to `<out>/workflow.json`
9. **Never write into the audited repo** - all output goes to `--out`
10. Exit code: 0 on success, 1 on analysis error, 2 on input error

---

## 3. Repo Analyser Package

### 3.1 Package Structure

Create [`packages/repo-analyser/`](packages/repo-analyser/):

```
packages/repo-analyser/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Public API
│   ├── detector.ts       # Package manager & ecosystem detection
│   ├── parser.ts         # Manifest parsing (package.json, requirements.txt)
│   ├── github.ts         # GitHub URL metadata (no clone)
│   └── types.ts          # RepoContext interface
└── __tests__/
    ├── detector.test.ts
    ├── parser.test.ts
    └── fixtures/
        ├── npm-project/
        └── python-project/
```

### 3.2 Detection Logic

[`packages/repo-analyser/src/detector.ts`](packages/repo-analyser/src/detector.ts):

```typescript
export async function detectRepoContext(input: string): Promise<RepoContext> {
  // 1. Determine input type: local path, GitHub URL, or manifest file
  // 2. For local path: read package.json/requirements.txt/pyproject.toml
  // 3. For GitHub URL: fetch raw manifest via GitHub API (no clone)
  // 4. For manifest file: parse directly
  
  // Detection order:
  // - package-lock.json → npm
  // - pnpm-lock.yaml → pnpm
  // - yarn.lock → yarn
  // - requirements.txt → pip
  // - pyproject.toml → poetry
  
  // Return RepoContext with explicit null for undetectable fields
}
```

**Rules:**
- Never clone repos - use GitHub raw content API
- Never execute discovered code
- Missing fields are explicit `null`, never omitted
- Detection errors are explicit in `RepoContext.detectionErrors: string[]`

### 3.3 Supported Inputs

1. **Local directory:** `--repo ./my-project`
2. **GitHub URL:** `--repo https://github.com/owner/repo`
3. **Manifest file:** `--manifest ./package.json`

---

## 4. Real Discovery Implementation

### 4.1 Discovery Flow

Update [`packages/core/src/discovery.ts`](packages/core/src/discovery.ts):

```typescript
export async function discoverCandidates(
  brief: IdeaBrief,
  options: {
    searchFirst: boolean;
    catalogFallback: boolean;
  }
): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    candidates: [],
    method: 'unknown',
    fallbackUsed: false,
  };

  if (options.searchFirst) {
    // 1. Expand intent to search query (AI or keyword)
    const query = await expandIntentToQuery(brief);
    
    // 2. Search registries in parallel
    const [npmResults, pypiResults, githubResults] = await Promise.all([
      searchNpm(query, brief.ecosystem),
      searchPyPI(query, brief.ecosystem),
      searchGitHub(query, brief.ecosystem),
    ]);
    
    // 3. Merge and deduplicate
    result.candidates = mergeResults([npmResults, pypiResults, githubResults]);
    result.method = 'search';
  }

  // 4. Fallback to catalog if search returned < 3 candidates
  if (result.candidates.length < 3 && options.catalogFallback) {
    const catalogCandidates = discoverFromCatalog(brief);
    result.candidates.push(...catalogCandidates.map(c => ({
      ...c,
      source: 'catalog-fallback' as const,
    })));
    result.fallbackUsed = true;
  }

  return result;
}
```

### 4.2 Search Collectors

Create [`packages/collectors/src/search.ts`](packages/collectors/src/search.ts):

```typescript
export async function searchNpm(query: string, limit: number = 10): Promise<SearchResult[]> {
  // Use npm registry search: https://registry.npmjs.org/-/v1/search?text=<query>&size=<limit>
  // Return: name, version, description, score
}

export async function searchPyPI(query: string, limit: number = 10): Promise<SearchResult[]> {
  // Use PyPI search: https://pypi.org/search/?q=<query>
  // Parse HTML or use PyPI XML-RPC API
  // Return: name, version, description
}

export async function searchGitHub(query: string, limit: number = 10): Promise<SearchResult[]> {
  // Use GitHub search API: https://api.github.com/search/repositories?q=<query>
  // Return: full_name, description, stars, language
}
```

**Rules:**
- All search results are labeled with `source: 'npm-search' | 'pypi-search' | 'github-search'`
- Catalog fallback candidates are labeled `source: 'catalog-fallback'`
- UI must display source label for every candidate
- Search failures degrade gracefully to catalog, never crash

---

## 5. Evidence Passport Upgrade

### 5.1 Schema Changes

Update [`packages/core/src/types.ts`](packages/core/src/types.ts):

```typescript
export const RetrievalSourceSchema = z.enum([
  'live',
  'cache',
  'cache-fallback',
  'fixture',
  'not-available'
]);
export type RetrievalSource = z.infer<typeof RetrievalSourceSchema>;

export const EvidenceFactSchema = z.object({
  value: z.union([z.string(), z.number()]),
  source: z.string(),                    // URL or 'not-available'
  collectedAt: z.string(),               // ISO-8601 or 'not-available'
  sourceType: SourceTypeSchema,          // npm, github, pypi, openssf, inferred
  retrievalSource: RetrievalSourceSchema, // NEW: live, cache, cache-fallback, fixture, not-available
}).nullable();
```

### 5.2 Collector Updates

Update all collectors in [`packages/collectors/src/`](packages/collectors/src/):

```typescript
// npm.ts, github.ts, pypi.ts, openssf.ts
export async function collectData(name: string): Promise<CollectorResult> {
  // 1. Check cache first
  const cached = await cache.get(name);
  if (cached && !isExpired(cached)) {
    return {
      ...cached.data,
      retrievalSource: 'cache',
    };
  }

  // 2. Try live fetch
  try {
    const liveData = await fetchLive(name);
    await cache.set(name, liveData);
    return {
      ...liveData,
      retrievalSource: 'live',
    };
  } catch (error) {
    // 3. Rate limit or network error → use stale cache
    if (cached) {
      return {
        ...cached.data,
        retrievalSource: 'cache-fallback',
      };
    }
    
    // 4. No cache, no live → explicit not-available
    return {
      retrievalSource: 'not-available',
      error: error.message,
    };
  }
}
```

### 5.3 UI Display

Update [`apps/web/src/components/FactBadge.tsx`](apps/web/src/components/FactBadge.tsx):

```typescript
function RetrievalBadge({ source }: { source: RetrievalSource }) {
  const badges = {
    'live': { label: 'LIVE', color: 'green' },
    'cache': { label: 'CACHED', color: 'blue' },
    'cache-fallback': { label: 'CACHED (rate-limited)', color: 'yellow' },
    'fixture': { label: 'FIXTURE', color: 'purple' },
    'not-available': { label: 'NOT AVAILABLE', color: 'red' },
  };
  
  const { label, color } = badges[source];
  return <span className={`badge badge-${color}`}>{label}</span>;
}
```

**Rules:**
- Every fact in Evidence Passport must display its `retrievalSource`
- No fact can exist without all five fields: value, source, collectedAt, sourceType, retrievalSource
- Missing evidence is explicit `null` with `retrievalSource: 'not-available'`

---

## 6. Bob Skill Production Workflow

### 6.1 Skill Update

Update [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md):

```markdown
## Production Workflow

1. **Inspect repo context:**
   - Read package.json, requirements.txt, or pyproject.toml
   - Detect package manager, ecosystem, language, framework
   - Check for .oss-preflight/config.json

2. **Choose workflow mode:**
   - If user provides an idea → `run` command (idea-to-scaffold)
   - If user asks to audit repo → `audit` command (repo analysis)
   - If user asks for recommendations only → `recommend` command

3. **Present exact CLI command:**
   ```bash
   # Idea flow
   oss-preflight run --idea "Discord bot that summarizes channel activity" --out ./oss-preflight-output

   # Repo audit flow
   oss-preflight audit --repo . --out ./.oss-preflight/audits/latest

   # Recommendation only
   oss-preflight recommend --idea "..." --json --save
   ```

4. **Show workflow trace summary:**
   - Discovery method used (search vs catalog-fallback)
   - Number of candidates found
   - Top 3 recommendations with scores
   - Evidence gaps (missing license, stale commits, etc.)
   - Scaffold availability

5. **Ask before writes:**
   - "Scaffold the top recommendation to ./oss-preflight-output/scaffold/?"
   - "Write audit report to ./.oss-preflight/audits/latest/?"

6. **Delegate writes to oss-preflight-scaffolder mode:**
   - Never write directly into user source
   - Use approved output directories only
   - Confirm write locations before execution

7. **Summarize results:**
   - Files created
   - Smoke test status
   - Next steps (install deps, set env vars, run tests)
   - What still needs human review
```

### 6.2 Activation Evidence

For S09 evidence, demonstrate:
1. Skill activates on trigger phrase: "run OSS Preflight on this idea"
2. Skill inspects repo context (shows detected package manager, ecosystem)
3. Skill presents exact CLI command
4. Skill shows workflow trace summary
5. Skill asks before scaffold write
6. Skill delegates to `oss-preflight-scaffolder` mode

**Evidence format:** Screenshot or task-history excerpt showing the above 6 steps.

---

## 7. Production Validation

### 7.1 Validation Script

Create [`scripts/validate-production.ts`](scripts/validate-production.ts):

```typescript
#!/usr/bin/env node

/**
 * Production Readiness Validation
 * 
 * Checks all 16 P9 acceptance criteria programmatically
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  criterion: string;
  passed: boolean;
  evidence: string;
  blocker: boolean;
}

async function validateProduction(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // AC1: pnpm test passes
  results.push(await checkTests());

  // AC2: pnpm build passes
  results.push(await checkBuild());

  // AC3: recommend --json --save creates file
  results.push(await checkRecommendSave());

  // AC4: scaffold accepts latest.json
  results.push(await checkScaffoldHandoff());

  // AC5: run command completes
  results.push(await checkRunCommand());

  // AC6: audit npm repo
  results.push(await checkAuditNpm());

  // AC7: audit python repo
  results.push(await checkAuditPython());

  // AC8: Web uses local API
  results.push(await checkWebIntegration());

  // AC9: Web repo-audit flow
  results.push(await checkWebAudit());

  // AC10: Evidence Passport shows retrievalSource
  results.push(await checkEvidencePassport());

  // AC11: Bob skill activates
  results.push(await checkBobSkill());

  // AC12: No hardcoded candidates as live
  results.push(await checkNoHardcodedLive());

  // AC13: All facts have source metadata
  results.push(await checkFactMetadata());

  // AC14: Missing evidence is explicit
  results.push(await checkExplicitNulls());

  // AC15: This validation script runs
  results.push({ criterion: 'AC15', passed: true, evidence: 'Running now', blocker: false });

  // AC16: Docs reflect current truth
  results.push(await checkDocsUpdated());

  return results;
}

// Print results
const results = await validateProduction();
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const blockers = results.filter(r => !r.passed && r.blocker).length;

console.log(`\n=== Production Validation Results ===\n`);
console.log(`Passed: ${passed}/16`);
console.log(`Failed: ${failed}/16`);
console.log(`Blockers: ${blockers}\n`);

results.forEach(r => {
  const icon = r.passed ? '✅' : (r.blocker ? '🚫' : '⚠️');
  console.log(`${icon} ${r.criterion}: ${r.evidence}`);
});

process.exit(blockers > 0 ? 1 : 0);
```

### 7.2 Package.json Script

Add to root [`package.json`](package.json):

```json
{
  "scripts": {
    "validate:production": "tsx scripts/validate-production.ts"
  }
}
```

---

## 8. Test Fixtures

### 8.1 NPM Fixture

Create [`fixtures/npm-project/`](fixtures/npm-project/):

```
fixtures/npm-project/
├── package.json          # Express + axios dependencies
├── package-lock.json
├── src/
│   └── index.js         # Simple Express server
└── README.md
```

**package.json:**
```json
{
  "name": "test-npm-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "test": "vitest run"
  }
}
```

### 8.2 Python Fixture

Create [`fixtures/python-project/`](fixtures/python-project/):

```
fixtures/python-project/
├── requirements.txt      # Flask + requests dependencies
├── pyproject.toml        # Poetry config
├── src/
│   └── app.py           # Simple Flask app
└── README.md
```

**requirements.txt:**
```
flask==3.0.0
requests==2.31.0
pytest==7.4.0
```

---

## 9. Quality Gates Enforcement

| Gate | Enforcer | Verification Method |
|------|----------|---------------------|
| No hardcoded short-circuit | `evidence-discipline` skill + AC12 check | Grep for catalog usage, verify all candidates have `source` label |
| Evidence discipline | `.bob/rules/01-evidence-discipline.md` + `evidence-discipline` skill | All facts have 5 required fields, no invented data |
| Agentic workflow | AC11 + Bob skill demo | Skill activates, presents CLI, asks before writes |
| Write safety | Bob skill + `oss-preflight-scaffolder` fence | No writes into user source without approval |
| Production clone | AC1-AC9 + validation script | Fresh clone works with keyword parser |
| Random project | AC6-AC7 + fixtures | npm and Python fixtures audit successfully |
| Submission | AC16 + S09 export | build-report row, docs updated, evidence exported |

---

## 10. Must-Test Execution Plan

All tests run on **first TEST pass** in the Orchestrator loop:

```powershell
# 1. Unit tests
pnpm test

# 2. Build
pnpm build

# 3. Production validation
pnpm validate:production

# 4. CLI recommend with save
node packages\cli\dist\index.js recommend --idea "Discord bot that summarizes channel activity" --json --save

# 5. CLI scaffold from saved recommendation
node packages\cli\dist\index.js scaffold --recommendation .oss-preflight\recommendations\latest.json --rank 1 --out C:\tmp\oss-preflight-p9-scaffold

# 6. CLI run (full workflow)
node packages\cli\dist\index.js run --idea "Discord bot that summarizes channel activity" --out C:\tmp\oss-preflight-p9-run

# 7. CLI audit npm fixture
node packages\cli\dist\index.js audit --repo fixtures\npm-project --out C:\tmp\oss-preflight-p9-npm-audit

# 8. CLI audit python fixture
node packages\cli\dist\index.js audit --repo fixtures\python-project --out C:\tmp\oss-preflight-p9-python-audit

# 9. Web E2E tests
pnpm --filter @oss-preflight/web test:e2e
```

**Pass criteria:** All commands exit 0, all tests green, validation script reports 16/16 passed.

---

## 11. Implementation Order

### Phase 1: Foundation (Workflow Trace + Repo Analyser)
1. Create [`packages/core/src/workflow.ts`](packages/core/src/workflow.ts) with WorkflowTrace interface
2. Create [`packages/repo-analyser/`](packages/repo-analyser/) package
3. Implement detector, parser, and GitHub metadata fetcher
4. Add repo-analyser tests with fixtures
5. Update core serializer to handle workflow traces

### Phase 2: CLI Commands
1. Update [`packages/cli/src/recommend-command.ts`](packages/cli/src/recommend-command.ts) with `--save` flag
2. Update [`packages/cli/src/scaffold-command.ts`](packages/cli/src/scaffold-command.ts) with `--rank` and wrapper handling
3. Create [`packages/cli/src/run-command.ts`](packages/cli/src/run-command.ts)
4. Create [`packages/cli/src/audit-command.ts`](packages/cli/src/audit-command.ts)
5. Update [`packages/cli/src/index.ts`](packages/cli/src/index.ts) to register new commands

### Phase 3: Real Discovery
1. Create [`packages/collectors/src/search.ts`](packages/collectors/src/search.ts) with npm/PyPI/GitHub search
2. Update [`packages/core/src/discovery.ts`](packages/core/src/discovery.ts) with search-first flow
3. Add discovery tests with search mocks
4. Update catalog fallback labeling

### Phase 4: Evidence Passport Upgrade
1. Update [`packages/core/src/types.ts`](packages/core/src/types.ts) with RetrievalSource
2. Update all collectors to return retrievalSource
3. Update [`apps/web/src/components/FactBadge.tsx`](apps/web/src/components/FactBadge.tsx) to display source
4. Update Evidence Passport page to show all 5 fact fields

### Phase 5: Bob Skill & Validation
1. Update [`.bob/skills/oss-preflight-advisor/SKILL.md`](.bob/skills/oss-preflight-advisor/SKILL.md)
2. Create [`scripts/validate-production.ts`](scripts/validate-production.ts)
3. Add `validate:production` script to [`package.json`](package.json)
4. Create test fixtures in [`fixtures/`](fixtures/)

### Phase 6: Documentation & Evidence
1. Update [`README.md`](README.md) with new CLI commands
2. Update [`docs/submission-readiness.md`](docs/submission-readiness.md)
3. Update [`bob_sessions/build-report.md`](bob_sessions/build-report.md) with S09 row
4. Export S09 evidence to [`bob_sessions/S09-production-readiness/`](bob_sessions/S09-production-readiness/)

---

## 12. Acceptance Criteria Mapping

| AC | Requirement | Implementation | Verification |
|----|-------------|----------------|--------------|
| AC1 | `pnpm test` passes | All existing + new tests | Run `pnpm test` |
| AC2 | `pnpm build` passes | All packages build | Run `pnpm build` |
| AC3 | `recommend --save` creates file | Update recommend-command.ts | Check `.oss-preflight/recommendations/latest.json` exists |
| AC4 | `scaffold` accepts latest.json | Update scaffold-command.ts | Run scaffold with saved file |
| AC5 | `run` completes workflow | Create run-command.ts | Run `run` command, check all artifacts |
| AC6 | `audit` npm repo | Create audit-command.ts + npm fixture | Audit npm fixture, check report |
| AC7 | `audit` python repo | Create audit-command.ts + python fixture | Audit python fixture, check report |
| AC8 | Web uses local API | Verify server.ts spawns CLI | Check Playwright test |
| AC9 | Web repo-audit flow | Add audit UI flow | Check Playwright test |
| AC10 | Evidence shows retrievalSource | Update types + collectors + UI | Inspect Evidence Passport page |
| AC11 | Bob skill activates | Update SKILL.md | Manual activation + screenshot |
| AC12 | No hardcoded live candidates | Label all catalog candidates | Grep for 'catalog-fallback' label |
| AC13 | All facts have metadata | Update EvidenceFact schema | Validate all facts have 5 fields |
| AC14 | Missing evidence explicit | Update serializer | Check for explicit nulls |
| AC15 | Validation script runs | Create validate-production.ts | Run `pnpm validate:production` |
| AC16 | Docs updated | Update README, submission-readiness | Review docs for accuracy |

---

## 13. Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Search APIs rate-limited | Graceful degradation to catalog fallback, labeled as fallback |
| GitHub API requires auth | Use unauthenticated endpoints, document rate limits |
| PyPI search unreliable | Implement XML-RPC fallback, cache aggressively |
| Repo detection fails | Return explicit `unknown` values, never crash |
| Workflow trace too large | Limit candidates to top 10, summarize evidence gaps |
| Bob skill doesn't activate | Document manual CLI path as fallback |

---

## 14. Definition of Done

P9 is complete when:

- [ ] All 16 acceptance criteria pass
- [ ] `pnpm test` reports 0 failures
- [ ] `pnpm build` completes successfully
- [ ] `pnpm validate:production` reports 16/16 passed
- [ ] All must-test commands execute successfully
- [ ] Reviewer finds zero blockers
- [ ] S09 evidence exported to `bob_sessions/S09-production-readiness/`
- [ ] `bob_sessions/build-report.md` has S09 row
- [ ] `docs/submission-readiness.md` updated with P9 verdict
- [ ] Quality score table shows all 4 areas ≥9/10
- [ ] Human approval given before commit

---

## 15. S09 Evidence Artifact Structure

```
bob_sessions/S09-production-readiness/
├── task-history.md                    # Exported from Bob IDE
├── consumption-summary.png            # Screenshot from Bob IDE
├── validation-results.txt             # Output of validate:production
├── cli-run-demo.txt                   # Output of run command
├── cli-audit-npm-demo.txt             # Output of npm audit
├── cli-audit-python-demo.txt          # Output of python audit
├── bob-skill-activation.png           # Screenshot of skill demo
└── workflow-trace-sample.json         # Example workflow.json
```

---

## 16. Build Report Row Template

```markdown
| S09 | 2026-05-17 12:00 | Orchestrator -> Code/Reviewer/Advanced | evidence-discipline, code-review, test-runner, doc-writer, oss-preflight-advisor | Production readiness hardening: workflow trace, real discovery, repo audit, CLI/Web/Bob integration, validation gate | docs/phase-plan-P9-production-readiness.md, packages/, apps/web/, .bob/skills/, docs/ | pnpm test; pnpm build; pnpm validate:production; CLI run/audit/scaffold; web e2e | bob_sessions/S09-production-readiness/ | Production readiness raised to >=9/10 with executable evidence | Complete |
```

---

## Appendix A: File Checklist

**New files to create:**
- [ ] `packages/core/src/workflow.ts`
- [ ] `packages/repo-analyser/package.json`
- [ ] `packages/repo-analyser/src/index.ts`
- [ ] `packages/repo-analyser/src/detector.ts`
- [ ] `packages/repo-analyser/src/parser.ts`
- [ ] `packages/repo-analyser/src/github.ts`
- [ ] `packages/repo-analyser/src/types.ts`
- [ ] `packages/repo-analyser/__tests__/detector.test.ts`
- [ ] `packages/cli/src/run-command.ts`
- [ ] `packages/cli/src/audit-command.ts`
- [ ] `packages/collectors/src/search.ts`
- [ ] `scripts/validate-production.ts`
- [ ] `fixtures/npm-project/package.json`
- [ ] `fixtures/npm-project/src/index.js`
- [ ] `fixtures/python-project/requirements.txt`
- [ ] `fixtures/python-project/src/app.py`

**Files to update:**
- [ ] `packages/core/src/types.ts` (add RetrievalSource)
- [ ] `packages/core/src/discovery.ts` (add search-first flow)
- [ ] `packages/cli/src/index.ts` (register new commands)
- [ ] `packages/cli/src/recommend-command.ts` (add --save)
- [ ] `packages/cli/src/scaffold-command.ts` (add --rank, wrapper handling)
- [ ] `packages/collectors/src/npm.ts` (add retrievalSource)
- [ ] `packages/collectors/src/github.ts` (add retrievalSource)
- [ ] `packages/collectors/src/pypi.ts` (add retrievalSource)
- [ ] `packages/collectors/src/openssf.ts` (add retrievalSource)
- [ ] `apps/web/src/components/FactBadge.tsx` (display retrievalSource)
- [ ] `.bob/skills/oss-preflight-advisor/SKILL.md` (production workflow)
- [ ] `package.json` (add validate:production script)
- [ ] `README.md` (document new commands)
- [ ] `docs/submission-readiness.md` (P9 verdict)
- [ ] `bob_sessions/build-report.md` (S09 row)

---

**End of Spec**

This spec is ready for Orchestrator execution. Every requirement is explicit, every acceptance criterion is testable, and every quality gate is enforced by a named mechanism.