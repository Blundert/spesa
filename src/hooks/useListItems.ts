import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import {
  getListItems,
  addToList,
  removeFromList,
  updateListItemQuantity,
  clearList,
} from '../db/repositories/listItems'
import { upsertItem } from '../db/repositories/items'

export function useListItems() {
  return useQuery({
    queryKey: qk.listItems(),
    queryFn: () => getListItems(),
  })
}

export function useAddToList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId }: { itemId: number }) => addToList(itemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems() })
    },
  })
}

/** Crea un nuovo item (se non esiste) e lo aggiunge alla lista. */
export function useAddNewItemToList(defaultCategoryId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, categoryId }: { name: string; categoryId?: number }) => {
      const catId = categoryId ?? defaultCategoryId
      const itemId = await upsertItem(name, catId)
      await addToList(itemId)
      return itemId
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems() })
      void qc.invalidateQueries({ queryKey: qk.items() })
    },
  })
}

export function useRemoveFromList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => removeFromList(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems() })
    },
  })
}

export function useUpdateListQuantity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateListItemQuantity(id, quantity),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems() })
    },
  })
}

export function useClearList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => clearList(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems() })
    },
  })
}
