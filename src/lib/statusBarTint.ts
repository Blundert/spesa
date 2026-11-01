import { useEffect } from 'react'

/**
 * Colore della barra di stato (meta theme-color) coerente con la parte alta dell'app.
 * iOS altrimenti campiona da solo il colore in cima alla pagina e lo aggiorna in modo
 * incostante (barra chiara con un velo scuro aperto, o scura dopo averlo chiuso).
 */

/** Sfondo dell'app (#F2F2F0). */
export const STATUS_BAR_BASE = '#F2F2F0'
/** #F2F2F0 sotto il velo `bg-black/32` degli sheet. */
export const STATUS_BAR_SHEET = '#A5A5A3'
/** #F2F2F0 sotto il velo `bg-black/80` (tessera fedeltà). */
export const STATUS_BAR_DARK = '#303030'

const stack: { color: string }[] = []

function apply() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = stack.at(-1)?.color ?? STATUS_BAR_BASE
}

/** Finché `active` è true la barra di stato prende `color`; l'ultimo livello aperto vince. */
export function useStatusBarTint(active: boolean, color: string) {
  useEffect(() => {
    if (!active) return
    const entry = { color }
    stack.push(entry)
    apply()
    return () => {
      stack.splice(stack.indexOf(entry), 1)
      apply()
    }
  }, [active, color])
}
