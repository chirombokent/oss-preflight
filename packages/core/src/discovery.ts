import type { IdeaBrief } from './types.js';
import discoveryCatalog from '../fixtures/discovery-catalog.json' with { type: 'json' };

type CatalogDomain = Record<string, string[]>;
type Catalog = Record<string, CatalogDomain>;

/**
 * Discovery method used to find candidates
 */
export type DiscoveryMethod = 'search' | 'catalog' | 'search-with-catalog-fallback';

/**
 * Discovery source for a candidate
 */
export type DiscoverySource = 'npm-search' | 'pypi-search' | 'github-search' | 'catalog-fallback';

/**
 * Candidate with discovery source
 */
export interface DiscoveredCandidate {
  name: string;
  source: DiscoverySource;
}

/**
 * Discovery result with method and fallback info
 */
export interface DiscoveryResult {
  candidates: DiscoveredCandidate[];
  method: DiscoveryMethod;
  fallbackUsed: boolean;
}

/**
 * Options for discovery with search
 */
export interface DiscoveryOptions {
  searchFirst?: boolean;
  catalogFallback?: boolean;
}

/**
 * Discover candidate packages based on idea brief
 *
 * Pure function - no I/O, no LLM calls
 * Uses deterministic demo catalog for Phase P1
 * Kept for backward compatibility
 *
 * @param brief - The parsed user intent
 * @returns Array of candidate package names
 */
export function discoverCandidates(brief: IdeaBrief): string[] {
  const { ecosystem, domain } = brief;

  // Get catalog for the ecosystem
  const catalog = discoveryCatalog as Catalog;
  const ecosystemCatalog = catalog[ecosystem];
  if (!ecosystemCatalog) {
    return [];
  }

  // Look up candidates by domain
  const candidates = ecosystemCatalog[domain];
  if (!candidates || !Array.isArray(candidates)) {
    return [];
  }

  // Return a copy to ensure immutability
  return [...candidates];
}

/**
 * Discover candidates with search-first flow
 *
 * This is an async wrapper that coordinates search and catalog fallback.
 * The actual search calls are injected as a parameter to keep core pure.
 *
 * Discovery order:
 * 1. Expand intent to search query (keyword-based for now)
 * 2. Search registries in parallel (via injected search function)
 * 3. Merge and deduplicate results
 * 4. Fallback to catalog if search returned < 3 candidates
 *
 * @param brief - The parsed user intent
 * @param searchFn - Injected search function (returns candidates with source labels)
 * @param options - Discovery options
 * @returns Discovery result with candidates, method, and fallback info
 */
export async function discoverCandidatesWithSearch(
  brief: IdeaBrief,
  searchFn: (query: string, ecosystem: string) => Promise<DiscoveredCandidate[]>,
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const { searchFirst = true, catalogFallback = true } = options;

  if (!searchFirst) {
    // Catalog-only mode
    const catalogCandidates = discoverCandidates(brief);
    return {
      candidates: catalogCandidates.map(name => ({
        name,
        source: 'catalog-fallback' as const
      })),
      method: 'catalog',
      fallbackUsed: false
    };
  }

  // Build search query from brief
  const query = buildSearchQuery(brief);

  // Search registries
  const searchResults = await searchFn(query, brief.ecosystem);

  // Deduplicate by name (keep first occurrence)
  const seen = new Set<string>();
  const deduplicated = searchResults.filter(candidate => {
    if (seen.has(candidate.name)) {
      return false;
    }
    seen.add(candidate.name);
    return true;
  });

  const catalogCandidates = catalogFallback ? discoverCandidates(brief) : [];
  const hasCatalogDomain = catalogCandidates.length > 0;

  // Top up known domains with curated catalog candidates even when live search
  // returns plenty of results. Registry search is broad; the catalog provides
  // deterministic, visibly labelled anchors for common project intents.
  const needsFallback = catalogFallback && (deduplicated.length < 3 || hasCatalogDomain);

  if (needsFallback) {
    // Add catalog candidates that aren't already in search results
    const catalogWithSource = catalogCandidates
      .filter(name => !seen.has(name))
      .map(name => ({
        name,
        source: 'catalog-fallback' as const
      }));

    if (catalogWithSource.length === 0 && deduplicated.length >= 3) {
      return {
        candidates: deduplicated,
        method: 'search',
        fallbackUsed: false
      };
    }

    return {
      candidates: [...deduplicated, ...catalogWithSource],
      method: 'search-with-catalog-fallback',
      fallbackUsed: catalogWithSource.length > 0
    };
  }

  return {
    candidates: deduplicated,
    method: 'search',
    fallbackUsed: false
  };
}

/**
 * Build search query from idea brief
 *
 * Simple keyword-based approach for now.
 * Future: could use AI to expand intent to better search terms.
 *
 * @param brief - The parsed user intent
 * @returns Search query string
 */
function buildSearchQuery(brief: IdeaBrief): string {
  const domainQueries: Record<string, string[]> = {
    discord: ['discord', 'bot', 'client'],
    'web-framework': ['web', 'framework', 'http', 'server', 'routing'],
    'data-science': ['data', 'science', 'dataframe', 'csv', 'notebook'],
    testing: ['testing', 'unit', 'test', 'runner'],
    'http-client': ['http', 'client', 'request', 'fetch'],
  };

  const parts = [
    ...(domainQueries[brief.domain] ?? [brief.domain]),
    ...brief.capabilities,
  ];
  return parts.join(' ');
}

// Made with Bob
