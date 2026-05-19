import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { PWAInstallBanner } from './components/ui/PWAInstallBanner'
import '@/styles/globals.css'

// Register Service Worker — required for PWA install prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered:', reg.scope)
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000)
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <PWAInstallBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: 'var(--bg3)' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: 'var(--bg3)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
