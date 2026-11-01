import { useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { desktopRouter } from './router'

export function DesktopApp() {
  // Il router desktop può essere rimasto fermo su un URL vecchio mentre era smontato:
  // lo riallineo alla posizione attuale prima di montarlo.
  useState(() => {
    const { pathname, search, hash } = window.location
    desktopRouter.history.replace(pathname + search + hash)
    return true
  })

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
