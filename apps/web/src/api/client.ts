import type { IdeaBrief, Recommendation, WorkflowTrace } from '@oss-preflight/core';

export type AnalyzeMode = 'recommend' | 'audit';
export type AiProvider = 'keyword' | 'anthropic' | 'openai-compatible' | 'gemini';

export interface AiSettings {
  provider: AiProvider;
  token?: string;
  model?: string;
  baseUrl?: string;
}

export interface AnalyzeRecommendResponse {
  mode: 'recommend';
  detectedMode: AnalyzeMode;
  input: string;
  recommendations: Recommendation[];
  ideas_parsed: IdeaBrief;
  brief: IdeaBrief;
  workflow: WorkflowTrace;
  intent: {
    provider: string;
    fallbackUsed: boolean;
    requestedProvider?: string;
    warning?: string;
  };
  provider: string;
}

export interface AuditDependency {
  name: string;
  version: string;
  score: number;
  risks: string[];
  facts: unknown;
  suggestedAlternative: { name: string; version: string; score: number } | null;
}

export interface AnalyzeAuditResponse {
  mode: 'audit';
  detectedMode: AnalyzeMode;
  input: string;
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
  workflow: WorkflowTrace;
  report: string;
  artifacts: { report?: string; workflow?: string };
  provider: string;
}

export type AnalyzeResponse = AnalyzeRecommendResponse | AnalyzeAuditResponse;

export interface ScaffoldDownloadResponse {
  blob: Blob;
  fileName: string;
  type: 'template' | 'adoption-pack';
  message: string;
}

export interface AiConnectionResponse {
  ok: boolean;
  provider: AiProvider;
  model?: string;
  baseUrl?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly hint?: string;
  readonly mode?: AnalyzeMode;

  constructor(message: string, details: { status: number; hint?: string; mode?: AnalyzeMode }) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.hint = details.hint;
    this.mode = details.mode;
  }
}

function settingsBody(settings: AiSettings): Record<string, string> {
  return {
    provider: settings.provider,
    ...(settings.token ? { token: settings.token } : {}),
    ...(settings.model ? { model: settings.model } : {}),
    ...(settings.baseUrl ? { baseUrl: settings.baseUrl } : {}),
  };
}

function cleanErrorString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseErrorMode(value: unknown): AnalyzeMode | undefined {
  return value === 'recommend' || value === 'audit' ? value : undefined;
}

async function parseJsonError(response: Response, fallback: string): Promise<ApiError> {
  try {
    const error = await response.json() as { error?: unknown; message?: unknown; hint?: unknown; mode?: unknown };
    return new ApiError(cleanErrorString(error.error) ?? cleanErrorString(error.message) ?? fallback, {
      status: response.status,
      hint: cleanErrorString(error.hint),
      mode: parseErrorMode(error.mode),
    });
  } catch {
    return new ApiError(fallback, { status: response.status });
  }
}

export async function analyze(
  input: string,
  settings: AiSettings,
  mode?: AnalyzeMode
): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input,
      mode,
      ...settingsBody(settings),
    }),
  });

  if (!response.ok) {
    throw await parseJsonError(response, 'Failed to analyze input');
  }

  return response.json() as Promise<AnalyzeResponse>;
}

export async function testAiConnection(settings: AiSettings): Promise<AiConnectionResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      testConnection: true,
      ...settingsBody(settings),
    }),
  });

  if (!response.ok) {
    throw await parseJsonError(response, 'Provider settings are invalid');
  }

  return response.json() as Promise<AiConnectionResponse>;
}

export async function recommend(input: string, settings: AiSettings = { provider: 'keyword' }): Promise<AnalyzeRecommendResponse> {
  const response = await analyze(input, settings, 'recommend');
  if (response.mode !== 'recommend') {
    throw new Error('Analyze returned audit results for a recommendation request');
  }
  return response;
}

export async function audit(input: string): Promise<AnalyzeAuditResponse> {
  const response = await analyze(input, { provider: 'keyword' }, 'audit');
  if (response.mode !== 'audit') {
    throw new Error('Analyze returned recommendations for an audit request');
  }
  return response;
}

export async function scaffold(recommendation: Recommendation): Promise<ScaffoldDownloadResponse> {
  const response = await fetch('/api/scaffold', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recommendation }),
  });

  if (!response.ok) {
    throw await parseJsonError(response, 'Failed to generate scaffold');
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const fileNameMatch = disposition.match(/filename="([^"]+)"/i);
  const fileName = fileNameMatch?.[1] ?? `${recommendation.candidate.name}-starter.zip`;
  const typeHeader = response.headers.get('X-OSS-Preflight-Scaffold-Type');
  const message = response.headers.get('X-OSS-Preflight-Message') ?? 'Scaffold zip is ready.';
  return {
    blob: await response.blob(),
    fileName,
    type: typeHeader === 'adoption-pack' ? 'adoption-pack' : 'template',
    message,
  };
}
