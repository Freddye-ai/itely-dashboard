/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-page':        '#0d0d0d',
        'bg-card':        '#1a1a1a',
        'bg-surface':     '#252525',
        'accent-cyan':    '#D4A017',
        'accent-emerald': '#22d3ee',
        'accent-red':     '#f87171',
        'text-primary':   '#f0f0f0',
        'text-muted':     '#888888',
        'border-dark':    '#2d2d2d',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
