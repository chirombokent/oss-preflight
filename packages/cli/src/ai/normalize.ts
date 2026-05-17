import { canonicalizeDomain, IdeaBriefSchema, type Ecosystem, type IdeaBrief } from '@oss-preflight/core';

const ECOSYSTEMS: readonly Ecosystem[] = ['npm', 'pypi', 'github'];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function asEcosystem(value: unknown): Ecosystem {
  return typeof value === 'string' && ECOSYSTEMS.includes(value as Ecosystem)
    ? (value as Ecosystem)
    : 'npm';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeBriefJson(text: string): IdeaBrief {
  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI provider response');
  }

  const parsed = asRecord(JSON.parse(jsonMatch[0]));
  const targetUser = typeof parsed.targetUser === 'string' ? parsed.targetUser : undefined;

  return IdeaBriefSchema.parse({
    capabilities: asStringArray(parsed.capabilities),
    domain: canonicalizeDomain(
      typeof parsed.domain === 'string' && parsed.domain.trim().length > 0
        ? parsed.domain
        : 'general'
    ),
    ...(targetUser ? { targetUser } : {}),
    ecosystem: asEcosystem(parsed.ecosystem),
    constraints: asRecord(parsed.constraints),
  });
}
