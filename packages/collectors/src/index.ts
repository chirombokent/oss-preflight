import type { Ecosystem } from '@oss-preflight/core';
import { collectNpmData } from './npm.js';
import { collectGitHubData } from './github.js';
import { collectPyPIData } from './pypi.js';

/**
 * Collector function type
 */
export type CollectorFunction<T = unknown> = (
  identifier: string,
  forceRefresh?: boolean
) => Promise<T>;

/**
 * Registry mapping ecosystem to collector function
 */
export const collectors: Record<Ecosystem, CollectorFunction> = {
  npm: collectNpmData as CollectorFunction,
  github: collectGitHubData as CollectorFunction,
  pypi: collectPyPIData as CollectorFunction
};

/**
 * Get collector for an ecosystem
 */
export function getCollector(ecosystem: Ecosystem): CollectorFunction {
  const collector = collectors[ecosystem];
  if (!collector) {
    throw new Error(`No collector found for ecosystem: ${ecosystem}`);
  }
  return collector;
}

// Re-export types and functions
export { collectNpmData, type NpmCollectedData } from './npm.js';
export { collectGitHubData, type GitHubCollectedData } from './github.js';
export { collectPyPIData, type PyPICollectedData } from './pypi.js';
export { collectOpenSSFData, type OpenSSFCollectedData } from './openssf.js';
export { PackageNotFoundError, CollectorError, RateLimitError } from './errors.js';
export { readCache, writeCache, clearCache, clearAllCache, type CacheEntry } from './cache/index.js';

// Made with Bob
