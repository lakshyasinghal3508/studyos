// useSystemTheme.ts
// Theme is handled ENTIRELY by CSS media queries (prefers-color-scheme)
// This hook only syncs the html element for any JS that needs to know
// No React state needed — CSS does the real work

import { useEffect } from 'react'

export function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const sync = (dark: boolean) => {
      // These are for any JS-based logic that checks theme
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
      // Update canvas-based charts background color
      document.documentElement.style.setProperty(
        '--chart-bg',
        dark ? '#14141E' : '#FFFFFF'
      )
    }

    sync(mq.matches)

    const handler = (e: MediaQueryListEvent) => sync(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
}
