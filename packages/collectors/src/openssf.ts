import { CollectorError } from './errors.js';
import { readCache, writeCache } from './cache/index.js';

/**
 * OpenSSF Scorecard API response
 */
export interface OpenSSFScorecard {
  date: string;
  repo: {
    name: string;
    commit: string;
  };
  scorecard: {
    version: string;
    commit: string;
  };
  score: number;
  checks: Array<{
    name: string;
    score: number;
    reason: string;
    details: string[];
  }>;
  metadata: string[];
}

/**
 * Collected OpenSSF data
 */
export interface OpenSSFCollectedData {
  scorecard: OpenSSFScorecard | null;
  score: number | null;
  sourceUrl: string;
  collectedAt: string;
}

/**
 * Normalize repository identifier for OpenSSF
 */
function normalizeRepoId(ownerRepo: string): string {
  return ownerRepo.toLowerCase();
}

/**
 * Fetch OpenSSF Scorecard data
 * Note: OpenSSF Scorecard API requires the full GitHub URL format
 */
async function fetchOpenSSFScore(ownerRepo: string): Promise<OpenSSFScorecard | null> {
  // OpenSSF Scorecard API endpoint
  const url = `https://api.securityscorecards.dev/projects/github.com/${ownerRepo}`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 404) {
      // Not all repos have OpenSSF scores - this is expected
      return null;
    }
    
    if (!response.ok) {
      // Service unavailable or other error - return null, not a failure
      return null;
    }
    
    return await response.json() as OpenSSFScorecard;
  } catch {
    // Network error or service unavailable - return null
    return null;
  }
}

/**
 * Collect OpenSSF Scorecard data with caching
 * Missing score returns null, not a failure
 */
export async function collectOpenSSFData(
  ownerRepo: string,
  forceRefresh = false
): Promise<OpenSSFCollectedData> {
  const canonicalId = normalizeRepoId(ownerRepo);
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await readCache<OpenSSFCollectedData>('openssf', canonicalId);
    if (cached && !cached.error) {
      return {
        ...cached.data,
        collectedAt: cached.collectedAt
      };
    }
  }
  
  try {
    // Fetch live data
    const scorecard = await fetchOpenSSFScore(ownerRepo);
    
    const sourceUrl = `https://api.securityscorecards.dev/projects/github.com/${ownerRepo}`;
    const collectedAt = new Date().toISOString();
    
    const data: OpenSSFCollectedData = {
      scorecard,
      score: scorecard?.score ?? null,
      sourceUrl,
      collectedAt
    };
    
    // Cache the result (even if null - we don't want to keep retrying)
    await writeCache('openssf', canonicalId, data, 'live');
    
    return data;
  } catch (error) {
    // For errors, try to return cached data if available
    const cached = await readCache<OpenSSFCollectedData>('openssf', canonicalId);
    if (cached && !cached.error) {
      return {
        ...cached.data,
        collectedAt: cached.collectedAt
      };
    }
    
    // Cache the error
    await writeCache('openssf', canonicalId, { error: (error as Error).message }, 'live', true);
    
    throw new CollectorError('openssf', ownerRepo, error as Error);
  }
}

// Made with Bob
