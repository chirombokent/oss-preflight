import { readCache, writeCacheBestEffort } from './cache/index.js';

/**
 * Search result from any registry
 */
export interface SearchResult {
  name: string;
  version?: string;
  description?: string;
  score?: number;
  stars?: number;
  language?: string;
  homepageUrl?: string | null;
  repositoryUrl?: string | null;
  source: 'npm-search' | 'pypi-search' | 'github-search';
}

/**
 * npm registry search API response
 */
interface NpmSearchResponse {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      links?: {
        npm?: string;
        homepage?: string;
        repository?: string;
      };
    };
    score: {
      final: number;
    };
  }>;
}

/**
 * GitHub search API response
 */
interface GitHubSearchResponse {
  items: Array<{
    full_name: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    html_url: string;
  }>;
}


/**
 * Normalize search query for cache key
 */
function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * Create GitHub headers with optional auth
 */
function createGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'oss-preflight'
  };
  
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Check if GitHub response is rate limited
 */
function isGitHubRateLimited(response: Response): boolean {
  return response.status === 403 && 
         response.headers.get('X-RateLimit-Remaining') === '0';
}

/**
 * Search npm registry
 * 
 * Uses npm registry search API: https://registry.npmjs.org/-/v1/search
 * Returns package name, version, description, and relevance score
 */
export async function searchNpm(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const canonicalQuery = normalizeSearchQuery(query);
  const cacheKey = `${canonicalQuery}:${limit}`;
  
  // Check cache first
  const cached = await readCache<SearchResult[]>('npm-search', cacheKey);
  if (cached && !cached.error) {
    return cached.data.map(result => ({ ...result, source: 'npm-search' as const }));
  }
  
  try {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Graceful degradation - return empty array on error
      return [];
    }
    
    const data = await response.json() as NpmSearchResponse;
    
    const results: SearchResult[] = data.objects.map(obj => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description,
      score: obj.score.final,
      homepageUrl: obj.package.links?.homepage ?? null,
      repositoryUrl: obj.package.links?.repository ?? null,
      source: 'npm-search' as const
    }));
    
    // Cache writes are best-effort in hosted/serverless runtimes.
    await writeCacheBestEffort('npm-search', cacheKey, results, 'live');
    
    return results;
  } catch (error) {
    // Graceful degradation - return empty array, don't crash
    return [];
  }
}

/**
 * Generate candidate PyPI distribution names for a GitHub repo.
 *
 * The vast majority of Python projects publish under a name that is the repo
 * slug (or a trivial dash/underscore/`py-` variant of it). We try the cheap
 * heuristics first and verify each against the PyPI JSON API.
 */
function pypiNameCandidates(repoFullName: string): string[] {
  const slug = (repoFullName.split('/').pop() ?? repoFullName).toLowerCase().trim();
  const variants = new Set<string>();
  const add = (value: string): void => {
    const cleaned = value.trim();
    if (cleaned) {
      variants.add(cleaned);
    }
  };

  add(slug);
  add(slug.replace(/_/g, '-'));
  add(slug.replace(/-/g, '_'));
  add(slug.replace(/\.py$/, ''));
  add(slug.replace(/^(python|py)[-_]/, ''));
  add(slug.replace(/[-_](python|py)$/, ''));

  return [...variants];
}

/**
 * Resolve a GitHub repo to its real PyPI distribution name.
 *
 * PyPI no longer exposes a programmatic search API (the HTML search page is
 * behind an anti-bot challenge), so discovery is driven by GitHub repo search.
 * Each repo is mapped back to a PyPI package via the official JSON API
 * (`/pypi/{name}/json`), which is not bot-walled. Name heuristics are tried
 * first; the repo's `pyproject.toml` is consulted as a fallback.
 */
