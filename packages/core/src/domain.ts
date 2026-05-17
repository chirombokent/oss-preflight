const GENERIC_DOMAINS = new Set([
  'app',
  'application',
  'general',
  'general-app',
  'general-application',
  'software',
  'tool',
]);

function normalizedDomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Collapse provider-specific/free-form domain labels into the deterministic
 * catalog domains used by discovery and scoring.
 */
export function canonicalizeDomain(domain: string): string {
  const normalized = normalizedDomain(domain);
  if (!normalized) {
    return 'general';
  }

  if (GENERIC_DOMAINS.has(normalized)) {
    return 'general';
  }

  if (normalized.includes('discord')) {
    return 'discord';
  }

  if (
    normalized.includes('weather') ||
    normalized.includes('forecast') ||
    normalized.includes('meteorolog') ||
    normalized.includes('climate')
  ) {
    return 'weather';
  }

  if (
    normalized.includes('data-science') ||
    normalized.includes('data-analysis') ||
    normalized.includes('analytics') ||
    normalized.includes('machine-learning') ||
    normalized.includes('notebook')
  ) {
    return 'data-science';
  }

  if (normalized.includes('test')) {
    return 'testing';
  }

  if (
    normalized.includes('http-client') ||
    normalized.includes('fetch') ||
    normalized.includes('request-client')
  ) {
    return 'http-client';
  }

  if (
    normalized.includes('web-framework') ||
    normalized.includes('web-api') ||
    normalized.includes('api-framework') ||
    normalized.includes('http-server') ||
    normalized.includes('backend-framework')
  ) {
    return 'web-framework';
  }

  return normalized;
}

export function isGenericDomain(domain: string): boolean {
  return canonicalizeDomain(domain) === 'general';
}

