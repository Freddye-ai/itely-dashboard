/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens de tema — resolvidos via CSS variables (troca automática dark/light)
        'bg-page':      'rgb(var(--bg-page) / <alpha-value>)',
        'bg-card':      'rgb(var(--bg-card) / <alpha-value>)',
        'bg-surface':   'rgb(var(--bg-surface) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-muted':   'rgb(var(--text-muted) / <alpha-value>)',
        'border-dark':  'rgb(var(--border-dark) / <alpha-value>)',
        // Cores de acento — fixas em ambos os temas
        'accent-cyan':    '#D4A017',
        'accent-emerald': '#22d3ee',
        'accent-red':     '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
