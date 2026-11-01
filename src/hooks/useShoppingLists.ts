import { useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import {
  archiveShoppingList,
  createShoppingList,
  getShoppingLists,
  getUsualItems,
  updateShoppingList,
} from '../db/repositories/shoppingLists'
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

export function useCreateList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, supermarketId }: { name: string; supermarketId: number | null }) =>
      createShoppingList(name, supermarketId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.shoppingLists() }),
  })
}

export function useUpdateList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: number; name?: string; supermarketId?: number | null }) =>
      updateShoppingList(id, patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.shoppingLists() }),
  })
}

export function useArchiveList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => archiveShoppingList(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.shoppingLists() }),
  })
}
