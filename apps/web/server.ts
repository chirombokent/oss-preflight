import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { handleAnalyze } from './api/analyze.js';
import { handleScaffold } from './api/scaffold.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const app = express();
app.use(express.json());

// Serve bob_sessions/ directory for BuildProof page
app.use('/bob_sessions', express.static(path.join(__dirname, '../../bob_sessions')));

// Vercel-compatible local routes for the production web flow.
app.post('/api/analyze', handleAnalyze);
app.post('/api/scaffold', handleScaffold);

function createCliInvocation(args: string[]): { command: string; args: string[] } {
  const localCli = path.join(repoRoot, 'packages/cli/dist/index.js');

  if (fs.existsSync(localCli)) {
    return {
      command: process.execPath,
      args: [localCli, ...args],
    };
  }

  return {
    command: process.platform === 'win32' ? 'oss-preflight.cmd' : 'oss-preflight',
    args,
  };
}

/**
 * Express server - thin bridge that spawns CLI
 * AC7: Spawns oss-preflight CLI with --json, handles spawn failures
 */

/**
 * POST /api/recommend - spawns `oss-preflight recommend --json`
 */
app.post('/api/recommend', async (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'Idea string is required' });
  }

  try {
    // Spawn CLI process
    const cli = createCliInvocation(['recommend', '--idea', idea, '--json']);
    const child = spawn(cli.command, cli.args, {
      cwd: repoRoot,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      // Handle spawn failure (ENOENT, permission error)
      console.error('CLI spawn error:', error);
      return res.status(500).json({
        error: 'Failed to spawn CLI. Run manually: oss-preflight recommend --idea "' + idea + '" --json',
        command: `oss-preflight recommend --idea "${idea}" --json`,
      });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error('CLI exited with code', code);
        console.error('stderr:', stderr);
        return res.status(500).json({
          error: stderr || 'CLI command failed',
          command: `oss-preflight recommend --idea "${idea}" --json`,
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (parseError) {
        console.error('Failed to parse CLI output:', parseError);
        res.status(500).json({
          error: 'Failed to parse CLI output',
          command: `oss-preflight recommend --idea "${idea}" --json`,
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      command: `oss-preflight recommend --idea "${idea}" --json`,
    });
  }
});

/**
 * POST /api/scaffold - spawns `oss-preflight scaffold`
 */
app.post('/api/scaffold', async (req, res) => {
  const { recommendation } = req.body;

  if (!recommendation) {
    return res.status(400).json({ error: 'Recommendation is required' });
  }

  try {
    // Write recommendation to temp file
    const tempFile = path.join(__dirname, 'temp-recommendation.json');
    await fsp.writeFile(tempFile, JSON.stringify(recommendation));

    // Spawn CLI process
    const outputDir = path.join(__dirname, 'temp-scaffold');
    
    const cli = createCliInvocation(['scaffold', '--recommendation', tempFile, '--out', outputDir]);
    const child = spawn(cli.command, cli.args, {
      cwd: repoRoot,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      console.error('CLI spawn error:', error);
      return res.status(500).json({
        error: 'Failed to spawn CLI. Run manually: oss-preflight scaffold --recommendation <file> --out <dir>',
        command: 'oss-preflight scaffold --recommendation <file> --out <dir>',
      });
    });

    child.on('close', async (code) => {
      // Clean up temp file
      try {
        await fsp.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        console.error('CLI exited with code', code);
        console.error('stderr:', stderr);
        return res.status(500).json({
          error: stderr || 'CLI command failed',
          command: 'oss-preflight scaffold --recommendation <file> --out <dir>',
        });
      }

      // Read generated files
      try {
        const files = await fsp.readdir(outputDir, { recursive: true });
        const fileList = files.filter((f: any) => {
          const stat = fs.statSync(path.join(outputDir, f));
          return stat.isFile();
        });

        res.json({
          files: fileList,
          passed: stdout.includes('✓') || stdout.includes('passed'),
          output: stdout,
        });
      } catch (readError) {
        console.error('Failed to read scaffold output:', readError);
        res.status(500).json({
          error: 'Failed to read scaffold output',
          files: [],
          passed: false,
          output: stdout,
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      command: 'oss-preflight scaffold --recommendation <file> --out <dir>',
    });
  }
});

/**
 * POST /api/audit - spawns `oss-preflight audit --repo <path> --json`
 *
 * Exercises the real CLI audit path (no mocking): repo context detection,
 * dependency extraction, evidence collection, scoring, and report generation.
 */
app.post('/api/audit', async (req, res) => {
  const { repo, manifest } = req.body;

  if ((!repo || typeof repo !== 'string') && (!manifest || typeof manifest !== 'string')) {
    return res.status(400).json({ error: 'A repo path/URL or manifest path is required' });
  }

  const target = repo || manifest;
  const flag = repo ? '--repo' : '--manifest';
  const manualCommand = `oss-preflight audit ${flag} "${target}" --json`;

  try {
    const cli = createCliInvocation(['audit', flag, target, '--json']);
    const child = spawn(cli.command, cli.args, {
      cwd: repoRoot,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      console.error('CLI spawn error:', error);
      return res.status(500).json({
        error: `Failed to spawn CLI. Run manually: ${manualCommand}`,
        command: manualCommand,
      });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error('CLI exited with code', code);
        console.error('stderr:', stderr);
        return res.status(500).json({
          error: stderr || 'CLI command failed',
          command: manualCommand,
        });
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (parseError) {
        console.error('Failed to parse CLI output:', parseError);
        res.status(500).json({
          error: 'Failed to parse CLI output',
          command: manualCommand,
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      command: manualCommand,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OSS Preflight API server running on http://localhost:${PORT}`);
});

// Made with Bob
