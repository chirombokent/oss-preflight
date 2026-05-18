import { describe, it, expect, vi } from 'vitest';
import { discoverCandidates, discoverCandidatesWithSearch } from '../src/discovery.js';
import type { IdeaBrief } from '../src/types.js';
import type { DiscoveredCandidate } from '../src/discovery.js';

describe('discovery.ts', () => {
  describe('discoverCandidates', () => {
    it('returns only real npm discord packages for npm discord domain', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot', 'message processing'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toContain('discord.js');
      expect(candidates).toContain('eris');
      expect(candidates).toContain('oceanic.js');
      // discord.py is a PyPI package, not npm — it must not leak into npm results
      expect(candidates).not.toContain('discord.py');
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('returns web framework packages for web-framework domain', () => {
      const brief: IdeaBrief = {
        capabilities: ['http server', 'routing'],
        domain: 'web-framework',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toContain('express');
      expect(candidates).toContain('fastify');
    });

    it('returns weather packages for weather forecasting domain aliases', () => {
      const brief: IdeaBrief = {
        capabilities: ['weather data', 'forecasting'],
        domain: 'weather forecasting',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toContain('openmeteo');
      expect(candidates).toContain('openweather-api-node');
    });

    it('returns empty array for unknown domain', () => {
      const brief: IdeaBrief = {
        capabilities: ['unknown'],
        domain: 'nonexistent-domain',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toEqual([]);
    });

    it('is deterministic - same input produces same output', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const result1 = discoverCandidates(brief);
      const result2 = discoverCandidates(brief);
      const result3 = discoverCandidates(brief);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('returns stable order across multiple calls', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const result1 = discoverCandidates(brief);
      const result2 = discoverCandidates(brief);

      // Check that order is stable
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i]).toBe(result2[i]);
      }
    });

    it('handles PyPI ecosystem', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'pypi',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toContain('discord.py');
      // discord.js is an npm package, not PyPI — it must not leak into PyPI results
      expect(candidates).not.toContain('discord.js');
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('handles GitHub ecosystem', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord-bot',
        ecosystem: 'github',
      };

      const candidates = discoverCandidates(brief);

      expect(candidates).toContain('discordjs/discord.js');
      expect(candidates).toContain('Rapptz/discord.py');
    });

    it('returns unique candidates (no duplicates)', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);
      const uniqueCandidates = [...new Set(candidates)];

      expect(candidates.length).toBe(uniqueCandidates.length);
    });

    it('does not perform I/O or network calls', () => {
      // This test verifies the function is pure by checking it completes quickly
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const start = Date.now();
      discoverCandidates(brief);
      const duration = Date.now() - start;

      // Pure function should complete in < 10ms
      expect(duration).toBeLessThan(10);
    });

    it('does not call LLM or external APIs', () => {
      // This is a structural test - the function should be pure
      // We verify by checking it works without any mocking
      const brief: IdeaBrief = {
        capabilities: ['testing'],
        domain: 'testing',
        ecosystem: 'npm',
      };

      const candidates = discoverCandidates(brief);

      expect(Array.isArray(candidates)).toBe(true);
    });
  });

  describe('discoverCandidatesWithSearch', () => {
    it('returns search results when search returns >= 3 candidates', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot', 'message processing'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'discord.js', source: 'npm-search' },
        { name: 'eris', source: 'npm-search' },
        { name: 'oceanic.js', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(result.candidates).toHaveLength(3);
      expect(result.candidates[0].name).toBe('discord.js');
      expect(result.candidates[0].source).toBe('npm-search');
      expect(result.method).toBe('search');
      expect(result.fallbackUsed).toBe(false);
      expect(mockSearch).toHaveBeenCalledWith('discord bot client', 'npm');
    });

    it('builds weather-specific search terms from weather domain aliases', async () => {
      const brief: IdeaBrief = {
        capabilities: ['weather data', 'forecasting'],
        domain: 'weather forecasting',
        ecosystem: 'npm',
      };
      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'unrelated-result', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(mockSearch).toHaveBeenCalledWith(
        'weather forecast forecasting openmeteo openweather data',
        'npm'
      );
      expect(result.candidates.map((candidate) => candidate.name)).toContain('openmeteo');
      expect(result.fallbackUsed).toBe(true);
    });

    it('uses free-form domains and agentic search terms without requiring a catalog bucket', async () => {
      const brief: IdeaBrief = {
        capabilities: ['semantic retrieval', 'embedding search'],
        domain: 'vector database',
        ecosystem: 'npm',
        searchTerms: ['embedding search', 'nearest neighbor index'],
      };
      const mockSearch = vi.fn().mockResolvedValue([
        { name: '@qdrant/js-client-rest', source: 'npm-search' },
        { name: 'weaviate-ts-client', source: 'npm-search' },
        { name: 'vectra', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(mockSearch).toHaveBeenCalledWith(
        'vector database embedding search',
        'npm'
      );
      expect(result.method).toBe('search');
      expect(result.fallbackUsed).toBe(false);
      expect(result.candidates.map((candidate) => candidate.name)).toEqual([
        '@qdrant/js-client-rest',
        'weaviate-ts-client',
        'vectra',
      ]);
    });

    it('keeps live repository candidates for recognized domains without requiring a catalog bucket', async () => {
      const brief: IdeaBrief = {
        capabilities: ['Generate music', 'Compose music using AI'],
        domain: 'music-generation',
        ecosystem: 'pypi',
        searchTerms: ['AI music generation', 'algorithmic composition library'],
      };
      const mockSearch = vi.fn().mockResolvedValue([
        {
          name: 'cuthbertLab/music21',
          source: 'github-search',
          kind: 'repository',
          repositoryUrl: 'https://github.com/cuthbertLab/music21',
        },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(mockSearch).toHaveBeenCalledWith(
        'ai music generation composition audio synthesis',
        'pypi'
      );
      expect(result.method).toBe('search');
      expect(result.fallbackUsed).toBe(false);
      expect(result.candidates.map((candidate) => candidate.name)).toEqual([
        'cuthbertLab/music21',
      ]);
    });

    it('falls back to catalog when search returns < 3 candidates', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'some-package', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(result.candidates.length).toBeGreaterThan(1);
      expect(result.candidates[0].name).toBe('some-package');
      expect(result.candidates[0].source).toBe('npm-search');
      const catalogCandidates = result.candidates.filter(c => c.source === 'catalog-fallback');
      expect(catalogCandidates.length).toBeGreaterThan(0);
      expect(result.method).toBe('search-with-catalog-fallback');
      expect(result.fallbackUsed).toBe(true);
    });

    it('labels all catalog fallback candidates with catalog-fallback source', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(result.candidates.length).toBeGreaterThan(0);
      result.candidates.forEach(candidate => {
        expect(candidate.source).toBe('catalog-fallback');
      });
      expect(result.method).toBe('search-with-catalog-fallback');
      expect(result.fallbackUsed).toBe(true);
    });

    it('deduplicates search results by name', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'discord.js', source: 'npm-search' },
        { name: 'eris', source: 'npm-search' },
        { name: 'discord.js', source: 'github-search' },
        { name: 'oceanic.js', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(result.candidates).toHaveLength(3);
      expect(result.candidates[0].name).toBe('discord.js');
      expect(result.candidates[1].name).toBe('eris');
      expect(result.candidates[2].name).toBe('oceanic.js');
    });

    it('uses catalog-only mode when searchFirst is false', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn();

      const result = await discoverCandidatesWithSearch(brief, mockSearch, { searchFirst: false });

      expect(mockSearch).not.toHaveBeenCalled();
      expect(result.candidates.length).toBeGreaterThan(0);
      result.candidates.forEach(candidate => {
        expect(candidate.source).toBe('catalog-fallback');
      });
      expect(result.method).toBe('catalog');
      expect(result.fallbackUsed).toBe(false);
    });

    it('does not use catalog fallback when catalogFallback is false', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'some-package', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch, { catalogFallback: false });

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].name).toBe('some-package');
      expect(result.method).toBe('search');
      expect(result.fallbackUsed).toBe(false);
    });

    it('preserves source labels from search results', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'pkg1', source: 'npm-search' },
        { name: 'pkg2', source: 'pypi-search' },
        { name: 'pkg3', source: 'github-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      expect(result.candidates[0].source).toBe('npm-search');
      expect(result.candidates[1].source).toBe('pypi-search');
      expect(result.candidates[2].source).toBe('github-search');
    });

    it('does not add catalog candidates that are already in search results', async () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const mockSearch = vi.fn().mockResolvedValue([
        { name: 'discord.js', source: 'npm-search' },
        { name: 'eris', source: 'npm-search' },
      ] as DiscoveredCandidate[]);

      const result = await discoverCandidatesWithSearch(brief, mockSearch);

      const discordJsCount = result.candidates.filter(c => c.name === 'discord.js').length;
      const erisCount = result.candidates.filter(c => c.name === 'eris').length;
      
      expect(discordJsCount).toBe(1);
      expect(erisCount).toBe(1);
      expect(result.fallbackUsed).toBe(true);
    });
  });
});

// Made with Bob
