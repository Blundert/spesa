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

export function useListItems(isoWeek: string) {
  return useQuery({
    queryKey: qk.listItems(isoWeek),
    queryFn: () => getListItems(isoWeek),
  })
}

export function useAddToList(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId }: { itemId: number }) => addToList(isoWeek, itemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems(isoWeek) })
    },
  })
}

/** Crea un nuovo item (se non esiste) e lo aggiunge alla lista. */
export function useAddNewItemToList(isoWeek: string, defaultCategoryId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, categoryId }: { name: string; categoryId?: number }) => {
      const catId = categoryId ?? defaultCategoryId
      const itemId = await upsertItem(name, catId)
      await addToList(isoWeek, itemId)
      return itemId
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.items() })
    },
  })
}

export function useRemoveFromList(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => removeFromList(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems(isoWeek) })
    },
  })
}

export function useUpdateListQuantity(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateListItemQuantity(id, quantity),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems(isoWeek) })
    },
  })
}

export function useClearList(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => clearList(isoWeek),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listItems(isoWeek) })
    },
  })
}
