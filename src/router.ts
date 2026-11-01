import { createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router'
import { currentWeek } from './lib/date'
import { getDefaultBuonoValueCents } from './lib/buoniSettings'
import { AppShell } from './components/AppShell'
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
import { PiattiScreen } from './screens/PiattiScreen'
import { StatisticheScreen } from './screens/StatisticheScreen'

const rootRoute = createRootRoute({ component: Outlet })

// Layout route: persists across navigations between main screens,
// keeping navOpen state alive so the push animation plays correctly.
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: AppShell,
})

// La Lista è la home; /lista resta come alias per i link salvati.
const listaRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  component: ListaScreen,
})

const listaAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lista',
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
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

const statisticheRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/statistiche',
  component: StatisticheScreen,
})

const piattiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/piatti',
  component: PiattiScreen,
})

// La spesa in corso è a schermo intero, senza barra né menu.
const spesaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spesa',
  component: SpesaScreen,
  // Buoni, valore e lista scelti nel pannello della pill; passati alla nuova spesa.
  validateSearch: (search: Record<string, unknown>): { buoni: number; val: number; list?: number } => {
    const buoni = Number(search.buoni)
    const val = Number(search.val)
    const list = Number(search.list)
    return {
      buoni: Number.isFinite(buoni) && buoni >= 0 ? Math.floor(buoni) : 0,
      val: Number.isFinite(val) && val > 0 ? Math.floor(val) : getDefaultBuonoValueCents(),
      ...(Number.isInteger(list) && list > 0 ? { list } : {}),
    }
  },
})

// Sezione principale accanto alla Lista.
const pastiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/pasti',
  component: PastiScreen,
  validateSearch: (search: Record<string, unknown>): { week: string } => ({
    week: typeof search.week === 'string' ? search.week : currentWeek(),
  }),
})

const pianificazioniRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/pasti/storico',
  component: PianificazioniScreen,
})

const sessioneRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/storico/$sessionId',
  component: SessioneScreen,
})

const itemDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/item/$itemId',
  component: ItemDetailScreen,
})

const changelogRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/changelog',
  component: ChangelogScreen,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    listaRoute,
    pastiRoute,
    storicoRoute,
    supermercatiRoute,
    cataloRoute,
    piattiRoute,
    statisticheRoute,
    impostazioniRoute,
    pianificazioniRoute,
    sessioneRoute,
    itemDetailRoute,
    changelogRoute,
  ]),
  listaAliasRoute,
  spesaRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
