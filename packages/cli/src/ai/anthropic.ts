import Anthropic from '@anthropic-ai/sdk';
import { buildIntentPrompt } from './prompt.js';
import { normalizeBriefJson } from './normalize.js';
import type { IntentParser } from './types.js';

export interface AnthropicIntentParserOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface AnthropicTextResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

export function buildAnthropicMessageRequest(idea: string, model: string) {
  return {
    model,
    max_tokens: 1024,
    temperature: 0,
    seed: 42,
    messages: [{
      role: 'user' as const,
      content: buildIntentPrompt(idea),
    }],
  };
}

export function createAnthropicIntentParser(options: AnthropicIntentParserOptions): IntentParser {
  const client = new Anthropic({
    apiKey: options.apiKey,
    ...(options.baseUrl ? { baseURL: options.baseUrl } : {}),
  } as ConstructorParameters<typeof Anthropic>[0]);

  return {
    provider: 'anthropic',
    parse: async (idea: string) => {
      const response = await client.messages.create(
        buildAnthropicMessageRequest(idea, options.model) as Parameters<typeof client.messages.create>[0]
      ) as AnthropicTextResponse;
      const content = response.content[0];
      if (!content || content.type !== 'text' || !content.text) {
        throw new Error('Unexpected response type from Anthropic');
      }
      return normalizeBriefJson(content.text);
    },
  };
}
