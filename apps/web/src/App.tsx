import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IdeaInput } from './pages/IdeaInput';
import { RecommendationList } from './pages/RecommendationList';
import { EvidencePassport } from './pages/EvidencePassport';
import { ScaffoldProgress } from './pages/ScaffoldProgress';
import { BuildProof } from './pages/BuildProof';
import { AuditResults } from './pages/AuditResults';
import { UsageGuide } from './pages/UsageGuide';
import { LoadingTrace } from './components/LoadingTrace';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkflowTracePanel } from './components/WorkflowTracePanel';
import {
  analyze,
  ApiError,
  scaffold,
  type AiProvider,
  type AiSettings,
  type AnalyzeMode,
  type AnalyzeResponse,
  type ScaffoldDownloadResponse,
} from './api/client';
import type { Recommendation } from '@oss-preflight/core';

type Page = 'home' | 'guide' | 'build-proof';

interface ScaffoldState {
  status: 'idle' | 'preparing' | 'ready' | 'error';
  files: string[];
  fileName?: string;
  message?: string;
  scaffoldType?: 'template' | 'adoption-pack';
  activeName?: string | null;
}

type ToastKind = 'error' | 'success' | 'info';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  meta?: string;
  ttlMs?: number;
}

const SETTINGS_KEY = 'oss-preflight.ai-settings.v1';
const THEME_KEY = 'oss-preflight.theme.v1';
const DEFAULT_SETTINGS: AiSettings = { provider: 'keyword', token: '', model: '', baseUrl: '' };
const DEFAULT_TOAST_TTL_MS = 6000;
const ERROR_TOAST_TTL_MS = 8500;
const TEMPLATE_FILES = [
  'package.json',
  'tsconfig.json',
  'src/index.ts',
  'src/summarizer.ts',
  'smoke-test.ts',
  'README.md',
  'ADOPTION_REPORT.md',
];

