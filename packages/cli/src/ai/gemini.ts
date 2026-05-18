import { buildIntentPrompt } from './prompt.js';
import { normalizeBriefJson } from './normalize.js';
import type { IntentParser } from './types.js';

export interface GeminiIntentParserOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function modelPath(model: string): string {
  return model.startsWith('models/') ? model : `models/${model}`;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;

function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function retryDelayFromHeader(response: Response): number | null {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) {
    return null;
  }

  const seconds = Number.parseInt(retryAfter, 10);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const timestamp = Date.parse(retryAfter);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return Math.max(0, timestamp - Date.now());
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusError(status: number, attempt: number): Error {
  const suffix = attempt > 1 ? ` after ${attempt} attempts` : '';
  return new Error(`Gemini provider returned ${status}${suffix}`);
}

async function fetchGeminiWithRetries(
  url: string,
  init: RequestInit,
  maxRetries: number,
  retryDelayMs: number
): Promise<Response> {
  const maxAttempts = Math.max(1, maxRetries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Gemini provider request failed after ${attempt} attempts: ${(error as Error).message}`
        );
      }
      await sleep(retryDelayMs * attempt);
      continue;
    }

    if (response.ok) {
      return response;
    }

    if (!isRetriableStatus(response.status) || attempt === maxAttempts) {
      throw statusError(response.status, attempt);
    }

    await sleep(retryDelayFromHeader(response) ?? retryDelayMs * attempt);
  }

  throw new Error('Gemini provider request did not complete');
}

export function buildGeminiRequestBody(idea: string) {
  return {
    contents: [{
      role: 'user',
      parts: [{
        text: buildIntentPrompt(idea),
      }],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1024,
    },
  };
}

export function createGeminiIntentParser(options: GeminiIntentParserOptions): IntentParser {
  return {
    provider: 'gemini',
    parse: async (idea: string) => {
      const response = await fetchGeminiWithRetries(
        `${trimTrailingSlash(options.baseUrl)}/v1beta/${modelPath(options.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': options.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildGeminiRequestBody(idea)),
        },
        options.maxRetries ?? DEFAULT_MAX_RETRIES,
        options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
      );

      const data = await response.json() as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!text) {
        throw new Error('No text content returned from Gemini provider');
      }

      return normalizeBriefJson(text);
    },
  };
}
