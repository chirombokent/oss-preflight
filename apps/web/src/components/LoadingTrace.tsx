import { useEffect, useMemo, useState } from 'react';
import type { AnalyzeMode } from '../api/client';

interface LoadingTraceProps {
  mode: AnalyzeMode | 'auto';
}

const IDEA_STEPS = [
  'Classifying input',
  'Parsing intent',
  'Searching live registries',
  'Collecting evidence',
  'Ranking recommendations',
];

const AUDIT_STEPS = [
  'Classifying input',
  'Checking public repository',
  'Reading manifests',
  'Collecting dependency evidence',
  'Scoring risk',
];

export function LoadingTrace({ mode }: LoadingTraceProps) {
  const [activeStep, setActiveStep] = useState(0);
  const steps = useMemo(() => (mode === 'audit' ? AUDIT_STEPS : IDEA_STEPS), [mode]);

  useEffect(() => {
    setActiveStep(0);
    const timer = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, steps.length - 1));
    }, 700);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-lg border border-[#DCE3ED] bg-white/92 p-5 shadow-[0_16px_50px_rgba(26,31,44,0.08)] dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4F7CAC] dark:text-[#7EC8E3]">
            Live workflow
          </h2>
          <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
            Running fresh collector calls for this request.
          </p>
        </div>
        <div className="relative h-10 w-10 rounded-lg border border-[#DCE3ED] bg-[#F7F9FC] dark:border-white/10 dark:bg-white/[0.05]">
          <span className="absolute inset-2 rounded-md bg-[#4F7CAC]/20" />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F7CAC] shadow-[0_0_0_8px_rgba(79,124,172,0.12)]" />
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const status = index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending';
          return (
            <li
              key={step}
              className={`relative rounded-lg border px-3 py-3 transition duration-300 ${
                status === 'active'
                  ? 'border-[#4F7CAC] bg-[#F0F6FB] text-[#173B57] dark:border-[#7EC8E3] dark:bg-[#132634] dark:text-white'
                  : status === 'done'
                    ? 'border-[#2E8B57]/20 bg-[#EAF7EF] text-[#1D5B39] dark:border-[#74D99F]/20 dark:bg-[#10271B] dark:text-[#BCECCF]'
                    : 'border-[#E2E6EE] bg-[#F7F9FC] text-[#687083] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#AEB6C7]'
              }`}
            >
              <span className="mb-2 block text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
              <span className="block text-sm font-semibold leading-snug">{step}</span>
              {status === 'active' && <span className="loading-scan" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
