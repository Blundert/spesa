import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRoot } from './AppRoot'
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
    <AppRoot />
  </StrictMode>,
)
