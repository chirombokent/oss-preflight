/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pf-slate-deep': '#3B4E7A',
        'pf-slate-mid': '#5268A0',
        'pf-slate-light': '#6B82BA',
        'pf-copper-warm': '#C9A96E',
        'pf-copper-light': '#D4BC8A',
        'pf-copper-dark': '#B8944F',
        'pf-evidence-solid': '#6B7D9F',
        'pf-evidence-light': '#8B9DBF',
        'pf-charcoal': '#1A1A1A',
        'pf-stone': '#6E6E6E',
        'pf-stone-mid': '#9E9E9E',
        'pf-sand-light': '#E8DFD0',
        'pf-sand-pale': '#F0EBE1',
        'pf-ivory': '#FAFAF5',
        'pf-ivory-warm': '#F5F0E8',
        'pf-success': '#2E7D4F',
        'pf-success-bg': '#E8F5EE',
        'pf-warning': '#B8860B',
        'pf-warning-bg': '#FFF8E1',
        'pf-error': '#C0392B',
        'pf-error-bg': '#FDECEC',
        'pf-info': '#3B4E7A',
        'pf-info-bg': '#EEF1F8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['"DM Sans"', '"Satoshi"', 'system-ui', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(59, 78, 122, 0.04), 0 4px 12px rgba(59, 78, 122, 0.06)',
        'glow': '0 0 20px rgba(201, 169, 110, 0.22)',
      },
    },
  },
  plugins: [],
}

// Made with Bob
