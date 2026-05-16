import { PackageNotFoundError, CollectorError } from './errors.js';
import { readCache, writeCache } from './cache/index.js';
import type { CollectorResultSource } from './cache/index.js';

/**
 * npm registry metadata response
 */
export interface NpmMetadata {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  dist: {
    tarball: string;
  };
  _npmUser?: {
    name: string;
  };
}

/**
 * npm downloads API response
 */
interface NpmDownloadsResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

/**
 * Collected npm package data
 */
export interface NpmCollectedData {
  metadata: NpmMetadata;
  weeklyDownloads: number | null;
  sourceUrl: string;
  collectedAt: string;
  source: CollectorResultSource;
}

/**
 * Normalize npm package name for cache key
 */
function normalizeNpmName(name: string): string {
  return name.toLowerCase();
}

/**
 * Fetch npm package metadata
 */
async function fetchNpmMetadata(packageName: string): Promise<NpmMetadata> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
  
  const response = await fetch(url);
  
  if (response.status === 404) {
    throw new PackageNotFoundError('npm', packageName);
  }
  
  if (!response.ok) {
    throw new Error(`npm registry returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json() as NpmMetadata;
}

/**
 * Fetch npm package download stats (last 7 days)
 */
async function fetchNpmDownloads(packageName: string): Promise<number | null> {
  const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as NpmDownloadsResponse;
    return typeof data.downloads === 'number' ? data.downloads : null;
  } catch {
    return null;
  }
}

/**
 * Collect npm package data with caching
 */
export async function collectNpmData(
  packageName: string,
  forceRefresh = false
): Promise<NpmCollectedData> {
  const canonicalId = normalizeNpmName(packageName);
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await readCache<NpmCollectedData>('npm', canonicalId);
    if (cached) {
      if (cached.error) {
        // Cached error - throw without retrying
        throw new CollectorError('npm', packageName, new Error('Cached error'));
      }
      // Cached success data
      return {
        ...cached.data,
        collectedAt: cached.collectedAt,
        source: 'cache'
      };
    }
  }
  
  try {
    // Fetch live data
    const [metadata, weeklyDownloads] = await Promise.all([
      fetchNpmMetadata(packageName),
      fetchNpmDownloads(packageName)
    ]);
    
    const sourceUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const collectedAt = new Date().toISOString();
    
    const data: NpmCollectedData = {
      metadata,
      weeklyDownloads,
      sourceUrl,
      collectedAt,
      source: 'live'
    };
    
    // Cache the result
    await writeCache('npm', canonicalId, data, 'live');
    
    return data;
  } catch (error) {
    if (error instanceof PackageNotFoundError) {
      await writeCache('npm', canonicalId, { error: error.message }, 'live', true);
      throw error;
    }
    
    // For other errors, try to return cached data if available
    const cached = await readCache<NpmCollectedData>('npm', canonicalId, { allowExpired: true });
    if (cached && !cached.error) {
      // Return stale cache as fallback
      return {
        ...cached.data,
        collectedAt: cached.collectedAt,
        source: 'cache-fallback'
      };
    }
    
    // Cache the error
    await writeCache('npm', canonicalId, { error: (error as Error).message }, 'live', true);
    
    throw new CollectorError('npm', packageName, error as Error);
  }
}

// Made with Bob
