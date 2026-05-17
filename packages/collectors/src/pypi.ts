import { PackageNotFoundError, CollectorError } from './errors.js';
import { readCache, writeCache } from './cache/index.js';
import type { CollectorResultSource } from './cache/index.js';

/**
 * PyPI package metadata response
 */
export interface PyPIMetadata {
  info: {
    name: string;
    version: string;
    summary?: string;
    license?: string;
    home_page?: string;
    project_urls?: Record<string, string>;
  };
  urls: Array<{
    packagetype: string;
    url: string;
  }>;
  releases: Record<string, unknown>;
}

/**
 * Collected PyPI package data
 */
export interface PyPICollectedData {
  metadata: PyPIMetadata;
  sourceUrl: string;
  collectedAt: string;
  source: CollectorResultSource;
}

/**
 * Normalize PyPI package name for cache key
 * PyPI normalizes names: lowercase, replace _ and - with -
 */
function normalizePyPIName(name: string): string {
  return name.toLowerCase().replace(/[_\.]/g, '-');
}

/**
 * Fetch PyPI package metadata
 */
async function fetchPyPIMetadata(packageName: string): Promise<PyPIMetadata> {
  const url = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`;
  
  const response = await fetch(url);
  
  if (response.status === 404) {
    throw new PackageNotFoundError('pypi', packageName);
  }
  
  if (!response.ok) {
    throw new Error(`PyPI API returned ${response.status}: ${response.statusText}`);
  }
  
  const metadata = await response.json() as PyPIMetadata;
  return sanitizePyPIMetadata(metadata);
}

function sanitizePyPIMetadata(metadata: PyPIMetadata): PyPIMetadata {
  return {
    info: {
      name: metadata.info.name,
      version: metadata.info.version,
      summary: metadata.info.summary,
      license: metadata.info.license,
      home_page: metadata.info.home_page,
      project_urls: metadata.info.project_urls
    },
    urls: metadata.urls.map((url) => ({
      packagetype: url.packagetype,
      url: url.url
    })),
    releases: {}
  };
}

function sanitizePyPICollectedData(
  data: PyPICollectedData,
  collectedAt: string,
  source: CollectorResultSource
): PyPICollectedData {
  return {
    ...data,
    metadata: sanitizePyPIMetadata(data.metadata),
    collectedAt,
    source
  };
}

/**
 * Collect PyPI package data with caching
 */
export async function collectPyPIData(
  packageName: string,
  forceRefresh = false
): Promise<PyPICollectedData> {
  const canonicalId = normalizePyPIName(packageName);
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await readCache<PyPICollectedData>('pypi', canonicalId);
    if (cached && !cached.error) {
      return sanitizePyPICollectedData(cached.data, cached.collectedAt, 'cache');
    }
  }
  
  try {
    // Fetch live data
    const metadata = await fetchPyPIMetadata(packageName);
    
    const sourceUrl = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`;
    const collectedAt = new Date().toISOString();
    
    const data: PyPICollectedData = {
      metadata,
      sourceUrl,
      collectedAt,
      source: 'live'
    };
    
    // Cache the result
    await writeCache('pypi', canonicalId, data, 'live');
    
    return data;
  } catch (error) {
    if (error instanceof PackageNotFoundError) {
      await writeCache('pypi', canonicalId, { error: error.message }, 'live', true);
      throw error;
    }
    
    // For other errors, try to return cached data if available
    const cached = await readCache<PyPICollectedData>('pypi', canonicalId, { allowExpired: true });
    if (cached && !cached.error) {
      // Return stale cache as fallback
      return sanitizePyPICollectedData(cached.data, cached.collectedAt, 'cache-fallback');
    }
    
    // Cache the error
    await writeCache('pypi', canonicalId, { error: (error as Error).message }, 'live', true);
    
    throw new CollectorError('pypi', packageName, error as Error);
  }
}

// Made with Bob
