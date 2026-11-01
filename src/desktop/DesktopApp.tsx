import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { desktopRouter } from './router'

export function DesktopApp() {
  return (
    <>
      <RouterProvider router={desktopRouter} />
      <Toaster
        position="bottom-center"
        duration={2000}
        toastOptions={{
          style: {
            background: '#2A2A2C',
            color: '#fff',
            borderRadius: '15px',
            border: 'none',
            fontSize: '14px',
            width: '356px',
          },
        }}
      />
    </>
  )
}
