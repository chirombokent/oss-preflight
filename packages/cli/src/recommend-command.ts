import Anthropic from '@anthropic-ai/sdk';
import type {
  IdeaBrief,
  Candidate,
  Recommendation,
  CandidateFacts,
  EvidenceMap,
} from '@oss-preflight/core';
import { discoverCandidates, scoreAndRank } from '@oss-preflight/core';
import {
  collectNpmData,
  collectGitHubData,
  collectOpenSSFData,
} from '@oss-preflight/collectors';

type EvidenceFact = CandidateFacts['license'];
type SourceType = NonNullable<EvidenceFact>['sourceType'];

/**
 * Collected-data inputs for a single candidate, as returned by the collectors.
 * Kept structural so {@link buildCandidateFacts} stays a pure, I/O-free mapper.
 */
export interface CollectedInputs {
  npm?: {
    metadata: { license?: string | null };
    weeklyDownloads: number | null;
    sourceUrl: string;
    collectedAt: string;
  };
  github?: {
    repo: {
      stargazers_count: number | null;
      open_issues_count: number | null;
      pushed_at: string | null;
    };
    sourceUrl: string;
    collectedAt: string;
  };
  openssf?: {
    score: number | null;
    sourceUrl: string;
    collectedAt: string;
  };
}

/**
 * Build one `EvidenceFact`, or `null` when the value is missing. Missing
 * evidence is always an explicit `null` — never invented, never omitted.
 */
function makeFact(
  value: string | number | null | undefined,
  source: string,
  collectedAt: string,
  sourceType: SourceType
): EvidenceFact {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return { value, source, collectedAt, sourceType };
}

/**
 * Pure mapper: collected registry/repo data → the passport `facts` block.
 * No I/O; deterministic for a fixed input.
 */
export function buildCandidateFacts(inputs: CollectedInputs): CandidateFacts {
  const { npm, github, openssf } = inputs;

  return {
    license: npm
      ? makeFact(npm.metadata.license ?? null, npm.sourceUrl, npm.collectedAt, 'npm')
      : null,
    weeklyDownloads: npm
      ? makeFact(npm.weeklyDownloads, npm.sourceUrl, npm.collectedAt, 'npm')
      : null,
    lastCommit: github
      ? makeFact(github.repo.pushed_at ?? null, github.sourceUrl, github.collectedAt, 'github')
      : null,
    stars: github
      ? makeFact(github.repo.stargazers_count ?? null, github.sourceUrl, github.collectedAt, 'github')
      : null,
    openIssues: github
      ? makeFact(github.repo.open_issues_count ?? null, github.sourceUrl, github.collectedAt, 'github')
      : null,
    openssfScore: openssf
      ? makeFact(openssf.score, openssf.sourceUrl, openssf.collectedAt, 'openssf')
      : null,
  };
}

/**
 * Recommend Command - Phase P3
 * 
 * Full pipeline: Claude intent parser → discovery → collectors → scoring → output
 * Claude adapter lives in CLI (not core), preserving core's zero-I/O property
 * 
 * On Claude API error: falls back to keyword-based intent parsing
 */

const DEMO_PACKAGE_FALLBACKS: Record<string, Partial<Candidate>> = {
  'discord.js': {
    version: '14.14.1',
    homepageUrl: 'https://discord.js.org',
    repositoryUrl: 'https://github.com/discordjs/discord.js',
  },
  eris: {
    version: '0.17.2',
    repositoryUrl: 'https://github.com/abalabahaha/eris',
  },
};

function normalizeRepositoryUrl(repositoryUrl?: string): string | null {
  if (!repositoryUrl) {
    return null;
  }

  return repositoryUrl
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');
}

/**
 * Extract `owner/repo` from a GitHub URL, or null if it is not a GitHub repo.
 */
function parseGitHubRepo(repositoryUrl?: string | null): string | null {
  const normalized = normalizeRepositoryUrl(repositoryUrl ?? undefined);
  if (!normalized) {
    return null;
  }
  const match = normalized.match(/github\.com[/:]([^/]+)\/([^/]+?)\/?$/i);
  if (!match) {
    return null;
  }
  return `${match[1]}/${match[2]}`;
}

/**
 * Check environment variables
 * Throws if ANTHROPIC_API_KEY is missing (exit code 3)
 */
export function checkEnvironment(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  // GITHUB_TOKEN is optional - higher rate limits if present
}

/**
 * Validate user input
 * Throws if idea is empty (exit code 2)
 */
