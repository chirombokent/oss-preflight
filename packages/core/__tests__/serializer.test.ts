import { describe, it, expect } from 'vitest';
import { serializeRecommendation } from '../src/serializer.js';
import type { Recommendation } from '../src/types.js';

describe('serializer.ts', () => {
  describe('serializeRecommendation', () => {
    it('serializes a complete recommendation', () => {
      const recommendation: Recommendation = {
        rank: 1,
        score: 87.5,
        candidate: {
          name: 'discord.js',
          version: '14.11.0',
          ecosystem: 'npm',
          homepageUrl: 'https://discord.js.org',
          repositoryUrl: 'https://github.com/discordjs/discord.js',
        },
        subscores: {
          goalFit: 95,
          repoCompat: 85,
          maintenance: 85,
          safety: 80,
          community: 95,
          docsQuality: 80,
        },
        passport: {
          facts: {
            license: {
              value: 'Apache-2.0',
              source: 'https://registry.npmjs.org/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'npm',
            },
            weeklyDownloads: {
              value: 1200000,
              source: 'https://registry.npmjs.org/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'npm',
            },
            lastCommit: {
              value: '2026-05-14T15:22:00Z',
              source: 'https://api.github.com/repos/discordjs/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'github',
            },
            stars: {
              value: 27500,
              source: 'https://api.github.com/repos/discordjs/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'github',
            },
            openIssues: null,
            openssfScore: null,
          },
          interpretation: {
            goalFit: 'Excellent match',
            compatibility: 'TypeScript/JavaScript',
            tradeoffs: ['Large footprint'],
            warnings: [],
            recommendedAlongside: ['typescript'],
          },
        },
        scaffoldAvailable: true,
        templateId: 'discord-summary-bot',
      };

      const json = serializeRecommendation(recommendation);
      const parsed = JSON.parse(json);

      expect(parsed.rank).toBe(1);
      expect(parsed.score).toBe(87.5);
      expect(parsed.candidate.name).toBe('discord.js');
      expect(parsed.passport.facts.license.value).toBe('Apache-2.0');
    });

    it('emits null fields explicitly, never omits them', () => {
      const recommendation: Recommendation = {
        rank: 1,
        score: 50,
        candidate: {
          name: 'test-package',
          version: '1.0.0',
          ecosystem: 'npm',
          homepageUrl: null,
          repositoryUrl: null,
        },
        subscores: {
          goalFit: 50,
          repoCompat: 50,
          maintenance: 50,
          safety: 50,
          community: 50,
          docsQuality: 50,
        },
        passport: {
          facts: {
            license: null,
            weeklyDownloads: null,
            lastCommit: null,
            stars: null,
            openIssues: null,
            openssfScore: null,
          },
          interpretation: {
            goalFit: 'Unknown',
            compatibility: 'Unknown',
            tradeoffs: [],
            warnings: ['Limited evidence'],
            recommendedAlongside: [],
          },
        },
        scaffoldAvailable: false,
        templateId: null,
      };

      const json = serializeRecommendation(recommendation);
      const parsed = JSON.parse(json);

      // Verify null fields are present in JSON
      expect(parsed.candidate.homepageUrl).toBe(null);
      expect(parsed.candidate.repositoryUrl).toBe(null);
      expect(parsed.passport.facts.license).toBe(null);
      expect(parsed.passport.facts.weeklyDownloads).toBe(null);
      expect(parsed.passport.facts.lastCommit).toBe(null);
      expect(parsed.passport.facts.stars).toBe(null);
      expect(parsed.passport.facts.openIssues).toBe(null);
      expect(parsed.passport.facts.openssfScore).toBe(null);
      expect(parsed.templateId).toBe(null);

      // Verify keys exist in the JSON string
      expect(json).toContain('"homepageUrl":null');
      expect(json).toContain('"license":null');
      expect(json).toContain('"templateId":null');
    });

    it('rejects incomplete evidence (missing required fields)', () => {
      const incomplete = {
        rank: 1,
        score: 50,
        candidate: {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
        },
        subscores: {
          goalFit: 50,
          repoCompat: 50,
          maintenance: 50,
          safety: 50,
          community: 50,
          docsQuality: 50,
        },
        // Missing passport entirely
        scaffoldAvailable: false,
        templateId: null,
      };

      expect(() => serializeRecommendation(incomplete as any)).toThrow();
    });

    it('produces deterministic output for same input', () => {
      const recommendation: Recommendation = {
        rank: 1,
        score: 75,
        candidate: {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/test/test',
        },
        subscores: {
          goalFit: 75,
          repoCompat: 75,
          maintenance: 75,
          safety: 75,
          community: 75,
          docsQuality: 75,
        },
        passport: {
          facts: {
            license: null,
            weeklyDownloads: null,
            lastCommit: null,
            stars: null,
            openIssues: null,
            openssfScore: null,
          },
          interpretation: {
            goalFit: 'Good',
            compatibility: 'Compatible',
            tradeoffs: [],
            warnings: [],
            recommendedAlongside: [],
          },
        },
        scaffoldAvailable: false,
        templateId: null,
      };

      const json1 = serializeRecommendation(recommendation);
      const json2 = serializeRecommendation(recommendation);
      const json3 = serializeRecommendation(recommendation);

      expect(json1).toBe(json2);
      expect(json2).toBe(json3);
    });

    it('handles arrays consistently', () => {
      const recommendation: Recommendation = {
        rank: 1,
        score: 80,
        candidate: {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/test/test',
        },
        subscores: {
          goalFit: 80,
          repoCompat: 80,
          maintenance: 80,
          safety: 80,
          community: 80,
          docsQuality: 80,
        },
        passport: {
          facts: {
            license: null,
            weeklyDownloads: null,
            lastCommit: null,
            stars: null,
            openIssues: null,
            openssfScore: null,
          },
          interpretation: {
            goalFit: 'Good',
            compatibility: 'Compatible',
            tradeoffs: ['tradeoff1', 'tradeoff2'],
            warnings: ['warning1'],
            recommendedAlongside: ['pkg1', 'pkg2', 'pkg3'],
          },
        },
        scaffoldAvailable: false,
        templateId: null,
      };

      const json = serializeRecommendation(recommendation);
      const parsed = JSON.parse(json);

      expect(parsed.passport.interpretation.tradeoffs).toEqual(['tradeoff1', 'tradeoff2']);
      expect(parsed.passport.interpretation.warnings).toEqual(['warning1']);
      expect(parsed.passport.interpretation.recommendedAlongside).toEqual(['pkg1', 'pkg2', 'pkg3']);
    });
  });
});

// Made with Bob
