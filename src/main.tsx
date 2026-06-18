import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import PWAInstall from '@khmyznikov/pwa-install/react-legacy'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import './i18n'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div data-vaul-drawer-wrapper style={{ height: '100dvh', width: '100%', maxWidth: '430px', overflow: 'hidden', background: '#F2F2F0', position: 'relative' }}>
        <RouterProvider router={router} />
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

