import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { currentWeek } from '../lib/date'
import { getDefaultBuonoValueCents } from '../lib/buoniSettings'
import { DesktopShell } from './components/DesktopShell'
import { DashboardScreen } from './screens/DashboardScreen'
import { AdvancedStatsScreen } from './screens/AdvancedStatsScreen'
import { DesktopCatalogoScreen } from './screens/DesktopCatalogoScreen'
import { DesktopStoricoScreen } from './screens/DesktopStoricoScreen'
import { DesktopImpostazioniScreen } from './screens/DesktopImpostazioniScreen'

import { DesktopListaScreen } from './screens/DesktopListaScreen'
import { DesktopListeScreen } from './screens/DesktopListeScreen'
import { DesktopSpesaScreen } from './screens/DesktopSpesaScreen'
import { DesktopSessioneScreen } from './screens/DesktopSessioneScreen'
import { DesktopItemDetailScreen } from './screens/DesktopItemDetailScreen'
import { DesktopPastiScreen } from './screens/DesktopPastiScreen'
import { DesktopPianificazioniScreen } from './screens/DesktopPianificazioniScreen'
import { DesktopPiattiScreen } from './screens/DesktopPiattiScreen'
import { DesktopSupermercatiScreen } from './screens/DesktopSupermercatiScreen'
import { DesktopChangelogScreen } from './screens/DesktopChangelogScreen'

const rootRoute = createRootRoute({ component: Outlet })

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'desktop-shell',
  component: DesktopShell,
})

const dashboardRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  component: DashboardScreen,
})

const statsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/stats',
  component: AdvancedStatsScreen,
})

const cataloRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/catalogo',
  component: DesktopCatalogoScreen,
})

const storicoRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/storico',
  component: DesktopStoricoScreen,
})

const impostazioniRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/impostazioni',
  component: DesktopImpostazioniScreen,
})

const listaRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/lista',
  component: DesktopListaScreen,
})

const listeRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/liste',
  component: DesktopListeScreen,
})

const pastiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/pasti',
  component: DesktopPastiScreen,
  validateSearch: (search: Record<string, unknown>): { week: string } => ({
    week: typeof search.week === 'string' ? search.week : currentWeek(),
  }),
})

const pianificazioniRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/pasti/storico',
  component: DesktopPianificazioniScreen,
})

const piattiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/piatti',
  component: DesktopPiattiScreen,
})

const supermercatiRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/supermercati',
  component: DesktopSupermercatiScreen,
})

const sessioneRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/storico/$sessionId',
  component: DesktopSessioneScreen,
})

const itemDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/item/$itemId',
  component: DesktopItemDetailScreen,
})

const changelogRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/changelog',
  component: DesktopChangelogScreen,
})

// Stessa forma della rotta mobile: buoni, valore e lista scelti all'avvio della spesa.
const spesaRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/spesa',
  component: DesktopSpesaScreen,
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

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    dashboardRoute,
    statsRoute,
    cataloRoute,
    storicoRoute,
    impostazioniRoute,
    listaRoute,
    listeRoute,
    pastiRoute,
    pianificazioniRoute,
    piattiRoute,
    supermercatiRoute,
    sessioneRoute,
    itemDetailRoute,
    changelogRoute,
    spesaRoute,
  ]),
])

export const desktopRouter = createRouter({ routeTree })
