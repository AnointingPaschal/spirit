/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#03060C',
        surface: '#070D18',
        border: '#0F1F35',
        cyan: { DEFAULT: '#00CFFD', dim: '#0095B8', glow: 'rgba(0,207,253,0.15)' },
        lime: { DEFAULT: '#B3FF59', dim: '#7AB83C' },
        violet: { DEFAULT: '#7C68EE', dim: '#5A4BBD' },
        muted: '#3D5470',
        ink: '#8BA5C4',
      },
      fontFamily: {
        display: ['"Syne"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        'glow-pulse': { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        'float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scan': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
      boxShadow: {
        'cyan': '0 0 24px rgba(0,207,253,0.25)',
        'cyan-lg': '0 0 48px rgba(0,207,253,0.2)',
        'lime': '0 0 24px rgba(179,255,89,0.2)',
      },
    },
  },
  plugins: [],
};
