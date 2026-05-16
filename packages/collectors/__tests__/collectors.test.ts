import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectNpmData } from '../src/npm.js';
import { collectGitHubData } from '../src/github.js';
import { PackageNotFoundError, RateLimitError } from '../src/errors.js';
import { readCache, writeCache, clearCache } from '../src/cache/index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Collectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up cache after each test
    await clearCache('npm', 'discord.js');
    await clearCache('github', 'discordjs/discord.js');
  });

  describe('npm collector', () => {
    it('should handle 404 errors correctly', async () => {
      // Mock 404 response
      mockFetch.mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: 'Not Found'
      });

      // Should throw PackageNotFoundError, not return null or fake data
      await expect(collectNpmData('nonexistent-package-xyz')).rejects.toThrow(
        PackageNotFoundError
      );

      // Verify no fake data was returned
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('nonexistent-package-xyz')
      );
    });

    it('should fetch and cache npm data', async () => {
      const mockMetadata = {
        name: 'discord.js',
        version: '14.11.0',
        description: 'A powerful library for interacting with Discord',
        license: 'Apache-2.0',
        repository: {
          type: 'git',
          url: 'https://github.com/discordjs/discord.js'
        },
        dist: {
          tarball: 'https://registry.npmjs.org/discord.js/-/discord.js-14.11.0.tgz'
        }
      };

      const mockDownloads = {
        downloads: 1200000,
        start: '2026-05-09',
        end: '2026-05-15',
        package: 'discord.js'
      };

      // Mock successful responses
      mockFetch
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => mockMetadata
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => mockDownloads
        });

      const result = await collectNpmData('discord.js');

      expect(result.metadata.name).toBe('discord.js');
      expect(result.metadata.version).toBe('14.11.0');
      expect(result.weeklyDownloads).toBe(1200000);
      expect(result.sourceUrl).toContain('registry.npmjs.org');
      expect(result.collectedAt).toBeDefined();

      // Verify data was cached
      const cached = await readCache('npm', 'discord.js');
      expect(cached).not.toBeNull();
      expect(cached?.data.metadata.name).toBe('discord.js');
    });
  });

  describe('GitHub collector', () => {
    it('should handle rate limits with cache fallback', async () => {
      const mockRepoData = {
        id: 123,
        name: 'discord.js',
        full_name: 'discordjs/discord.js',
        description: 'A powerful library',
        html_url: 'https://github.com/discordjs/discord.js',
        homepage: 'https://discord.js.org',
        stargazers_count: 27500,
        watchers_count: 27500,
        forks_count: 3500,
        open_issues_count: 150,
        license: {
          key: 'apache-2.0',
          name: 'Apache License 2.0',
          spdx_id: 'Apache-2.0'
        },
        topics: ['discord', 'bot', 'api'],
        created_at: '2015-07-17T00:00:00Z',
        updated_at: '2026-05-15T10:00:00Z',
        pushed_at: '2026-05-14T15:22:00Z',
        default_branch: 'main'
      };

      // First, populate cache with valid data
      await writeCache('github', 'discordjs/discord.js', {
        repo: mockRepoData,
        contributors: [],
        contributorCount: 0,
        sourceUrl: 'https://api.github.com/repos/discordjs/discord.js',
        collectedAt: new Date().toISOString()
      }, 'live');

      // Mock rate limit response
      mockFetch.mockResolvedValueOnce({
        status: 403,
        ok: false,
        statusText: 'Forbidden',
        headers: new Map([
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)]
        ]) as any
      });

      // Should return cached data instead of throwing
      const result = await collectGitHubData('discordjs/discord.js');

      expect(result.repo.name).toBe('discord.js');
      expect(result.repo.stargazers_count).toBe(27500);
      // Should have returned cached data
      expect(result.collectedAt).toBeDefined();
    });

    it('should throw RateLimitError when no cache available', async () => {
      // Mock rate limit response with no cache
      mockFetch.mockResolvedValueOnce({
        status: 403,
        ok: false,
        statusText: 'Forbidden',
        headers: new Map([
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)]
        ]) as any
      });

      await expect(collectGitHubData('new-repo/no-cache')).rejects.toThrow(
        RateLimitError
      );
    });
  });

  describe('Cache invalidation', () => {
    it('should refetch when cache is expired', async () => {
      const oldTimestamp = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(); // 7 hours ago
      
      // Write expired cache entry
      await writeCache('npm', 'test-package', {
        metadata: {
          name: 'test-package',
          version: '1.0.0',
          dist: { tarball: 'https://example.com' }
        },
        weeklyDownloads: 100,
        sourceUrl: 'https://registry.npmjs.org/test-package/latest',
        collectedAt: oldTimestamp
      }, 'live');

      // Manually set the collectedAt to be old
      const cachePath = await readCache('npm', 'test-package');
      if (cachePath) {
        await writeCache('npm', 'test-package', cachePath.data, 'live');
        // Manually override timestamp in the cache file
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const homedir = (await import('node:os')).homedir();
        const cacheFile = path.join(homedir, '.oss-preflight', 'cache', 'npm', 'test-package.json');
        const content = JSON.parse(await fs.readFile(cacheFile, 'utf-8'));
        content.collectedAt = oldTimestamp;
        await fs.writeFile(cacheFile, JSON.stringify(content, null, 2));
      }

      const mockMetadata = {
        name: 'test-package',
        version: '2.0.0', // New version
        dist: { tarball: 'https://example.com' }
      };

      const mockDownloads = {
        downloads: 200,
        package: 'test-package'
      };

      // Mock fresh fetch
      mockFetch
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => mockMetadata
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => mockDownloads
        });

      const result = await collectNpmData('test-package');

      // Should have fetched new data
      expect(result.metadata.version).toBe('2.0.0');
      expect(result.weeklyDownloads).toBe(200);
      
      // Verify fetch was called (cache was invalidated)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Error caching', () => {
    it('should cache errors and not retry immediately', async () => {
      // Mock timeout error for both npm calls (metadata and downloads)
      mockFetch
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockRejectedValueOnce(new Error('Request timeout'));

      // First call should fail and cache the error
      await expect(collectNpmData('timeout-package')).rejects.toThrow();

      // Check that error was cached
      const cached = await readCache('npm', 'timeout-package');
      expect(cached).not.toBeNull();
      expect(cached?.error).toBe(true);

      // Second call should return cached error without retrying
      mockFetch.mockClear();
      await expect(collectNpmData('timeout-package')).rejects.toThrow();
      
      // Fetch should not have been called again (error was cached)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

// Made with Bob