export function validateInput(idea: string): void {
  if (!idea || idea.trim().length === 0) {
    throw new Error('Idea string cannot be empty');
  }
}

/**
 * Create Claude adapter with deterministic settings
 * temperature=0, seed=42 for reproducible output
 */
export function createClaudeAdapter(apiKey: string) {
  const client = new Anthropic({ apiKey });
  
  return async (idea: string): Promise<IdeaBrief> => {
    const response = await client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 1024,
      temperature: 0,
      // @ts-ignore - seed parameter exists but may not be in types yet
      seed: 42,
      messages: [{
        role: 'user',
        content: `Parse this software idea into structured intent. Extract:
- capabilities (array of strings)
- domain (string)
- targetUser (string, optional)
- ecosystem (one of: npm, pypi, github)

Idea: "${idea}"

Respond with ONLY valid JSON matching this schema:
{
  "capabilities": ["string"],
  "domain": "string",
  "targetUser": "string",
  "ecosystem": "npm|pypi|github"
}`
      }]
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      capabilities: parsed.capabilities || [],
      domain: parsed.domain || 'general',
      targetUser: parsed.targetUser,
      ecosystem: parsed.ecosystem || 'npm',
      constraints: {}
    };
  };
}

/**
 * Keyword-based fallback parser
 * Extracts ecosystem and domain from keywords when Claude fails
 */
export function keywordParser(idea: string): IdeaBrief {
  const lowerIdea = idea.toLowerCase();
  
  // Detect ecosystem
  let ecosystem: 'npm' | 'pypi' | 'github' = 'npm';
  if (lowerIdea.includes('python') || lowerIdea.includes('django') || lowerIdea.includes('flask')) {
    ecosystem = 'pypi';
  } else if (lowerIdea.includes('npm') || lowerIdea.includes('node') || lowerIdea.includes('javascript') || lowerIdea.includes('typescript')) {
    ecosystem = 'npm';
  }
  
  // Detect domain
  let domain = 'general';
  if (lowerIdea.includes('discord')) {
    domain = 'discord';
  } else if (lowerIdea.includes('bot')) {
    domain = 'bot';
  } else if (lowerIdea.includes('web') || lowerIdea.includes('api')) {
    domain = 'web';
  }
  
  // Extract capabilities (simple keyword extraction)
  const capabilities: string[] = [];
  if (lowerIdea.includes('summarize') || lowerIdea.includes('summary')) {
    capabilities.push('summarization');
  }
  if (lowerIdea.includes('message') || lowerIdea.includes('chat')) {
    capabilities.push('message processing');
  }
  if (lowerIdea.includes('schedule') || lowerIdea.includes('cron')) {
    capabilities.push('scheduling');
  }
  
  if (capabilities.length === 0) {
    capabilities.push('general functionality');
  }
  
  return {
    capabilities,
    domain,
    ecosystem,
    constraints: {}
  };
}

/**
 * Parse intent with Claude, fall back to keyword parsing on error
 */
export async function parseIntentWithFallback(
  idea: string,
  claudeAdapter?: (idea: string) => Promise<IdeaBrief>
): Promise<IdeaBrief> {
  if (!claudeAdapter) {
    // No Claude adapter provided, use keyword parser
    return keywordParser(idea);
  }
  
  try {
    return await claudeAdapter(idea);
  } catch (error) {
    // Claude failed - fall back to keyword parsing
    console.error('Claude API error, falling back to keyword parsing:', (error as Error).message);
    return keywordParser(idea);
  }
}

/**
 * Gather evidence for candidates using the collectors.
 *
 * Returns enriched candidates plus an {@link EvidenceMap} of sourced facts.
 * Every collector call is best-effort: a failure degrades that fact to an
 * explicit `null` (see {@link buildCandidateFacts}) and never aborts the
 * pipeline — the live demo must never break on a flaky upstream API.
 */
