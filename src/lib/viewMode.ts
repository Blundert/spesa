/**
 * Interfaccia desktop: viewport abbastanza largo E abbastanza alto. L'altezza minima tiene un
 * telefono in orizzontale (es. 932×430) sull'interfaccia mobile.
 */
export const DESKTOP_QUERY = '(min-width: 768px) and (min-height: 500px)'

/** Sotto questa larghezza il menu laterale si compatta da solo (finché non lo si sceglie a mano). */
export const SIDEBAR_COMPACT_BELOW = 1100

export type ViewMode = 'desktop' | 'mobile'
export type SidebarPref = 'compact' | 'expanded' | null

// Rotte con un path diverso fra le due interfacce. Tutte le altre coincidono.
const TO_DESKTOP: Record<string, string> = { '/': '/lista', '/statistiche': '/stats' }
const TO_MOBILE: Record<string, string> = { '/lista': '/', '/stats': '/statistiche' }

/**
 * Traduce un URL (path + query + hash) nel path equivalente dell'altra interfaccia, così il
 * passaggio desktop ↔ mobile resta sulla stessa pagina senza ricaricare.
 * `home: false` lascia com'è la home (usato all'avvio).
 */
export function translatePath(url: string, to: ViewMode, options: { home?: boolean } = {}): string {
  const cut = url.search(/[?#]/)
  const path = cut === -1 ? url : url.slice(0, cut)
  const rest = cut === -1 ? '' : url.slice(cut)
  // All'avvio la home ('/') appartiene all'interfaccia in cui si apre: la Dashboard su desktop,
  // la Lista su mobile. Si traduce solo quando si passa dall'una all'altra.
  if (path === '/' && options.home === false) return url
  const map = to === 'desktop' ? TO_DESKTOP : TO_MOBILE
  return (map[path] ?? path) + rest
}

/** Menu compatto: la scelta esplicita dell'utente vince, altrimenti decide la larghezza. */
export function resolveSidebarCompact(pref: SidebarPref, viewportWidth: number): boolean {
  if (pref === 'compact') return true
  if (pref === 'expanded') return false
  return viewportWidth < SIDEBAR_COMPACT_BELOW
}

export function parseSidebarPref(raw: string | null): SidebarPref {
  return raw === 'compact' || raw === 'expanded' ? raw : null
}
