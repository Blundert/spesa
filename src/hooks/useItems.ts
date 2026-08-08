import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getItems, upsertItem } from '../db/repositories/items'
import { getSupermarkets, updateLoyaltyCard } from '../db/repositories/supermarkets'
import { getCategories } from '../db/repositories/categories'

export function useItems() {
  return useQuery({ queryKey: qk.items(), queryFn: getItems })
}

/** Crea un item nel catalogo (o riusa quello esistente con lo stesso nome) senza aggiungerlo alla lista. */
export function useUpsertItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { name: string; categoryId: number }) => upsertItem(vars.name, vars.categoryId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.items() }),
  })
}

export function useSupermarkets() {
  return useQuery({ queryKey: qk.supermarkets(), queryFn: getSupermarkets })
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories(), queryFn: getCategories })
}

export function useUpdateLoyaltyCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; imageDataUrl: string | null }) =>
      updateLoyaltyCard(vars.id, vars.imageDataUrl),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.supermarkets() }),
  })
}
