import { describe, it, expect } from 'vitest';
import { scoreAndRank } from '../src/scorer.js';
import type { Candidate, IdeaBrief, RepoStack } from '../src/types.js';

describe('scorer.ts', () => {
  describe('scoreAndRank', () => {
    it('scores and ranks candidates', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot', 'message processing'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
        {
          name: 'eris',
          version: '0.17.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/abalabahaha/eris',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].rank).toBe(1);
      expect(recommendations[1].rank).toBe(2);
      expect(recommendations[0].score).toBeGreaterThanOrEqual(0);
      expect(recommendations[0].score).toBeLessThanOrEqual(100);
    });

    it('produces subscores for all 6 dimensions', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);
      const subscores = recommendations[0].subscores;

      expect(subscores.goalFit).toBeGreaterThanOrEqual(0);
      expect(subscores.goalFit).toBeLessThanOrEqual(100);
      expect(subscores.repoCompat).toBeGreaterThanOrEqual(0);
      expect(subscores.repoCompat).toBeLessThanOrEqual(100);
      expect(subscores.maintenance).toBeGreaterThanOrEqual(0);
      expect(subscores.maintenance).toBeLessThanOrEqual(100);
      expect(subscores.safety).toBeGreaterThanOrEqual(0);
      expect(subscores.safety).toBeLessThanOrEqual(100);
      expect(subscores.community).toBeGreaterThanOrEqual(0);
      expect(subscores.community).toBeLessThanOrEqual(100);
      expect(subscores.docsQuality).toBeGreaterThanOrEqual(0);
      expect(subscores.docsQuality).toBeLessThanOrEqual(100);
    });

    it('applies correct weights to subscores', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/test/test',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);
      const rec = recommendations[0];
      const subscores = rec.subscores;

      // Verify weighted average
      const expectedScore =
        subscores.goalFit * 0.30 +
        subscores.repoCompat * 0.25 +
        subscores.maintenance * 0.15 +
        subscores.safety * 0.15 +
        subscores.community * 0.10 +
        subscores.docsQuality * 0.05;

      expect(rec.score).toBeCloseTo(expectedScore, 1);
    });

    it('handles empty candidate array', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const recommendations = scoreAndRank([], brief);

      expect(recommendations).toEqual([]);
    });

    it('handles single candidate', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].rank).toBe(1);
    });

    it('is deterministic - same input produces same output', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
        {
          name: 'eris',
          version: '0.17.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/abalabahaha/eris',
        },
      ];

      const result1 = scoreAndRank(candidates, brief);
      const result2 = scoreAndRank(candidates, brief);
      const result3 = scoreAndRank(candidates, brief);

      expect(result1[0].score).toBe(result2[0].score);
      expect(result2[0].score).toBe(result3[0].score);
      expect(result1[0].rank).toBe(result2[0].rank);
    });

    it('includes evidence passport with null facts', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/test/test',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);
      const passport = recommendations[0].passport;

      expect(passport.facts.license).toBe(null);
      expect(passport.facts.weeklyDownloads).toBe(null);
      expect(passport.facts.lastCommit).toBe(null);
      expect(passport.facts.stars).toBe(null);
      expect(passport.facts.openIssues).toBe(null);
      expect(passport.facts.openssfScore).toBe(null);
    });

    it('includes interpretation fields', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);
      const interpretation = recommendations[0].passport.interpretation;

      expect(typeof interpretation.goalFit).toBe('string');
      expect(typeof interpretation.compatibility).toBe('string');
      expect(Array.isArray(interpretation.tradeoffs)).toBe(true);
      expect(Array.isArray(interpretation.warnings)).toBe(true);
      expect(Array.isArray(interpretation.recommendedAlongside)).toBe(true);
    });

    it('considers repo stack for compatibility scoring', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
      ];

      const repoStack: RepoStack = {
        ecosystem: 'npm',
        dependencies: ['typescript', 'express'],
        language: 'typescript',
      };

      const recommendations = scoreAndRank(candidates, brief, repoStack);

      expect(recommendations[0].subscores.repoCompat).toBeGreaterThan(0);
    });

    it('sets scaffoldAvailable and templateId', () => {
      const brief: IdeaBrief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const candidates: Candidate[] = [
        {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
      ];

      const recommendations = scoreAndRank(candidates, brief);

      expect(typeof recommendations[0].scaffoldAvailable).toBe('boolean');
      expect(recommendations[0].templateId === null || typeof recommendations[0].templateId === 'string').toBe(true);
    });
  });
});

// Made with Bob
