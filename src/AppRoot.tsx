import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import PWAInstall from '@khmyznikov/pwa-install/react-legacy'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { TutorialController } from './tutorial'
import { UpdateNotifier } from './pwa/UpdateNotifier'
import { LazyDesktopApp, preloadDesktopApp } from './desktop/LazyDesktopApp'
import { DESKTOP_QUERY, translatePath, type ViewMode } from './lib/viewMode'

// Desktop o mobile segue il viewport in tempo reale: niente refresh. Al cambio si traduce l'URL
// corrente nel path equivalente dell'altra interfaccia (es. /stats ↔ /statistiche) e i dati
// restano gli stessi (stesso QueryClient, stesso DB).
const mq = window.matchMedia(DESKTOP_QUERY)

const currentHref = () => window.location.pathname + window.location.search + window.location.hash

function syncUrl(mode: ViewMode, options?: { home?: boolean }) {
  const current = currentHref()
  const next = translatePath(current, mode, options)
  if (next !== current) window.history.replaceState(window.history.state, '', next)
}

const modeNow = (): ViewMode => (mq.matches ? 'desktop' : 'mobile')

// Anche all'avvio: un link a /stats aperto su telefono deve atterrare su /statistiche.
syncUrl(modeNow(), { home: false })

// Interfaccia mostrata: `null` per un frame durante il cambio. Il router vecchio si smonta PRIMA
// che l'URL venga tradotto, altrimenti lo vedrebbe cambiare e cercherebbe una rotta che non ha.
let shown: ViewMode | null = modeNow()
const listeners = new Set<() => void>()
const publish = (next: ViewMode | null) => {
  shown = next
  listeners.forEach((l) => l())
}

let pendingFrame = 0
mq.addEventListener('change', () => {
  cancelAnimationFrame(pendingFrame)
  publish(null)
  pendingFrame = requestAnimationFrame(() => {
    syncUrl(modeNow())
    publish(modeNow())
  })
})

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

function useShownMode(): ViewMode | null {
  return useSyncExternalStore(subscribe, () => shown)
}

function MobileApp() {
  // Il router mobile può essere rimasto fermo su un URL vecchio mentre era smontato:
  // lo riallineo alla posizione attuale prima di montarlo.
  useRunOnce(() => router.history.replace(currentHref()))
  return (
    <>
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
          background: 'var(--t-bg)',
        }}
      >
        <RouterProvider router={router} />
        <TutorialController />
        <UpdateNotifier />
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
        position="bottom-center"
        offset="calc(env(safe-area-inset-bottom) + 100px)"
        duration={2000}
        toastOptions={{
          style: {
            background: 'var(--t-accent)',
            color: 'var(--t-on)',
            borderRadius: '15px',
            border: 'none',
            fontSize: '14px',
            width: '356px',
          },
        }}
      />
    </>
  )
}

/** Esegue `fn` una sola volta, prima del primo render dei figli (che leggono lo stato del router). */
function useRunOnce(fn: () => void) {
  useState(() => {
    fn()
    return true
  })
}

export function AppRoot() {
  const mode = useShownMode()

  // Dissolvenza leggera solo quando si cambia interfaccia (non al primo avvio).
  const first = useRef(true)
  useEffect(() => {
    if (mode === null) return
    if (first.current) {
      first.current = false
      return
    }
    const root = document.documentElement
    root.dataset.swapping = '1'
    const id = window.setTimeout(() => delete root.dataset.swapping, 300)
    return () => window.clearTimeout(id)
  }, [mode])

  // Su schermi già abbastanza larghi per un resize verso il desktop, il chunk è pronto in anticipo.
  useEffect(() => {
    if (mode === 'mobile' && window.innerWidth >= 600) preloadDesktopApp()
  }, [mode])

  return (
    <QueryClientProvider client={queryClient}>
      {mode === 'desktop' && (
        <Suspense fallback={null}>
          <LazyDesktopApp />
        </Suspense>
      )}
      {mode === 'mobile' && <MobileApp />}
    </QueryClientProvider>
  )
}
