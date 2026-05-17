import React from 'react';
import { SourceLink } from './SourceLink';
import type { EvidenceFact } from '@oss-preflight/core';

interface FactBadgeProps {
  label: string;
  fact: EvidenceFact;
  className?: string;
}

/**
 * FactBadge - renders a fact with its source link and (live) or (cached) label
 * AC9: Fact with source link and live/cached label
 */
export function FactBadge({ label, fact, className = '' }: FactBadgeProps) {
  if (!fact) {
    return (
      <div className={`text-sm text-pf-stone-mid ${className}`}>
        <span className="font-medium">{label}:</span> (not available)
      </div>
    );
  }

  const isLive = fact.sourceType !== 'inferred';
  const isCached = fact.source.includes('cache') || fact.sourceType === 'inferred';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-pf-charcoal dark:text-pf-ivory">
          {label}:
        </span>
        <span className="text-sm text-pf-charcoal dark:text-pf-ivory">
          {String(fact.value)}
        </span>
        <span className="text-xs text-pf-stone-mid">
          {isCached ? '(cached)' : '(live)'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <SourceLink url={fact.source} />
        <span className="text-pf-stone-mid">
          {new Date(fact.collectedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// Made with Bob
