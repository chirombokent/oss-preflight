interface SourceLinkProps {
  url: string;
  label?: string;
  className?: string;
}

/**
 * SourceLink - renders a clickable source URL with icon
 * AC10: Clickable source URL with icon
 */
export function SourceLink({ url, label, className = '' }: SourceLinkProps) {
  // Extract domain for display if no label provided
  const displayLabel = label || new URL(url).hostname.replace('www.', '');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-sm text-pf-slate-mid hover:text-pf-copper-warm transition-colors underline underline-offset-2 ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      <span>{displayLabel}</span>
    </a>
  );
}

// Made with Bob
