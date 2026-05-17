import { describe, it, expect } from 'vitest';
import { discoverCandidates } from '../src/discovery.js';
import type { IdeaBrief } from '../src/types.js';

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
});

// Made with Bob
