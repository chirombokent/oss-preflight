import { canonicalizeDomain, type IdeaBrief } from '@oss-preflight/core';
import type { IntentParser } from './types.js';

export function keywordParser(idea: string): IdeaBrief {
  const lowerIdea = idea.toLowerCase();

  let ecosystem: 'npm' | 'pypi' | 'github' = 'npm';
  if (
    includesAny(lowerIdea, [
      'python',
      'django',
      'flask',
      'fastapi',
      'pandas',
      'numpy',
      'scikit',
      'pytest',
      'jupyter',
      'notebook',
    ])
  ) {
    ecosystem = 'pypi';
  } else if (includesAny(lowerIdea, ['npm', 'node', 'javascript', 'typescript'])) {
    ecosystem = 'npm';
  }

  let domain = 'general';
  if (lowerIdea.includes('discord')) {
    domain = 'discord';
  } else if (includesAny(lowerIdea, ['weather', 'forecast', 'forecasting', 'meteorology', 'climate', 'openweather', 'open-meteo', 'openmeteo'])) {
    domain = 'weather';
  } else if (includesAny(lowerIdea, ['data science', 'data analysis', 'analytics', 'csv', 'notebook', 'jupyter', 'pandas', 'numpy', 'machine learning', 'ml'])) {
    domain = 'data-science';
  } else if (includesAny(lowerIdea, ['test', 'testing', 'unit test', 'pytest', 'vitest', 'jest'])) {
    domain = 'testing';
  } else if (includesAny(lowerIdea, ['http client', 'fetch', 'request', 'axios'])) {
    domain = 'http-client';
  } else if (includesAny(lowerIdea, ['web', 'api', 'server', 'framework', 'express', 'fastify', 'koa', 'hono', 'django', 'flask', 'fastapi'])) {
    domain = 'web-framework';
  } else if (lowerIdea.includes('bot')) {
    domain = 'bot';
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
  if (includesAny(lowerIdea, ['api', 'server', 'route', 'routing', 'endpoint', 'http'])) {
    capabilities.push('http server');
    capabilities.push('routing');
  }
  if (includesAny(lowerIdea, ['upload', 'image upload', 'file upload'])) {
    capabilities.push('file upload');
  }
  if (includesAny(lowerIdea, ['csv', 'spreadsheet'])) {
    capabilities.push('csv processing');
  }
  if (includesAny(lowerIdea, ['data analysis', 'analytics', 'notebook', 'jupyter'])) {
    capabilities.push('data analysis');
  }
  if (includesAny(lowerIdea, ['test', 'testing', 'unit test'])) {
    capabilities.push('testing');
  }
  if (includesAny(lowerIdea, ['weather', 'forecast', 'forecasting', 'meteorology', 'climate'])) {
    capabilities.push('weather data');
    capabilities.push('forecasting');
  }

  if (capabilities.length === 0) {
    if (domain === 'web-framework') {
      capabilities.push('http server', 'routing');
    } else if (domain === 'data-science') {
      capabilities.push('data analysis', 'csv processing');
    } else if (domain === 'testing') {
      capabilities.push('testing');
    } else if (domain === 'weather') {
      capabilities.push('weather data', 'forecasting');
    }
  }

  return {
    capabilities: capabilities.length > 0 ? capabilities : ['general functionality'],
    domain: canonicalizeDomain(domain),
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

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}
