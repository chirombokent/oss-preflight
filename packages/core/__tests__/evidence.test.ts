import { describe, it, expect } from 'vitest';
import { scoreAndRank } from '../src/scorer.js';
import { serializeRecommendation } from '../src/serializer.js';
import type { Candidate, IdeaBrief } from '../src/types.js';

describe('Evidence Test (AC #8) - Missing signal handling', () => {
  it('handles missing evidence without crashing', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'unknown-package',
        version: '1.0.0',
        ecosystem: 'npm',
        // No homepageUrl, no repositoryUrl
      },
    ];

    // Should not crash
    expect(() => {
      const recommendations = scoreAndRank(candidates, brief);
      expect(recommendations).toHaveLength(1);
    }).not.toThrow();
  });

  it('emits null for missing evidence fields', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'test-package',
        version: '1.0.0',
        ecosystem: 'npm',
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const passport = recommendations[0]!.passport;

    // All facts should be null (no collectors in P1)
    expect(passport.facts.license).toBe(null);
    expect(passport.facts.weeklyDownloads).toBe(null);
    expect(passport.facts.lastCommit).toBe(null);
    expect(passport.facts.stars).toBe(null);
    expect(passport.facts.openIssues).toBe(null);
    expect(passport.facts.openssfScore).toBe(null);
  });

  it('serializes null fields explicitly', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'test-package',
        version: '1.0.0',
        ecosystem: 'npm',
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const json = serializeRecommendation(recommendations[0]!);

    // Verify null fields are present in JSON string
    expect(json).toContain('"license":null');
    expect(json).toContain('"weeklyDownloads":null');
    expect(json).toContain('"lastCommit":null');
    expect(json).toContain('"stars":null');
    expect(json).toContain('"openIssues":null');
    expect(json).toContain('"openssfScore":null');
  });

  it('labels missing evidence as (not available) in interpretation', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'unknown-domain',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'obscure-package',
        version: '0.1.0',
        ecosystem: 'npm',
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const interpretation = recommendations[0]!.passport.interpretation;

    // Should have warnings about limited evidence
    expect(interpretation.warnings.length).toBeGreaterThan(0);
    expect(interpretation.warnings.some(w => 
      w.toLowerCase().includes('limited') || 
      w.toLowerCase().includes('no repository')
    )).toBe(true);
  });

  it('still produces valid scores with missing evidence', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'minimal-package',
        version: '1.0.0',
        ecosystem: 'npm',
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const rec = recommendations[0]!;

    // Should still have valid scores
    expect(rec.score).toBeGreaterThanOrEqual(0);
    expect(rec.score).toBeLessThanOrEqual(100);
    expect(rec.subscores.goalFit).toBeGreaterThanOrEqual(0);
    expect(rec.subscores.goalFit).toBeLessThanOrEqual(100);
  });

  it('handles candidate with no version', () => {
    const brief: IdeaBrief = {
      capabilities: ['bot'],
      domain: 'discord',
      ecosystem: 'npm',
    };

    const candidates: Candidate[] = [
      {
        name: 'test',
        version: '',
        ecosystem: 'npm',
      },
    ];

    expect(() => {
      const recommendations = scoreAndRank(candidates, brief);
      expect(recommendations).toHaveLength(1);
    }).not.toThrow();
  });

  it('handles missing OpenSSF score gracefully', () => {
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
    const passport = recommendations[0]!.passport;

    // OpenSSF score should be null (not available in P1)
    expect(passport.facts.openssfScore).toBe(null);
    
    // But safety score should still be computed
    expect(recommendations[0]!.subscores.safety).toBeGreaterThan(0);
  });

  it('never silently omits evidence fields', () => {
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
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const json = serializeRecommendation(recommendations[0]!);
    const parsed = JSON.parse(json);

    // Verify all expected fact fields exist
    expect('license' in parsed.passport.facts).toBe(true);
    expect('weeklyDownloads' in parsed.passport.facts).toBe(true);
    expect('lastCommit' in parsed.passport.facts).toBe(true);
    expect('stars' in parsed.passport.facts).toBe(true);
    expect('openIssues' in parsed.passport.facts).toBe(true);
    expect('openssfScore' in parsed.passport.facts).toBe(true);
  });
});

// Made with Bob
