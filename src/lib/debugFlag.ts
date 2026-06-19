// Flag per il riquadro diagnostico del viewport, attivabile da Impostazioni (default OFF).
const KEY = 'debug-viewport'
const EVENT = 'debug-viewport-change'

export function getDebugViewport(): boolean {
  return localStorage.getItem(KEY) === '1'
}

export function setDebugViewport(on: boolean): void {
  localStorage.setItem(KEY, on ? '1' : '0')
  window.dispatchEvent(new Event(EVENT))
}

/** Registra un callback al cambio del flag; ritorna la funzione di cleanup. */
export function onDebugViewportChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}
