import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dexie è locale → nessuna necessità di re-fetch automatico
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60, // 1h
      retry: false,
    },
  },
})
