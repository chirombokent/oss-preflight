import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Demo fixtures', () => {
  it('should load npm discord.js fixture with valid data', async () => {
    const fixturePath = join(__dirname, '../fixtures/demo-packages/npm-discord.js.json');
    const content = await fs.readFile(fixturePath, 'utf-8');
    const fixture = JSON.parse(content);

    // Verify required fields exist
    expect(fixture.metadata).toBeDefined();
    expect(fixture.metadata.name).toBe('discord.js');
    expect(fixture.metadata.version).toBeDefined();
    expect(fixture.metadata.license).toBe('Apache-2.0');
    expect(fixture.weeklyDownloads).toBeGreaterThan(0);
    expect(fixture.sourceUrl).toContain('registry.npmjs.org');
    expect(fixture.collectedAt).toBeDefined();
    
    // Verify timestamp is valid ISO-8601
    expect(() => new Date(fixture.collectedAt)).not.toThrow();
  });

  it('should load GitHub discordjs/discord.js fixture with valid data', async () => {
    const fixturePath = join(__dirname, '../fixtures/demo-packages/github-discordjs-discord.js.json');
    const content = await fs.readFile(fixturePath, 'utf-8');
    const fixture = JSON.parse(content);

    // Verify required fields exist
    expect(fixture.repo).toBeDefined();
    expect(fixture.repo.full_name).toBe('discordjs/discord.js');
    expect(fixture.repo.stargazers_count).toBeGreaterThan(0);
    expect(fixture.repo.license).toBeDefined();
    expect(fixture.repo.license.spdx_id).toBe('Apache-2.0');
    expect(fixture.contributors).toBeInstanceOf(Array);
    expect(fixture.contributorCount).toBeGreaterThan(0);
    expect(fixture.sourceUrl).toContain('api.github.com');
    expect(fixture.collectedAt).toBeDefined();
    
    // Verify timestamp is valid ISO-8601
    expect(() => new Date(fixture.collectedAt)).not.toThrow();
    
    // Verify last commit timestamp
    expect(fixture.repo.pushed_at).toBeDefined();
    expect(() => new Date(fixture.repo.pushed_at)).not.toThrow();
  });
});

// Made with Bob
