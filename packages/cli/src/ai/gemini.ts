import { buildIntentPrompt } from './prompt.js';
import { normalizeBriefJson } from './normalize.js';
import type { IntentParser } from './types.js';

export interface GeminiIntentParserOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
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
      const response = await fetch(
        `${trimTrailingSlash(options.baseUrl)}/v1beta/${modelPath(options.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': options.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildGeminiRequestBody(idea)),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini provider returned ${response.status}`);
      }

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

