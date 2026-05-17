import type { AnalyzeAuditResponse } from '../api/client';
import { WorkflowTracePanel } from '../components/WorkflowTracePanel';

interface AuditResultsProps {
  result: AnalyzeAuditResponse;
}

function riskTone(riskCount: number): string {
  if (riskCount >= 3) {
    return 'border-[#C44E52]/20 bg-[#FDEEEE] text-[#8E2C31]';
  }
  if (riskCount === 2) {
    return 'border-[#D88B31]/25 bg-[#FFF3DF] text-[#7A4D12]';
  }
  if (riskCount === 1) {
    return 'border-[#4F7CAC]/20 bg-[#F0F6FB] text-[#173B57]';
  }
  return 'border-[#2E8B57]/20 bg-[#EAF7EF] text-[#1D5B39]';
}

export function AuditResults({ result }: AuditResultsProps) {
  const dependencies = result.dependencies.slice(0, 12);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          ['Total', result.summary.total],
          ['High', result.summary.highRisk],
          ['Medium', result.summary.mediumRisk],
          ['Low', result.summary.lowRisk],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_12px_36px_rgba(26,31,44,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
            <span className="block text-sm font-semibold text-[#687083] dark:text-[#AEB6C7]">{label}</span>
            <span className="mt-2 block text-3xl font-semibold text-[#17191F] dark:text-white">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-[#DCE3ED] bg-white shadow-[0_12px_36px_rgba(26,31,44,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-[#E6E9EF] px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-semibold text-[#17191F] dark:text-white">Dependency risk</h2>
            <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
              {result.input}
            </p>
          </div>
          <div className="divide-y divide-[#E6E9EF] dark:divide-white/10">
            {dependencies.length > 0 ? dependencies.map((dependency) => (
              <article key={`${dependency.name}-${dependency.version}`} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_120px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[#17191F] dark:text-white">{dependency.name}</h3>
                    <span className="rounded-md bg-[#F1F4F8] px-2 py-1 text-xs text-[#687083] dark:bg-white/10 dark:text-[#AEB6C7]">
                      {dependency.version}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dependency.risks.length > 0 ? dependency.risks.map((risk) => (
                      <span
                        key={risk}
                        className={`rounded-md border px-2 py-1 text-xs ${riskTone(dependency.risks.length)}`}
                      >
                        {risk}
                      </span>
                    )) : (
                      <span className="rounded-md border border-[#2E8B57]/20 bg-[#EAF7EF] px-2 py-1 text-xs text-[#1D5B39]">
                        No immediate issues
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:text-right">
                  <span className="block text-2xl font-semibold text-[#17191F] dark:text-white">
                    {dependency.score.toFixed(0)}
                  </span>
                  <span className="text-xs text-[#687083] dark:text-[#AEB6C7]">score</span>
                </div>
              </article>
            )) : (
              <div className="px-5 py-10 text-sm text-[#687083] dark:text-[#AEB6C7]">
                No dependencies were found in the supported manifests.
              </div>
            )}
          </div>
        </section>

        <WorkflowTracePanel workflow={result.workflow} />
      </div>
    </div>
  );
}
