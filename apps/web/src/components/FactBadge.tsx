import { SourceLink } from './SourceLink';
import type { EvidenceFact, RetrievalSource } from '@oss-preflight/core';

interface FactBadgeProps {
  label: string;
  fact: EvidenceFact;
  className?: string;
}

/**
 * RetrievalBadge - color-coded badge for retrieval source
 */
function RetrievalBadge({ source }: { source: RetrievalSource }) {
  const badges = {
    'live': { label: 'LIVE', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    'cache': { label: 'CACHED', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'cache-fallback': { label: 'CACHED (rate-limited)', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'fixture': { label: 'FIXTURE', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    'not-available': { label: 'NOT AVAILABLE', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  // Guard against an unknown / missing retrievalSource rather than crashing.
  const { label, color } = badges[source] ?? badges['not-available'];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

/**
 * Safely format an ISO timestamp; falls back to the raw string if it is
 * missing or unparseable (e.g. the literal 'not-available').
 */
function formatCollectedAt(collectedAt: string | undefined): string {
  if (!collectedAt) {
    return 'unknown date';
  }
  const date = new Date(collectedAt);
  return isNaN(date.getTime()) ? collectedAt : date.toLocaleDateString();
}

/**
 * FactBadge - renders a fact with all 5 fields: value, source, collectedAt, sourceType, retrievalSource
 * P9 Phase 4: Display retrievalSource badge with color coding
 */
export function FactBadge({ label, fact, className = '' }: FactBadgeProps) {
  if (!fact) {
    return (
      <div className={`flex items-baseline gap-2 flex-wrap text-sm text-pf-stone-mid ${className}`}>
        <span className="font-medium">{label}:</span>
        <span>(not available)</span>
        <RetrievalBadge source="not-available" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm font-medium text-pf-charcoal dark:text-pf-ivory">
          {label}:
        </span>
        <span className="text-sm text-pf-charcoal dark:text-pf-ivory">
          {String(fact.value)}
        </span>
        <RetrievalBadge source={fact.retrievalSource ?? 'not-available'} />
      </div>
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-pf-stone-mid">
          {fact.sourceType ?? 'unknown'}
        </span>
        <span className="text-pf-stone-mid">•</span>
        <SourceLink url={fact.source} />
        <span className="text-pf-stone-mid">•</span>
        <span className="text-pf-stone-mid">
          {formatCollectedAt(fact.collectedAt)}
        </span>
      </div>
    </div>
  );
}

// Made with Bob
