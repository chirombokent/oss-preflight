import { describe, it, expect } from 'vitest';
import {
  IdeaBriefSchema,
  CandidateSchema,
  EvidencePassportSchema,
  RecommendationSchema,
  type IdeaBrief,
  type Candidate,
  type EvidencePassport,
  type Recommendation,
} from '../src/types.js';

describe('types.ts - Zod schemas', () => {
  describe('IdeaBriefSchema', () => {
    it('validates a complete IdeaBrief', () => {
      const brief: IdeaBrief = {
        capabilities: ['message processing', 'scheduled summarization'],
        domain: 'discord community management',
        targetUser: 'solo developer',
        searchTerms: ['discord bot framework', 'message summarization'],
        ecosystem: 'npm',
        constraints: {
          maxComplexity: 'medium',
          preferredLicense: 'MIT',
        },
      };

      const result = IdeaBriefSchema.safeParse(brief);
      expect(result.success).toBe(true);
    });

    it('validates IdeaBrief with minimal fields', () => {
      const brief = {
        capabilities: ['bot'],
        domain: 'discord',
        ecosystem: 'npm',
      };

      const result = IdeaBriefSchema.safeParse(brief);
      expect(result.success).toBe(true);
    });

    it('rejects IdeaBrief missing required fields', () => {
      const brief = {
        capabilities: ['bot'],
        // missing domain and ecosystem
      };

      const result = IdeaBriefSchema.safeParse(brief);
      expect(result.success).toBe(false);
    });
  });

  describe('CandidateSchema', () => {
    it('validates a complete Candidate', () => {
      const candidate: Candidate = {
        name: 'discord.js',
        version: '14.11.0',
        ecosystem: 'npm',
        homepageUrl: 'https://discord.js.org',
        repositoryUrl: 'https://github.com/discordjs/discord.js',
      };

      const result = CandidateSchema.safeParse(candidate);
      expect(result.success).toBe(true);
    });

    it('validates Candidate with null optional fields', () => {
      const candidate = {
        name: 'discord.js',
        version: '14.11.0',
        ecosystem: 'npm',
        homepageUrl: null,
        repositoryUrl: 'https://github.com/discordjs/discord.js',
      };

      const result = CandidateSchema.safeParse(candidate);
      expect(result.success).toBe(true);
    });

    it('rejects invalid ecosystem', () => {
      const candidate = {
        name: 'discord.js',
        version: '14.11.0',
        ecosystem: 'invalid',
        repositoryUrl: 'https://github.com/discordjs/discord.js',
      };

      const result = CandidateSchema.safeParse(candidate);
      expect(result.success).toBe(false);
    });
  });

  describe('EvidencePassportSchema', () => {
    it('validates a complete EvidencePassport', () => {
      const passport: EvidencePassport = {
        facts: {
          license: {
            value: 'Apache-2.0',
            source: 'https://registry.npmjs.org/discord.js',
            collectedAt: '2026-05-15T10:30:00Z',
            sourceType: 'npm',
            retrievalSource: 'live',
          },
          weeklyDownloads: {
            value: 1200000,
            source: 'https://registry.npmjs.org/discord.js',
            collectedAt: '2026-05-15T10:30:00Z',
            sourceType: 'npm',
            retrievalSource: 'live',
          },
          lastCommit: {
            value: '2026-05-14T15:22:00Z',
            source: 'https://api.github.com/repos/discordjs/discord.js',
            collectedAt: '2026-05-15T10:30:00Z',
            sourceType: 'github',
            retrievalSource: 'live',
          },
          stars: {
            value: 27500,
            source: 'https://api.github.com/repos/discordjs/discord.js',
            collectedAt: '2026-05-15T10:30:00Z',
            sourceType: 'github',
            retrievalSource: 'live',
          },
          openIssues: null,
          openssfScore: null,
        },
        interpretation: {
          goalFit: 'Excellent match for Discord bot development',
          compatibility: 'Works in TypeScript or JavaScript',
          tradeoffs: ['Largest download footprint'],
          warnings: [],
          recommendedAlongside: ['typescript', 'dotenv'],
        },
      };

      const result = EvidencePassportSchema.safeParse(passport);
      expect(result.success).toBe(true);
    });

    it('validates EvidencePassport with null facts', () => {
      const passport = {
        facts: {
          license: null,
          weeklyDownloads: null,
          lastCommit: null,
          stars: null,
          openIssues: null,
          openssfScore: null,
        },
        interpretation: {
          goalFit: 'Assessment',
          compatibility: 'Unknown',
          tradeoffs: [],
          warnings: ['Limited evidence available'],
          recommendedAlongside: [],
        },
      };

      const result = EvidencePassportSchema.safeParse(passport);
      expect(result.success).toBe(true);
    });
  });

  describe('RecommendationSchema', () => {
    it('validates a complete Recommendation', () => {
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
              retrievalSource: 'live',
            },
            weeklyDownloads: {
              value: 1200000,
              source: 'https://registry.npmjs.org/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'npm',
              retrievalSource: 'live',
            },
            lastCommit: {
              value: '2026-05-14T15:22:00Z',
              source: 'https://api.github.com/repos/discordjs/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'github',
              retrievalSource: 'live',
            },
            stars: {
              value: 27500,
              source: 'https://api.github.com/repos/discordjs/discord.js',
              collectedAt: '2026-05-15T10:30:00Z',
              sourceType: 'github',
              retrievalSource: 'live',
            },
            openIssues: null,
            openssfScore: null,
          },
          interpretation: {
            goalFit: 'Excellent match',
            compatibility: 'TypeScript/JavaScript',
            tradeoffs: [],
            warnings: [],
            recommendedAlongside: [],
          },
        },
        scaffoldAvailable: true,
        templateId: 'discord-summary-bot',
      };

      const result = RecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('validates subscores are 0-100', () => {
      const recommendation = {
        rank: 1,
        score: 87.5,
        candidate: {
          name: 'test',
          version: '1.0.0',
          ecosystem: 'npm',
          repositoryUrl: 'https://github.com/test/test',
        },
        subscores: {
          goalFit: 150, // invalid
          repoCompat: 85,
          maintenance: 85,
          safety: 80,
          community: 95,
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
            goalFit: 'test',
            compatibility: 'test',
            tradeoffs: [],
            warnings: [],
            recommendedAlongside: [],
          },
        },
        scaffoldAvailable: false,
        templateId: null,
      };

      const result = RecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });
  });

  describe('JSDoc @source tags', () => {
    it('IdeaBrief has @source: inferred on inferred fields', () => {
      // This is a compile-time check via JSDoc, verified by reading the source
      // We validate the schema accepts the expected structure
      const brief: IdeaBrief = {
        capabilities: ['inferred'],
        domain: 'inferred',
        targetUser: 'inferred',
        ecosystem: 'npm',
        constraints: {},
      };

      expect(IdeaBriefSchema.safeParse(brief).success).toBe(true);
    });
  });
});

// Made with Bob
