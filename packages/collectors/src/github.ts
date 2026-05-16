import { CollectorError, RateLimitError } from './errors.js';
import { readCache, writeCache } from './cache/index.js';

/**
 * GitHub repository API response
 */
export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
}

/**
 * GitHub contributor response
 */
interface GitHubContributor {
  login: string;
  contributions: number;
}

/**
 * Collected GitHub repository data
 */
export interface GitHubCollectedData {
  repo: GitHubRepoResponse;
  contributors: GitHubContributor[];
  contributorCount: number;
  sourceUrl: string;
  collectedAt: string;
}

/**
 * Normalize GitHub repo identifier (owner/repo)
 */
function normalizeGitHubRepo(ownerRepo: string): string {
  return ownerRepo.toLowerCase();
}

/**
 * Get GitHub token from environment
 */
function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}

/**
 * Create fetch headers with optional auth
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'oss-preflight'
  };
  
  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Check if response is rate limited
 */
function isRateLimited(response: Response): boolean {
  return response.status === 403 && 
         response.headers.get('X-RateLimit-Remaining') === '0';
}

/**
 * Fetch GitHub repository data
 */
async function fetchGitHubRepo(ownerRepo: string): Promise<GitHubRepoResponse> {
  const url = `https://api.github.com/repos/${ownerRepo}`;
  
  const response = await fetch(url, {
    headers: createHeaders()
  });
  
  if (response.status === 404) {
    throw new Error(`Repository not found: ${ownerRepo}`);
  }
  
  if (isRateLimited(response)) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const retryAfter = resetTime ? parseInt(resetTime, 10) - Math.floor(Date.now() / 1000) : undefined;
    throw new RateLimitError('github', retryAfter);
  }
  
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json() as GitHubRepoResponse;
}

/**
 * Fetch GitHub contributors
 */
async function fetchGitHubContributors(ownerRepo: string): Promise<GitHubContributor[]> {
  const url = `https://api.github.com/repos/${ownerRepo}/contributors?per_page=10`;
  
  try {
    const response = await fetch(url, {
      headers: createHeaders()
    });
    
    if (!response.ok) {
      // Contributors fetch is not critical - return empty array
      return [];
    }
    
    return await response.json() as GitHubContributor[];
  } catch {
    // Network error - return empty array
    return [];
  }
}

/**
 * Collect GitHub repository data with caching and rate-limit fallback
 */
export async function collectGitHubData(
  ownerRepo: string,
  forceRefresh = false
): Promise<GitHubCollectedData> {
  const canonicalId = normalizeGitHubRepo(ownerRepo);
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await readCache<GitHubCollectedData>('github', canonicalId);
    if (cached && !cached.error) {
      return {
        ...cached.data,
        collectedAt: cached.collectedAt
      };
    }
  }
  
  try {
    // Fetch live data
    const [repo, contributors] = await Promise.all([
      fetchGitHubRepo(ownerRepo),
      fetchGitHubContributors(ownerRepo)
    ]);
    
    const sourceUrl = `https://api.github.com/repos/${ownerRepo}`;
    const collectedAt = new Date().toISOString();
    
    const data: GitHubCollectedData = {
      repo,
      contributors,
      contributorCount: contributors.length,
      sourceUrl,
      collectedAt
    };
    
    // Cache the result
    await writeCache('github', canonicalId, data, 'live');
    
    return data;
  } catch (error) {
    // If rate limited, try to return cached data with cache-fallback source
    if (error instanceof RateLimitError) {
      const cached = await readCache<GitHubCollectedData>('github', canonicalId);
      if (cached && !cached.error) {
        // Return stale cache as fallback with updated source
        return {
          ...cached.data,
          collectedAt: cached.collectedAt
        };
      }
      
      // No cache available, rethrow
      throw error;
    }
    
    // For other errors, try to return cached data if available
    const cached = await readCache<GitHubCollectedData>('github', canonicalId);
    if (cached && !cached.error) {
      return {
        ...cached.data,
        collectedAt: cached.collectedAt
      };
    }
    
    // Cache the error
    await writeCache('github', canonicalId, { error: (error as Error).message }, 'live', true);
    
    throw new CollectorError('github', ownerRepo, error as Error);
  }
}

// Made with Bob
