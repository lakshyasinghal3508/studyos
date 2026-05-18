import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { PWAInstallBanner } from './components/ui/PWAInstallBanner'
import '@/styles/globals.css'

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
            background: '#14141E',
            color: '#EEEDF8',
            border: '1px solid #2E2E42',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#14141E' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#14141E' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
