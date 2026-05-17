import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyze, ApiError, recommend, scaffold, testAiConnection } from '../src/api/client';
import type { Recommendation } from '@oss-preflight/core';

global.fetch = vi.fn();

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
      goalFit: 'Excellent fit for Discord bot development',
      compatibility: 'Compatible with Node.js 16+',
      tradeoffs: [],
      warnings: [],
      recommendedAlongside: [],
    },
  },
  scaffoldAvailable: true,
  templateId: 'discord-summary-bot',
};

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/analyze for recommendation requests', async () => {
    const mockResponse = {
      mode: 'recommend',
      detectedMode: 'recommend',
      input: 'Discord bot that summarizes channel activity',
      provider: 'keyword',
      recommendations: [mockRecommendation],
      ideas_parsed: {
        capabilities: ['Discord bot', 'summarization'],
        domain: 'chat automation',
        ecosystem: 'npm',
      },
      brief: {
        capabilities: ['Discord bot', 'summarization'],
        domain: 'chat automation',
        ecosystem: 'npm',
      },
      workflow: {
        workflowId: 'workflow-1',
        discoveryPlan: { searchMethod: 'registry-search', ecosystem: 'npm' },
        candidates: [],
        evidenceGaps: [],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recommend('Discord bot that summarizes channel activity');

    expect(global.fetch).toHaveBeenCalledWith('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 'Discord bot that summarizes channel activity',
        mode: 'recommend',
        provider: 'keyword',
      }),
    });
    expect(result.recommendations[0].candidate.name).toBe('discord.js');
  });

  it('calls POST /api/analyze with explicit audit mode', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mode: 'audit',
        detectedMode: 'audit',
        input: 'https://github.com/vitest-dev/vitest',
        provider: 'keyword',
        repoContext: {},
        summary: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, noRisk: 0 },
        dependencies: [],
        workflowId: 'workflow-2',
        workflow: {
          workflowId: 'workflow-2',
          discoveryPlan: { searchMethod: 'manifest', ecosystem: 'npm' },
          candidates: [],
          evidenceGaps: [],
        },
        report: '',
        artifacts: {},
      }),
    });

    const result = await analyze('https://github.com/vitest-dev/vitest', { provider: 'keyword' }, 'audit');

    expect(result.mode).toBe('audit');
    expect(global.fetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
      body: JSON.stringify({
        input: 'https://github.com/vitest-dev/vitest',
        mode: 'audit',
        provider: 'keyword',
      }),
    }));
  });

  it('validates session AI settings through /api/analyze', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        provider: 'keyword',
        message: 'Keyword mode is ready without a token.',
      }),
    });

    const result = await testAiConnection({ provider: 'keyword' });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
      body: JSON.stringify({
        testConnection: true,
        provider: 'keyword',
      }),
    }));
  });

  it('downloads scaffold zip from POST /api/scaffold', async () => {
    const blob = new Blob(['zip-content'], { type: 'application/zip' });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'Content-Disposition') return 'attachment; filename="discord.js-starter.zip"';
          if (name === 'X-OSS-Preflight-Scaffold-Type') return 'template';
          if (name === 'X-OSS-Preflight-Message') return 'Scaffold generated successfully';
          return null;
        },
      },
      blob: async () => blob,
    });

    const result = await scaffold(mockRecommendation);

    expect(result.fileName).toBe('discord.js-starter.zip');
    expect(result.type).toBe('template');
    expect(global.fetch).toHaveBeenCalledWith('/api/scaffold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recommendation: mockRecommendation }),
    });
  });

  it('preserves structured error details for toast rendering', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'API error', hint: 'Try again.', mode: 'recommend' }),
    });

    try {
      await recommend('test idea');
      throw new Error('Expected recommend to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        message: 'API error',
        status: 400,
        hint: 'Try again.',
        mode: 'recommend',
      });
    }
  });
});
