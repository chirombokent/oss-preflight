import { ScoreBar } from '../components/ScoreBar';
import type { Recommendation } from '@oss-preflight/core';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onOpenPassport: (recommendation: Recommendation) => void;
  onScaffold: (recommendation: Recommendation) => void;
  activeScaffoldName?: string | null;
}

export function RecommendationList({
  recommendations,
  onOpenPassport,
  onScaffold,
  activeScaffoldName = null,
}: RecommendationListProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-[#17191F] dark:text-white md:text-4xl">
            Recommendations
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#687083] dark:text-[#AEB6C7]">
            Ranked packages with sourced facts separated from interpretation.
          </p>
        </div>
        <span className="rounded-lg border border-[#DCE3ED] bg-white px-3 py-2 text-sm font-semibold text-[#4F7CAC] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#7EC8E3]">
          {recommendations.length} ranked
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {recommendations.slice(0, 3).map((rec, index) => {
          const isPreparing = activeScaffoldName === rec.candidate.name;
          return (
            <article
              key={`${rec.rank}-${rec.candidate.name}`}
              className="surface-card group relative overflow-hidden rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_12px_36px_rgba(26,31,44,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(26,31,44,0.12)] dark:border-white/10 dark:bg-white/[0.04]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F7CAC] via-[#2E8B57] to-[#D88B31]" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#17191F] text-base font-semibold text-white dark:bg-white dark:text-[#17191F]">
                    {rec.rank}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-[#17191F] dark:text-white">
                      {rec.candidate.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
                      {rec.candidate.ecosystem} · {rec.candidate.version}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-3xl font-semibold text-[#17191F] dark:text-white">
                    {rec.score.toFixed(0)}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#687083] dark:text-[#AEB6C7]">
                    score
                  </span>
                </div>
              </div>

              <div className="mb-5 space-y-3">
                <ScoreBar score={rec.subscores.goalFit} label="Goal fit" />
                <ScoreBar score={rec.subscores.maintenance} label="Maintenance" />
                <ScoreBar score={rec.subscores.safety} label="Safety" />
              </div>

              <p className="mb-5 min-h-[72px] text-sm leading-6 text-[#4D5566] dark:text-[#D7DDEA]">
                {rec.passport.interpretation.goalFit || 'No interpretation available.'}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onOpenPassport(rec)}
                  className="rounded-lg border border-[#C9D3E2] px-4 py-2.5 text-sm font-semibold text-[#303541] transition hover:border-[#4F7CAC] hover:bg-[#F0F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                >
                  Open Passport
                </button>
                <button
                  onClick={() => onScaffold(rec)}
                  disabled={isPreparing}
                  className="rounded-lg bg-[#17191F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#303541] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#17191F]"
                >
                  {isPreparing
                    ? 'Preparing zip...'
                    : rec.scaffoldAvailable
                      ? 'Download starter'
                      : 'Download adoption pack'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
