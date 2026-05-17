import type {
  IdeaBrief,
  Candidate,
  Recommendation,
  CandidateFacts,
  EvidenceMap,
} from '@oss-preflight/core';
import {
  discoverCandidatesWithSearch,
  scoreAndRank,
  type DiscoveredCandidate,
  type DiscoveryResult,
} from '@oss-preflight/core';
import {
  collectNpmData,
  collectGitHubData,
  collectOpenSSFData,
  searchNpm,
  searchPyPI,
  searchGitHub,
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
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

type EvidenceFact = CandidateFacts['license'];
type SourceType = NonNullable<EvidenceFact>['sourceType'];
type RetrievalSource = NonNullable<EvidenceFact>['retrievalSource'];

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
    retrievalSource: RetrievalSource;
  };
  pypi?: {
    metadata: { license?: string | null };
    sourceUrl: string;
    collectedAt: string;
    retrievalSource: RetrievalSource;
  };
  github?: {
    repo: {
      stargazers_count: number | null;
      open_issues_count: number | null;
      pushed_at: string | null;
    };
    sourceUrl: string;
    collectedAt: string;
    retrievalSource: RetrievalSource;
  };
  openssf?: {
    score: number | null;
    sourceUrl: string;
    collectedAt: string;
    retrievalSource: RetrievalSource;
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
  sourceType: SourceType,
  retrievalSource: RetrievalSource
): EvidenceFact {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return { value, source, collectedAt, sourceType, retrievalSource };
}

/**
 * Pure mapper: collected registry/repo data → the passport `facts` block.
 * No I/O; deterministic for a fixed input.
 */
export function buildCandidateFacts(inputs: CollectedInputs): CandidateFacts {
  const { npm, pypi, github, openssf } = inputs;

  return {
    license: npm
      ? makeFact(npm.metadata.license ?? null, npm.sourceUrl, npm.collectedAt, 'npm', npm.retrievalSource)
      : pypi
        ? makeFact(pypi.metadata.license ?? null, pypi.sourceUrl, pypi.collectedAt, 'pypi', pypi.retrievalSource)
        : null,
    weeklyDownloads: npm
      ? makeFact(npm.weeklyDownloads, npm.sourceUrl, npm.collectedAt, 'npm', npm.retrievalSource)
      : null,
    lastCommit: github
      ? makeFact(github.repo.pushed_at ?? null, github.sourceUrl, github.collectedAt, 'github', github.retrievalSource)
      : null,
    stars: github
      ? makeFact(github.repo.stargazers_count ?? null, github.sourceUrl, github.collectedAt, 'github', github.retrievalSource)
      : null,
    openIssues: github
      ? makeFact(github.repo.open_issues_count ?? null, github.sourceUrl, github.collectedAt, 'github', github.retrievalSource)
      : null,
    openssfScore: openssf
      ? makeFact(openssf.score, openssf.sourceUrl, openssf.collectedAt, 'openssf', openssf.retrievalSource)
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

/**
 * Search adapter signature consumed by core's `discoverCandidatesWithSearch`.
 */
export type SearchFn = (
  query: string,
  ecosystem: string
) => Promise<DiscoveredCandidate[]>;

/**
 * Live registry search adapter.
 *
 * Routes the query to the ecosystem-appropriate registry search and maps
 * results to source-labelled discovered candidates. Every search is
 * best-effort (the underlying collectors degrade to `[]` on failure), so a
 * flaky upstream never aborts discovery — core then falls back to the catalog.
 */
export async function liveSearchFn(
  query: string,
  ecosystem: string
): Promise<DiscoveredCandidate[]> {
  if (ecosystem === 'pypi') {
    const results = await searchPyPI(query);
    return results.map((r) => ({ name: r.name, source: 'pypi-search' as const }));
  }

  if (ecosystem === 'github') {
    const results = await searchGitHub(query);
    return results.map((r) => ({ name: r.name, source: 'github-search' as const }));
  }

  // Default to npm registry search.
  const results = await searchNpm(query);
  return results.map((r) => ({ name: r.name, source: 'npm-search' as const }));
}

export interface RecommendPipelineOptions extends AiConfigOptions {
  refresh?: boolean;
  collectEvidence?: boolean;
  intentParser?: IntentParser | IntentParserFn;
  /**
   * Backward-compatible test hook for older callers. Prefer `intentParser`.
   */
  claudeAdapter?: IntentParserFn;
  save?: boolean;
  /**
   * Disable live registry search and use the catalog only. Used by tests and
   * offline runs that need deterministic candidates.
   */
  catalogOnly?: boolean;
  /**
   * Injected search adapter (test hook). Defaults to {@link liveSearchFn}.
   */
  searchFn?: SearchFn;
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
        retrievalSource: npmData.source,
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
          retrievalSource: gh.source,
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
          retrievalSource: ossf.source,
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
 * Response wrapper for saved recommendations
 */
export interface RecommendationWrapper {
  workflowId: string;
  timestamp: string;
  idea: string;
  brief: IdeaBrief;
  recommendations: Recommendation[];
}

/**
 * Save recommendations to .oss-preflight/recommendations/latest.json
 */
export function saveRecommendations(
  idea: string,
  brief: IdeaBrief,
  recommendations: Recommendation[]
): void {
  const wrapper: RecommendationWrapper = {
    workflowId: randomUUID(),
    timestamp: new Date().toISOString(),
    idea,
    brief,
    recommendations,
  };

  const outputDir = path.join(process.cwd(), '.oss-preflight', 'recommendations');
  const outputPath = path.join(outputDir, 'latest.json');

  // Create directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Write the wrapper
  fs.writeFileSync(outputPath, JSON.stringify(wrapper, null, 2), 'utf-8');
}

/**
 * Run the full recommendation pipeline
 */
export async function runRecommendPipeline(
  idea: string,
  options: RecommendPipelineOptions = {}
): Promise<{
  recommendations: Recommendation[];
  brief: IdeaBrief;
  discovery: DiscoveryResult;
}> {
  // Validate input
  validateInput(idea);

  const suppliedParser = options.intentParser ?? options.claudeAdapter;
  const intentParser = suppliedParser ?? createIntentParser(resolveAiConfig(options));
  const brief = await parseIntentWithFallback(idea, intentParser);

  // Discover candidates via live registry search, falling back to the curated
  // catalog only when search yields too few results (or catalogOnly is set).
  const searchFn = options.searchFn ?? liveSearchFn;
  const discovery = await discoverCandidatesWithSearch(brief, searchFn, {
    searchFirst: options.catalogOnly !== true,
    catalogFallback: true,
  });

  // Convert discovered names to Candidate objects. Versions/URLs are filled in
  // by the collectors during evidence gathering.
  const candidates: Candidate[] = discovery.candidates.map((c: DiscoveredCandidate) => ({
    name: c.name,
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
  const topRecommendations = recommendations.slice(0, 3);

  // Save if requested
  if (options.save) {
    saveRecommendations(idea, brief, topRecommendations);
  }

  return {
    recommendations: topRecommendations,
    brief,
    discovery
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
