import type { WorkflowTrace } from '@oss-preflight/core';

interface WorkflowTracePanelProps {
  workflow: WorkflowTrace;
}

export function WorkflowTracePanel({ workflow }: WorkflowTracePanelProps) {
  const candidates = workflow.candidates.slice(0, 8);
  const gaps = workflow.evidenceGaps.slice(0, 6);

  return (
    <section className="rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_12px_36px_rgba(26,31,44,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#17191F] dark:text-white">Workflow trace</h2>
          <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
            {workflow.discoveryPlan.searchMethod} · {workflow.discoveryPlan.ecosystem}
          </p>
        </div>
        <code className="rounded-md bg-[#F1F4F8] px-3 py-2 text-xs text-[#303541] dark:bg-white/10 dark:text-[#D7DDEA]">
          {workflow.workflowId.slice(0, 8)}
        </code>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#687083] dark:text-[#AEB6C7]">
            Candidate source
          </h3>
          <div className="grid gap-2">
            {candidates.length > 0 ? candidates.map((candidate) => (
              <div
                key={`${candidate.name}-${candidate.discoveredAt}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F9FC] px-3 py-2 dark:bg-white/[0.05]"
              >
                <span className="truncate text-sm font-semibold text-[#303541] dark:text-white">{candidate.name}</span>
                <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs text-[#4F7CAC] shadow-sm dark:bg-white/10 dark:text-[#7EC8E3]">
                  {candidate.source}
                </span>
              </div>
            )) : (
              <p className="rounded-lg bg-[#F7F9FC] px-3 py-2 text-sm text-[#687083] dark:bg-white/[0.05] dark:text-[#AEB6C7]">
                No candidates were discovered.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#687083] dark:text-[#AEB6C7]">
            Evidence gaps
          </h3>
          <div className="space-y-2">
            {gaps.length > 0 ? gaps.map((gap) => (
              <div key={`${gap.candidate}-${gap.missingFields.join(',')}`} className="rounded-lg border border-[#F2D4A7] bg-[#FFF8EA] px-3 py-2 text-sm text-[#7A4D12] dark:border-[#F2D4A7]/25 dark:bg-[#2A2111] dark:text-[#F4D6A2]">
                <span className="font-semibold">{gap.candidate}</span>
                <span className="block text-xs">{gap.missingFields.join(', ')}</span>
              </div>
            )) : (
              <p className="rounded-lg border border-[#2E8B57]/20 bg-[#EAF7EF] px-3 py-2 text-sm text-[#1D5B39] dark:bg-[#10271B] dark:text-[#BCECCF]">
                No evidence gaps recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
