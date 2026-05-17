import { createAnthropicIntentParser } from './anthropic.js';
import { createGeminiIntentParser } from './gemini.js';
import { createKeywordIntentParser } from './keyword.js';
import { createOpenAiCompatibleIntentParser } from './openai-compatible.js';
import type { IntentParser, ResolvedAiConfig } from './types.js';

export function createIntentParser(config: ResolvedAiConfig): IntentParser {
  switch (config.provider) {
    case 'anthropic':
      return createAnthropicIntentParser({
        apiKey: config.apiKey!,
        model: config.model!,
        baseUrl: config.baseUrl,
      });
    case 'openai-compatible':
      return createOpenAiCompatibleIntentParser({
        apiKey: config.apiKey!,
        model: config.model!,
        baseUrl: config.baseUrl!,
      });
    case 'gemini':
      return createGeminiIntentParser({
        apiKey: config.apiKey!,
        model: config.model!,
        baseUrl: config.baseUrl!,
      });
    case 'keyword':
      return createKeywordIntentParser();
  }
}

