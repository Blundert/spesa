import { RouterProvider } from '@tanstack/react-router'
import { desktopRouter } from './router'

export function DesktopApp() {
  return <RouterProvider router={desktopRouter} />
}
