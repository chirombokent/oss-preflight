import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runSmokeTest } from '../src/runner.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEST_TMP_ROOT = path.join(TEST_DIR, '.tmp', 'runner');
const RUNNER_TEST_TIMEOUT_MS = 20000;

describe('Scaffold Runner', () => {
  let testScaffoldDir: string;

  function removeDirIfExists(dir: string): void {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }

  beforeEach(() => {
    fs.mkdirSync(TEST_TMP_ROOT, { recursive: true });
    testScaffoldDir = fs.mkdtempSync(path.join(TEST_TMP_ROOT, 'case-'));
  });

  afterEach(() => {
    removeDirIfExists(testScaffoldDir);
  });

  it('runs npm install if node_modules missing', async () => {
    // Create a minimal package.json
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'echo "test passed"',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    // Should have run npm install
    expect(result.installedDependencies).toBe(true);
    expect(fs.existsSync(path.join(testScaffoldDir, 'package-lock.json'))).toBe(true);
    expect(result.pass).toBe(true);
  }, RUNNER_TEST_TIMEOUT_MS);

  it('skips npm install if node_modules exists', async () => {
    // Create package.json and node_modules
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'echo "test passed"',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    fs.mkdirSync(path.join(testScaffoldDir, 'node_modules'));

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.pass).toBe(true);
    expect(result.installedDependencies).toBe(false);
    expect(result.output).not.toContain('npm install');
  }, RUNNER_TEST_TIMEOUT_MS);

  it('executes smoke test and captures stdout', async () => {
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'echo "Smoke test output"',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.pass).toBe(true);
    expect(result.output).toContain('Smoke test output');
  }, RUNNER_TEST_TIMEOUT_MS);

  it('returns pass=true when test exits 0', async () => {
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'exit 0',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.pass).toBe(true);
  }, RUNNER_TEST_TIMEOUT_MS);

  it('returns pass=false when test exits non-zero', async () => {
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'exit 1',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.pass).toBe(false);
    expect(result.output).toBeTruthy();
  }, RUNNER_TEST_TIMEOUT_MS);

  it('captures stderr on test failure', async () => {
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'echo "Error message" >&2 && exit 1',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.pass).toBe(false);
    expect(result.output).toContain('Error message');
  }, RUNNER_TEST_TIMEOUT_MS);

  it('returns duration in milliseconds', async () => {
    const packageJson = {
      name: 'test-scaffold',
      version: '1.0.0',
      scripts: {
        test: 'echo "test"',
      },
      dependencies: {},
    };

    fs.writeFileSync(
      path.join(testScaffoldDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(testScaffoldDir);

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
  }, RUNNER_TEST_TIMEOUT_MS);
});

// Made with Bob
