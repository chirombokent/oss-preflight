// Core types and schemas
export * from './types.js';

// Core modules
export { discoverCandidates } from './discovery.js';
export { scoreAndRank } from './scorer.js';
export { normalizePackageName } from './normalizer.js';
export { 
  serializeRecommendation, 
  serializeRecommendations,
  serializeRecommendationPretty 
} from './serializer.js';

// Made with Bob