async function gatherEvidence(
  candidates: Candidate[],
  forceRefresh: boolean
): Promise<{ candidates: Candidate[]; evidence: EvidenceMap }> {
  const evidence: EvidenceMap = {};

  const enriched = await Promise.all(candidates.map(async (candidate) => {
    if (candidate.ecosystem !== 'npm') {
      return candidate;
    }

    let resolved: Candidate;
    const inputs: CollectedInputs = {};

    try {
      const npmData = await collectNpmData(candidate.name, forceRefresh);
      resolved = {
        ...candidate,
        version: npmData.metadata.version,
        homepageUrl: npmData.metadata.homepage ?? candidate.homepageUrl,
        repositoryUrl:
          normalizeRepositoryUrl(npmData.metadata.repository?.url) ?? candidate.repositoryUrl,
      };
      inputs.npm = {
        metadata: { license: npmData.metadata.license ?? null },
        weeklyDownloads: npmData.weeklyDownloads,
        sourceUrl: npmData.sourceUrl,
        collectedAt: npmData.collectedAt,
      };
    } catch {
      const fallback = DEMO_PACKAGE_FALLBACKS[candidate.name.toLowerCase()];
      resolved = {
        ...candidate,
        ...fallback,
        version: fallback?.version ?? candidate.version,
      };
    }

    // Repo-derived evidence (GitHub + OpenSSF), best-effort.
    const ownerRepo = parseGitHubRepo(resolved.repositoryUrl);
    if (ownerRepo) {
      try {
        const gh = await collectGitHubData(ownerRepo, forceRefresh);
        inputs.github = {
          repo: {
            stargazers_count: gh.repo.stargazers_count ?? null,
            open_issues_count: gh.repo.open_issues_count ?? null,
            pushed_at: gh.repo.pushed_at ?? null,
          },
          sourceUrl: gh.sourceUrl,
          collectedAt: gh.collectedAt,
        };
      } catch {
        // Rate limited / unavailable → GitHub facts stay null.
      }

      try {
        const ossf = await collectOpenSSFData(ownerRepo, forceRefresh);
        inputs.openssf = {
          score: ossf.score,
          sourceUrl: ossf.sourceUrl,
          collectedAt: ossf.collectedAt,
        };
      } catch {
        // Unavailable → OpenSSF fact stays null.
      }
    }

    evidence[candidate.name] = buildCandidateFacts(inputs);
    return resolved;
  }));

  return { candidates: enriched, evidence };
}

/**
 * Run the full recommendation pipeline
 */
export async function runRecommendPipeline(
  idea: string,
  options: {
    refresh?: boolean;
    apiKey?: string;
    claudeAdapter?: (idea: string) => Promise<IdeaBrief>;
    collectEvidence?: boolean;
  } = {}
): Promise<{ recommendations: Recommendation[]; brief: IdeaBrief }> {
  // Validate input
  validateInput(idea);

  // Claude is the preferred intent parser but it is optional: when no API key
  // is available we degrade to keyword parsing (reduced capability) instead of
  // failing the whole pipeline. `checkEnvironment` remains the strict gate for
  // callers that require Claude.
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  const claudeAdapter =
    options.claudeAdapter || (apiKey ? createClaudeAdapter(apiKey) : undefined);
  const brief = await parseIntentWithFallback(idea, claudeAdapter);
  
  // Discover candidates
  const candidateNames = discoverCandidates(brief);
  
  // Convert names to Candidate objects
  // In P3, we use the discovery catalog which provides basic candidate info
  const candidates: Candidate[] = candidateNames.map((name: string) => ({
    name,
    version: '1.0.0', // Placeholder - collectors will provide real version
    ecosystem: brief.ecosystem,
    homepageUrl: null,
    repositoryUrl: null
  }));
  
  // Gather evidence (collectors integration)
  let enrichedCandidates = candidates;
  let evidence: EvidenceMap | undefined;
  if (options.collectEvidence !== false) {
    const gathered = await gatherEvidence(candidates, options.refresh || false);
    enrichedCandidates = gathered.candidates;
    evidence = gathered.evidence;
  }

  // Score and rank (evidence-aware when collectors returned facts)
  const recommendations = scoreAndRank(enrichedCandidates, brief, undefined, evidence);
  
  // Return top 3
  return {
    recommendations: recommendations.slice(0, 3),
    brief
  };
}

/**
 * Main recommend command handler
 */
export async function recommendCommand(
  idea: string,
  options: {
    json?: boolean;
    format?: 'table' | 'json' | 'md';
    refresh?: boolean;
  }
): Promise<void> {
  try {
    await runRecommendPipeline(idea, {
      refresh: options.refresh
    });
    
    // Output will be handled by the CLI index
    // This function is a stub for the actual command handler
    return;
  } catch (error) {
    if ((error as Error).message.includes('ANTHROPIC_API_KEY')) {
      process.exit(3); // Config error
    } else if ((error as Error).message.includes('empty')) {
      process.exit(2); // User input error
    } else {
      console.error('Error:', (error as Error).message);
      process.exit(1); // Collector/API error
    }
  }
}

// Made with Bob
