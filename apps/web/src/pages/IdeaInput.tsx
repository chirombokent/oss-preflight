import React, { useState } from 'react';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
  loading?: boolean;
}

/**
 * IdeaInput - accepts text input and submit button
 * AC2: Text input (idea string) and submit button; calls POST /api/recommend
 */
export function IdeaInput({ onSubmit, loading = false }: IdeaInputProps) {
  const [idea, setIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onSubmit(idea.trim());
    }
  };

  return (
    <div className="min-h-screen bg-pf-ivory dark:bg-[#171613] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-pf-slate-deep dark:text-pf-ivory mb-4">
            OSS Preflight
          </h1>
          <p className="text-lg text-pf-stone dark:text-[#D3D0C8]">
            Evidence-backed package recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#282722] rounded-2xl shadow-card p-8">
          <label htmlFor="idea" className="block text-sm font-semibold text-pf-charcoal dark:text-pf-ivory mb-3">
            What do you want to build?
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., Discord bot that summarizes channel activity"
            className="w-full h-32 px-4 py-3 border border-pf-sand-light dark:border-[rgba(250,250,247,0.14)] rounded-lg bg-pf-ivory dark:bg-[#201F1A] text-pf-charcoal dark:text-pf-ivory placeholder-pf-stone-mid focus:outline-none focus:ring-2 focus:ring-pf-slate-mid resize-none"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="mt-4 w-full bg-pf-slate-deep hover:bg-pf-slate-mid disabled:bg-pf-stone-mid text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Getting recommendations...' : 'Get Recommendations'}
          </button>
        </form>

        <p className="text-center text-sm text-pf-stone-mid mt-6">
          Built in 48 hours with Bob
        </p>
      </div>
    </div>
  );
}

// Made with Bob
