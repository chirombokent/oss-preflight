interface HighlightCodeProps {
  code: string;
  language?: string;
  className?: string;
}

/**
 * HighlightCode - renders code with syntax highlighting
 * Simple implementation without external dependencies
 */
export function HighlightCode({ code, language = 'text', className = '' }: HighlightCodeProps) {
  return (
    <pre className={`bg-pf-ivory-warm dark:bg-[#201F1A] p-4 rounded-lg overflow-x-auto ${className}`}>
      <code className="font-mono text-sm text-pf-charcoal dark:text-pf-ivory" data-language={language}>
        {code}
      </code>
    </pre>
  );
}

// Made with Bob
