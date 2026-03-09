import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      colors: {
        // Brand
        emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        indigo: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
        // Custom
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          active: 'rgba(255,255,255,0.10)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.10) 0%, transparent 50%)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'flip': 'flip 0.6s ease-in-out forwards',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.25s ease-out',
        'gravity-fill': 'gravity-fill 1s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.08)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '0.8' },
        },
        'flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gravity-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-width)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(255,255,255,0.14), 0 8px 32px rgba(0,0,0,0.5)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.3)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