async function resolvePyPIPackage(
  repoFullName: string
): Promise<{ name: string; description?: string } | null> {
  const verify = async (
    candidate: string
  ): Promise<{ name: string; description?: string } | null> => {
    try {
      const response = await fetch(
        `https://pypi.org/pypi/${encodeURIComponent(candidate)}/json`,
        { headers: { Accept: 'application/json', 'User-Agent': 'oss-preflight' } }
      );
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { info?: { name?: string; summary?: string } };
      const name = data.info?.name;
      if (!name) {
        return null;
      }
      return { name, description: data.info?.summary ?? undefined };
    } catch {
      return null;
    }
  };

  for (const candidate of pypiNameCandidates(repoFullName).slice(0, 4)) {
    const resolved = await verify(candidate);
    if (resolved) {
      return resolved;
    }
  }

  // Fallback: read the published name from the repo's pyproject.toml.
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${repoFullName}/HEAD/pyproject.toml`,
      { headers: { 'User-Agent': 'oss-preflight' } }
    );
    if (response.ok) {
      const toml = await response.text();
      const nameMatch = toml.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
      if (nameMatch?.[1]) {
        return verify(nameMatch[1].trim());
      }
    }
  } catch {
    // Ignore - resolution is best-effort.
  }

  return null;
}

/**
 * Search for PyPI packages.
 *
 * PyPI has no usable search API, so candidates are discovered via GitHub repo
 * search (scoped to Python) and resolved back to verified PyPI distribution
 * names. Best-effort: any upstream failure degrades to an empty array.
 */
export async function searchPyPI(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const canonicalQuery = normalizeSearchQuery(query);
  const cacheKey = `${canonicalQuery}:${limit}`;

  // Check cache first
  const cached = await readCache<SearchResult[]>('pypi-search', cacheKey);
  if (cached && !cached.error) {
    return cached.data.map(result => ({ ...result, source: 'pypi-search' as const }));
  }

  try {
    const githubQuery = `${query} language:python`;
    const perPage = Math.min(limit * 2, 20);
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(githubQuery)}&sort=stars&order=desc&per_page=${perPage}`;

    const response = await fetch(url, { headers: createGitHubHeaders() });

    if (isGitHubRateLimited(response) || !response.ok) {
      // Graceful degradation - return empty array on rate limit / error
      return [];
    }

    const data = (await response.json()) as GitHubSearchResponse;

    const results: SearchResult[] = [];
    const seen = new Set<string>();

    for (const item of data.items) {
      if (results.length >= limit) {
        break;
      }
      const resolved = await resolvePyPIPackage(item.full_name);
      if (!resolved) {
        continue;
      }
      const key = resolved.name.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      results.push({
        name: resolved.name,
        description: resolved.description ?? item.description ?? undefined,
        stars: item.stargazers_count,
        source: 'pypi-search' as const
      });
    }

    // Cache writes are best-effort in hosted/serverless runtimes.
    await writeCacheBestEffort('pypi-search', cacheKey, results, 'live');

    return results;
  } catch (error) {
    // Graceful degradation - return empty array, don't crash
    return [];
  }
}

/**
 * Search GitHub repositories
 * 
 * Uses GitHub search API: https://api.github.com/search/repositories
 * Returns repository full_name, description, stars, and language
 */
export async function searchGitHub(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const canonicalQuery = normalizeSearchQuery(query);
  const cacheKey = `${canonicalQuery}:${limit}`;
  
  // Check cache first
  const cached = await readCache<SearchResult[]>('github-search', cacheKey);
  if (cached && !cached.error) {
    return cached.data.map(result => ({ ...result, source: 'github-search' as const }));
  }
  
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
    
    const response = await fetch(url, {
      headers: createGitHubHeaders()
    });
    
    if (isGitHubRateLimited(response)) {
      // Graceful degradation - return empty array on rate limit
      return [];
    }
    
    if (!response.ok) {
      // Graceful degradation - return empty array on error
      return [];
    }
    
    const data = await response.json() as GitHubSearchResponse;
    
    const results: SearchResult[] = data.items.map(item => ({
      name: item.full_name,
      description: item.description ?? undefined,
      stars: item.stargazers_count,
      language: item.language ?? undefined,
      repositoryUrl: item.html_url,
      source: 'github-search' as const
    }));
    
    // Cache writes are best-effort in hosted/serverless runtimes.
    await writeCacheBestEffort('github-search', cacheKey, results, 'live');
    
    return results;
  } catch (error) {
    // Graceful degradation - return empty array, don't crash
    return [];
  }
}

// Made with Bob
