/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.html",
    "./js/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0D0D0D',
          bgElevated: '#1A1A1A',
          panel: '#111111',
          panelAlt: '#161616',
          border: '#2A2A2A',
          borderBright: '#333333',
          accent: '#00FF88',
          accentDim: '#00CC6A',
          accentGlow: 'rgba(0, 255, 136, 0.15)',
          accentStrong: '#00FF99',
          metallic: '#C0C0C0',
          metallicDim: '#8A8A8A',
          gold: '#FFD700',
          goldDim: '#B8960D',
          muted: '#6B6B6B',
          text: '#FAFAFA',
          textDim: '#CCCCCC',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(3.5rem, 12vw, 14rem)', { lineHeight: '0.92', letterSpacing: '-0.04em', fontWeight: '700' }],
        'section-title': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],
        'label': ['0.7rem', { letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 60px rgba(0, 255, 136, 0.12), 0 0 120px rgba(0, 255, 136, 0.06)',
        'glow-strong': '0 0 80px rgba(0, 255, 136, 0.25), 0 0 160px rgba(0, 255, 136, 0.12)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'expo-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      animation: {
        'float-slow': 'float 20s ease-in-out infinite',
        'float-medium': 'float 15s ease-in-out infinite',
        'float-fast': 'float 12s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-30px) translateX(20px) rotate(2deg)' },
          '50%': { transform: 'translateY(20px) translateX(-15px) rotate(-1deg)' },
          '75%': { transform: 'translateY(-15px) translateX(-25px) rotate(1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}