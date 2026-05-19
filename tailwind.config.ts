import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // 'media' = follows OS/device theme automatically — NO class toggle needed
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        os: {
          bg:      '#08080E', bg2:     '#0F0F17', bg3:     '#14141E',
          bg4:     '#1A1A26', bg5:     '#20202E',
          border:  '#252535', border2: '#2E2E42', border3: '#3A3A52',
          text:    '#EEEDF8', text2:   '#9896B6', text3:   '#54527A',
          accent:  '#7C3AED', accent2: '#06B6D4', accent3: '#F59E0B',
          green:   '#10B981', red:     '#EF4444', pink:    '#EC4899',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'fade-in':   'fadeIn 0.2s ease both',
        'glow':      'glow 3s ease infinite',
        'float':     'float 3s ease infinite',
        'shimmer':   'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' },                                to: { opacity: '1' } },
        glow:    { '0%,100%': { boxShadow: '0 0 20px rgba(124,58,237,0.2)' }, '50%': { boxShadow: '0 0 50px rgba(124,58,237,0.5)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(0,0,0,0.4)',
        'card':       '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 0 0 1px rgba(124,58,237,0.3), 0 8px 40px rgba(124,58,237,0.12)',
        'modal':      '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [typography],
} satisfies Config
