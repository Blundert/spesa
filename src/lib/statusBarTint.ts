import { useEffect } from 'react'

/**
 * Colore della barra di stato coerente con la parte alta dell'app.
 *
 * iOS (26+) in standalone ricava il colore della barra campionando gli elementi
 * fissi in cima alla pagina, e solo in certi momenti. I veli degli sheet entrano ed
 * escono con una dissolvenza di 0,5s: iOS li campionava a metà (barra chiara con il
 * velo aperto, o grigia dopo averlo chiuso). Le modifiche runtime di `theme-color`
 * vengono ignorate.
 *
 * Soluzione: una striscia fissa in cima, sopra i veli, che ha subito il colore
 * finale (niente dissolvenza). Alla chiusura dell'ultimo velo diventa del colore
 * base e resta per tutta la dissolvenza, poi viene rimossa.
 */

/** Sfondo dell'app (#F2F2F0). */
export const STATUS_BAR_BASE = '#F2F2F0'
/** #F2F2F0 sotto il velo `bg-black/32` degli sheet. */
export const STATUS_BAR_SHEET = '#A5A5A3'
/** #F2F2F0 sotto il velo `bg-black/80` (tessera fedeltà). */
export const STATUS_BAR_DARK = '#303030'

/** Dissolvenza dei veli di Vaul (0,5s) + margine. */
const FADE_OUT_MS = 600

const stack: { color: string }[] = []
let strip: HTMLDivElement | null = null
let removeTimer: number | undefined

function apply() {
  window.clearTimeout(removeTimer)
  if (!strip) {
    strip = document.createElement('div')
    strip.setAttribute('aria-hidden', 'true')
    strip.dataset.statusBarStrip = ''
    Object.assign(strip.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      height: '6px',
      zIndex: '2147483647',
      pointerEvents: 'none',
    })
    document.body.appendChild(strip)
  }
  strip.style.background = stack.at(-1)?.color ?? STATUS_BAR_BASE
  if (stack.length === 0) {
    removeTimer = window.setTimeout(() => {
      strip?.remove()
      strip = null
    }, FADE_OUT_MS)
  }
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
