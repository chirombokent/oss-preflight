#!/usr/bin/env node

/**
 * Production Readiness Validation
 *
 * This gate executes the real product and asserts on real outcomes. It does
 * NOT pass by checking that files or scripts merely exist — every CLI-facing
 * criterion runs the actual command and inspects its exit code and output.
 *
 * Flow:
 *   1. pnpm build   (real build, must exit 0)
 *   2. pnpm test    (real vitest run, must exit 0)
 *   3. recommend / scaffold / run / audit  (real CLI execution + assertions)
 *
 * All generated artifacts are written under a temp directory and removed,
 * so a validation run never pollutes the working tree.
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface ValidationResult {
  criterion: string;
  passed: boolean;
  evidence: string;
  blocker: boolean;
}

const repoRoot = process.cwd();
const cliDist = path.join(repoRoot, 'packages/cli/dist/index.js');

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Run a binary with array args and NO shell. Safe for paths containing
 * spaces (this repo lives under ".../Main Projects/..."). Used for the
 * `node <cliDist>` invocations.
 */
function run(
  command: string,
  args: string[],
  timeoutMs = 600_000,
  cwd = repoRoot
): RunResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf-8',
    timeout: timeoutMs,
    env: { ...process.env },
  });
  return {
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/**
 * Run a package script via the platform pnpm launcher. pnpm is a `.cmd`
 * shim on Windows, so this path needs a shell — but it takes no
 * space-containing path arguments, so shell quoting is not a concern.
 */
function runPnpm(args: string[], timeoutMs = 600_000): RunResult {
  const result = spawnSync('pnpm', args, {
    cwd: repoRoot,
    encoding: 'utf-8',
    timeout: timeoutMs,
    shell: true,
    env: { ...process.env },
  });
  return {
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function runCli(args: string[], timeoutMs = 180_000, cwd = repoRoot): RunResult {
  return run(process.execPath, [cliDist, ...args], timeoutMs, cwd);
}

function ok(criterion: string, evidence: string): ValidationResult {
  return { criterion, passed: true, evidence, blocker: false };
}

function fail(criterion: string, evidence: string, blocker = true): ValidationResult {
  return { criterion, passed: false, evidence, blocker };
}

function parseRecommendationNames(stdout: string): string[] {
  const json = JSON.parse(stdout);
  if (!Array.isArray(json.recommendations)) {
    throw new Error('recommendations[] missing');
  }
  return json.recommendations.map((r: { candidate: { name: string } }) => r.candidate.name);
}

/**
 * AC1: pnpm build actually succeeds.
 */
function checkBuild(): ValidationResult {
  const r = runPnpm(['-s', 'build']);
  return r.code === 0
    ? ok('AC1: pnpm build', 'Build exited 0')
    : fail('AC1: pnpm build', `Build exited ${r.code}: ${r.stderr.slice(-400)}`);
}

/**
 * AC2: pnpm test actually passes.
 */
function checkTests(): ValidationResult {
  const r = runPnpm(['-s', 'test']);
  return r.code === 0
    ? ok('AC2: pnpm test', 'Test suite exited 0')
    : fail('AC2: pnpm test', `Tests exited ${r.code}: ${r.stdout.slice(-400)}`);
}

/**
 * AC3: recommend --json --save runs and writes a valid recommendations file.
 */
function checkRecommendSave(tmp: string): ValidationResult {
  // Run in the temp dir so --save writes under tmp (cwd-relative) and the
  // working tree is never polluted.
  const r = runCli(
    [
      'recommend',
      '--idea',
      'Discord bot that summarizes channel activity',
      '--json',
      '--save',
    ],
    180_000,
    tmp
  );
  if (r.code !== 0) {
    return fail('AC3: recommend --json --save', `Exit ${r.code}: ${r.stderr.slice(-300)}`);
  }
  const savePath = path.join(tmp, '.oss-preflight', 'recommendations', 'latest.json');
  if (!fs.existsSync(savePath)) {
    return fail('AC3: recommend --json --save', 'latest.json was not written');
  }
  try {
    const saved = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    const json = JSON.parse(r.stdout);
    if (!Array.isArray(json.recommendations) || json.recommendations.length === 0) {
      return fail('AC3: recommend --json --save', 'No recommendations returned');
    }
    if (!Array.isArray(saved.recommendations)) {
      return fail('AC3: recommend --json --save', 'Saved file has no recommendations[]');
    }
  } catch (e) {
    return fail('AC3: recommend --json --save', `Unparseable output: ${(e as Error).message}`);
  }
  return ok('AC3: recommend --json --save', 'Ran, returned recommendations, wrote latest.json');
}

/**
 * AC4 + AC5: run (recommend → scaffold → smoke) completes for the demo idea.
 */
function checkRunCommand(tmp: string): ValidationResult {
  const outDir = path.join(tmp, 'run');
  const r = runCli(
    ['run', '--idea', 'Discord bot that summarizes channel activity', '--out', outDir],
    300_000,
    tmp
  );
  if (r.code !== 0) {
    return fail('AC4/5: run command', `Exit ${r.code}: ${r.stderr.slice(-300)}`);
  }
  const reportExists = fs.existsSync(path.join(outDir, 'REPORT.md'));
  const workflowExists = fs.existsSync(path.join(outDir, 'workflow.json'));
  if (!reportExists || !workflowExists) {
    return fail('AC4/5: run command', 'Missing REPORT.md or workflow.json');
  }
  try {
    const workflow = JSON.parse(fs.readFileSync(path.join(outDir, 'workflow.json'), 'utf-8'));
    const scaffoldAction = workflow.actions.find((a: { type: string; success: boolean }) => a.type === 'scaffold' && a.success);
    if (!scaffoldAction) {
      return fail('AC4/5: run command', 'Workflow did not record a successful scaffold action');
    }
    if (workflow.verification.smokeTestPassed !== true) {
      return fail('AC4/5: run command', 'Workflow smokeTestPassed was not true');
    }
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(outDir, 'scaffold', 'package.json'), 'utf-8')
    );
    if (!packageJson.dependencies?.['discord.js']) {
      return fail('AC4/5: run command', 'Generated scaffold did not depend on discord.js');
    }
    if (packageJson.dependencies?.['@discordjs/rest']) {
      return fail('AC4/5: run command', 'Generated scaffold used @discordjs/rest as the template package');
    }
  } catch (e) {
    return fail('AC4/5: run command', `Could not inspect generated artifacts: ${(e as Error).message}`);
  }
  return ok('AC4/5: run command', 'Scaffold selected discord.js, typecheck/smoke passed, artifacts written');
}

/**
 * Random project usefulness: generic ideas should produce domain-appropriate
 * packages, not broad registry-search hits ranked by popularity alone.
 */
function checkArbitraryIdeaRecommendations(tmp: string): ValidationResult {
  const web = runCli(
    ['recommend', '--idea', 'Node TypeScript web API framework', '--json'],
    180_000,
    tmp
  );
  if (web.code !== 0) {
    return fail('P9: arbitrary idea recommendations', `Node web idea exited ${web.code}: ${web.stderr.slice(-300)}`);
  }

  const py = runCli(
    ['recommend', '--idea', 'Python data science notebook for CSV analysis', '--json'],
    180_000,
    tmp
  );
  if (py.code !== 0) {
    return fail('P9: arbitrary idea recommendations', `Python data idea exited ${py.code}: ${py.stderr.slice(-300)}`);
  }

  const weather = runCli(
    ['recommend', '--idea', 'A weather forecasting app', '--json'],
    180_000,
    tmp
  );
  if (weather.code !== 0) {
    return fail('P9: arbitrary idea recommendations', `Weather idea exited ${weather.code}: ${weather.stderr.slice(-300)}`);
  }

  try {
    const webNames = parseRecommendationNames(web.stdout);
    const pyNames = parseRecommendationNames(py.stdout);
    const weatherNames = parseRecommendationNames(weather.stdout);
    const hasWebFramework = webNames.some((name) => ['express', 'fastify', 'koa', 'hapi'].includes(name));
    const hasDataScience = pyNames.some((name) => ['pandas', 'numpy', 'scikit-learn', 'matplotlib'].includes(name));
    const hasWeather = weatherNames.some((name) => ['openmeteo', 'openweather-api-node', 'weather-js', 'openweather-apis'].includes(name));

    if (!hasWebFramework) {
      return fail('P9: arbitrary idea recommendations', `Web API recommendations were ${webNames.join(', ')}`);
    }
    if (!hasDataScience) {
      return fail('P9: arbitrary idea recommendations', `Python data recommendations were ${pyNames.join(', ')}`);
    }
    if (!hasWeather) {
      return fail('P9: arbitrary idea recommendations', `Weather recommendations were ${weatherNames.join(', ')}`);
    }
    if (webNames[0] === 'pdfjs-dist') {
      return fail('P9: arbitrary idea recommendations', 'pdfjs-dist still outranked web frameworks');
    }
    if (weatherNames.some((name) => ['@matter/general', '@sentry/core', '@sentry/react'].includes(name))) {
      return fail('P9: arbitrary idea recommendations', `Weather recommendations included broad hits: ${weatherNames.join(', ')}`);
    }

    return ok(
      'P9: arbitrary idea recommendations',
      `Node web: ${webNames.join(', ')}; Python data: ${pyNames.join(', ')}; Weather: ${weatherNames.join(', ')}`
    );
  } catch (e) {
    return fail('P9: arbitrary idea recommendations', `Unparseable recommendation output: ${(e as Error).message}`);
  }
}

/**
 * AC6: audit an npm repo via the real CLI JSON path.
 */
function checkAuditNpm(tmp: string): ValidationResult {
  // Run in tmp so collector cache writes land under tmp, not the repo.
  const r = runCli(
    [
      'audit',
      '--repo',
      path.join(repoRoot, 'fixtures/npm-project'),
      '--json',
      '--out',
      path.join(tmp, 'audit-npm'),
    ],
    180_000,
    tmp
  );
  if (r.code !== 0) {
    return fail('AC6: audit npm repo', `Exit ${r.code}: ${r.stderr.slice(-300)}`);
  }
  try {
    const json = JSON.parse(r.stdout);
    if (json.repoContext.ecosystem !== 'npm' || json.summary.total < 1) {
      return fail('AC6: audit npm repo', 'Unexpected audit shape for npm fixture');
    }
  } catch (e) {
    return fail('AC6: audit npm repo', `Unparseable output: ${(e as Error).message}`);
  }
  return ok('AC6: audit npm repo', 'Audited npm fixture, structured JSON returned');
}

/**
 * AC7: audit a Python repo — ecosystem must be pypi and PyPI evidence wired.
 */
function checkAuditPython(tmp: string): ValidationResult {
  const outDir = path.join(tmp, 'audit-py');
  const r = runCli(
    [
      'audit',
      '--repo',
      path.join(repoRoot, 'fixtures/python-project'),
      '--json',
      '--out',
      outDir,
    ],
    180_000,
    tmp
  );
  if (r.code !== 0) {
    return fail('AC7: audit python repo', `Exit ${r.code}: ${r.stderr.slice(-300)}`);
  }
  try {
    const json = JSON.parse(r.stdout);
    if (json.repoContext.ecosystem !== 'pypi') {
      return fail('AC7: audit python repo', `ecosystem was ${json.repoContext.ecosystem}, expected pypi`);
    }
    const workflow = JSON.parse(
      fs.readFileSync(path.join(json.artifacts.workflow), 'utf-8')
    );
    if (workflow.discoveryPlan.ecosystem !== 'pypi' || workflow.discoveryPlan.searchMethod !== 'manifest') {
      return fail('AC7: audit python repo', 'Workflow trace did not record pypi/manifest discovery');
    }
  } catch (e) {
    return fail('AC7: audit python repo', `Unparseable output: ${(e as Error).message}`);
  }
  return ok('AC7: audit python repo', 'Audited pypi fixture; workflow records true pypi/manifest discovery');
}

/**
 * AC8 + AC9: Production web exposes Vercel serverless endpoints that run the
 * in-memory recommend/audit/scaffold paths. The old Express spawn bridge may
 * remain for local compatibility, but it is not the production deploy path.
 */
function checkWebBridge(): ValidationResult {
  const analyzePath = path.join(repoRoot, 'apps/web/api/analyze.ts');
  const scaffoldPath = path.join(repoRoot, 'apps/web/api/scaffold.ts');
  const vercelPath = path.join(repoRoot, 'vercel.json');
  if (!fs.existsSync(analyzePath) || !fs.existsSync(scaffoldPath) || !fs.existsSync(vercelPath)) {
    return fail('AC8/9: web serverless API', 'Missing analyze/scaffold function or vercel.json');
  }

  const analyzeSrc = fs.readFileSync(analyzePath, 'utf-8');
  const scaffoldSrc = fs.readFileSync(scaffoldPath, 'utf-8');
  const vercelSrc = fs.readFileSync(vercelPath, 'utf-8');
  const hasAnalyze = analyzeSrc.includes('runRecommendAnalysis') && analyzeSrc.includes('runAuditPipeline');
  const hasPublicRepoCheck = analyzeSrc.includes('api.github.com/repos') && analyzeSrc.includes('GITHUB_TOKEN');
  const hasZipScaffold = scaffoldSrc.includes('generateScaffoldFiles') && scaffoldSrc.includes('application/zip');
  const hasMaxDuration = vercelSrc.includes('"maxDuration": 60');
  const noSpawnInFunctions = !analyzeSrc.includes('spawn(') && !scaffoldSrc.includes('spawn(');

  if (!(hasAnalyze && hasPublicRepoCheck && hasZipScaffold && hasMaxDuration && noSpawnInFunctions)) {
    return fail(
      'AC8/9: web serverless API',
      `analyze=${hasAnalyze} publicRepo=${hasPublicRepoCheck} zip=${hasZipScaffold} maxDuration=${hasMaxDuration} noSpawn=${noSpawnInFunctions}`
    );
  }

  return ok('AC8/9: web serverless API', '/api/analyze and /api/scaffold use in-process pipelines with zip output');
}

/**
 * AC10/13/14: Evidence fact schema carries full source attribution and
 * explicit nullability. These are legitimately static schema invariants.
 */
function checkEvidenceSchema(): ValidationResult {
  const typesPath = path.join(repoRoot, 'packages/core/src/types.ts');
  if (!fs.existsSync(typesPath)) {
    return fail('AC10/13/14: evidence schema', 'types.ts not found');
  }
  const src = fs.readFileSync(typesPath, 'utf-8');
  const hasAll =
    src.includes('value:') &&
    src.includes('source:') &&
    src.includes('collectedAt:') &&
    src.includes('sourceType:') &&
    src.includes('retrievalSource:') &&
    src.includes('.nullable()') &&
    src.includes('not-available');
  return hasAll
    ? ok('AC10/13/14: evidence schema', 'Full source attribution + explicit null handling present')
    : fail('AC10/13/14: evidence schema', 'EvidenceFact schema missing required fields/nullability');
}

/**
 * AC11: Bob skill defines the production workflow.
 */
function checkBobSkill(): ValidationResult {
  const skillPath = path.join(repoRoot, '.bob/skills/oss-preflight-advisor/SKILL.md');
  if (!fs.existsSync(skillPath)) {
    return fail('AC11: Bob skill', 'SKILL.md not found', false);
  }
  const src = fs.readFileSync(skillPath, 'utf-8');
  return src.includes('Production Workflow')
    ? ok('AC11: Bob skill', 'SKILL.md defines the Production Workflow')
    : fail('AC11: Bob skill', 'Production Workflow section missing', false);
}

/**
 * AC12: discovery is search-first with explicit source labels (no hardcoded
 * candidates presented as live), and the pipeline actually calls it.
 */
function checkDiscoveryWiring(): ValidationResult {
  const discoveryPath = path.join(repoRoot, 'packages/core/src/discovery.ts');
  const recommendPath = path.join(repoRoot, 'packages/cli/src/recommend-command.ts');
  const discoverySrc = fs.readFileSync(discoveryPath, 'utf-8');
  const recommendSrc = fs.readFileSync(recommendPath, 'utf-8');
  const labelsSources = discoverySrc.includes("'catalog-fallback'") && discoverySrc.includes("source:");
  const pipelineUsesSearch = recommendSrc.includes('discoverCandidatesWithSearch');
  if (!labelsSources || !pipelineUsesSearch) {
    return fail(
      'AC12: search-first discovery',
      `labels=${labelsSources} pipelineUsesSearch=${pipelineUsesSearch}`
    );
  }
  return ok('AC12: search-first discovery', 'Pipeline calls discoverCandidatesWithSearch with source labels');
}

/**
 * AC16: required docs exist.
 */
function checkDocs(): ValidationResult {
  const required = [
    'docs/architecture.md',
    'docs/implementation-plan.md',
    'docs/p9-implementation-spec.md',
  ];
  const missing = required.filter((d) => !fs.existsSync(path.join(repoRoot, d)));
  return missing.length === 0
    ? ok('AC16: documentation', 'Required docs present')
    : fail('AC16: documentation', `Missing: ${missing.join(', ')}`, false);
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ossp-validate-'));
  const results: ValidationResult[] = [];

  console.log('Running production validation (real execution)...\n');

  // Heavy real checks first.
  results.push(checkBuild());

  // The CLI checks below require a successful build.
  const buildOk = results[0].passed;
  if (!buildOk) {
    console.error('Build failed — skipping CLI execution checks.');
  }

  results.push(checkTests());

  if (buildOk) {
    results.push(checkRecommendSave(tmp));
    results.push(checkRunCommand(tmp));
    results.push(checkArbitraryIdeaRecommendations(tmp));
    results.push(checkAuditNpm(tmp));
    results.push(checkAuditPython(tmp));
  } else {
    for (const c of ['AC3: recommend', 'AC4/5: run', 'P9: arbitrary idea recommendations', 'AC6: audit npm', 'AC7: audit python']) {
      results.push(fail(c, 'Skipped — build failed'));
    }
  }

  results.push(checkWebBridge());
  results.push(checkEvidenceSchema());
  results.push(checkBobSkill());
  results.push(checkDiscoveryWiring());
  results.push(ok('AC15: validation script runs', 'Script executed real commands'));
  results.push(checkDocs());

  // Clean up generated artifacts.
  fs.rmSync(tmp, { recursive: true, force: true });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const blockers = results.filter((r) => !r.passed && r.blocker).length;

  console.log(`\n=== Production Validation Results ===\n`);
  console.log(`Passed:   ${passed}/${results.length}`);
  console.log(`Failed:   ${failed}/${results.length}`);
  console.log(`Blockers: ${blockers}\n`);

  results.forEach((r) => {
    const icon = r.passed ? '✅' : r.blocker ? '🚫' : '⚠️';
    console.log(`${icon} ${r.criterion}: ${r.evidence}`);
  });

  console.log('');
  process.exit(blockers > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Validation script failed:', error);
  process.exit(1);
});

// Made with Bob
