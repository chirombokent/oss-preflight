import { ScoreBar } from '../components/ScoreBar';
import type { Recommendation } from '@oss-preflight/core';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onOpenPassport: (recommendation: Recommendation) => void;
  onScaffold: (recommendation: Recommendation) => void;
  activeScaffoldName?: string | null;
}

function candidateKind(recommendation: Recommendation): 'package' | 'repository' {
  return recommendation.candidate.kind ?? (recommendation.candidate.ecosystem === 'github' ? 'repository' : 'package');
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  isPreparing: boolean;
  onOpenPassport: (recommendation: Recommendation) => void;
  onScaffold: (recommendation: Recommendation) => void;
}

function RecommendationCard({
  recommendation,
  index,
  isPreparing,
  onOpenPassport,
  onScaffold,
}: RecommendationCardProps) {
  const kind = candidateKind(recommendation);

  return (
    <article
      className="surface-card group relative overflow-hidden rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_12px_36px_rgba(26,31,44,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(26,31,44,0.12)] dark:border-white/10 dark:bg-white/[0.04]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F7CAC] via-[#2E8B57] to-[#D88B31]" />
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#17191F] text-base font-semibold text-white dark:bg-white dark:text-[#17191F]">
            {recommendation.rank}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-[#17191F] dark:text-white">
              {recommendation.candidate.name}
            </h3>
            <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
              {kind} / {recommendation.candidate.ecosystem} / {recommendation.candidate.version}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-3xl font-semibold text-[#17191F] dark:text-white">
            {recommendation.score.toFixed(0)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#687083] dark:text-[#AEB6C7]">
            score
          </span>
        </div>
      </div>

      <div className="mb-5 space-y-3">
        <ScoreBar score={recommendation.subscores.goalFit} label="Goal fit" />
        <ScoreBar score={recommendation.subscores.maintenance} label="Maintenance" />
        <ScoreBar score={recommendation.subscores.safety} label="Safety" />
      </div>

      <p className="mb-5 min-h-[72px] text-sm leading-6 text-[#4D5566] dark:text-[#D7DDEA]">
        {recommendation.passport.interpretation.goalFit || 'No interpretation available.'}
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onOpenPassport(recommendation)}
          className="rounded-lg border border-[#C9D3E2] px-4 py-2.5 text-sm font-semibold text-[#303541] transition hover:border-[#4F7CAC] hover:bg-[#F0F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
        >
          Open Passport
        </button>
        <button
          onClick={() => onScaffold(recommendation)}
          disabled={isPreparing}
          className="rounded-lg bg-[#17191F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#303541] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-[#17191F]"
        >
          {isPreparing
            ? 'Preparing zip...'
            : recommendation.scaffoldAvailable
              ? 'Download starter'
              : 'Download adoption pack'}
        </button>
      </div>
    </article>
  );
}

export function RecommendationList({
  recommendations,
  onOpenPassport,
  onScaffold,
  activeScaffoldName = null,
}: RecommendationListProps) {
  const groups = [
    {
      title: 'Packages',
      items: recommendations.filter((rec) => candidateKind(rec) === 'package'),
    },
    {
      title: 'Repositories and solutions',
      items: recommendations.filter((rec) => candidateKind(rec) === 'repository'),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-[#17191F] dark:text-white md:text-4xl">
            Recommendations
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#687083] dark:text-[#AEB6C7]">
            Ranked packages, repositories, and solution candidates with sourced facts separated from interpretation.
          </p>
        </div>
        <span className="rounded-lg border border-[#DCE3ED] bg-white px-3 py-2 text-sm font-semibold text-[#4F7CAC] dark:border-white/10 dark:bg-white/[0.05] dark:text-[#7EC8E3]">
          {recommendations.length} ranked
        </span>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#687083] dark:text-[#AEB6C7]">
                {group.title}
              </h2>
              <span className="rounded-md bg-[#F1F4F8] px-2 py-1 text-xs font-semibold text-[#4F7CAC] dark:bg-white/10 dark:text-[#7EC8E3]">
                {group.items.length}
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {group.items.map((recommendation, index) => (
                <RecommendationCard
                  key={`${recommendation.rank}-${recommendation.candidate.name}`}
                  recommendation={recommendation}
                  index={index}
                  isPreparing={activeScaffoldName === recommendation.candidate.name}
                  onOpenPassport={onOpenPassport}
                  onScaffold={onScaffold}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
