import type { IdeaBrief } from '@oss-preflight/core';
import type { IntentParser } from './types.js';

export function keywordParser(idea: string): IdeaBrief {
  const lowerIdea = idea.toLowerCase();

  let ecosystem: 'npm' | 'pypi' | 'github' = 'npm';
  if (lowerIdea.includes('python') || lowerIdea.includes('django') || lowerIdea.includes('flask')) {
    ecosystem = 'pypi';
  } else if (
    lowerIdea.includes('npm') ||
    lowerIdea.includes('node') ||
    lowerIdea.includes('javascript') ||
    lowerIdea.includes('typescript')
  ) {
    ecosystem = 'npm';
  }

  let domain = 'general';
  if (lowerIdea.includes('discord')) {
    domain = 'discord';
  } else if (lowerIdea.includes('bot')) {
    domain = 'bot';
  } else if (lowerIdea.includes('web') || lowerIdea.includes('api')) {
    domain = 'web';
  }

  const capabilities: string[] = [];
  if (lowerIdea.includes('summarize') || lowerIdea.includes('summary')) {
    capabilities.push('summarization');
  }
  if (lowerIdea.includes('message') || lowerIdea.includes('chat')) {
    capabilities.push('message processing');
  }
  if (lowerIdea.includes('schedule') || lowerIdea.includes('cron')) {
    capabilities.push('scheduling');
  }

  return {
    capabilities: capabilities.length > 0 ? capabilities : ['general functionality'],
    domain,
    ecosystem,
    constraints: {},
  };
}

export function createKeywordIntentParser(): IntentParser {
  return {
    provider: 'keyword',
    parse: async (idea: string) => keywordParser(idea),
  };
}

