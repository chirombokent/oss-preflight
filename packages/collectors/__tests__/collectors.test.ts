import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { collectNpmData, type NpmCollectedData } from '../src/npm.js';
import { collectGitHubData } from '../src/github.js';
import { collectPyPIData } from '../src/pypi.js';
import { collectOpenSSFData } from '../src/openssf.js';
import { PackageNotFoundError, RateLimitError } from '../src/errors.js';
import { readCache, writeCache } from '../src/cache/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

let cacheDir: string;

function jsonResponse(status: number, body: unknown, headers: Headers = new Headers()): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: status === 200 ? 'OK' : 'Error',
    headers,
    json: async () => body
  } as Response;
}

function rateLimitResponse(): Response {
  return jsonResponse(
    403,
    { message: 'API rate limit exceeded' },
    new Headers({
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600)
    })
  );
}

const npmMetadata = {
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
  },
  _npmUser: {
    name: 'maintainer',
    email: 'maintainer@example.com'
  },
  maintainers: [
    { name: 'maintainer', email: 'maintainer@example.com' }
  ],
  contributors: [
    { name: 'contributor', email: 'contributor@example.com' }
  ]
};

const githubRepo = {
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

describe('Collectors', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    cacheDir = await mkdtemp(join(tmpdir(), 'oss-preflight-cache-'));
    process.env.OSS_PREFLIGHT_CACHE_DIR = cacheDir;
  });

  afterEach(async () => {
    delete process.env.OSS_PREFLIGHT_CACHE_DIR;
    await rm(cacheDir, { recursive: true, force: true });
  });

  describe('npm collector', () => {
    it('throws PackageNotFoundError and caches the 404 as an error entry', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'not found' }));

      await expect(collectNpmData('nonexistent-package-xyz')).rejects.toThrow(
        PackageNotFoundError
      );

      const cached = await readCache('npm', 'nonexistent-package-xyz');
      expect(cached?.error).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('nonexistent-package-xyz')
      );
    });

    it('fetches, labels, and caches npm data', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(200, npmMetadata))
        .mockResolvedValueOnce(jsonResponse(200, {
          downloads: 1200000,
          start: '2026-05-09',
          end: '2026-05-15',
          package: 'discord.js'
        }));

      const result = await collectNpmData('discord.js');

      expect(result.metadata.name).toBe('discord.js');
      expect(result.metadata.version).toBe('14.11.0');
      expect(result.weeklyDownloads).toBe(1200000);
      expect(result.sourceUrl).toContain('registry.npmjs.org');
      expect(result.source).toBe('live');
      expect(JSON.stringify(result.metadata)).not.toContain('email');
      expect(JSON.stringify(result.metadata)).not.toContain('maintainers');
      expect(JSON.stringify(result.metadata)).not.toContain('contributors');

      const cached = await readCache<NpmCollectedData>('npm', 'discord.js');
      expect(cached?.source).toBe('live');
      expect(cached?.data.metadata.name).toBe('discord.js');
      expect(JSON.stringify(cached?.data.metadata)).not.toContain('email');

      mockFetch.mockClear();
      const cachedResult = await collectNpmData('discord.js');
      expect(cachedResult.source).toBe('cache');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses explicit null when npm downloads evidence is unavailable', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(200, npmMetadata))
        .mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }));

      const result = await collectNpmData('discord.js');

      expect(result.weeklyDownloads).toBeNull();
      expect(result.source).toBe('live');
    });
  });

  describe('GitHub collector', () => {
    it('returns cached data with source cache-fallback on rate limit', async () => {
      await writeCache('github', 'discordjs/discord.js', {
        repo: githubRepo,
        contributors: [],
        contributorCount: 0,
        sourceUrl: 'https://api.github.com/repos/discordjs/discord.js',
        collectedAt: new Date().toISOString(),
        source: 'live'
      }, 'live');

      mockFetch.mockResolvedValueOnce(rateLimitResponse());

      const result = await collectGitHubData('discordjs/discord.js', true);

      expect(result.repo.name).toBe('discord.js');
      expect(result.repo.stargazers_count).toBe(27500);
      expect(result.source).toBe('cache-fallback');
    });

    it('throws RateLimitError when rate limited with no cache available', async () => {
      mockFetch.mockResolvedValueOnce(rateLimitResponse());

      await expect(collectGitHubData('new-repo/no-cache', true)).rejects.toThrow(
        RateLimitError
      );
    });

    it('uses explicit null when contributor evidence is unavailable', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(200, githubRepo))
        .mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }));

      const result = await collectGitHubData('discordjs/discord.js', true);

      expect(result.repo.full_name).toBe('discordjs/discord.js');
      expect(result.contributors).toBeNull();
      expect(result.contributorCount).toBeNull();
      expect(result.source).toBe('live');
    });
  });

  describe('Cache invalidation', () => {
    it('sanitizes cache keys that contain Windows alternate-stream characters', async () => {
      await writeCache('pypi-search', 'ai music composition:10', [{ name: 'music21' }], 'live');

      const cached = await readCache<Array<{ name: string }>>('pypi-search', 'ai music composition:10');
      const files = await readdir(join(cacheDir, 'pypi-search'));

      expect(cached?.data).toEqual([{ name: 'music21' }]);
      expect(files).toContain('ai music composition_10.json');
      expect(files).not.toContain('ai music composition');
    });

    it('refetches when cache is expired', async () => {
      const oldTimestamp = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();

      await writeCache('npm', 'test-package', {
        metadata: {
          name: 'test-package',
          version: '1.0.0',
          dist: { tarball: 'https://example.com' }
        },
        weeklyDownloads: 100,
        sourceUrl: 'https://registry.npmjs.org/test-package/latest',
        collectedAt: oldTimestamp,
        source: 'live'
      }, 'live');

      const cacheFile = join(cacheDir, 'npm', 'test-package.json');
      const content = JSON.parse(await readFile(cacheFile, 'utf-8'));
      content.collectedAt = oldTimestamp;
      await writeFile(cacheFile, JSON.stringify(content, null, 2));

      mockFetch
        .mockResolvedValueOnce(jsonResponse(200, {
          name: 'test-package',
          version: '2.0.0',
          dist: { tarball: 'https://example.com' }
        }))
        .mockResolvedValueOnce(jsonResponse(200, {
          downloads: 200,
          package: 'test-package'
        }));

      const result = await collectNpmData('test-package');
      const updatedCache = await readCache<NpmCollectedData>('npm', 'test-package');

      expect(result.metadata.version).toBe('2.0.0');
      expect(result.weeklyDownloads).toBe(200);
      expect(result.source).toBe('live');
      expect(updatedCache?.data.metadata.version).toBe('2.0.0');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Error caching', () => {
    it('caches npm errors and does not retry immediately', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockRejectedValueOnce(new Error('Request timeout'));

      await expect(collectNpmData('timeout-package')).rejects.toThrow();

      const cached = await readCache('npm', 'timeout-package');
      expect(cached?.error).toBe(true);

      mockFetch.mockClear();
      await expect(collectNpmData('timeout-package')).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Optional collectors', () => {
    it('collects PyPI metadata with mocked fetch', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, {
        info: {
          name: 'discord.py',
          version: '2.5.2',
          summary: 'A Python wrapper for the Discord API',
          author: 'Maintainer Name',
          author_email: 'maintainer@example.com'
        },
        urls: [],
        releases: {}
      }));

      const result = await collectPyPIData('discord.py');

      expect(result.metadata.info.name).toBe('discord.py');
      expect(result.metadata.info.version).toBe('2.5.2');
      expect(JSON.stringify(result.metadata)).not.toContain('maintainer@example.com');
      expect(result.source).toBe('live');
    });

    it('returns null score when OpenSSF is unavailable', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }));

      const result = await collectOpenSSFData('discordjs/discord.js');

      expect(result.scorecard).toBeNull();
      expect(result.score).toBeNull();
      expect(result.source).toBe('live');
    });
  });

  describe('Parallel fetch', () => {
    it('completes npm and GitHub collection in one parallel call', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(200, npmMetadata))
        .mockResolvedValueOnce(jsonResponse(200, {
          downloads: 1200000,
          package: 'discord.js'
        }))
        .mockResolvedValueOnce(jsonResponse(200, githubRepo))
        .mockResolvedValueOnce(jsonResponse(200, [
          { login: 'iCrawl', contributions: 1250 }
        ]));

      const [npmResult, githubResult] = await Promise.all([
        collectNpmData('discord.js', true),
        collectGitHubData('discordjs/discord.js', true)
      ]);

      expect(npmResult.metadata.name).toBe('discord.js');
      expect(githubResult.repo.full_name).toBe('discordjs/discord.js');
      expect(githubResult.contributorCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});

// Made with Bob
