interface ScaffoldProgressProps {
  status: 'idle' | 'preparing' | 'ready' | 'error';
  files: string[];
  fileName?: string;
  message?: string;
  scaffoldType?: 'template' | 'adoption-pack';
}

export function ScaffoldProgress({
  status,
  files,
  fileName,
  message,
  scaffoldType = 'template',
}: ScaffoldProgressProps) {
  if (status === 'idle') {
    return null;
  }

  const isReady = status === 'ready';
  const isPreparing = status === 'preparing';

  return (
    <section className="mx-auto max-w-6xl px-6 pb-10">
      <div className="rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-[0_12px_36px_rgba(26,31,44,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="rounded-lg bg-[#F7F9FC] p-4 dark:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${
                isReady ? 'bg-[#EAF7EF] text-[#1D5B39]' : 'bg-[#F0F6FB] text-[#173B57]'
              }`}>
                {isPreparing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#17191F] dark:text-white">
                  {isReady ? 'Download ready' : 'Preparing zip'}
                </h2>
                <p className="text-xs text-[#687083] dark:text-[#AEB6C7]">
                  {scaffoldType === 'template' ? 'Template scaffold' : 'Adoption pack'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#4D5566] dark:text-[#D7DDEA]">
              {message ?? (isPreparing ? 'Creating the package in memory.' : `${fileName} has been downloaded.`)}
            </p>
            {fileName && (
              <code className="mt-3 inline-block rounded-md bg-[#F1F4F8] px-3 py-2 text-xs text-[#303541] dark:bg-white/10 dark:text-[#D7DDEA]">
                {fileName}
              </code>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div key={file} className="flex items-center gap-2 rounded-lg border border-[#E6E9EF] px-3 py-2 text-sm text-[#4D5566] dark:border-white/10 dark:text-[#D7DDEA]">
              <svg className="h-4 w-4 shrink-0 text-[#4F7CAC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span className="truncate">{file}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
