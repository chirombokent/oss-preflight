import { describe, it, expect } from 'vitest';
import { discoverCandidates } from '../src/discovery.js';
import { scoreAndRank } from '../src/scorer.js';
import type { IdeaBrief } from '../src/types.js';

describe('Discord-bot Fixture Test (AC #9)', () => {
  it('produces stable top-3 ranking with discord.js at rank 1', () => {
    // Frozen IdeaBrief fixture
    const brief: IdeaBrief = {
      capabilities: ['bot', 'message processing', 'scheduled summarization'],
      domain: 'discord',
      targetUser: 'solo developer',
      ecosystem: 'npm',
      constraints: {
        maxComplexity: 'medium',
      },
    };

    // Discovery returns expected candidates
    const candidateNames = discoverCandidates(brief);
    expect(candidateNames).toContain('discord.js');
    expect(candidateNames).toContain('discord.py');
    expect(candidateNames).toContain('eris');

    // Convert to Candidate objects
    const candidates = candidateNames.map(name => ({
      name,
      version: name === 'discord.js' ? '14.11.0' : 
               name === 'discord.py' ? '2.3.0' : '0.17.0',
      ecosystem: 'npm' as const,
      repositoryUrl: name === 'discord.js' ? 'https://github.com/discordjs/discord.js' :
                     name === 'discord.py' ? 'https://github.com/Rapptz/discord.py' :
                     'https://github.com/abalabahaha/eris',
      homepageUrl: name === 'discord.js' ? 'https://discord.js.org' : null,
    }));

    // Score and rank
    const recommendations = scoreAndRank(candidates, brief);

    // Verify exactly 3 recommendations
    expect(recommendations).toHaveLength(3);

    // Verify discord.js is rank 1
    expect(recommendations[0]!.candidate.name).toBe('discord.js');
    expect(recommendations[0]!.rank).toBe(1);

    // Verify ranks are sequential
    expect(recommendations[0]!.rank).toBe(1);
    expect(recommendations[1]!.rank).toBe(2);
    expect(recommendations[2]!.rank).toBe(3);
  });

  it('produces stable ranking across multiple runs', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot', 'message processing'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidateNames = discoverCandidates(brief);
    const candidates = candidateNames.map(name => ({
      name,
      version: '1.0.0',
      ecosystem: 'npm' as const,
      repositoryUrl: `https://github.com/test/${name}`,
    }));

    // Run 10 times
    const rankings: string[][] = [];
    for (let i = 0; i < 10; i++) {
      const recommendations = scoreAndRank(candidates, brief);
      const names = recommendations.map(r => r.candidate.name);
      rankings.push(names);
    }

    // All rankings should be identical
    const first = JSON.stringify(rankings[0]);
    for (let i = 1; i < rankings.length; i++) {
      expect(JSON.stringify(rankings[i])).toBe(first);
    }
  });

  it('discord.js has highest score', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidateNames = discoverCandidates(brief);
    const candidates = candidateNames.map(name => ({
      name,
      version: '1.0.0',
      ecosystem: 'npm' as const,
      repositoryUrl: `https://github.com/test/${name}`,
      homepageUrl: name === 'discord.js' ? 'https://discord.js.org' : null,
    }));

    const recommendations = scoreAndRank(candidates, brief);
    const discordJs = recommendations.find(r => r.candidate.name === 'discord.js');

    expect(discordJs).toBeDefined();
    expect(discordJs!.rank).toBe(1);
    
    // discord.js should have the highest score
    const maxScore = Math.max(...recommendations.map(r => r.score));
    expect(discordJs!.score).toBe(maxScore);
  });

  it('all recommendations have valid subscores', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidateNames = discoverCandidates(brief);
    const candidates = candidateNames.map(name => ({
      name,
      version: '1.0.0',
      ecosystem: 'npm' as const,
      repositoryUrl: `https://github.com/test/${name}`,
    }));

    const recommendations = scoreAndRank(candidates, brief);

    for (const rec of recommendations) {
      expect(rec.subscores.goalFit).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.goalFit).toBeLessThanOrEqual(100);
      expect(rec.subscores.repoCompat).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.repoCompat).toBeLessThanOrEqual(100);
      expect(rec.subscores.maintenance).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.maintenance).toBeLessThanOrEqual(100);
      expect(rec.subscores.safety).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.safety).toBeLessThanOrEqual(100);
      expect(rec.subscores.community).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.community).toBeLessThanOrEqual(100);
      expect(rec.subscores.docsQuality).toBeGreaterThanOrEqual(0);
      expect(rec.subscores.docsQuality).toBeLessThanOrEqual(100);
    }
  });

  it('all recommendations have evidence passports', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidateNames = discoverCandidates(brief);
    const candidates = candidateNames.map(name => ({
      name,
      version: '1.0.0',
      ecosystem: 'npm' as const,
      repositoryUrl: `https://github.com/test/${name}`,
    }));

    const recommendations = scoreAndRank(candidates, brief);

    for (const rec of recommendations) {
      expect(rec.passport).toBeDefined();
      expect(rec.passport.facts).toBeDefined();
      expect(rec.passport.interpretation).toBeDefined();
      expect(typeof rec.passport.interpretation.goalFit).toBe('string');
      expect(typeof rec.passport.interpretation.compatibility).toBe('string');
      expect(Array.isArray(rec.passport.interpretation.tradeoffs)).toBe(true);
      expect(Array.isArray(rec.passport.interpretation.warnings)).toBe(true);
      expect(Array.isArray(rec.passport.interpretation.recommendedAlongside)).toBe(true);
    }
  });

  it('discord.js has scaffold available', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot', 'message processing'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidateNames = discoverCandidates(brief);
    const candidates = candidateNames.map(name => ({
      name,
      version: '1.0.0',
      ecosystem: 'npm' as const,
      repositoryUrl: `https://github.com/test/${name}`,
    }));

    const recommendations = scoreAndRank(candidates, brief);
    const discordJs = recommendations.find(r => r.candidate.name === 'discord.js');

    expect(discordJs).toBeDefined();
    expect(discordJs!.scaffoldAvailable).toBe(true);
    expect(discordJs!.templateId).toBe('discord-summary-bot');
  });

  it('produces deterministic output for the fixture', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot', 'message processing', 'scheduled summarization'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const candidateNames = discoverCandidates(brief);
      const candidates = candidateNames.map(name => ({
        name,
        version: '1.0.0',
        ecosystem: 'npm' as const,
        repositoryUrl: `https://github.com/test/${name}`,
      }));

      const recommendations = scoreAndRank(candidates, brief);
      const json = JSON.stringify(recommendations);
      results.push(json);
    }

    // All results should be identical
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(first);
    }
  });
});

// Made with Bob
