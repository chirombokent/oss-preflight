# OSS Preflight Web UI — Component Implementation Guide

> Build React components that implement the OSS Preflight design system. Minimal dependencies, maximum clarity.

---

## Setup

### Imports in App.tsx

```typescript
// Design tokens (CSS variables)
import '../ui-reference/oss-preflight-design-tokens.css';

// Tailwind + custom overrides
import './styles/tailwind.css';
import './styles/custom.css';

// React Router for pages
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
```

### CSS Variables in React

All design tokens are CSS variables. Use them directly in Tailwind or in inline styles:

```tsx
// Tailwind (preferred)
<h1 className="text-slate-900 font-bold text-3xl" 
    style={{ color: 'var(--pf-slate-deep)' }}>
  Recommendations
</h1>

// Or pure CSS variable
<div style={{ 
  backgroundColor: 'var(--pf-ivory)',
  padding: 'var(--pf-space-4)'
}}>
  Content
</div>
```

---

## Key Components

### 1. IdeaInput.tsx

Entry point. User types idea + optional constraints.

```tsx
import { useState } from 'react';
import { apiClient } from '../api/client';

export function IdeaInput() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/recommend', { 
        idea,
        lang: undefined,  // Optional constraints
        license: undefined,
        repo: undefined
      });
      setRecommendations(res.data.recommendations);
    } catch (err) {
      console.error(err);
      // Show error toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="pf-h1">What do you want to build?</h1>
      
      <textarea
        className="w-full p-4 mt-4 border rounded-lg"
        style={{
          borderColor: 'var(--pf-border)',
          backgroundColor: 'var(--pf-input-bg)'
        }}
        rows={4}
        placeholder="e.g., I want to build a Discord bot that summarises the last 24 hours of channel activity"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <button
        className="mt-6 px-6 py-3 rounded-md font-semibold text-white"
        style={{
          backgroundColor: 'var(--pf-slate-deep)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
        onClick={handleSubmit}
        disabled={loading || !idea.trim()}
      >
        {loading ? 'Finding stacks...' : 'Find Stacks'}
      </button>

      {recommendations && <RecommendationList recs={recommendations} />}
    </div>
  );
}
```

### 2. RecommendationList.tsx

3 cards, each showing rank, name, score, and score bar.

```tsx
import { Recommendation } from '../../core/types';
import { ScoreBar } from './ScoreBar';
import { EvidencePassport } from './EvidencePassport';
import { useState } from 'react';

export function RecommendationList({ recs }: { recs: Recommendation[] }) {
  const [selectedRank, setSelectedRank] = useState<number | null>(null);

  return (
    <div className="mt-12 space-y-6">
      {recs.map((rec) => (
        <div
          key={rec.rank}
          className="p-6 rounded-lg border cursor-pointer transition-all"
          style={{
            backgroundColor: 'var(--pf-surface-raised)',
            borderColor: 'var(--pf-border)',
            boxShadow: 'var(--pf-shadow-card)',
          }}
          onClick={() => setSelectedRank(rec.rank)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-8 h-8 rounded-full text-white font-bold text-center"
                  style={{ backgroundColor: 'var(--pf-slate-deep)' }}
                >
                  {rec.rank}
                </span>
                <h3 className="pf-h3">{rec.candidate.name}</h3>
              </div>

              <p className="pf-small mt-2" style={{ color: 'var(--pf-text-secondary)' }}>
                v{rec.candidate.version}
              </p>

              {/* Score bar */}
              <ScoreBar subscores={rec.subscores} totalScore={rec.score} />
            </div>

            <div className="text-right">
              <div
                className="text-3xl font-bold"
                style={{ color: 'var(--pf-slate-deep)' }}
              >
                {rec.score}
              </div>
              <p className="pf-small">Overall score</p>
            </div>
          </div>

          {/* Passport modal trigger */}
          {selectedRank === rec.rank && (
            <EvidencePassport
              passport={rec.passport}
              onClose={() => setSelectedRank(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. ScoreBar.tsx

Horizontal bar split into 6 colored segments (weighted by dimension).

```tsx
interface Subscores {
  goalFit: number;
  repoCompat: number;
  maintenance: number;
  safety: number;
  community: number;
  docsQuality: number;
}

const DIMENSIONS = [
  { key: 'goalFit', label: 'Goal Fit', weight: 30, color: '--pf-score-goal-fit' },
  { key: 'repoCompat', label: 'Repo Compat', weight: 25, color: '--pf-score-compat' },
  { key: 'maintenance', label: 'Maintenance', weight: 15, color: '--pf-score-maintenance' },
  { key: 'safety', label: 'Safety', weight: 15, color: '--pf-score-safety' },
  { key: 'community', label: 'Community', weight: 10, color: '--pf-score-community' },
  { key: 'docsQuality', label: 'Docs', weight: 5, color: '--pf-score-docs' },
];

