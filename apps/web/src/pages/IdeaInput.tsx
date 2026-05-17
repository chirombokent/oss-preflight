import { type FormEvent, useMemo, useState } from 'react';
import type { AnalyzeMode } from '../api/client';

interface IdeaInputProps {
  onSubmit: (input: string, mode?: AnalyzeMode) => void;
  loading?: boolean;
  providerLabel: string;
  compact?: boolean;
}

type ModeChoice = 'auto' | AnalyzeMode;

function classifyPreview(input: string): AnalyzeMode {
  const trimmed = input.trim();
  return /^(?:https?:\/\/)?(?:www\.)?github\.com[/:][^/\s]+\/[^/\s]+/i.test(trimmed) ||
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed)
    ? 'audit'
    : 'recommend';
}

export function IdeaInput({ onSubmit, loading = false, providerLabel, compact = false }: IdeaInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ModeChoice>('auto');
  const detectedMode = useMemo(() => classifyPreview(input), [input]);
  const activeMode = mode === 'auto' ? detectedMode : mode;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSubmit(trimmed, mode === 'auto' ? undefined : mode);
    }
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-[#DCE3ED] bg-[#F7F9FC] dark:border-white/10 dark:bg-[#111318]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(23,25,31,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(23,25,31,0.04)_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)]" />
      <div className={`relative mx-auto grid max-w-6xl content-center gap-8 px-6 lg:grid-cols-[1fr_420px] ${
        compact ? 'py-8' : 'min-h-[calc(100vh-76px)] py-14'
      }`}>
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-[#C9D3E2] bg-white px-3 py-2 text-sm font-semibold text-[#303541] shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#2E8B57]" />
            {providerLabel}
          </div>
          <h1 className={`max-w-3xl font-semibold tracking-normal text-[#17191F] dark:text-white ${
            compact ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl'
          }`}>
            OSS Preflight
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#4D5566] dark:text-[#D7DDEA]">
            Paste a public GitHub URL or describe your app idea.
          </p>
          <div className={`mt-8 max-w-2xl gap-3 sm:grid-cols-3 ${compact ? 'hidden xl:grid' : 'grid'}`}>
            {[
              ['Live evidence', 'Registry, GitHub, OpenSSF'],
              ['Public repos', 'No private clone access'],
              ['Session BYOK', 'No server-side token storage'],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-[#DCE3ED] bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
                <span className="block text-sm font-semibold text-[#17191F] dark:text-white">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#687083] dark:text-[#AEB6C7]">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-card rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_24px_70px_rgba(26,31,44,0.14)] dark:border-white/10 dark:bg-[#191A1D]">
          <label htmlFor="input" className="mb-3 block text-sm font-semibold text-[#303541] dark:text-white">
            Input
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://github.com/owner/repo or Discord bot that summarizes channel activity"
            className="h-40 w-full resize-none rounded-lg border border-[#D9E0EA] bg-[#FBFCFE] px-4 py-3 text-base leading-7 text-[#17191F] outline-none transition focus:border-[#4F7CAC] focus:bg-white focus:ring-4 focus:ring-[#4F7CAC]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-[#7F889A]"
            disabled={loading}
            required
          />

          <div className="mt-4 rounded-lg bg-[#F7F9FC] p-1 dark:bg-white/[0.05]">
            {[
              ['auto', 'Auto'],
              ['recommend', 'Idea'],
              ['audit', 'Repo'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value as ModeChoice)}
                className={`w-1/3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  mode === value
                    ? 'bg-white text-[#17191F] shadow-sm dark:bg-white dark:text-[#17191F]'
                    : 'text-[#687083] hover:text-[#17191F] dark:text-[#AEB6C7] dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-lg border border-[#DCE3ED] px-3 py-2 text-sm font-semibold text-[#4F7CAC] dark:border-white/10 dark:text-[#7EC8E3]">
              {activeMode === 'audit' ? 'Repo audit' : 'Idea recommend'}
            </span>
            <span className="text-sm text-[#687083] dark:text-[#AEB6C7]">Public GitHub repos only.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#17191F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303541] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17191F]"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {loading ? 'Running preflight...' : 'Run preflight'}
          </button>
        </form>
      </div>
    </section>
  );
}
