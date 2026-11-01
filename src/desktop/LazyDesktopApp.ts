import { lazy } from 'react'

const load = () => import('./DesktopApp').then((m) => ({ default: m.DesktopApp }))

// Caricata a richiesta: il bundle desktop (recharts incluso) non pesa sull'app mobile.
export const LazyDesktopApp = lazy(load)

/** Scarica il chunk desktop in anticipo, così il passaggio da mobile a desktop è immediato. */
export function preloadDesktopApp(): void {
  void load()
}
