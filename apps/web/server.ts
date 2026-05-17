import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve bob_sessions/ directory for BuildProof page
app.use('/bob_sessions', express.static(path.join(__dirname, '../../bob_sessions')));

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
    const child = spawn('oss-preflight', ['recommend', '--idea', idea, '--json'], {
      cwd: path.resolve(__dirname, '../..'),
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
    const fs = await import('fs/promises');
    await fs.writeFile(tempFile, JSON.stringify(recommendation));

    // Spawn CLI process
    const outputDir = path.join(__dirname, 'temp-scaffold');
    
    const child = spawn('oss-preflight', ['scaffold', '--recommendation', tempFile, '--out', outputDir], {
      cwd: path.resolve(__dirname, '../..'),
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
        await fs.unlink(tempFile);
      } catch (e) {
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
        const files = await fs.readdir(outputDir, { recursive: true });
        const fileList = files.filter((f: any) => {
          const stat = require('fs').statSync(path.join(outputDir, f));
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OSS Preflight API server running on http://localhost:${PORT}`);
});

// Made with Bob
