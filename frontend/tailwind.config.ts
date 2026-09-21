/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — professional legal aesthetic
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c1d5ff',
          300: '#93b5ff',
          400: '#608bff',
          500: '#3d64f5',  // primary
          600: '#2645e0',
          700: '#1e36c5',
          800: '#1d30a0',
          900: '#1c2d7e',
          950: '#141d52',
        },
        legal: {
          // Warm neutral — parchment-inspired accents
          50:  '#faf8f4',
          100: '#f3ede2',
          200: '#e8d9c4',
          300: '#d8bfa0',
          400: '#c49d78',
          500: '#b5835a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

