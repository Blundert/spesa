import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { HomeScreen } from './screens/HomeScreen'
import { SpesaScreen } from './screens/SpesaScreen'
import { ListaScreen } from './screens/ListaScreen'
import { StoricoScreen } from './screens/StoricoScreen'
import { SupermercatiScreen } from './screens/SupermercatiScreen'
import { PastiScreen } from './screens/PastiScreen'
import { SessioneScreen } from './screens/SessioneScreen'
import { ItemDetailScreen } from './screens/ItemDetailScreen'

const rootRoute = createRootRoute({ component: Outlet })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeScreen,
})

const spesaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spesa',
  component: SpesaScreen,
})

const listaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lista',
  component: ListaScreen,
})

const storicoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/storico',
  component: StoricoScreen,
})

const supermercatiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/supermercati',
  component: SupermercatiScreen,
})

const pastiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pasti',
  component: PastiScreen,
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

const routeTree = rootRoute.addChildren([
  homeRoute,
  spesaRoute,
  listaRoute,
  storicoRoute,
  supermercatiRoute,
  pastiRoute,
  sessioneRoute,
  itemDetailRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
