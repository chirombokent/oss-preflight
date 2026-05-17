import { type FormEvent, useState } from 'react';
import { ApiError, testAiConnection, type AiProvider, type AiSettings } from '../api/client';

interface SettingsNotice {
  kind: 'error' | 'success' | 'info';
  title: string;
  message?: string;
  meta?: string;
}

interface SettingsPanelProps {
  open: boolean;
  settings: AiSettings;
  onChange: (settings: AiSettings) => void;
  onClose: () => void;
  onClear: () => void;
  onNotify?: (notice: SettingsNotice) => void;
}

const PROVIDERS: Array<{ value: AiProvider; label: string; description: string }> = [
  { value: 'keyword', label: 'Keyword', description: 'No key required' },
  { value: 'anthropic', label: 'Anthropic', description: 'Session token' },
  { value: 'openai-compatible', label: 'OpenAI-compatible', description: 'Model + base URL' },
  { value: 'gemini', label: 'Gemini', description: 'Session token' },
];

export function SettingsPanel({
  open,
  settings,
  onChange,
  onClose,
  onClear,
  onNotify,
}: SettingsPanelProps) {
  const [status, setStatus] = useState<{ type: 'idle' | 'checking' | 'ok' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  if (!open) {
    return null;
  }

  const needsToken = settings.provider !== 'keyword';
  const needsBaseUrl = settings.provider === 'openai-compatible';

  const update = (patch: Partial<AiSettings>) => {
    setStatus({ type: 'idle', message: '' });
    onChange({ ...settings, ...patch });
  };

  const handleProviderChange = (provider: AiProvider) => {
    update({
      provider,
      token: provider === 'keyword' ? '' : settings.token,
      model: provider === 'openai-compatible' ? settings.model : settings.model,
      baseUrl: provider === 'openai-compatible'
        ? settings.baseUrl || 'https://api.openai.com/v1'
        : settings.baseUrl,
    });
  };

  const handleTest = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ type: 'checking', message: 'Checking provider settings...' });
    try {
      const result = await testAiConnection(settings);
      setStatus({ type: 'ok', message: result.message });
      onNotify?.({
        kind: 'success',
        title: 'Provider settings ready',
        message: result.message,
        meta: result.provider,
      });
    } catch (error) {
      const title = error instanceof Error ? error.message : 'Provider settings failed validation.';
      const detail = error instanceof ApiError ? error.hint : undefined;
      setStatus({
        type: 'error',
        message: detail ? `${title} ${detail}` : title,
      });
      onNotify?.({
        kind: 'error',
        title,
        message: detail,
        meta: error instanceof ApiError ? `HTTP ${error.status}` : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-[#191A1D]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleTest} className="flex min-h-full flex-col">
          <header className="border-b border-[#E6E9EF] px-6 py-5 dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#17191F] dark:text-white">Settings</h2>
                <p className="mt-1 text-sm text-[#687083] dark:text-[#AEB6C7]">
                  Token stays in this browser session and is sent per request.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-lg text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] focus:outline-none focus:ring-2 focus:ring-[#4F7CAC] dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close settings"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-6 px-6 py-6">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-[#303541] dark:text-white">Provider</legend>
              <div className="grid gap-2">
                {PROVIDERS.map((provider) => (
                  <label
                    key={provider.value}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition ${
                      settings.provider === provider.value
                        ? 'border-[#4F7CAC] bg-[#F0F6FB] text-[#173B57] dark:border-[#7EC8E3] dark:bg-[#132634] dark:text-white'
                        : 'border-[#E2E6EE] bg-white text-[#303541] hover:border-[#B9C4D4] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#D7DDEA]'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{provider.label}</span>
                      <span className="block text-xs text-[#687083] dark:text-[#AEB6C7]">{provider.description}</span>
                    </span>
                    <input
                      className="h-4 w-4 accent-[#4F7CAC]"
                      type="radio"
                      name="provider"
                      checked={settings.provider === provider.value}
                      onChange={() => handleProviderChange(provider.value)}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {needsToken && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#303541] dark:text-white">Token</span>
                <input
                  type="password"
                  value={settings.token ?? ''}
                  onChange={(event) => update({ token: event.target.value })}
                  className="w-full rounded-lg border border-[#D9E0EA] bg-white px-4 py-3 text-sm text-[#17191F] outline-none transition focus:border-[#4F7CAC] focus:ring-4 focus:ring-[#4F7CAC]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  autoComplete="off"
                />
              </label>
            )}

            {settings.provider !== 'keyword' && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#303541] dark:text-white">Model</span>
                <input
                  value={settings.model ?? ''}
                  onChange={(event) => update({ model: event.target.value })}
                  className="w-full rounded-lg border border-[#D9E0EA] bg-white px-4 py-3 text-sm text-[#17191F] outline-none transition focus:border-[#4F7CAC] focus:ring-4 focus:ring-[#4F7CAC]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder={settings.provider === 'openai-compatible' ? 'Required for this provider' : 'Provider default'}
                />
              </label>
            )}

            {needsBaseUrl && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#303541] dark:text-white">Base URL</span>
                <input
                  value={settings.baseUrl ?? ''}
                  onChange={(event) => update({ baseUrl: event.target.value })}
                  className="w-full rounded-lg border border-[#D9E0EA] bg-white px-4 py-3 text-sm text-[#17191F] outline-none transition focus:border-[#4F7CAC] focus:ring-4 focus:ring-[#4F7CAC]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="https://api.openai.com/v1"
                />
              </label>
            )}

            {status.type !== 'idle' && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  status.type === 'ok'
                    ? 'border-[#2E8B57]/20 bg-[#EAF7EF] text-[#1D5B39]'
                    : status.type === 'error'
                      ? 'border-[#C44E52]/20 bg-[#FDEEEE] text-[#8E2C31]'
                      : 'border-[#4F7CAC]/20 bg-[#F0F6FB] text-[#173B57]'
                }`}
                role="status"
              >
                {status.message}
              </div>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E9EF] px-6 py-5 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setStatus({ type: 'idle', message: '' });
                onClear();
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#687083] transition hover:bg-[#F1F4F8] hover:text-[#17191F] dark:hover:bg-white/10 dark:hover:text-white"
            >
              Clear credentials
            </button>
            <button
              type="submit"
              disabled={status.type === 'checking'}
              className="rounded-lg bg-[#17191F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#303541] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17191F]"
            >
              {status.type === 'checking' ? 'Checking...' : 'Test connection'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
