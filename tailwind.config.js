/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05050a',
          900: '#08080f',
          850: '#0b0b15',
          800: '#0f0f1a',
          700: '#151522',
          600: '#1d1d2e',
        },
        accent: {
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Sora',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 24px 48px -32px rgba(0,0,0,0.9)',
        lift: '0 30px 60px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
        glow: '0 10px 40px -12px rgba(99,102,241,0.65)',
        'glow-sm': '0 0 24px -6px rgba(129,140,248,0.5)',
        'glow-lg': '0 20px 60px -15px rgba(124,58,237,0.75)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        'hero-grid': '56px 56px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -18px, 0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(28px, -22px, 0) scale(1.07)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        caret: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.7', transform: 'scale(0.92)' },
          '70%': { opacity: '0', transform: 'scale(1.28)' },
          '100%': { opacity: '0', transform: 'scale(1.28)' },
        },
        equalize: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-down': 'fade-down 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.45s ease-out both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 9s ease-in-out infinite',
        drift: 'drift 16s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        shake: 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        caret: 'caret 1.1s step-end infinite',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        equalize: 'equalize 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
