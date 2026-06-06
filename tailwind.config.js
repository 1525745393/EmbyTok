/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './types.ts',
  ],
  theme: {
    extend: {
      animation: {
        'heart-float': 'heartFloat 1.2s ease-out forwards',
      },
      keyframes: {
        heartFloat: {
          '0%': {
            transform: 'scale(0) translateY(60px)',
            opacity: '0',
          },
          '30%': {
            transform: 'scale(1.8) translateY(30px)',
            opacity: '1',
          },
          '60%': {
            transform: 'scale(1.2) translateY(15px)',
            opacity: '0.8',
          },
          '100%': {
            transform: 'scale(0.8) translateY(0)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
};
