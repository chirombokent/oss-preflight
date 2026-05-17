import { readCache, writeCache } from './cache/index.js';

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
      source: 'npm-search' as const
    }));
    
    // Cache the results
    await writeCache('npm-search', cacheKey, results, 'live');
    
    return results;
  } catch (error) {
    // Graceful degradation - return empty array, don't crash
    return [];
  }
}

/**
 * Search PyPI registry
 * 
 * Uses PyPI XML-RPC API for search
 * Returns package name, version, and description
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
    // Use PyPI's simple search endpoint (JSON API)
    // Note: PyPI doesn't have a great search API, so we use a simple approach
    const url = `https://pypi.org/search/?q=${encodeURIComponent(query)}&o=`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'oss-preflight'
      }
    });
    
    if (!response.ok) {
      // Graceful degradation - return empty array on error
      return [];
    }
    
    const html = await response.text();
    
    // Parse HTML to extract package names and descriptions
    // This is a simple regex-based parser for the PyPI search results page
    const packageRegex = /<a class="package-snippet"[^>]*href="\/project\/([^/]+)\/[^>]*>[\s\S]*?<span class="package-snippet__name">([^<]+)<\/span>[\s\S]*?<p class="package-snippet__description">([^<]*)<\/p>/g;
    
    const results: SearchResult[] = [];
    let match;
    let count = 0;
    
    while ((match = packageRegex.exec(html)) !== null && count < limit) {
      if (match[2] && match[3]) {
        results.push({
          name: match[2].trim(),
          description: match[3].trim(),
          source: 'pypi-search' as const
        });
        count++;
      }
    }
    
    // Cache the results
    await writeCache('pypi-search', cacheKey, results, 'live');
    
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
      source: 'github-search' as const
    }));
    
    // Cache the results
    await writeCache('github-search', cacheKey, results, 'live');
    
    return results;
  } catch (error) {
    // Graceful degradation - return empty array, don't crash
    return [];
  }
}

// Made with Bob