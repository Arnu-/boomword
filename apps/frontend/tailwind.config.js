/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        game: {
          bg: '#1a1a2e',
          bubble: '#4ade80',
          correct: '#22c55e',
          wrong: '#ef4444',
        },
      },
      fontFamily: {
        game: ['Comic Sans MS', 'cursive', 'sans-serif'],
      },
      animation: {
        'bubble-float': 'bubbleFloat 3s ease-in-out infinite',
        'bubble-pop': 'bubblePop 0.3s ease-out forwards',
        'score-pop': 'scorePop 0.5s ease-out',
      },
      keyframes: {
        bubbleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bubblePop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.5' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        scorePop: {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-30px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
