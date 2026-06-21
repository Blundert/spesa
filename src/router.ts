import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { currentISOWeek } from './lib/date'
import { DEFAULT_BUONO_VALUE_CENTS } from './db/types'
import { AppShell } from './components/AppShell'
import { HomeScreen } from './screens/HomeScreen'
import { SpesaScreen } from './screens/SpesaScreen'
import { ListaScreen } from './screens/ListaScreen'
import { StoricoScreen } from './screens/StoricoScreen'
import { SupermercatiScreen } from './screens/SupermercatiScreen'
import { ImpostazioniScreen } from './screens/ImpostazioniScreen'
import { PastiScreen } from './screens/PastiScreen'
import { PianificazioniScreen } from './screens/PianificazioniScreen'
import { SessioneScreen } from './screens/SessioneScreen'
import { ItemDetailScreen } from './screens/ItemDetailScreen'
import { ChangelogScreen } from './screens/ChangelogScreen'
import { CatalogoScreen } from './screens/CatalogoScreen'

const rootRoute = createRootRoute({ component: Outlet })

// Layout route: persists across navigations between main screens,
// keeping navOpen state alive so the push animation plays correctly.
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: AppShell,
})

const homeRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  component: HomeScreen,
})

const listaRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/lista',
  component: ListaScreen,
})

const storicoRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/storico',
  component: StoricoScreen,
})

const supermercatiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/supermercati',
  component: SupermercatiScreen,
})

const impostazioniRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/impostazioni',
  component: ImpostazioniScreen,
})

const cataloRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/catalogo',
  component: CatalogoScreen,
})

// Standalone routes (no shell nav)
const spesaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spesa',
  component: SpesaScreen,
  // Buoni e valore scelti nel box d'avvio; passati alla nuova spesa.
  validateSearch: (search: Record<string, unknown>): { buoni: number; val: number } => {
    const buoni = Number(search.buoni)
    const val = Number(search.val)
    return {
      buoni: Number.isFinite(buoni) && buoni >= 0 ? Math.floor(buoni) : 0,
      val: Number.isFinite(val) && val > 0 ? Math.floor(val) : DEFAULT_BUONO_VALUE_CENTS,
    }
  },
})

const pastiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pasti',
  component: PastiScreen,
  validateSearch: (search: Record<string, unknown>): { week: string } => ({
    week: typeof search.week === 'string' ? search.week : currentISOWeek(),
  }),
})

const pianificazioniRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pasti/storico',
  component: PianificazioniScreen,
})

const sessioneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/storico/$sessionId',
  component: SessioneScreen,
})

const itemDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/item/$itemId',
  component: ItemDetailScreen,
})

const changelogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changelog',
  component: ChangelogScreen,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([homeRoute, listaRoute, storicoRoute, supermercatiRoute, cataloRoute, impostazioniRoute]),
  spesaRoute,
  pastiRoute,
  pianificazioniRoute,
  sessioneRoute,
  itemDetailRoute,
  changelogRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
