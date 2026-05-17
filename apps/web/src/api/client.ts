import type { Recommendation, IdeaBrief } from '@oss-preflight/core';

export interface RecommendResponse {
  recommendations: Recommendation[];
  ideas_parsed: IdeaBrief;
  error?: string;
}

export interface ScaffoldResponse {
  files: string[];
  passed: boolean;
  output: string;
  error?: string;
}

/**
 * API Client - fetch wrappers for /api/recommend and /api/scaffold
 */

export async function recommend(idea: string): Promise<RecommendResponse> {
  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idea }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get recommendations');
  }

  return response.json();
}

export interface AuditDependency {
  name: string;
  version: string;
  score: number;
  risks: string[];
  facts: unknown;
  suggestedAlternative: { name: string; version: string; score: number } | null;
}

export interface AuditResponse {
  repoContext: unknown;
  summary: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    noRisk: number;
  };
  dependencies: AuditDependency[];
  evidenceGaps?: unknown[];
  workflowId: string;
  artifacts: { report?: string; workflow?: string };
  error?: string;
}

export async function audit(repo: string): Promise<AuditResponse> {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to audit repository');
  }

  return response.json();
}

export async function scaffold(recommendation: Recommendation): Promise<ScaffoldResponse> {
  const response = await fetch('/api/scaffold', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recommendation }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate scaffold');
  }

  return response.json();
}

// Made with Bob
