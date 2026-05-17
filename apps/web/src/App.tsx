import { useState, useEffect } from 'react';
import { IdeaInput } from './pages/IdeaInput';
import { RecommendationList } from './pages/RecommendationList';
import { EvidencePassport } from './pages/EvidencePassport';
import { ScaffoldProgress } from './pages/ScaffoldProgress';
import { BuildProof } from './pages/BuildProof';
import { recommend, scaffold } from './api/client';
import type { Recommendation } from '@oss-preflight/core';

type Page = 'idea' | 'recommendations' | 'scaffold' | 'build-proof';

/**
 * App - main flow routing with Context + hooks
 * AC1: Renders main flow: idea input → recommendation list → Evidence Passport modal → scaffold progress → build-proof page
 * AC11: Dark mode via class="dark", respects prefers-reduced-motion, calm mode via data-calm
 */
function App() {
  const [page, setPage] = useState<Page>('idea');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  
  // Scaffold state
  const [scaffoldFiles, setScaffoldFiles] = useState<string[]>([]);
  const [smokeTestStatus, setSmokeTestStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle');
  const [adoptionReport, setAdoptionReport] = useState('');
  const [scaffoldOutput, setScaffoldOutput] = useState('');

  // Dark mode and accessibility
  const [darkMode, setDarkMode] = useState(false);
  const [calmMode, setCalmMode] = useState(false);

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCalmMode(prefersReducedMotion);
  }, []);

  useEffect(() => {
    // Apply dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Apply calm mode attribute
    if (calmMode) {
      document.documentElement.setAttribute('data-calm', 'true');
    } else {
      document.documentElement.removeAttribute('data-calm');
    }
  }, [calmMode]);

  const handleIdeaSubmit = async (idea: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await recommend(idea);
      setRecommendations(result.recommendations);
      setPage('recommendations');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPassport = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setPassportOpen(true);
  };

  const handleClosePassport = () => {
    setPassportOpen(false);
  };

  const handleScaffold = async (recommendation: Recommendation) => {
    setLoading(true);
    setError(null);
    setSmokeTestStatus('running');
    setPage('scaffold');
    
    try {
      const result = await scaffold(recommendation);
      setScaffoldFiles(result.files);
      setSmokeTestStatus(result.passed ? 'pass' : 'fail');
      setScaffoldOutput(result.output);
      
      // Parse adoption report from output if available
      const adoptionMatch = result.output.match(/ADOPTION_REPORT\.md:\n([\s\S]*?)(?=\n\n|$)/);
      if (adoptionMatch) {
        setAdoptionReport(adoptionMatch[1] ?? '');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setSmokeTestStatus('fail');
    } finally {
      setLoading(false);
    }
  };

  // Render current page
  const renderPage = () => {
    switch (page) {
      case 'idea':
        return <IdeaInput onSubmit={handleIdeaSubmit} loading={loading} />;
      
      case 'recommendations':
        return (
          <RecommendationList
            recommendations={recommendations}
            onOpenPassport={handleOpenPassport}
            onScaffold={handleScaffold}
          />
        );
      
      case 'scaffold':
        return (
          <ScaffoldProgress
            files={scaffoldFiles}
            smokeTestStatus={smokeTestStatus}
            adoptionReport={adoptionReport}
            output={scaffoldOutput}
          />
        );
      
      case 'build-proof':
        return <BuildProof />;
      
      default:
        return <IdeaInput onSubmit={handleIdeaSubmit} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white dark:bg-[#282722] border-b border-pf-sand-light dark:border-[rgba(250,250,247,0.14)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPage('idea')}
              className="text-pf-slate-deep dark:text-pf-ivory font-semibold hover:text-pf-copper-warm transition-colors"
            >
              OSS Preflight
            </button>
            {recommendations.length > 0 && (
              <button
                onClick={() => setPage('recommendations')}
                className="text-pf-stone hover:text-pf-slate-deep dark:hover:text-pf-ivory transition-colors"
              >
                Recommendations
              </button>
            )}
            <button
              onClick={() => setPage('build-proof')}
              className="text-pf-stone hover:text-pf-slate-deep dark:hover:text-pf-ivory transition-colors"
            >
              Build Proof
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-pf-stone hover:text-pf-slate-deep dark:hover:text-pf-ivory transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setCalmMode(!calmMode)}
              className="text-pf-stone hover:text-pf-slate-deep dark:hover:text-pf-ivory transition-colors text-sm"
              aria-label="Toggle calm mode"
            >
              {calmMode ? 'Motion On' : 'Calm'}
            </button>
          </div>
        </div>
      </nav>

      {/* Error display */}
      {error && (
        <div className="bg-pf-error-bg border-l-4 border-pf-error p-4 m-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-pf-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-pf-error">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-pf-error hover:text-pf-error/80"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {renderPage()}

      {/* Evidence Passport Modal */}
      {passportOpen && (
        <EvidencePassport
          recommendation={selectedRecommendation}
          onClose={handleClosePassport}
        />
      )}
    </div>
  );
}

export default App;

// Made with Bob
