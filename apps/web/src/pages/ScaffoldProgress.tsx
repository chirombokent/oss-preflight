import React from 'react';
import { HighlightCode } from '../components/HighlightCode';

interface ScaffoldProgressProps {
  files: string[];
  smokeTestStatus: 'idle' | 'running' | 'pass' | 'fail';
  adoptionReport: string;
  output: string;
}

/**
 * ScaffoldProgress - displays file tree, smoke test status, adoption report
 * AC5: File tree of generated scaffold, live smoke test status, adoption report content
 */
export function ScaffoldProgress({
  files,
  smokeTestStatus,
  adoptionReport,
  output,
}: ScaffoldProgressProps) {
  const getStatusIcon = () => {
    switch (smokeTestStatus) {
      case 'running':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pf-slate-deep"></div>
        );
      case 'pass':
        return (
          <svg className="w-5 h-5 text-pf-success" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'fail':
        return (
          <svg className="w-5 h-5 text-pf-error" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (smokeTestStatus) {
      case 'running':
        return 'Running smoke test...';
      case 'pass':
        return 'Smoke test passed ✓';
      case 'fail':
        return 'Smoke test failed ✗';
      default:
        return 'Smoke test pending';
    }
  };

  return (
    <div className="min-h-screen bg-pf-ivory dark:bg-[#171613] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-pf-slate-deep dark:text-pf-ivory mb-2">
            Scaffold Generated
          </h1>
          <p className="text-pf-stone dark:text-[#D3D0C8]">
            Your working starter is ready
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* File Tree */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Generated Files
            </h2>
            <div className="space-y-1 font-mono text-sm">
              {files.length > 0 ? (
                files.map((file, i) => (
                  <div
                    key={i}
                    className="text-pf-stone dark:text-[#D3D0C8] hover:text-pf-slate-mid transition-colors"
                  >
                    📄 {file}
                  </div>
                ))
              ) : (
                <p className="text-pf-stone-mid">No files generated yet</p>
              )}
            </div>
          </div>

          {/* Smoke Test Status */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Smoke Test
            </h2>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon()}
              <span className="text-pf-charcoal dark:text-pf-ivory font-medium">
                {getStatusText()}
              </span>
            </div>
            {output && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-2">
                  Output
                </h3>
                <HighlightCode code={output} className="max-h-64 overflow-y-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Adoption Report */}
        {adoptionReport && (
          <div className="mt-6 bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Adoption Report
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-pf-stone dark:text-[#D3D0C8]">
                {adoptionReport}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
