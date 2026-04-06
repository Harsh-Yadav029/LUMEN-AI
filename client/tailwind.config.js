/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary backgrounds
        'bg-primary':   '#0B0F14',
        'bg-secondary': '#111827',
        'bg-card':      '#131B24',
        'bg-hover':     '#1A2433',
        'bg-input':     '#0F1923',

        // Accent — emerald green
        'accent':       '#10B981',
        'accent-soft':  '#34D399',
        'accent-dim':   '#059669',
        'accent-faint': 'rgba(16,185,129,0.08)',
        'accent-glow':  'rgba(16,185,129,0.15)',

        // Text
        'text-primary':   '#E5E7EB',
        'text-secondary': '#9CA3AF',
        'text-muted':     '#4B5563',
        'text-hint':      '#374151',

        // Borders
        'border':       '#1F2937',
        'border-mid':   '#2D3748',
        'border-light': '#374151',
      },
      fontFamily: {
        sans:  ['Poppins', 'system-ui', 'sans-serif'],
        mono:  ['Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-up':    'fadeUp 0.22s ease both',
        'blink':      'blink 1s step-end infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'typing':     'typing 1.2s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.75)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.2', transform: 'translateY(0)' },
          '30%':            { opacity: '1',   transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
