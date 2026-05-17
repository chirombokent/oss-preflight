import { describe, expect, it } from 'vitest';
import { discoverCandidates, scoreAndRank } from '../src/index.js';
import type { Candidate, IdeaBrief } from '../src/types.js';

describe('weather domain recommendations', () => {
  it('discovers weather packages from a provider-style weather forecasting domain', () => {
    const brief: IdeaBrief = {
      capabilities: ['weather data', 'forecasting'],
      domain: 'weather forecasting',
      ecosystem: 'npm',
    };

    const candidates = discoverCandidates(brief);

    expect(candidates).toContain('openmeteo');
    expect(candidates).toContain('openweather-api-node');
    expect(candidates).not.toContain('@matter/general');
  });

  it('ranks weather packages above broad registry hits', () => {
    const brief: IdeaBrief = {
      capabilities: ['weather data', 'forecasting'],
      domain: 'weather forecasting',
      ecosystem: 'npm',
    };
    const candidates: Candidate[] = [
      {
        name: '@matter/general',
        version: '0.16.11',
        ecosystem: 'npm',
        homepageUrl: 'https://github.com/matter-js/matter.js',
        repositoryUrl: 'https://github.com/matter-js/matter.js',
      },
      {
        name: 'openmeteo',
        version: '1.2.3',
        ecosystem: 'npm',
        homepageUrl: 'https://github.com/open-meteo/typescript#readme',
        repositoryUrl: 'https://github.com/open-meteo/typescript',
      },
      {
        name: '@sentry/core',
        version: '10.53.1',
        ecosystem: 'npm',
        homepageUrl: 'https://github.com/getsentry/sentry-javascript/tree/master/packages/core',
        repositoryUrl: 'https://github.com/getsentry/sentry-javascript',
      },
    ];

    const recommendations = scoreAndRank(candidates, brief);
    const matter = recommendations.find((rec) => rec.candidate.name === '@matter/general');

    expect(recommendations[0]!.candidate.name).toBe('openmeteo');
    expect(matter?.subscores.goalFit).toBeLessThan(recommendations[0]!.subscores.goalFit);
  });

  it('does not treat general functionality as a strong domain match', () => {
    const brief: IdeaBrief = {
      capabilities: ['general functionality'],
      domain: 'general',
      ecosystem: 'npm',
    };
    const candidates: Candidate[] = [{
      name: '@matter/general',
      version: '0.16.11',
      ecosystem: 'npm',
      homepageUrl: 'https://github.com/matter-js/matter.js',
      repositoryUrl: 'https://github.com/matter-js/matter.js',
    }];

    const recommendations = scoreAndRank(candidates, brief);

    expect(recommendations[0]!.subscores.goalFit).toBeLessThanOrEqual(50);
  });
});

