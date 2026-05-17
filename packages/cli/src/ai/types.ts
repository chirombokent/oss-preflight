import type { IdeaBrief } from '@oss-preflight/core';

export type AiProvider = 'anthropic' | 'openai-compatible' | 'gemini' | 'keyword';

export interface IntentParser {
  provider: AiProvider;
  parse(idea: string): Promise<IdeaBrief>;
}

export type IntentParserFn = (idea: string) => Promise<IdeaBrief>;

export interface AiConfigOptions {
  provider?: string;
  model?: string;
  baseUrl?: string;
  config?: string;
  apiKey?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface ResolvedAiConfig {
  provider: AiProvider;
  explicitProvider: boolean;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface ProviderDefaults {
  model?: string;
  baseUrl?: string;
}

