import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { HomeScreen } from './screens/HomeScreen'
import { SpesaScreen } from './screens/SpesaScreen'

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

const routeTree = rootRoute.addChildren([homeRoute, spesaRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
