import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import {
  getListItems,
  addToList,
  removeFromList,
  updateListItemQuantity,
  removePurchasedFromList,
  clearList,
} from '../db/repositories/listItems'
import { upsertItem } from '../db/repositories/items'

/** Voci di una lista; senza lista (liste non ancora caricate) resta vuota. */
export function useListItems(listId: number | undefined) {
  return useQuery({
    queryKey: qk.listItemsOf(listId ?? 0),
    queryFn: () => getListItems(listId ?? 0),
    enabled: listId !== undefined,
  })
}

export function useAddToList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) => addToList(listId, itemId),
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}

/** Crea un nuovo item (se non esiste) e lo aggiunge alla lista. */
export function useAddNewItemToList(defaultCategoryId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, name, categoryId }: { listId: number; name: string; categoryId?: number }) => {
      const catId = categoryId ?? defaultCategoryId
      const itemId = await upsertItem(name, catId)
      await addToList(listId, itemId)
      return itemId
    },
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
      void qc.invalidateQueries({ queryKey: qk.items() })
    },
  })
}

export function useRemoveFromList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => removeFromList(id),
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}

export function useUpdateListQuantity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateListItemQuantity(id, quantity),
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}

export function useRemovePurchasedFromList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, itemIds }: { listId: number; itemIds: number[] }) =>
      removePurchasedFromList(listId, itemIds),
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}

export function useClearList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (listId: number) => clearList(listId),
    onSuccess: () => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}
