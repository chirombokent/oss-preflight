import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

export type CacheEntrySource = 'live' | 'cache';
export type CollectorResultSource = 'live' | 'cache' | 'cache-fallback' | 'fixture' | 'not-available';

/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
  data: T;
  collectedAt: string; // ISO-8601
  source: CacheEntrySource;
  error?: boolean;
}

export interface ReadCacheOptions {
  allowExpired?: boolean;
}

/**
 * TTL configuration per ecosystem (in milliseconds)
 */
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

const TTL_MS: Record<string, number> = {
  npm: DEFAULT_TTL_MS,           // 6 hours
  github: 2 * 60 * 60 * 1000,   // 2 hours
  pypi: 6 * 60 * 60 * 1000,     // 6 hours
  openssf: 24 * 60 * 60 * 1000, // 24 hours
  discovery: 1 * 60 * 60 * 1000 // 1 hour
};

/**
 * Get cache directory path
 */
function getCacheDir(): string {
  return process.env.OSS_PREFLIGHT_CACHE_DIR ?? join(process.cwd(), '.oss-preflight', 'cache');
}

/**
 * Get cache file path for a specific ecosystem and package
 */
function getCachePath(ecosystem: string, canonicalId: string): string {
  return join(getCacheDir(), ecosystem, `${safeCacheId(canonicalId)}.json`);
}

function safeCacheId(canonicalId: string): string {
  return canonicalId
    .split('/')
    .map((segment) => {
      const cleaned = segment
        .replace(/[<>:"\\|?*\x00-\x1F]/g, '_')
        .trim();
      return cleaned.length > 0 && cleaned !== '.' && cleaned !== '..' ? cleaned : '_';
    })
    .join('/');
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Check if cache entry is still valid based on TTL
 */
function isValid(entry: CacheEntry, ecosystem: string): boolean {
  const ttl = TTL_MS[ecosystem] ?? DEFAULT_TTL_MS;
  const collectedAt = new Date(entry.collectedAt).getTime();
  const now = Date.now();
  return (now - collectedAt) < ttl;
}

/**
 * Read from cache
 * Returns null if cache miss or expired
 */
export async function readCache<T>(
  ecosystem: string,
  canonicalId: string,
  options: ReadCacheOptions = {}
): Promise<CacheEntry<T> | null> {
  try {
    const cachePath = getCachePath(ecosystem, canonicalId);
    const content = await fs.readFile(cachePath, 'utf-8');
    const entry = JSON.parse(content) as CacheEntry<T>;
    
    if (options.allowExpired || isValid(entry, ecosystem)) {
      return entry;
    }
    
    // Cache expired
    return null;
  } catch (error) {
    // Cache miss (file doesn't exist or can't be read)
    return null;
  }
}

/**
 * Write to cache
 */
export async function writeCache<T>(
  ecosystem: string,
  canonicalId: string,
  data: T,
  source: CacheEntrySource = 'live',
  isError = false
): Promise<void> {
  const cachePath = getCachePath(ecosystem, canonicalId);
  const cacheDir = dirname(cachePath);
  
  await ensureDir(cacheDir);
  
  const entry: CacheEntry<T> = {
    data,
    collectedAt: new Date().toISOString(),
    source,
    ...(isError && { error: true })
  };
  
  await fs.writeFile(cachePath, JSON.stringify(entry, null, 2), 'utf-8');
}

/**
 * Best-effort cache write for live registry/serverless paths.
 *
 * Cache availability must not affect discovery or evidence collection; hosted
 * runtimes may expose the project directory as read-only.
 */
export async function writeCacheBestEffort<T>(
  ecosystem: string,
  canonicalId: string,
  data: T,
  source: CacheEntrySource = 'live',
  isError = false
): Promise<void> {
  try {
    await writeCache(ecosystem, canonicalId, data, source, isError);
  } catch {
    // Cache writes are an optimization. Callers should keep their live result.
  }
}

/**
 * Clear cache for a specific package
 */
export async function clearCache(
  ecosystem: string,
  canonicalId: string
): Promise<void> {
  try {
    const cachePath = getCachePath(ecosystem, canonicalId);
    await fs.unlink(cachePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  const cacheDir = getCacheDir();
  try {
    await fs.rm(cacheDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if directory doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

// Made with Bob
