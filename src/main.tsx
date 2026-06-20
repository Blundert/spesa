import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import PWAInstall from '@khmyznikov/pwa-install/react-legacy'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { TutorialController } from './tutorial'
import './i18n'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// Altezza affidabile del viewport in PWA standalone iOS. documentElement.clientHeight è stabile,
// mentre window.innerHeight (e quindi position:fixed/100dvh/100vh) oscilla includendo o no la
// status bar (es. 793 ↔ 852). Guidiamo l'altezza dello shell da clientHeight via CSS variable.
function syncAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${document.documentElement.clientHeight}px`,
  )
}
syncAppHeight()
window.addEventListener('resize', syncAppHeight)
window.addEventListener('orientationchange', syncAppHeight)
window.visualViewport?.addEventListener('resize', syncAppHeight)

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Shell: position: fixed ancorato in alto, ALTEZZA esplicita da --app-height
          (= documentElement.clientHeight, stabile) invece di bottom:0/100dvh, che su iOS
          standalone si agganciano a innerHeight ballerino e lasciavano un vuoto in basso. */}
      <div
        data-vaul-drawer-wrapper
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--app-height, 100%)',
          margin: '0 auto',
          width: '100%',
          maxWidth: '430px',
          overflow: 'hidden',
          background: '#F2F2F0',
        }}
      >
        <RouterProvider router={router} />
        <TutorialController />
        {/* Web component per l'installazione PWA (incl. istruzioni iOS). Manuale:
            si apre solo dalla pagina Impostazioni via showDialog(). Nome/icona passati
            espliciti così il dialog è corretto anche in dev (dove il manifest non è servito). */}
        <PWAInstall
          manualApple
          manualChrome
          useLocalStorage
          name="Spesa"
          description="App per la spesa con buoni pasto"
          icon="/pwa-192x192.png"
        />
      </div>
      <Toaster
        position="top-center"
        offset="calc(env(safe-area-inset-top) + 12px)"
        duration={2000}
        toastOptions={{
          style: {
            background: '#2A2A2C',
            color: '#fff',
            borderRadius: '15px',
            border: 'none',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)

