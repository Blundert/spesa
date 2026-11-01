import { isPrimaryPath } from './primarySection'

export type NavTransition = 'fade' | 'push' | 'pop'

// Pagine aperte dal menu: un livello sopra le sezioni principali.
const MENU_PATHS = new Set([
  '/storico',
  '/statistiche',
  '/liste',
  '/catalogo',
  '/piatti',
  '/supermercati',
  '/impostazioni',
])

// 0 = Lista/Pasti, 1 = pagine del menu, 2 = dettagli.
export function navLevel(pathname: string): number {
  if (isPrimaryPath(pathname)) return 0
  if (MENU_PATHS.has(pathname)) return 1
  return 2
}

// Salendo di livello la pagina entra da destra, scendendo torna da sinistra;
// allo stesso livello (Lista ↔ Pasti, menu → menu) solo dissolvenza.
export function navTransition(from: string, to: string): NavTransition {
  const a = navLevel(from)
  const b = navLevel(to)
  if (b > a) return 'push'
  if (b < a) return 'pop'
  return 'fade'
}
