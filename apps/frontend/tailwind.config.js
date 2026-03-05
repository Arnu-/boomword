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
        dark: {
          bg: '#0D1117',
          sidebar: '#161B22',
          card: '#1C2333',
          'card-hover': '#242D3F',
          highlight: '#2D1B69',
          border: 'rgba(255,255,255,0.1)',
          text: '#E6EDF3',
          'text-secondary': '#8B949E',
          accent: '#6C5CE7',
          'accent-light': '#8B7CF6',
          gold: '#FFD700',
          green: '#28A745',
          red: '#F85149',
        },
      },
      fontFamily: {
        game: ['Comic Sans MS', 'cursive', 'sans-serif'],
      },
      animation: {
        'bubble-float': 'bubbleFloat 3s ease-in-out infinite',
        'bubble-pop': 'bubblePop 0.3s ease-out forwards',
        'score-pop': 'scorePop 0.5s ease-out',
        'marquee': 'marquee 30s linear infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-medium': 'floatMedium 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
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
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-15px) scale(1.05)' },
        },
        floatMedium: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-10px) translateX(5px)' },
          '66%': { transform: 'translateY(-5px) translateX(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
