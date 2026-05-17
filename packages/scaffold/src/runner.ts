import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface SmokeTestResult {
  pass: boolean;
  output: string;
  duration: number;
}

/**
 * Run a command and capture output
 */
function runCommand(command: string, args: string[], cwd: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';

    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        output,
      });
    });

    proc.on('error', (error) => {
      resolve({
        exitCode: 1,
        output: `Error: ${error.message}`,
      });
    });
  });
}

/**
 * Run smoke test in scaffold directory
 */
export async function runSmokeTest(scaffoldDir: string): Promise<SmokeTestResult> {
  const startTime = Date.now();

  try {
    // Check if node_modules exists
    const nodeModulesPath = path.join(scaffoldDir, 'node_modules');
    const needsInstall = !fs.existsSync(nodeModulesPath);

    let installOutput = '';

    // Run npm install if needed
    if (needsInstall) {
      const installResult = await runCommand('npm', ['install'], scaffoldDir);
      installOutput = installResult.output;

      if (installResult.exitCode !== 0) {
        return {
          pass: false,
          output: `npm install failed:\n${installOutput}`,
          duration: Date.now() - startTime,
        };
      }
    }

    // Run npm test
    const testResult = await runCommand('npm', ['test'], scaffoldDir);

    const duration = Date.now() - startTime;

    return {
      pass: testResult.exitCode === 0,
      output: testResult.output,
      duration,
    };
  } catch (error) {
    return {
      pass: false,
      output: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

// Made with Bob