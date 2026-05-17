import { buildIntentPrompt } from './prompt.js';
import { normalizeBriefJson } from './normalize.js';
import type { IntentParser } from './types.js';

export interface OpenAiCompatibleIntentParserOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface OpenAiCompatibleResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function buildOpenAiCompatibleRequestBody(idea: string, model: string) {
  return {
    model,
    max_tokens: 1024,
    temperature: 0,
    messages: [{
      role: 'user',
      content: buildIntentPrompt(idea),
    }],
  };
}

export function createOpenAiCompatibleIntentParser(options: OpenAiCompatibleIntentParserOptions): IntentParser {
  return {
    provider: 'openai-compatible',
    parse: async (idea: string) => {
      const response = await fetch(`${trimTrailingSlash(options.baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildOpenAiCompatibleRequestBody(idea, options.model)),
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible provider returned ${response.status}`);
      }

      const data = await response.json() as OpenAiCompatibleResponse;
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('No text content returned from OpenAI-compatible provider');
      }

      return normalizeBriefJson(text);
    },
  };
}

