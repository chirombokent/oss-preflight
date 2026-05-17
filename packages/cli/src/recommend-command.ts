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
import {
  createAnthropicIntentParser,
  createIntentParser,
  isAiConfigError,
  keywordParser,
  resolveAiConfig,
  type AiConfigOptions,
  type IntentParser,
  type IntentParserFn,
} from './ai/index.js';

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
 * Full pipeline: AI intent parser -> discovery -> collectors -> scoring -> output
 * Provider adapters live in CLI (not core), preserving core's zero-I/O property
 * 
 * On AI provider error: falls back to keyword-based intent parsing
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

export interface RecommendPipelineOptions extends AiConfigOptions {
  refresh?: boolean;
  collectEvidence?: boolean;
  intentParser?: IntentParser | IntentParserFn;
  /**
   * Backward-compatible test hook for older callers. Prefer `intentParser`.
   */
  claudeAdapter?: IntentParserFn;
}

function parseWith(parser: IntentParser | IntentParserFn, idea: string): Promise<IdeaBrief> {
  return typeof parser === 'function' ? parser(idea) : parser.parse(idea);
}

function parserName(parser: IntentParser | IntentParserFn): string {
  return typeof parser === 'function' ? 'AI provider' : `${parser.provider} provider`;
}

/**
 * Check AI provider configuration. No configured provider is valid and means
 * OSS Preflight will use keyword parsing. Explicit provider misconfiguration
 * is a config error (CLI exit code 3).
 */
export function checkEnvironment(options: AiConfigOptions = {}): void {
  resolveAiConfig(options);
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

export { keywordParser };

export function createClaudeAdapter(apiKey: string): IntentParserFn {
  const parser = createAnthropicIntentParser({
    apiKey,
    model: 'claude-haiku-3-5-20241022',
    baseUrl: 'https://api.anthropic.com',
  });
  return (idea: string) => parser.parse(idea);
}

/**
 * Parse intent with the selected provider, falling back to keyword parsing on
 * provider failures. Config errors are raised before this point.
 */
export async function parseIntentWithFallback(
  idea: string,
  intentParser?: IntentParser | IntentParserFn
): Promise<IdeaBrief> {
  if (!intentParser) {
    return keywordParser(idea);
  }
  
  try {
    return await parseWith(intentParser, idea);
  } catch (error) {
    console.error(
      `${parserName(intentParser)} error, falling back to keyword intent parsing:`,
      (error as Error).message
    );
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
  options: RecommendPipelineOptions = {}
): Promise<{ recommendations: Recommendation[]; brief: IdeaBrief }> {
  // Validate input
  validateInput(idea);

  const suppliedParser = options.intentParser ?? options.claudeAdapter;
  const intentParser = suppliedParser ?? createIntentParser(resolveAiConfig(options));
  const brief = await parseIntentWithFallback(idea, intentParser);
  
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
  options: RecommendPipelineOptions & {
    json?: boolean;
    format?: 'table' | 'json' | 'md';
  }
): Promise<void> {
  try {
    await runRecommendPipeline(idea, options);
    
    // Output will be handled by the CLI index
    // This function is a stub for the actual command handler
    return;
  } catch (error) {
    if (isAiConfigError(error)) {
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
