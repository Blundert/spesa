import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getItemPriceHistory, getItemPriceByStore } from '../db/repositories/priceHistory'
import { getSupermarketStats } from '../db/repositories/supermarkets'

export function useItemPriceHistory(itemId: number) {
  return useQuery({
    queryKey: qk.priceHistory(itemId),
    queryFn: () => getItemPriceHistory(itemId),
    enabled: itemId > 0,
  })
}

export function useItemPriceByStore(itemId: number) {
  return useQuery({
    queryKey: [...qk.priceHistory(itemId), 'byStore'],
    queryFn: () => getItemPriceByStore(itemId),
    enabled: itemId > 0,
  })
}

export function useSupermarketStats() {
  return useQuery({
    queryKey: [...qk.supermarkets(), 'stats'],
    queryFn: getSupermarketStats,
  })
}
