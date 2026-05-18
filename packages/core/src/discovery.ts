import type { IdeaBrief } from './types.js';
import { canonicalizeDomain } from './domain.js';
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
  description?: string;
}

/**
 * Discovery result with method and fallback info
 */
export interface DiscoveryResult {
  candidates: DiscoveredCandidate[];
  method: DiscoveryMethod;
  fallbackUsed: boolean;
  query?: string;
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
  const { ecosystem } = brief;
  const domain = canonicalizeDomain(brief.domain);

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
      fallbackUsed: false,
      query: buildSearchQuery(brief)
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
        fallbackUsed: false,
        query
      };
    }

    return {
      candidates: [...deduplicated, ...catalogWithSource],
      method: 'search-with-catalog-fallback',
      fallbackUsed: catalogWithSource.length > 0,
      query
    };
  }

  return {
    candidates: deduplicated,
    method: 'search',
    fallbackUsed: false,
    query
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
    weather: ['weather', 'forecast', 'forecasting', 'openmeteo', 'openweather'],
    'web-framework': ['web', 'framework', 'http', 'server', 'routing'],
    'data-science': ['data', 'science', 'dataframe', 'csv', 'notebook'],
    'music-generation': ['ai music', 'music generation', 'music composition', 'audio synthesis', 'midi'],
    testing: ['testing', 'unit', 'test', 'runner'],
    'http-client': ['http', 'client', 'request', 'fetch'],
  };

  const domain = canonicalizeDomain(brief.domain);
  const domainParts = domainQueries[domain] ?? (domain === 'general' ? [] : [domain.replace(/-/g, ' ')]);

  // Registry/GitHub search ANDs every term, so a long keyword soup matches
  // nothing. Keep the query tight: the domain anchor plus the single most
  // specific phrase the intent parser produced. `liveSearchFn` derives
  // narrower n-gram variants from this for the cascade.
  const focusPhrase = brief.searchTerms?.[0] ?? brief.capabilities[0];
  const parts = [...domainParts, ...(focusPhrase ? [focusPhrase] : [])];
  const deduped = dedupeQueryParts(parts);

  // Dedupe at the token level (a phrase part may repeat a word already used as
  // a domain anchor) and hard cap at 6 tokens - past this, search relevance
  // collapses because registries AND every term together.
  const seenTokens = new Set<string>();
  const tokens: string[] = [];
  for (const token of deduped.join(' ').split(/\s+/)) {
    const key = token.toLowerCase();
    if (!key || seenTokens.has(key)) {
      continue;
    }
    seenTokens.add(key);
    tokens.push(token);
    if (tokens.length === 6) {
      break;
    }
  }
  return tokens.length > 0 ? tokens.join(' ') : 'software package';
}

function dedupeQueryParts(parts: string[]): string[] {
  const seen = new Set<string>();
  const generic = new Set(['general', 'functionality', 'general functionality']);
  const result: string[] = [];

  for (const part of parts) {
    const normalized = part.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!normalized || generic.has(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(part.trim());
  }

  return result.length > 0 ? result : ['software package'];
}

// Made with Bob
