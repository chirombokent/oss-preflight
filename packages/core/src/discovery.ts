import type { IdeaBrief } from './types.js';
import discoveryCatalog from '../fixtures/discovery-catalog.json' with { type: 'json' };

type CatalogDomain = Record<string, string[]>;
type Catalog = Record<string, CatalogDomain>;

/**
 * Discover candidate packages based on idea brief
 *
 * Pure function - no I/O, no LLM calls
 * Uses deterministic demo catalog for Phase P1
 *
 * @param brief - The parsed user intent
 * @returns Array of candidate package names
 */
export function discoverCandidates(brief: IdeaBrief): string[] {
  const { ecosystem, domain } = brief;

  // Get catalog for the ecosystem
  const catalog = discoveryCatalog as Catalog;
  const ecosystemCatalog = catalog[ecosystem];
  if (!ecosystemCatalog) {
    return [];
  }

  // Look up candidates by domain
  const candidates = ecosystemCatalog[domain];
  if (!candidates || !Array.isArray(candidates)) {
    return [];
  }

  // Return a copy to ensure immutability
  return [...candidates];
}

// Made with Bob
