import type { Ecosystem } from '@oss-preflight/core';

/**
 * Base error class for collector failures
 */
export class CollectorError extends Error {
  constructor(
    public readonly ecosystem: Ecosystem | 'openssf',
    public readonly packageName: string,
    public readonly originalError: Error,
    public readonly fallbackData?: unknown
  ) {
    super(`Collector error for ${ecosystem}:${packageName}: ${originalError.message}`);
    this.name = 'CollectorError';
  }
}

/**
 * Package not found in registry (404)
 */
export class PackageNotFoundError extends Error {
  constructor(
    public readonly ecosystem: Ecosystem,
    public readonly packageName: string
  ) {
    super(`Package not found: ${ecosystem}:${packageName}`);
    this.name = 'PackageNotFoundError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    public readonly ecosystem: Ecosystem | 'github' | 'openssf',
    public readonly retryAfter?: number
  ) {
    super(`Rate limit exceeded for ${ecosystem}${retryAfter ? `, retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}

// Made with Bob
