import { FactBadge } from '../components/FactBadge';
import type { Recommendation } from '@oss-preflight/core';

interface EvidencePassportProps {
  recommendation: Recommendation | null;
  onClose: () => void;
}

/**
 * EvidencePassport - modal displaying fact/inference split
 * AC4: Two visibly separated columns: Facts (sourced) and Interpretation (AI-derived)
 * Missing fields show "(not available)"
 */
export function EvidencePassport({ recommendation, onClose }: EvidencePassportProps) {
  if (!recommendation) return null;

  const { passport } = recommendation;

  return (
    <div
      className="fixed inset-0 bg-pf-overlay z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#282722] rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#282722] border-b border-pf-sand-light dark:border-[rgba(250,250,247,0.14)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-pf-slate-deep dark:text-pf-ivory">
              Evidence Passport
            </h2>
            <p className="text-sm text-pf-stone-mid mt-1">
              {recommendation.candidate.name} v{recommendation.candidate.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-pf-stone hover:text-pf-charcoal dark:hover:text-pf-ivory transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Two-column layout: Facts | Interpretation */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* LEFT COLUMN: FACTS (sourced, with source URLs, timestamps, sourceType labels) */}
          <div className="border-r border-pf-sand-light dark:border-[rgba(250,250,247,0.14)] pr-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-pf-slate-deep dark:text-pf-ivory mb-1">
                Facts
              </h3>
              <p className="text-sm text-pf-stone-mid">
                Sourced evidence with timestamps and links
              </p>
            </div>

            <div className="space-y-4">
              <FactBadge label="License" fact={passport.facts.license} />
              <FactBadge label="Weekly Downloads" fact={passport.facts.weeklyDownloads} />
              <FactBadge label="Last Commit" fact={passport.facts.lastCommit} />
              <FactBadge label="Stars" fact={passport.facts.stars} />
              <FactBadge label="Open Issues" fact={passport.facts.openIssues} />
              <FactBadge label="OpenSSF Score" fact={passport.facts.openssfScore} />
            </div>
          </div>

          {/* RIGHT COLUMN: INTERPRETATION (AI-derived) */}
          <div className="pl-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-pf-copper-dark dark:text-pf-copper-warm mb-1">
                Interpretation
              </h3>
              <p className="text-sm text-pf-stone-mid">
                AI-derived analysis and recommendations
              </p>
            </div>

            <div className="space-y-6">
              {/* Goal Fit */}
              <div>
                <h4 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                  Goal Fit Summary
                </h4>
                <p className="text-sm text-pf-stone dark:text-[#D3D0C8]">
                  {passport.interpretation.goalFit || '(not available)'}
                </p>
              </div>

              {/* Compatibility */}
              <div>
                <h4 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                  Compatibility Narrative
                </h4>
                <p className="text-sm text-pf-stone dark:text-[#D3D0C8]">
                  {passport.interpretation.compatibility || '(not available)'}
                </p>
              </div>

              {/* Tradeoffs */}
              <div>
                <h4 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                  Tradeoffs
                </h4>
                {passport.interpretation.tradeoffs.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-pf-stone dark:text-[#D3D0C8]">
                    {passport.interpretation.tradeoffs.map((tradeoff, i) => (
                      <li key={i}>{tradeoff}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-pf-stone-mid">(not available)</p>
                )}
              </div>

              {/* Warnings */}
              <div>
                <h4 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                  Warnings
                </h4>
                {passport.interpretation.warnings.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-pf-error">
                    {passport.interpretation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-pf-stone-mid">(not available)</p>
                )}
              </div>

              {/* Recommended Alongside */}
              {passport.interpretation.recommendedAlongside.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                    Recommended Alongside
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {passport.interpretation.recommendedAlongside.map((pkg, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-pf-ivory-warm dark:bg-[#201F1A] rounded-full text-sm text-pf-charcoal dark:text-pf-ivory"
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
