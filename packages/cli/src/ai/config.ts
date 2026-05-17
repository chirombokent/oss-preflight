import fs from 'fs';
import path from 'path';
import { AiConfigError } from './errors.js';
import type { AiConfigOptions, AiProvider, ProviderDefaults, ResolvedAiConfig } from './types.js';

export const AI_PROVIDER_DEFAULTS: Record<Exclude<AiProvider, 'keyword'>, ProviderDefaults> = {
  anthropic: {
    model: 'claude-haiku-3-5-20241022',
    baseUrl: 'https://api.anthropic.com',
  },
  gemini: {
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
  },
  'openai-compatible': {
    baseUrl: 'https://api.openai.com/v1',
  },
};

const SUPPORTED_PROVIDERS: readonly AiProvider[] = [
  'anthropic',
  'openai-compatible',
  'gemini',
  'keyword',
];

const SECRET_KEY_PATTERN = /(^apiKey$|_API_KEY$|token|secret)/i;

interface FileAiConfig {
  provider?: string;
  model?: string;
  baseUrl?: string;
}

interface FileConfig {
  ai?: FileAiConfig;
}

function isProvider(value: string): value is AiProvider {
  return SUPPORTED_PROVIDERS.includes(value as AiProvider);
}

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeProvider(value: unknown): AiProvider | undefined {
  const normalized = cleanString(value);
  if (!normalized) {
    return undefined;
  }
  if (!isProvider(normalized)) {
    throw new AiConfigError(
      `Unsupported AI provider "${normalized}". Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
    );
  }
  return normalized;
}

function assertNoSecrets(value: unknown, trail: string[] = []): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      const field = [...trail, key].join('.');
      throw new AiConfigError(
        `Secret-shaped field "${field}" is not allowed in OSS Preflight config. Store provider keys in environment variables.`
      );
    }
    assertNoSecrets(nested, [...trail, key]);
  }
}

function readFileConfig(options: AiConfigOptions): FileAiConfig {
  const cwd = options.cwd ?? process.cwd();
  const configPath = options.config
    ? path.resolve(cwd, options.config)
    : path.join(cwd, '.oss-preflight', 'config.json');

  if (!fs.existsSync(configPath)) {
    if (options.config) {
      throw new AiConfigError(`AI config file not found: ${configPath}`);
    }
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as FileConfig;
    assertNoSecrets(parsed);
    return parsed.ai ?? {};
  } catch (error) {
    if (error instanceof AiConfigError) {
      throw error;
    }
    throw new AiConfigError(`Failed to read AI config file ${configPath}: ${(error as Error).message}`);
  }
}

function providerKey(provider: AiProvider, env: NodeJS.ProcessEnv, apiKey?: string): string | undefined {
  if (apiKey) {
    return apiKey;
  }

  switch (provider) {
    case 'anthropic':
      return env.ANTHROPIC_API_KEY;
    case 'openai-compatible':
      return env.OPENAI_API_KEY;
    case 'gemini':
      return env.GEMINI_API_KEY;
    case 'keyword':
      return undefined;
  }
}

function requiredKeyName(provider: AiProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'openai-compatible':
      return 'OPENAI_API_KEY';
    case 'gemini':
      return 'GEMINI_API_KEY';
    case 'keyword':
      return '';
  }
}

export function resolveAiConfig(options: AiConfigOptions = {}): ResolvedAiConfig {
  const env = options.env ?? process.env;
  const fileConfig = readFileConfig(options);

  const rawProvider =
    cleanString(options.provider) ??
    cleanString(env.OSS_PREFLIGHT_AI_PROVIDER) ??
    cleanString(fileConfig.provider);
  const explicitProvider = rawProvider !== undefined;
  let provider = normalizeProvider(rawProvider);

  if (!provider && options.apiKey) {
    provider = 'anthropic';
  }
  if (!provider && env.ANTHROPIC_API_KEY) {
    provider = 'anthropic';
  }
  if (!provider) {
    provider = 'keyword';
  }

  const defaults = provider === 'keyword' ? {} : AI_PROVIDER_DEFAULTS[provider];
  const model =
    cleanString(options.model) ??
    cleanString(env.OSS_PREFLIGHT_AI_MODEL) ??
    cleanString(fileConfig.model) ??
    defaults.model;
  const baseUrl =
    cleanString(options.baseUrl) ??
    cleanString(env.OSS_PREFLIGHT_AI_BASE_URL) ??
    cleanString(fileConfig.baseUrl) ??
    defaults.baseUrl;
  const apiKey = providerKey(provider, env, options.apiKey);

  if (provider === 'keyword') {
    return { provider, explicitProvider, model: undefined, baseUrl: undefined, apiKey: undefined };
  }

  if (!model) {
    throw new AiConfigError(`AI provider "${provider}" requires a model via --ai-model, OSS_PREFLIGHT_AI_MODEL, or config.`);
  }

  if (!apiKey && explicitProvider) {
    throw new AiConfigError(`AI provider "${provider}" requires ${requiredKeyName(provider)}.`);
  }

  if (!apiKey) {
    return { provider: 'keyword', explicitProvider: false, model: undefined, baseUrl: undefined, apiKey: undefined };
  }

  return { provider, explicitProvider, model, baseUrl, apiKey };
}
