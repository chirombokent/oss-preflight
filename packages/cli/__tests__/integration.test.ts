import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Real CLI integration tests — NO mocks.
 *
 * These spawn the actual CLI against real fixtures and assert the structural
 * shape of `--json` output. This is the path the web `/api/audit` and
 * `/api/recommend` bridges depend on. Evidence values are intentionally NOT
 * asserted: collectors degrade gracefully offline, so only structure is
 * guaranteed deterministic.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const cliDist = path.join(repoRoot, 'packages/cli/dist/index.js');
const distBuilt = fs.existsSync(cliDist);

// Run the CLI from a throwaway cwd so collector cache / saved artifacts
// never land in the working tree during `pnpm test`.
const sandboxCwd = distBuilt
  ? fs.mkdtempSync(path.join(os.tmpdir(), 'ossp-itest-cwd-'))
  : repoRoot;

function runCli(args: string[]) {
  // Exercises the real built CLI — the exact entry the web bridge spawns.
  return spawnSync(process.execPath, [cliDist, ...args], {
    cwd: sandboxCwd,
    encoding: 'utf-8',
    timeout: 120_000,
    env: { ...process.env },
  });
}

// These tests require a prior `pnpm build`. The production gate
// (pnpm validate:production) always builds first; when run standalone
// without a build, skip rather than report a false failure.
describe.skipIf(!distBuilt)('CLI integration (real execution, no mocks)', () => {
  it('audit --repo <npm fixture> --json emits a parseable structured result', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossp-audit-npm-'));
    const result = runCli([
      'audit',
      '--repo',
      path.join(repoRoot, 'fixtures/npm-project'),
      '--json',
      '--out',
      outDir,
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    expect(parsed.repoContext.ecosystem).toBe('npm');
    // deps + devDeps: express, axios, vitest
    expect(parsed.summary.total).toBe(3);
    expect(Array.isArray(parsed.dependencies)).toBe(true);
    expect(parsed.dependencies.map((d: { name: string }) => d.name).sort()).toEqual(
      ['axios', 'express', 'vitest']
    );
    expect(typeof parsed.workflowId).toBe('string');
    // Artifacts were actually written to disk.
    expect(fs.existsSync(parsed.artifacts.report)).toBe(true);
    expect(fs.existsSync(parsed.artifacts.workflow)).toBe(true);

    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('audit --repo <python fixture> --json reports the pypi ecosystem (not the npm default)', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossp-audit-py-'));
    const result = runCli([
      'audit',
      '--repo',
      path.join(repoRoot, 'fixtures/python-project'),
      '--json',
      '--out',
      outDir,
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    expect(parsed.repoContext.ecosystem).toBe('pypi');
    expect(parsed.summary.total).toBeGreaterThan(0);

    // The workflow trace must record the true ecosystem + manifest source,
    // never the npm/catalog default.
    const workflow = JSON.parse(fs.readFileSync(parsed.artifacts.workflow, 'utf-8'));
    expect(workflow.discoveryPlan.ecosystem).toBe('pypi');
    expect(workflow.discoveryPlan.searchMethod).toBe('manifest');
    expect(workflow.candidates.length).toBe(parsed.summary.total);
    expect(workflow.candidates.every((c: { source: string }) => c.source === 'manifest')).toBe(true);

    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('recommend --idea --json returns ranked recommendations with discovery metadata wired in', () => {
    const result = runCli([
      'recommend',
      '--idea',
      'Discord bot that summarizes channel activity',
      '--json',
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed.recommendations)).toBe(true);
    expect(parsed.recommendations.length).toBeGreaterThan(0);
    expect(parsed.ideas_parsed.ecosystem).toBe('npm');
  });

  it('recommend ranks known Node web frameworks for a generic API idea', () => {
    const result = runCli([
      'recommend',
      '--idea',
      'Node TypeScript web API framework',
      '--json',
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    const names = parsed.recommendations.map((r: { candidate: { name: string } }) => r.candidate.name);
    expect(parsed.ideas_parsed.domain).toBe('web-framework');
    expect(names.some((name: string) => ['express', 'fastify', 'koa', 'hapi'].includes(name))).toBe(true);
    expect(names[0]).not.toBe('pdfjs-dist');
  });

  it('recommend returns Python data-science packages for a CSV notebook idea', () => {
    const result = runCli([
      'recommend',
      '--idea',
      'Python data science notebook for CSV analysis',
      '--json',
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    const names = parsed.recommendations.map((r: { candidate: { name: string } }) => r.candidate.name);
    expect(parsed.ideas_parsed.ecosystem).toBe('pypi');
    expect(parsed.ideas_parsed.domain).toBe('data-science');
    expect(names.some((name: string) => ['pandas', 'numpy', 'scikit-learn', 'matplotlib'].includes(name))).toBe(true);
  });

  it('recommend ranks weather packages for a forecasting app idea', () => {
    const result = runCli([
      'recommend',
      '--idea',
      'A weather forecasting app',
      '--json',
    ]);

    expect(result.status).toBe(0);

    const parsed = JSON.parse(result.stdout);
    const names = parsed.recommendations.map((r: { candidate: { name: string } }) => r.candidate.name);
    expect(parsed.ideas_parsed.domain).toBe('weather');
    expect(names.some((name: string) => ['openmeteo', 'openweather-api-node', 'weather-js', 'openweather-apis'].includes(name))).toBe(true);
    expect(names).not.toContain('@matter/general');
    expect(names).not.toContain('@sentry/core');
  });
});

// Made with Bob
