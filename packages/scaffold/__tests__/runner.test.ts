import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runSmokeTest } from '../src/runner.js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_SCAFFOLD_DIR = path.join(process.cwd(), 'packages/scaffold/__tests__/test-scaffold');

describe('Scaffold Runner', () => {
  beforeEach(() => {
    // Clean test scaffold directory
    if (fs.existsSync(TEST_SCAFFOLD_DIR)) {
      fs.rmSync(TEST_SCAFFOLD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_SCAFFOLD_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_SCAFFOLD_DIR)) {
      fs.rmSync(TEST_SCAFFOLD_DIR, { recursive: true, force: true });
    }
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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    // Should have run npm install
    expect(fs.existsSync(path.join(TEST_SCAFFOLD_DIR, 'node_modules'))).toBe(true);
    expect(result.pass).toBe(true);
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    fs.mkdirSync(path.join(TEST_SCAFFOLD_DIR, 'node_modules'));

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.pass).toBe(true);
    expect(result.output).not.toContain('npm install');
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.pass).toBe(true);
    expect(result.output).toContain('Smoke test output');
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.pass).toBe(true);
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.pass).toBe(false);
    expect(result.output).toBeTruthy();
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.pass).toBe(false);
    expect(result.output).toContain('Error message');
  });

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
      path.join(TEST_SCAFFOLD_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = await runSmokeTest(TEST_SCAFFOLD_DIR);

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
  });
});

// Made with Bob