import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { qk } from '../db/queryKeys'
import { getDishesWithIngredients, saveDish, deleteDish } from '../db/repositories/dishes'

export function useDishes() {
  return useQuery({ queryKey: qk.dishes(), queryFn: getDishesWithIngredients })
}

export function useSaveDish() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (vars: { id?: number; name: string; itemIds: number[] }) =>
      saveDish(vars.id, vars.name, vars.itemIds),
    onSuccess: (_id, vars) => {
      void qc.invalidateQueries({ queryKey: qk.dishes() })
      toast(t(vars.id !== undefined ? 'piatti.saved' : 'piatti.added', { name: vars.name.trim() }))
    },
  })
}

export function useDeleteDish() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => deleteDish(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.dishes() })
      toast(t('piatti.deleted'))
    },
  })
}
