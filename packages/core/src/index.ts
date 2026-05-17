// Core types and schemas
export * from './types.js';

// Core modules
export { discoverCandidates, discoverCandidatesWithSearch } from './discovery.js';
export type {
  DiscoveryMethod,
  DiscoverySource,
  DiscoveredCandidate,
  DiscoveryResult,
  DiscoveryOptions,
} from './discovery.js';
export { canonicalizeDomain, isGenericDomain } from './domain.js';
export { scoreAndRank } from './scorer.js';
export { normalizePackageName } from './normalizer.js';
export {
  serializeRecommendation,
  serializeRecommendations,
  serializeRecommendationPretty,
  serializeWorkflowTrace,
  serializeWorkflowTracePretty
} from './serializer.js';

// Workflow trace types and utilities
export type { WorkflowTrace, RepoContext } from './workflow.js';
export { WorkflowTraceSchema, RepoContextSchema, createWorkflowTrace } from './workflow.js';

// Made with Bob
