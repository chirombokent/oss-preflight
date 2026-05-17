import { describe, it, expect } from 'vitest';
import { scoreAndRank } from '../src/scorer.js';
import { serializeRecommendation } from '../src/serializer.js';
import type { Candidate, IdeaBrief, EvidenceMap } from '../src/types.js';

/**
 * GAP 1 — the Evidence Passport must reflect real collected facts when the
 * I/O layer injects them, while preserving the explicit-null contract for
 * missing evidence (core stays zero-I/O; collectors live in the CLI).
 */
describe('Evidence injection into the passport', () => {
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

  const facts: EvidenceMap = {
    'discord.js': {
      license: {
        value: 'Apache-2.0',
        source: 'https://registry.npmjs.org/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'npm',
      },
      weeklyDownloads: {
        value: 1500000,
        source: 'https://api.npmjs.org/downloads/point/last-week/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'npm',
      },
      lastCommit: {
        value: '2026-05-14T00:00:00Z',
        source: 'https://api.github.com/repos/discordjs/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'github',
      },
      stars: {
        value: 26000,
        source: 'https://api.github.com/repos/discordjs/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'github',
      },
      openIssues: {
        value: 40,
        source: 'https://api.github.com/repos/discordjs/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'github',
      },
      openssfScore: {
        value: 6.7,
        source: 'https://api.securityscorecards.dev/projects/github.com/discordjs/discord.js',
        collectedAt: '2026-05-17T00:00:00Z',
        sourceType: 'openssf',
      },
    },
  };

  it('populates passport.facts from injected evidence', () => {
    const [rec] = scoreAndRank(candidates, brief, undefined, facts);

    expect(rec!.passport.facts.license).toEqual(facts['discord.js']!.license);
    expect(rec!.passport.facts.weeklyDownloads?.value).toBe(1500000);
    expect(rec!.passport.facts.stars?.sourceType).toBe('github');
    expect(rec!.passport.facts.openssfScore?.value).toBe(6.7);
  });

  it('serializes injected facts (not null) for a sourced candidate', () => {
    const [rec] = scoreAndRank(candidates, brief, undefined, facts);
    const json = serializeRecommendation(rec!);

    expect(json).toContain('"Apache-2.0"');
    expect(json).not.toContain('"license":null');
  });

  it('keeps every fact null when no evidence is injected (missing-evidence path)', () => {
    const [rec] = scoreAndRank(candidates, brief);

    expect(rec!.passport.facts.license).toBe(null);
    expect(rec!.passport.facts.weeklyDownloads).toBe(null);
    expect(rec!.passport.facts.lastCommit).toBe(null);
    expect(rec!.passport.facts.stars).toBe(null);
    expect(rec!.passport.facts.openIssues).toBe(null);
    expect(rec!.passport.facts.openssfScore).toBe(null);
  });

  it('leaves facts null for candidates absent from the evidence map', () => {
    const otherOnly: EvidenceMap = {
      'unrelated-pkg': {
        license: {
          value: 'MIT',
          source: 'https://registry.npmjs.org/unrelated-pkg',
          collectedAt: '2026-05-17T00:00:00Z',
          sourceType: 'npm',
        },
        weeklyDownloads: null,
        lastCommit: null,
        stars: null,
        openIssues: null,
        openssfScore: null,
      },
    };

    const [rec] = scoreAndRank(candidates, brief, undefined, otherOnly);

    expect(rec!.passport.facts.license).toBe(null);
  });
});

/**
 * GAP 2 — when real evidence is injected, scoring must actually respond to it
 * (no longer pure name-list heuristics), while remaining deterministic for a
 * fixed evidence input and unchanged when no evidence is supplied.
 */
describe('Evidence-driven scoring', () => {
  const brief: IdeaBrief = {
    capabilities: ['bot'],
    domain: 'discord',
    ecosystem: 'npm',
  };

  const candidate: Candidate = {
    name: 'some-lib',
    version: '2.0.0',
    ecosystem: 'npm',
    repositoryUrl: 'https://github.com/acme/some-lib',
  };

  function factsWith(overrides: Partial<CandidateFacts>): EvidenceMap {
    const base: CandidateFacts = {
      license: null,
      weeklyDownloads: null,
      lastCommit: null,
      stars: null,
      openIssues: null,
      openssfScore: null,
    };
    return { 'some-lib': { ...base, ...overrides } };
  }

  it('rewards a higher OpenSSF score with a higher safety subscore', () => {
    const low = factsWith({
      openssfScore: { value: 2.0, source: 'https://api.securityscorecards.dev/x', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'openssf' },
    });
    const high = factsWith({
      openssfScore: { value: 9.0, source: 'https://api.securityscorecards.dev/x', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'openssf' },
    });

    const lowSafety = scoreAndRank([candidate], brief, undefined, low)[0]!.subscores.safety;
    const highSafety = scoreAndRank([candidate], brief, undefined, high)[0]!.subscores.safety;

    expect(highSafety).toBeGreaterThan(lowSafety);
  });

  it('rewards more GitHub stars with a higher community subscore', () => {
    const few = factsWith({
      stars: { value: 50, source: 'https://api.github.com/repos/acme/some-lib', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'github' },
    });
    const many = factsWith({
      stars: { value: 50000, source: 'https://api.github.com/repos/acme/some-lib', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'github' },
    });

    const fewCommunity = scoreAndRank([candidate], brief, undefined, few)[0]!.subscores.community;
    const manyCommunity = scoreAndRank([candidate], brief, undefined, many)[0]!.subscores.community;

    expect(manyCommunity).toBeGreaterThan(fewCommunity);
  });

  it('rewards a more recent last commit with a higher maintenance subscore', () => {
    const stale = factsWith({
      lastCommit: { value: '2021-01-01T00:00:00Z', source: 'https://api.github.com/repos/acme/some-lib', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'github' },
    });
    const fresh = factsWith({
      lastCommit: { value: '2026-05-10T00:00:00Z', source: 'https://api.github.com/repos/acme/some-lib', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'github' },
    });

    const staleMaint = scoreAndRank([candidate], brief, undefined, stale)[0]!.subscores.maintenance;
    const freshMaint = scoreAndRank([candidate], brief, undefined, fresh)[0]!.subscores.maintenance;

    expect(freshMaint).toBeGreaterThan(staleMaint);
  });

  it('is deterministic for a fixed evidence input', () => {
    const ev = factsWith({
      stars: { value: 1234, source: 'https://api.github.com/repos/acme/some-lib', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'github' },
      openssfScore: { value: 5.5, source: 'https://api.securityscorecards.dev/x', collectedAt: '2026-05-17T00:00:00Z', sourceType: 'openssf' },
    });

    const a = JSON.stringify(scoreAndRank([candidate], brief, undefined, ev));
    const b = JSON.stringify(scoreAndRank([candidate], brief, undefined, ev));
    const c = JSON.stringify(scoreAndRank([candidate], brief, undefined, ev));

    expect(b).toBe(a);
    expect(c).toBe(a);
  });
});

// Made with Bob