export function ScoreBar({ subscores, totalScore }: {
  subscores: Subscores;
  totalScore: number;
}) {
  return (
    <div className="mt-4">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden"
           style={{ backgroundColor: 'var(--pf-sand-light)' }}>
        {DIMENSIONS.map((dim) => (
          <div
            key={dim.key}
            style={{
              flex: `${dim.weight}%`,
              backgroundColor: `var(${dim.color})`,
              opacity: subscores[dim.key as keyof Subscores] / 100,
            }}
            title={`${dim.label}: ${subscores[dim.key as keyof Subscores]}`}
          />
        ))}
      </div>

      {/* Dimension labels on hover (optional) */}
      <div className="flex gap-1 mt-2 text-xs">
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} style={{ flex: `${dim.weight}%`, textAlign: 'center' }}>
            <span className="pf-caption">{dim.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. EvidencePassport.tsx

Modal showing fact column + interpretation column.

```tsx
import { EvidencePassport as PassportType } from '../../core/types';
import { FactBadge } from './FactBadge';

export function EvidencePassport({ passport, onClose }: {
  passport: PassportType;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--pf-overlay)', zIndex: 'var(--pf-z-modal)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-lg p-8"
        style={{ backgroundColor: 'var(--pf-surface-raised)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="pf-h2 mb-6">Evidence Passport</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Facts column */}
          <div>
            <h3 className="pf-h4 mb-4">Facts (Sourced)</h3>
            <div className="space-y-4">
              {Object.entries(passport.facts).map(([key, fact]) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="pf-small font-semibold">{key}</span>
                    <FactBadge type="fact" />
                  </div>
                  <code className="pf-code">{fact.value}</code>
                  <p className="pf-caption mt-1">
                    Source:{' '}
                    <a href={fact.source} target="_blank" className="pf-link">
                      {fact.sourceType}
                    </a>
                  </p>
                  <p className="pf-caption">
                    {new Date(fact.collectedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation column */}
          <div>
            <h3 className="pf-h4 mb-4">Interpretation (OSS Preflight Assessment)</h3>
            
            <div className="mb-6">
              <p className="pf-small font-semibold mb-2">Goal Fit</p>
              <p className="pf-body">{passport.interpretation.goalFit}</p>
            </div>

            <div className="mb-6">
              <p className="pf-small font-semibold mb-2">Compatibility</p>
              <p className="pf-body">{passport.interpretation.compatibility}</p>
            </div>

            {passport.interpretation.tradeoffs.length > 0 && (
              <div className="mb-6">
                <p className="pf-small font-semibold mb-2">Tradeoffs</p>
                <ul className="list-disc list-inside space-y-1">
                  {passport.interpretation.tradeoffs.map((t, i) => (
                    <li key={i} className="pf-small">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {passport.interpretation.warnings.length > 0 && (
              <div
                className="p-4 rounded-md"
                style={{ backgroundColor: 'var(--pf-warning-bg)' }}
              >
                <p className="pf-small font-semibold" style={{ color: 'var(--pf-warning)' }}>
                  Warnings
                </p>
                {passport.interpretation.warnings.map((w, i) => (
                  <p key={i} className="pf-small mt-1">{w}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className="mt-6 px-4 py-2 rounded-md"
          style={{ backgroundColor: 'var(--pf-slate-deep)', color: 'white' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

### 5. FactBadge.tsx

Small visual indicator: (Fact) or (Inferred) or (Cached).

```tsx
export function FactBadge({ type }: { type: 'fact' | 'inferred' | 'cached' }) {
  const classMap = {
    fact: 'pf-fact-badge',
    inferred: 'pf-inferred-badge',
    cached: 'pf-fact-badge opacity-70',
  };

  const labelMap = {
    fact: 'Fact',
    inferred: 'Inferred',
    cached: 'Cached',
  };

  return (
    <span
      className={`${classMap[type]} text-xs font-semibold`}
      style={{ marginLeft: 'var(--pf-space-2)' }}
    >
      ({labelMap[type]})
    </span>
  );
}
```

### 6. BuildProof.tsx

Static page showing sessions, modes, git log. Renders `/build-proof` route.

```tsx
import { useEffect, useState } from 'react';

export function BuildProof() {
  const [buildData, setBuildData] = useState(null);
  const [gitLog, setGitLog] = useState('');

  useEffect(() => {
    // Load bob/build-report.md
    fetch('/bob/build-report.md')
      .then(r => r.text())
      .then(text => setBuildData(text));

    // Fetch git log (if exposed via API)
    fetch('/api/git-log')
      .then(r => r.json())
      .then(data => setGitLog(data.log));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="pf-h1 mb-8">How OSS Preflight Was Built</h1>

      <div className="space-y-12">
        {/* Build Report */}
        {buildData && (
          <div>
            <h2 className="pf-h2 mb-4">Build Report</h2>
            <div
              className="prose prose-sm"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(buildData) }}
            />
          </div>
        )}

        {/* Git Log */}
        {gitLog && (
          <div>
            <h2 className="pf-h2 mb-4">Build Commits</h2>
            <pre
              className="p-4 rounded-lg overflow-x-auto text-sm"
              style={{
                backgroundColor: 'var(--pf-ivory-warm)',
                color: 'var(--pf-text-primary)',
              }}
            >
              {gitLog}
            </pre>
          </div>
        )}

        {/* Custom Modes */}
        <div>
          <h2 className="pf-h2 mb-4">Bob's Custom Modes</h2>
          <pre
            className="p-4 rounded-lg overflow-x-auto text-sm"
            style={{
              backgroundColor: 'var(--pf-ivory-warm)',
              color: 'var(--pf-text-primary)',
            }}
          >
            {/* Load from .bob/custom_modes.yaml */}
          </pre>
        </div>

        {/* Sessions */}
        <div>
          <h2 className="pf-h2 mb-4">Build Sessions</h2>
          <div className="space-y-3">
            {/* S00 through S08 */}
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md"
                   style={{ borderColor: 'var(--pf-border)' }}>
                <span
                  className="inline-block w-8 h-8 rounded-full text-white font-bold text-center text-sm"
                  style={{ backgroundColor: 'var(--pf-slate-mid)' }}
                >
                  S{String(i).padStart(2, '0')}
                </span>
                <span className="pf-small">Session {i}: [Mode] — [Output]</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Styling Best Practices

### 1. Use CSS Variables for Colors

```tsx
// ✅ Good
<div style={{ backgroundColor: 'var(--pf-slate-deep)' }}>

// ❌ Avoid
<div style={{ backgroundColor: '#3B4E7A' }}>
```

### 2. Responsive with Tailwind + CSS Variables

```tsx
<div className="p-4 md:p-6 lg:p-8" style={{
  backgroundColor: 'var(--pf-surface-raised)',
  borderColor: 'var(--pf-border)',
}}>
  Content
</div>
```

### 3. Dark Mode

Test in light and dark:

```tsx
// In tailwind.css or custom.css
@media (prefers-color-scheme: dark) {
  html.dark {
    /* Dark mode token overrides already in oss-preflight-design-tokens.css */
  }
}
```

User can toggle with:

```tsx
document.documentElement.classList.toggle('dark');
```

### 4. Accessibility

Always include:
- Proper heading hierarchy
- Focus visible states (use shadow-focus)
- ARIA labels for complex components
- Alt text for images

---

## Component Checklist

Before shipping a component:

- [ ] Uses only CSS variables for colors (no hardcoded hex)
- [ ] Respects `prefers-reduced-motion`
- [ ] Works in light and dark mode
- [ ] Passes WCAG AA contrast (4.5:1 for body, 3:1 for large)
- [ ] Has clear focus states
- [ ] Is tested with mock data
- [ ] Minimal dependencies (no component libraries)

---

## Tailwind Config

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'pf-slate': {
          deep: 'var(--pf-slate-deep)',
          mid: 'var(--pf-slate-mid)',
          light: 'var(--pf-slate-light)',
        },
        'pf-copper': {
          warm: 'var(--pf-copper-warm)',
          light: 'var(--pf-copper-light)',
          dark: 'var(--pf-copper-dark)',
        },
      },
      spacing: {
        'pf-0': 'var(--pf-space-0)',
        'pf-1': 'var(--pf-space-1)',
        // ... etc
      },
    },
  },
};
```

Then use:

```tsx
<div className="bg-pf-slate-deep text-white p-pf-4 rounded-lg">
  Styled with tokens
</div>
```

---

## File Structure

```
apps/web/
├── src/
│   ├── pages/
│   │   ├── IdeaInput.tsx
│   │   ├── RecommendationList.tsx
│   │   ├── ScaffoldProgress.tsx
│   │   └── BuildProof.tsx
│   ├── components/
│   │   ├── ScoreBar.tsx
│   │   ├── EvidencePassport.tsx
│   │   ├── FactBadge.tsx
│   │   └── SourceLink.tsx
│   ├── api/
│   │   └── client.ts
│   ├── styles/
│   │   ├── tailwind.css
│   │   └── custom.css
│   └── App.tsx
├── server.ts
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Questions?

Refer to [DESIGN_SYSTEM.md](../../ui-reference/DESIGN_SYSTEM.md) for detailed token docs or [architecture.md](../../docs/architecture.md) for system design.
