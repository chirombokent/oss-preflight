import type { Ecosystem, CanonicalId } from './types.js';

/**
 * Normalize package name to canonical form for stable cache keys
 * 
 * Rules:
 * - npm: lowercase
 * - pypi: lowercase, underscores to dashes
 * - github: lowercase owner/repo, extract from URLs
 */
export function normalizePackageName(name: string, ecosystem: Ecosystem): CanonicalId {
  // Trim whitespace
  let normalized = name.trim();

  if (ecosystem === 'npm') {
    // npm: just lowercase
    return normalized.toLowerCase();
  }

  if (ecosystem === 'pypi') {
    // PyPI: lowercase and normalize underscores to dashes
    return normalized.toLowerCase().replace(/_/g, '-');
  }

  if (ecosystem === 'github') {
    // GitHub: extract owner/repo from URL if needed, then lowercase
    
    // Handle full GitHub URLs
    if (normalized.startsWith('https://github.com/') || normalized.startsWith('http://github.com/')) {
      normalized = normalized.replace(/^https?:\/\/github\.com\//, '');
    }
    
    // Remove .git suffix if present
    if (normalized.endsWith('.git')) {
      normalized = normalized.slice(0, -4);
    }
    
    // Lowercase the owner/repo
    return normalized.toLowerCase();
  }

  // Fallback: just lowercase
  return normalized.toLowerCase();
}

// Made with Bob
