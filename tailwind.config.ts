import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // StudyOS design tokens
        os: {
          bg:       '#08080E',
          bg2:      '#0F0F17',
          bg3:      '#14141E',
          bg4:      '#1A1A26',
          bg5:      '#20202E',
          border:   '#252535',
          border2:  '#2E2E42',
          border3:  '#3A3A52',
          text:     '#EEEDF8',
          text2:    '#9896B6',
          text3:    '#54527A',
          accent:   '#7C3AED',
          accent2:  '#06B6D4',
          accent3:  '#F59E0B',
          green:    '#10B981',
          red:      '#EF4444',
          pink:     '#EC4899',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(260,80%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(195,80%,50%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(280,80%,50%,0.08) 0px, transparent 50%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease both',
        'fade-in': 'fadeIn 0.2s ease both',
        'slide-in': 'slideIn 0.25s ease both',
        'glow': 'glow 3s ease infinite',
        'float': 'float 3s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(124,58,237,0.2)' },
          '50%':     { boxShadow: '0 0 40px rgba(124,58,237,0.5)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        bounceSoft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'card': '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 0 0 1px rgba(124,58,237,0.3), 0 8px 40px rgba(124,58,237,0.12)',
        'glow-accent': '0 0 40px rgba(124,58,237,0.35)',
        'glow-cyan': '0 0 40px rgba(6,182,212,0.25)',
        'modal': '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      borderRadius: {
        'xl2': '16px',
        'xl3': '20px',
        'xl4': '24px',
      },
    },
  },
  plugins: [typography],
} satisfies Config
