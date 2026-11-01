import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getShoppingLists, getUsualItems } from '../db/repositories/shoppingLists'
import { getActiveListId, onActiveListChange, pickList } from '../lib/activeList'

export function useShoppingLists() {
  return useQuery({
    queryKey: qk.shoppingLists(),
    queryFn: () => getShoppingLists(),
  })
}

/** Lista aperta nella Lista (ricordata sul dispositivo), con tutte le liste. */
export function useActiveList() {
  const { data: lists = [] } = useShoppingLists()
  const preferredId = useSyncExternalStore(onActiveListChange, getActiveListId)
  return { lists, list: pickList(lists, preferredId) }
}

/** Prodotti più comprati con questa lista (base della spesa solita). */
export function useUsualItems(listId: number | undefined) {
  return useQuery({
    queryKey: qk.usualItems(listId ?? 0),
    queryFn: () => getUsualItems(listId ?? 0),
    enabled: listId !== undefined,
  })
}
