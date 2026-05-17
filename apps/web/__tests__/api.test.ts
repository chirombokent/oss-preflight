import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recommend, scaffold } from '../src/api/client';
import type { Recommendation } from '@oss-preflight/core';

/**
 * API Integration Tests
 * AC14: Mock CLI spawn; assert POST /api/recommend returns valid JSON;
 * assert POST /api/scaffold returns file list
 */

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recommend', () => {
    it('should call POST /api/recommend with idea and return recommendations', async () => {
      const mockResponse = {
        recommendations: [
          {
            rank: 1,
            score: 85,
            candidate: {
              name: 'discord.js',
              version: '14.14.1',
              ecosystem: 'npm',
            },
            subscores: {
              goalFit: 90,
              repoCompat: 80,
              maintenance: 85,
              safety: 80,
              community: 90,
              docsQuality: 85,
            },
            passport: {
              facts: {
                license: { value: 'Apache-2.0', source: 'https://registry.npmjs.org/discord.js', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'npm' },
                weeklyDownloads: { value: 1000000, source: 'https://registry.npmjs.org/discord.js', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'npm' },
                lastCommit: null,
                stars: null,
                openIssues: null,
                openssfScore: null,
              },
              interpretation: {
                goalFit: 'Excellent fit for Discord bot development',
                compatibility: 'Compatible with Node.js 16+',
                tradeoffs: ['Large bundle size'],
                warnings: [],
                recommendedAlongside: ['@discordjs/rest'],
              },
            },
            scaffoldAvailable: true,
            templateId: 'discord-summary-bot',
          },
        ],
        ideas_parsed: {
          capabilities: ['Discord bot', 'summarization'],
          domain: 'chat automation',
          ecosystem: 'npm',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await recommend('Discord bot that summarizes channel activity');

      expect(global.fetch).toHaveBeenCalledWith('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: 'Discord bot that summarizes channel activity' }),
      });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].candidate.name).toBe('discord.js');
      expect(result.ideas_parsed.ecosystem).toBe('npm');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API error' }),
      });

      await expect(recommend('test idea')).rejects.toThrow('API error');
    });
  });

  describe('scaffold', () => {
    it('should call POST /api/scaffold and return file list', async () => {
      const mockRecommendation: Recommendation = {
        rank: 1,
        score: 85,
        candidate: {
          name: 'discord.js',
          version: '14.14.1',
          ecosystem: 'npm',
        },
        subscores: {
          goalFit: 90,
          repoCompat: 80,
          maintenance: 85,
          safety: 80,
          community: 90,
          docsQuality: 85,
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
        scaffoldAvailable: true,
        templateId: 'discord-summary-bot',
      };

      const mockResponse = {
        files: ['package.json', 'src/index.ts', 'README.md'],
        passed: true,
        output: 'Scaffold generated successfully',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await scaffold(mockRecommendation);

      expect(global.fetch).toHaveBeenCalledWith('/api/scaffold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendation: mockRecommendation }),
      });

      expect(result.files).toHaveLength(3);
      expect(result.passed).toBe(true);
      expect(result.output).toContain('successfully');
    });

    it('should throw error on scaffold failure', async () => {
      const mockRecommendation: any = { rank: 1 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Scaffold failed' }),
      });

      await expect(scaffold(mockRecommendation)).rejects.toThrow('Scaffold failed');
    });
  });
});

// Made with Bob
