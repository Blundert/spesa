import { lazy } from 'react'

// Caricata a richiesta: il bundle desktop (recharts incluso) non pesa sull'app mobile.
export const LazyDesktopApp = lazy(() =>
  import('./DesktopApp').then((m) => ({ default: m.DesktopApp })),
)
