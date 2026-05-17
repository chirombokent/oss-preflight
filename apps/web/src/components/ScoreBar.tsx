import React from 'react';

interface ScoreBarProps {
  score: number;
  label?: string;
  className?: string;
}

/**
 * ScoreBar - renders a 0-100 score as a horizontal bar with color gradient
 * AC8: Green high (80+), yellow mid (50-79), red low (<50)
 */
export function ScoreBar({ score, label, className = '' }: ScoreBarProps) {
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Determine color based on score
  const getColor = (s: number): string => {
    if (s >= 80) return 'bg-pf-success';
    if (s >= 50) return 'bg-pf-warning';
    return 'bg-pf-error';
  };

  const color = getColor(clampedScore);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-pf-stone">{label}</span>
          <span className="font-semibold text-pf-charcoal dark:text-pf-ivory">
            {clampedScore}
          </span>
        </div>
      )}
      <div className="h-2 w-full bg-pf-sand-light dark:bg-[rgba(250,250,247,0.14)] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300 ease-out`}
          style={{ width: `${clampedScore}%` }}
          role="progressbar"
          aria-valuenow={clampedScore}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// Made with Bob