function readSessionSettings(): AiSettings {
  try {
    const raw = window.sessionStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      provider: (parsed.provider ?? 'keyword') as AiProvider,
      token: parsed.token ?? '',
      model: parsed.model ?? '',
      baseUrl: parsed.baseUrl ?? '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSessionSettings(settings: AiSettings): void {
  try {
    window.sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Session storage can be unavailable in locked-down browsers.
  }
}

function readDarkModePreference(): boolean {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

function writeDarkModePreference(darkMode: boolean): void {
  try {
    window.localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  } catch {
    // Local storage can be unavailable in locked-down browsers.
  }
}

function providerLabel(settings: AiSettings): string {
  switch (settings.provider) {
    case 'anthropic':
      return 'Anthropic session';
    case 'openai-compatible':
      return 'OpenAI-compatible session';
    case 'gemini':
      return 'Gemini session';
    case 'keyword':
    default:
      return 'Keyword mode';
  }
}

function filesForRecommendation(recommendation: Recommendation): string[] {
  return recommendation.scaffoldAvailable && recommendation.templateId === 'discord-summary-bot'
    ? TEMPLATE_FILES
    : ['ADOPTION_PACK.md'];
}

function triggerDownload(download: ScaffoldDownloadResponse): void {
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = download.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function toastFromError(error: unknown, fallback: string): Omit<ToastMessage, 'id'> {
  if (error instanceof ApiError) {
    const meta = [
      error.mode ? `${error.mode === 'audit' ? 'Audit' : 'Recommend'} mode` : null,
      `HTTP ${error.status}`,
    ].filter(Boolean).join(' / ');
    return {
      kind: 'error',
      title: error.message || fallback,
      message: error.hint,
      meta,
      ttlMs: ERROR_TOAST_TTL_MS,
    };
  }

  return {
    kind: 'error',
    title: error instanceof Error ? error.message : fallback,
    ttlMs: ERROR_TOAST_TTL_MS,
  };
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.ttlMs ?? DEFAULT_TOAST_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id, toast.ttlMs]);

  const palette = toast.kind === 'error'
    ? {
        shell: 'border-[#C44E52]/25 bg-[#FFF5F5] text-[#8E2C31] shadow-[#8E2C31]/10 dark:border-[#F29CA3]/20 dark:bg-[#2A1517] dark:text-[#FFD7DA]',
        icon: 'bg-[#FDE1E3] text-[#9F3036] dark:bg-[#5B2025] dark:text-[#FFD7DA]',
        bar: 'bg-[#C44E52]',
      }
    : toast.kind === 'success'
      ? {
          shell: 'border-[#2E8B57]/25 bg-[#F2FBF5] text-[#1D5B39] shadow-[#1D5B39]/10 dark:border-[#7BD8A4]/20 dark:bg-[#12241A] dark:text-[#C9F5D8]',
          icon: 'bg-[#DDF5E7] text-[#1D7A48] dark:bg-[#1F5134] dark:text-[#C9F5D8]',
          bar: 'bg-[#2E8B57]',
        }
      : {
          shell: 'border-[#4F7CAC]/25 bg-[#F0F6FB] text-[#173B57] shadow-[#173B57]/10 dark:border-[#7EC8E3]/20 dark:bg-[#132634] dark:text-[#D6F3FF]',
          icon: 'bg-[#DCEAF5] text-[#295D85] dark:bg-[#20475E] dark:text-[#D6F3FF]',
          bar: 'bg-[#4F7CAC]',
        };

  return (
    <div
      className={`toast-enter relative overflow-hidden rounded-lg border px-4 py-3 shadow-xl backdrop-blur ${palette.shell}`}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3 pr-1">
        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${palette.icon}`} aria-hidden="true">
          {toast.kind === 'success' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 8v5" strokeLinecap="round" />
              <path d="M12 17h.01" strokeLinecap="round" />
              <path d="M10.4 4.1 2.7 17.5A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.5L13.6 4.1a1.8 1.8 0 0 0-3.2 0Z" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm leading-5 opacity-90">{toast.message}</p>}
          {toast.meta && <p className="mt-2 text-xs font-semibold uppercase tracking-normal opacity-65">{toast.meta}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current dark:hover:bg-white/10"
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5 dark:bg-white/10">
        <div
          className={`toast-progress h-full origin-left ${palette.bar}`}
          style={{ animationDuration: `${toast.ttlMs ?? DEFAULT_TOAST_TTL_MS}ms` }}
        />
      </div>
    </div>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ResultBar({
  result,
  onOverride,
}: {
  result: AnalyzeResponse;
  onOverride: (mode: AnalyzeMode) => void;
}) {
  const oppositeMode: AnalyzeMode = result.mode === 'audit' ? 'recommend' : 'audit';
  return (
    <section className="border-b border-[#DCE3ED] bg-white/90 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-[#111318]/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#F0F6FB] px-3 py-2 text-sm font-semibold text-[#173B57] dark:bg-[#132634] dark:text-[#7EC8E3]">
            {result.mode === 'audit' ? 'Repo audit' : 'Idea recommend'}
          </span>
          <span className="text-sm text-[#687083] dark:text-[#AEB6C7]">
            detected as {result.detectedMode === 'audit' ? 'repo' : 'idea'}
          </span>
        </div>
        <button
          onClick={() => onOverride(oppositeMode)}
          className="rounded-lg border border-[#C9D3E2] px-3 py-2 text-sm font-semibold text-[#303541] transition hover:border-[#4F7CAC] hover:bg-[#F0F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
        >
          Run as {oppositeMode === 'audit' ? 'repo' : 'idea'}
        </button>
      </div>
    </section>
  );
}

function App() {
  const toastId = useRef(0);
  const [page, setPage] = useState<Page>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AiSettings>(() => readSessionSettings());
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<AnalyzeMode | 'auto'>('auto');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [lastInput, setLastInput] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => readDarkModePreference());
  const [calmMode, setCalmMode] = useState(false);
  const [scaffoldState, setScaffoldState] = useState<ScaffoldState>({
    status: 'idle',
    files: [],
    activeName: null,
  });

  const label = useMemo(() => providerLabel(settings), [settings]);
  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    toastId.current += 1;
    setToasts((current) => [...current, { ...toast, id: toastId.current }].slice(-4));
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCalmMode(prefersReducedMotion);
  }, []);

  useEffect(() => {
    writeSessionSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    writeDarkModePreference(darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (calmMode) {
      document.documentElement.setAttribute('data-calm', 'true');
    } else {
      document.documentElement.removeAttribute('data-calm');
    }
  }, [calmMode]);

  useEffect(() => {
    if (result && !loading && page === 'home') {
      window.setTimeout(() => {
        document.getElementById('result-anchor')?.scrollIntoView({
          behavior: calmMode ? 'auto' : 'smooth',
          block: 'start',
        });
      }, 80);
    }
  }, [calmMode, loading, page, result]);

  const handleAnalyze = async (input: string, mode?: AnalyzeMode) => {
    setPage('home');
    setLoading(true);
    setLoadingMode(mode ?? 'auto');
    setLastInput(input);
    setScaffoldState({ status: 'idle', files: [], activeName: null });

    try {
      const nextResult = await analyze(input, settings, mode);
      setResult(nextResult);
    } catch (err) {
      pushToast(toastFromError(err, 'Analyze request failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPassport = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setPassportOpen(true);
  };

  const handleScaffold = async (recommendation: Recommendation) => {
    const files = filesForRecommendation(recommendation);
    setScaffoldState({
      status: 'preparing',
      files,
      activeName: recommendation.candidate.name,
      scaffoldType: recommendation.scaffoldAvailable ? 'template' : 'adoption-pack',
      message: 'Creating the zip in memory.',
    });

    try {
      const download = await scaffold(recommendation);
      triggerDownload(download);
      pushToast({
        kind: 'success',
        title: 'Download ready',
        message: download.message,
        ttlMs: DEFAULT_TOAST_TTL_MS,
      });
      setScaffoldState({
        status: 'ready',
        files,
        fileName: download.fileName,
        message: download.message,
        scaffoldType: download.type,
        activeName: null,
      });
    } catch (err) {
      pushToast(toastFromError(err, 'Failed to generate scaffold zip'));
      setScaffoldState({
        status: 'error',
        files,
        message: 'Scaffold generation failed.',
        scaffoldType: recommendation.scaffoldAvailable ? 'template' : 'adoption-pack',
        activeName: null,
      });
    }
  };

  const recommendations = result?.mode === 'recommend' ? result.recommendations : [];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#17191F] dark:bg-[#111318] dark:text-white">
      <nav className="sticky top-0 z-40 border-b border-[#DCE3ED] bg-white px-6 py-4 dark:border-white/10 dark:bg-[#111318]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage('home')}
              className="flex items-center gap-3 rounded-lg px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-[#4F7CAC]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#17191F] text-sm font-semibold text-white dark:bg-white dark:text-[#17191F]">
                OP
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-4">OSS Preflight</span>
                <span className="block text-xs text-[#687083] dark:text-[#AEB6C7]">Production web</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {recommendations.length > 0 && (
              <button
                onClick={() => setPage('home')}
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
              >
                Results
              </button>
            )}
            <button
              onClick={() => setPage('guide')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] dark:hover:bg-white/10 dark:hover:text-white"
            >
              Guide
            </button>
            <button
              onClick={() => setPage('build-proof')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] dark:hover:bg-white/10 dark:hover:text-white"
            >
              Build Proof
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Open settings"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 0 1-4 0v-.08A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 0 1 4 0v.08A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .4.14.76.4 1 .3.28.68.4 1.1.4H21a2 2 0 0 1 0 4h-.08a1.7 1.7 0 0 0-1.52.6Z" />
              </svg>
            </button>
            <button
              onClick={() => setDarkMode((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-lg text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setCalmMode((value) => !value)}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] dark:hover:bg-white/10 dark:hover:text-white md:inline-flex"
            >
              {calmMode ? 'Motion' : 'Calm'}
            </button>
          </div>
        </div>
      </nav>

      {page === 'build-proof' ? (
        <BuildProof />
      ) : page === 'guide' ? (
        <UsageGuide />
      ) : (
        <>
          <IdeaInput onSubmit={handleAnalyze} loading={loading} providerLabel={label} compact={Boolean(result)} />

          {loading && <LoadingTrace mode={loadingMode} />}

          {result && !loading && (
            <>
              <div id="result-anchor" />
              <ResultBar result={result} onOverride={(mode) => handleAnalyze(lastInput, mode)} />
              {result.mode === 'recommend' ? (
                <>
                  {result.intent.fallbackUsed ? (
                    <div className="mx-auto mt-6 max-w-6xl px-6">
                      <div className="rounded-lg border border-[#D88B31]/25 bg-[#FFF3DF] px-4 py-3 text-sm text-[#7A4D12] dark:bg-[#2A2111] dark:text-[#F4D6A2]">
                        {result.intent.requestedProvider ?? 'AI'} parsing failed, so keyword parsing handled this run.
                      </div>
                    </div>
                  ) : result.provider === 'keyword' && (
                    <div className="mx-auto mt-6 max-w-6xl px-6">
                      <div className="rounded-lg border border-[#D88B31]/25 bg-[#FFF3DF] px-4 py-3 text-sm text-[#7A4D12] dark:bg-[#2A2111] dark:text-[#F4D6A2]">
                        Keyword mode returned deterministic recommendations without an AI token.
                      </div>
                    </div>
                  )}
                  <RecommendationList
                    recommendations={result.recommendations}
                    onOpenPassport={handleOpenPassport}
                    onScaffold={handleScaffold}
                    activeScaffoldName={scaffoldState.activeName}
                  />
                  <ScaffoldProgress
                    status={scaffoldState.status}
                    files={scaffoldState.files}
                    fileName={scaffoldState.fileName}
                    message={scaffoldState.message}
                    scaffoldType={scaffoldState.scaffoldType}
                  />
                  <div className="mx-auto max-w-6xl px-6 pb-12">
                    <WorkflowTracePanel workflow={result.workflow} />
                  </div>
                </>
              ) : (
                <AuditResults result={result} />
              )}
            </>
          )}
        </>
      )}

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      {passportOpen && (
        <EvidencePassport
          recommendation={selectedRecommendation}
          onClose={() => setPassportOpen(false)}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onClear={() => {
          window.sessionStorage.removeItem(SETTINGS_KEY);
          setSettings(DEFAULT_SETTINGS);
        }}
        onNotify={(notice) => {
          pushToast({
            ...notice,
            ttlMs: notice.kind === 'error' ? ERROR_TOAST_TTL_MS : DEFAULT_TOAST_TTL_MS,
          });
        }}
      />
    </div>
  );
}

export default App;
