import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getMealPlan, upsertMealPlan, clearMealPlan } from '../db/repositories/mealPlan'
import type { MealType } from '../db/types'

export function useMealPlan(isoWeek: string) {
  return useQuery({
    queryKey: qk.mealPlan(isoWeek),
    queryFn: () => getMealPlan(isoWeek),
  })
}

export function useUpdateMealSlot(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      dayIndex,
      mealType,
      dish,
    }: {
      dayIndex: number
      mealType: MealType
      dish: string
    }) => upsertMealPlan(isoWeek, dayIndex, mealType, dish),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mealPlan(isoWeek) })
    },
  })
}

export function useClearMealPlan(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => clearMealPlan(isoWeek),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mealPlan(isoWeek) })
    },
  })
}
