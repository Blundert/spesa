import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        offset={108}
        toastOptions={{
          style: {
            background: '#2A2A2C',
            color: '#fff',
            borderRadius: '15px',
            border: 'none',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
