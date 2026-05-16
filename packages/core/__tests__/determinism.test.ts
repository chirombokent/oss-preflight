import { describe, it, expect } from 'vitest';
import { scoreAndRank } from '../src/scorer.js';
import { serializeRecommendation } from '../src/serializer.js';
import type { Candidate, IdeaBrief } from '../src/types.js';

describe('Determinism Test (AC #7) - BLOCKER if fails', () => {
  it('produces byte-identical JSON across 10 runs', () => {
    // Frozen fixture
    const brief: IdeaBrief = {
      capabilities: ['bot', 'message processing', 'scheduled summarization'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'discord.js',
        version: '14.11.0',
        ecosystem: 'npm',
        homepageUrl: 'https://discord.js.org',
        repositoryUrl: 'https://github.com/discordjs/discord.js',
      },
      {
        name: 'eris',
        version: '0.17.0',
        ecosystem: 'npm',
        repositoryUrl: 'https://github.com/abalabahaha/eris',
      },
      {
        name: 'discord.py',
        version: '2.3.0',
        ecosystem: 'npm',
        repositoryUrl: 'https://github.com/Rapptz/discord.py',
      },
    ];

    // Run scorer + serializer 10 times
    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      expect(recommendations.length).toBeGreaterThan(0);
      const json = serializeRecommendation(recommendations[0]!);
      results.push(json);
    }

    // Verify all results are byte-identical
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(first);
    }

    // Also verify the full array is stable
    const fullResults: string[] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      const json = JSON.stringify(recommendations);
      fullResults.push(json);
    }

    const firstFull = fullResults[0];
    for (let i = 1; i < fullResults.length; i++) {
      expect(fullResults[i]).toBe(firstFull);
    }
  });

  it('produces stable ranking across runs', () => {
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

    const rankings: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      const ranks = recommendations.map(r => r.rank);
      rankings.push(ranks);
    }

    // All rankings should be identical
    const first = JSON.stringify(rankings[0]);
    for (let i = 1; i < rankings.length; i++) {
      expect(JSON.stringify(rankings[i])).toBe(first);
    }
  });

  it('produces stable scores across runs', () => {
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

    const scores: number[] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      expect(recommendations.length).toBeGreaterThan(0);
      scores.push(recommendations[0]!.score);
    }

    // All scores should be identical
    const first = scores[0];
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBe(first);
    }
  });

  it('produces stable subscores across runs', () => {
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

    const subscoresList: string[] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      expect(recommendations.length).toBeGreaterThan(0);
      const subscores = JSON.stringify(recommendations[0]!.subscores);
      subscoresList.push(subscores);
    }

    // All subscores should be identical
    const first = subscoresList[0];
    for (let i = 1; i < subscoresList.length; i++) {
      expect(subscoresList[i]).toBe(first);
    }
  });
});

// Made with Bob
