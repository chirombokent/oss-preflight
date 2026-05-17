import { ScoreBar } from '../components/ScoreBar';
import type { Recommendation } from '@oss-preflight/core';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onOpenPassport: (recommendation: Recommendation) => void;
  onScaffold: (recommendation: Recommendation) => void;
}

/**
 * RecommendationList - displays exactly 3 recommendation cards
 * AC3: 3 cards with rank, name, score, goal-fit, maintenance, safety
 * Each card has "Open Passport" button
 */
export function RecommendationList({
  recommendations,
  onOpenPassport,
  onScaffold,
}: RecommendationListProps) {
  return (
    <div className="min-h-screen bg-pf-ivory dark:bg-[#171613] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-pf-slate-deep dark:text-pf-ivory mb-2">
            Recommendations
          </h1>
          <p className="text-pf-stone dark:text-[#D3D0C8]">
            Evidence-backed package recommendations for your idea
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {recommendations.slice(0, 3).map((rec) => (
            <div
              key={rec.rank}
              className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6 flex flex-col"
            >
              {/* Rank badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pf-slate-deep text-white flex items-center justify-center font-bold text-lg">
                    {rec.rank}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-pf-charcoal dark:text-pf-ivory">
                      {rec.candidate.name}
                    </h3>
                    <p className="text-sm text-pf-stone-mid">
                      v{rec.candidate.version}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pf-slate-deep dark:text-pf-ivory">
                    {rec.score.toFixed(0)}
                  </div>
                  <div className="text-xs text-pf-stone-mid">Overall</div>
                </div>
              </div>

              {/* Subscores */}
              <div className="space-y-3 mb-6 flex-grow">
                <ScoreBar
                  score={rec.subscores.goalFit}
                  label="Goal Fit"
                />
                <ScoreBar
                  score={rec.subscores.maintenance}
                  label="Maintenance"
                />
                <ScoreBar
                  score={rec.subscores.safety}
                  label="Safety"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onOpenPassport(rec)}
                  className="w-full bg-pf-slate-deep hover:bg-pf-slate-mid text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Open Passport
                </button>
                {rec.scaffoldAvailable && (
                  <button
                    onClick={() => onScaffold(rec)}
                    className="w-full bg-pf-copper-warm hover:bg-pf-copper-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Generate Scaffold
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
