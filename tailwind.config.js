/** @type {import('tailwindcss').Config} */
// Colours map to the semantic CSS tokens in src/styles/tokens.css (STYLE.md §2).
// Do not add raw palette colours here.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        sunken: 'var(--bg-sunken)',
        hover: 'var(--bg-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        success: 'var(--success)',
      },
      borderRadius: { sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)' },
      fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
    },
  },
  // Preflight is off: src/styles/global.css owns element-level base styles,
  // so headings and controls follow STYLE.md instead of Tailwind's reset.
  corePlugins: { preflight: false },
  plugins: [],
};
