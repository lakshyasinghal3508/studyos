// PWAInstallBanner.tsx — Real PWA install prompt
// beforeinstallprompt fires when:
// 1. Site is HTTPS
// 2. Service worker is registered
// 3. manifest.json is valid
// 4. App not already installed
// 5. User has visited the site before (Chrome engagement heuristic)

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISSED_UNTIL_KEY = 'pwa-install-dismissed-until'

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Don't show if permanently dismissed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    // Don't show if temporarily dismissed (within 7 days)
    const until = localStorage.getItem(DISMISSED_UNTIL_KEY)
    if (until && Date.now() < parseInt(until)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Show after 4 seconds so user can see the app first
      setTimeout(() => setVisible(true), 4000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setVisible(false)
      setInstalled(true)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      setInstalled(true)
    }
    setPrompt(null)
  }, [prompt])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    // Remind again after 7 days
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }, [])

  const handleNeverAsk = useCallback(() => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }, [])

  if (installed) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 rounded-2xl p-4 border shadow-modal"
          style={{ background: 'var(--bg3)', borderColor: 'var(--border2)' }}
          role="dialog" aria-label="Install StudyOS app"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[16px] hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text3)', background: 'var(--bg4)' }}
            aria-label="Dismiss"
          >×</button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-display font-black text-lg text-white"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}>A</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[14px] mb-0.5" style={{ color: 'var(--text)' }}>
                Install StudyOS
              </div>
              <p className="text-[12px] mb-3" style={{ color: 'var(--text2)' }}>
                Add to your home screen for the full app experience — works offline too!
              </p>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleInstall} style={{ flex: 1 }}>
                  📲 Install App
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNeverAsk}>
                  Never
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
