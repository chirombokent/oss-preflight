import { z } from 'zod';
import { randomUUID } from 'crypto';
import { EcosystemSchema } from './types.js';

/**
 * RepoContext - detected repository metadata
 * 
 * All fields are explicit - missing data is null, never omitted.
 * Detection errors are captured in detectionErrors array.
 */
export const RepoContextSchema = z.object({
  path: z.string(),
  packageManager: z.enum(['npm', 'pnpm', 'yarn', 'pip', 'poetry', 'unknown']),
  ecosystem: EcosystemSchema,
  language: z.array(z.string()),
  framework: z.string().nullable(),
  scripts: z.record(z.string()),
  dependencies: z.record(z.string()),
  devDependencies: z.record(z.string()),
  license: z.string().nullable(),
  hasReadme: z.boolean(),
  detectedAt: z.string(), // ISO-8601 UTC
  detectionErrors: z.array(z.string()).optional(),
});

export type RepoContext = z.infer<typeof RepoContextSchema>;

/**
 * WorkflowTrace - complete audit trail of a workflow execution
 * 
 * Captures all inputs, decisions, outputs, and verification results.
 * Written to .oss-preflight/runs/<timestamp>/workflow.json
 */
export const WorkflowTraceSchema = z.object({
  workflowId: z.string(), // UUID v4
  mode: z.enum(['idea', 'repo-audit']),
  timestamp: z.string(), // ISO-8601 UTC
  input: z.object({
    idea: z.string().optional(),
    repoPath: z.string().optional(),
    repoUrl: z.string().optional(),
    manifestPath: z.string().optional(),
  }),
  repoContext: RepoContextSchema.nullable(),
  discoveryPlan: z.object({
    ecosystem: EcosystemSchema,
    domain: z.string(),
    searchQuery: z.string(),
    // Reflects how candidates were actually found: live registry search,
    // search with catalog top-up, or catalog-only fallback.
    searchMethod: z.enum([
      'ai-expanded',
      'keyword',
      'catalog-fallback',
      'registry-search',
      'search-with-catalog-fallback',
      'manifest',
    ]),
  }),
  candidates: z.array(z.object({
    name: z.string(),
    source: z.enum(['npm-search', 'pypi-search', 'github-search', 'catalog-fallback', 'manifest']),
    discoveredAt: z.string(), // ISO-8601 UTC
  })),
  recommendations: z.array(z.any()), // Recommendation[] - using any to avoid circular dependency
  evidenceGaps: z.array(z.object({
    candidate: z.string(),
    missingFields: z.array(z.string()),
    reason: z.string(),
  })),
  actions: z.array(z.object({
    type: z.enum(['scaffold', 'audit-report', 'adoption-pack']),
    timestamp: z.string(), // ISO-8601 UTC
    outputPath: z.string(),
    success: z.boolean(),
  })),
  verification: z.object({
    smokeTestPassed: z.boolean().nullable(),
    validationErrors: z.array(z.string()),
  }),
  generatedArtifacts: z.array(z.string()),
});

export type WorkflowTrace = z.infer<typeof WorkflowTraceSchema>;

/**
 * Create a new workflow trace with defaults
 */
export function createWorkflowTrace(
  mode: 'idea' | 'repo-audit',
  input: WorkflowTrace['input']
): WorkflowTrace {
  return {
    workflowId: randomUUID(),
    mode,
    timestamp: new Date().toISOString(),
    input,
    repoContext: null,
    discoveryPlan: {
      ecosystem: 'npm',
      domain: '',
      searchQuery: '',
      searchMethod: 'catalog-fallback',
    },
    candidates: [],
    recommendations: [],
    evidenceGaps: [],
    actions: [],
    verification: {
      smokeTestPassed: null,
      validationErrors: [],
    },
    generatedArtifacts: [],
  };
}

// Made with Bob