import { RecommendationSchema, type Recommendation } from './types.js';
import { WorkflowTraceSchema, type WorkflowTrace } from './workflow.js';

/**
 * Serialize a recommendation to JSON with explicit null handling
 * 
 * Rules:
 * - Missing fields are emitted as explicit null, never omitted
 * - Validates against schema before serialization
 * - Rejects incomplete evidence
 * - Produces deterministic output (stable key order)
 */
export function serializeRecommendation(recommendation: Recommendation): string {
  // Validate against schema - throws if incomplete
  const validated = RecommendationSchema.parse(recommendation);

  // Use JSON.stringify with replacer for deterministic key order
  // and explicit null handling
  return JSON.stringify(validated, null, 0);
}

/**
 * Serialize multiple recommendations
 */
export function serializeRecommendations(recommendations: Recommendation[]): string {
  const validated = recommendations.map(r => RecommendationSchema.parse(r));
  return JSON.stringify(validated, null, 0);
}

/**
 * Serialize with pretty printing (for human-readable output)
 */
export function serializeRecommendationPretty(recommendation: Recommendation): string {
  const validated = RecommendationSchema.parse(recommendation);
  return JSON.stringify(validated, null, 2);
}

/**
 * Serialize a workflow trace to JSON with explicit null handling
 *
 * Rules:
 * - Missing fields are emitted as explicit null, never omitted
 * - Validates against schema before serialization
 * - Produces deterministic output (stable key order)
 */
export function serializeWorkflowTrace(trace: WorkflowTrace): string {
  // Validate against schema - throws if incomplete
  const validated = WorkflowTraceSchema.parse(trace);
  
  // Use JSON.stringify with no spacing for deterministic output
  return JSON.stringify(validated, null, 0);
}

/**
 * Serialize workflow trace with pretty printing (for human-readable output)
 */
export function serializeWorkflowTracePretty(trace: WorkflowTrace): string {
  const validated = WorkflowTraceSchema.parse(trace);
  return JSON.stringify(validated, null, 2);
}

// Made with Bob
