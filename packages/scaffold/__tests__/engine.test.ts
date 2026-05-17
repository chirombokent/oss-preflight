import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateScaffold } from '../src/engine.js';
import type { Recommendation } from '@oss-preflight/core';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'packages/scaffold/__tests__/test-output');

// Mock recommendation for testing
const mockRecommendation: Recommendation = {
  rank: 1,
  score: 85,
  candidate: {
    name: 'discord.js',
    version: '14.14.1',
    ecosystem: 'npm',
    homepageUrl: 'https://discord.js.org',
    repositoryUrl: 'https://github.com/discordjs/discord.js',
  },
  subscores: {
    goalFit: 90,
    repoCompat: 85,
    maintenance: 88,
    safety: 82,
    community: 90,
    docsQuality: 85,
  },
  passport: {
    facts: {
      license: { value: 'Apache-2.0', source: 'https://registry.npmjs.org/discord.js', collectedAt: '2026-05-16T10:00:00Z', sourceType: 'npm' },
      weeklyDownloads: { value: 1500000, source: 'https://registry.npmjs.org/discord.js', collectedAt: '2026-05-16T10:00:00Z', sourceType: 'npm' },
      lastCommit: { value: '2026-05-10T15:30:00Z', source: 'https://api.github.com/repos/discordjs/discord.js', collectedAt: '2026-05-16T10:00:00Z', sourceType: 'github' },
      stars: { value: 24500, source: 'https://api.github.com/repos/discordjs/discord.js', collectedAt: '2026-05-16T10:00:00Z', sourceType: 'github' },
      openIssues: { value: 45, source: 'https://api.github.com/repos/discordjs/discord.js', collectedAt: '2026-05-16T10:00:00Z', sourceType: 'github' },
      openssfScore: null,
    },
    interpretation: {
      goalFit: 'Excellent fit for Discord bot development',
      compatibility: 'Compatible with Node.js 16+',
      tradeoffs: ['Requires Discord bot token', 'Learning curve for Discord API'],
      warnings: [],
      recommendedAlongside: ['@discordjs/rest', '@discordjs/builders'],
    },
  },
  scaffoldAvailable: true,
  templateId: 'discord-summary-bot',
};

describe('Scaffold Engine', () => {
  beforeEach(() => {
    // Clean test output directory
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it('generates scaffold files from template', async () => {
    const result = await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    expect(result.success).toBe(true);
    expect(fs.existsSync(TEST_OUTPUT_DIR)).toBe(true);
    
    // Check required files exist
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'src/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'src/summarizer.ts'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'ADOPTION_REPORT.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'smoke-test.ts'))).toBe(true);
  });

  it('interpolates package name in generated files', async () => {
    await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'package.json'), 'utf-8')
    );

    // Check that package name was interpolated
    expect(packageJson.dependencies['discord.js']).toBe('14.14.1');
  });

  it('generates README with install and run commands', async () => {
    await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    const readme = fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'README.md'), 'utf-8');

    expect(readme).toContain('npm install');
    expect(readme).toContain('npm test');
    expect(readme).toContain('discord.js');
  });

  it('generates ADOPTION_REPORT with timestamp, packages, and source URLs', async () => {
    await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    const report = fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'ADOPTION_REPORT.md'), 'utf-8');

    // Check metadata
    expect(report).toContain('**Generated**:');
    expect(report).toContain('discord.js');
    expect(report).toContain('14.14.1');
    expect(report).toContain('https://github.com/discordjs/discord.js');
    expect(report).toContain('## Smoke Test');
    expect(report).toContain('## Next Steps');
  });

  it('is idempotent - skips generation if version hash matches', async () => {
    // First generation
    const result1 = await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);
    expect(result1.success).toBe(true);
    expect(result1.skipped).toBe(false);

    const firstGenTime = fs.statSync(path.join(TEST_OUTPUT_DIR, 'package.json')).mtime;

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second generation with same recommendation
    const result2 = await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);
    expect(result2.success).toBe(true);
    expect(result2.skipped).toBe(true);

    const secondGenTime = fs.statSync(path.join(TEST_OUTPUT_DIR, 'package.json')).mtime;

    // File should not have been modified
    expect(secondGenTime.getTime()).toBe(firstGenTime.getTime());
  });

  it('regenerates if version hash changes', async () => {
    // First generation
    await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    // Modify recommendation (different version)
    const modifiedRecommendation = {
      ...mockRecommendation,
      candidate: {
        ...mockRecommendation.candidate,
        version: '14.15.0',
      },
    };

    // Second generation with different version
    const result = await generateScaffold(modifiedRecommendation, TEST_OUTPUT_DIR);
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(false);

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'package.json'), 'utf-8')
    );

    expect(packageJson.dependencies['discord.js']).toBe('14.15.0');
  });

  it('includes source URLs in adoption report', async () => {
    await generateScaffold(mockRecommendation, TEST_OUTPUT_DIR);

    const report = fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'ADOPTION_REPORT.md'), 'utf-8');

    // Check that source URLs are included
    expect(report).toContain('https://registry.npmjs.org/discord.js');
    expect(report).toContain('https://api.github.com/repos/discordjs/discord.js');
  });
});

// Made with Bob