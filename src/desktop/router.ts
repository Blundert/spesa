import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { DesktopShell } from './components/DesktopShell'
import { DashboardScreen } from './screens/DashboardScreen'
import { AdvancedStatsScreen } from './screens/AdvancedStatsScreen'
import { DesktopCatalogoScreen } from './screens/DesktopCatalogoScreen'
import { DesktopStoricoScreen } from './screens/DesktopStoricoScreen'
import { DesktopImpostazioniScreen } from './screens/DesktopImpostazioniScreen'

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

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    dashboardRoute,
    statsRoute,
    cataloRoute,
    storicoRoute,
    impostazioniRoute,
  ]),
])

export const desktopRouter = createRouter({ routeTree })
