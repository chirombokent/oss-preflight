import { HighlightCode } from '../components/HighlightCode';
import buildReport from '../../../../bob_sessions/build-report.md?raw';

/**
 * BuildProof - renders Bob evidence
 * AC6: .bob/custom_modes.yaml summary, .bob/skills/ list, bob_sessions/ export list,
 * bob_sessions/build-report.md content, git log showing Bob-assisted commits
 */
export function BuildProof() {
  return (
    <div className="min-h-screen bg-pf-ivory dark:bg-[#171613] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-pf-slate-deep dark:text-pf-ivory mb-2">
            Build Proof
          </h1>
          <p className="text-pf-stone dark:text-[#D3D0C8]">
            Verifiable evidence of Bob-powered SDLC acceleration — custom modes, skills, session exports, and commit history
          </p>
        </div>

        <div className="space-y-6">
          {/* Bob Configuration */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Bob Configuration
            </h2>
            <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-4">
              Project-specific Bob setup defining specialized modes and skills for this build
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-pf-slate-deep dark:text-pf-ivory mb-2">
                  Custom Modes
                </h3>
                <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-2">
                  Source: <code className="bg-pf-ivory-warm dark:bg-[#201F1A] px-2 py-1 rounded">
                    .bob/custom_modes.yaml
                  </code>
                </p>
                <ul className="list-disc list-inside text-sm text-pf-stone dark:text-[#D3D0C8] space-y-1">
                  <li><strong>code</strong> — Implementation mode (scoped to packages/, apps/)</li>
                  <li><strong>reviewer</strong> — Code review with quality gates</li>
                  <li><strong>plan</strong> — Architecture and spec design</li>
                  <li><strong>orchestrator</strong> — Multi-phase build coordination</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-pf-slate-deep dark:text-pf-ivory mb-2">
                  Skills
                </h3>
                <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-2">
                  Source: <code className="bg-pf-ivory-warm dark:bg-[#201F1A] px-2 py-1 rounded">
                    .bob/skills/
                  </code>
                </p>
                <ul className="list-disc list-inside text-sm text-pf-stone dark:text-[#D3D0C8] space-y-1">
                  <li><strong>evidence-discipline</strong> — Enforces fact/inference separation</li>
                  <li><strong>code-review</strong> — Validates engineering standards</li>
                  <li><strong>test-runner</strong> — Executes and reports test results</li>
                  <li><strong>doc-writer</strong> — Generates user-facing documentation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bob Sessions */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Bob Session Exports
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-4">
                Complete task histories from each build phase, exported from Bob's conversation logs
              </p>
              <ul className="list-disc list-inside text-sm text-pf-stone dark:text-[#D3D0C8] space-y-1">
                <li>
                  <a href="/bob_sessions/S00-hour0-export-test/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S00: Hour-0 export test
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S01-plan-architecture/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S01: Plan architecture
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S01.5-plan-council/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S01.5: Plan Council
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S03-core-schemas-scoring/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S03: Core schemas + scoring (P1)
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S04-collectors-cache/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S04: Collectors + cache (P2)
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S05-cli-scaffold/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S05: CLI + scaffold (P3 + P4)
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S06-web-build-proof/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S06: Web UI + build-proof (P5)
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S07-runtime-skill-demo/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S07: Runtime skill demo (P6)
                  </a>
                </li>
                <li>
                  <a href="/bob_sessions/S08-review-submission/" className="text-pf-slate-mid hover:text-pf-copper-warm underline">
                    S08: Review + submission (P7)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Build Report */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Build Report
            </h2>
            <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-4">
              Source: <code className="bg-pf-ivory-warm dark:bg-[#201F1A] px-2 py-1 rounded">
                bob_sessions/build-report.md
              </code> — Phase-by-phase summary of work completed, acceptance criteria met, and test results
            </p>
            <HighlightCode code={buildReport} language="markdown" />
          </div>

          {/* Git Log */}
          <div className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-semibold text-pf-charcoal dark:text-pf-ivory mb-4">
              Bob-Assisted Commits
            </h2>
            <p className="text-sm text-pf-stone dark:text-[#D3D0C8] mb-4">
              Representative commits from the build (demo data — production deployment would fetch from git log)
            </p>
            <div className="space-y-2 font-mono text-sm">
              <div className="border-l-4 border-pf-slate-deep pl-4 py-2">
                <div className="text-pf-charcoal dark:text-pf-ivory font-semibold">
                  feat(core): add deterministic scoring and discovery
                </div>
                <div className="text-pf-stone-mid text-xs mt-1">
                  Phase P1 - Core schemas, types, and scoring engine
                </div>
              </div>
              <div className="border-l-4 border-pf-slate-deep pl-4 py-2">
                <div className="text-pf-charcoal dark:text-pf-ivory font-semibold">
                  feat(collectors): add npm/github/pypi/openssf collectors with cache
                </div>
                <div className="text-pf-stone-mid text-xs mt-1">
                  Phase P2 - Evidence collection with source-labeled fallback
                </div>
              </div>
              <div className="border-l-4 border-pf-slate-deep pl-4 py-2">
                <div className="text-pf-charcoal dark:text-pf-ivory font-semibold">
                  feat(cli): add recommend command with json output
                </div>
                <div className="text-pf-stone-mid text-xs mt-1">
                  Phase P3 - CLI with Claude fallback and output formatting
                </div>
              </div>
              <div className="border-l-4 border-pf-slate-deep pl-4 py-2">
                <div className="text-pf-charcoal dark:text-pf-ivory font-semibold">
                  feat(scaffold): add idempotent scaffold engine with smoke test
                </div>
                <div className="text-pf-stone-mid text-xs mt-1">
                  Phase P4 - Scaffold generation with adoption report
                </div>
              </div>
              <div className="border-l-4 border-pf-slate-deep pl-4 py-2">
                <div className="text-pf-charcoal dark:text-pf-ivory font-semibold">
                  feat(web): add UI with spawn fallback and build-proof page
                </div>
                <div className="text-pf-stone-mid text-xs mt-1">
                  Phase P5 - Web UI with fact/inference split and Bob evidence
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
