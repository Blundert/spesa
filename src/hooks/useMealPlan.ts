import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import {
  getMealPlan,
  upsertMealPlan,
  clearMealPlan,
  getPlannedWeeks,
} from '../db/repositories/mealPlan'
import type { MealType } from '../db/types'
import { getWeekStartDay } from '../lib/weekSettings'

export function useMealPlan(isoWeek: string) {
  return useQuery({
    queryKey: qk.mealPlan(isoWeek),
    queryFn: () => getMealPlan(isoWeek, getWeekStartDay()),
  })
}

export function usePlannedWeeks() {
  return useQuery({
    queryKey: qk.plannedWeeks(),
    queryFn: () => getPlannedWeeks(),
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
      void qc.invalidateQueries({ queryKey: qk.plannedWeeks() })
    },
  })
}

export function useClearMealPlan(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => clearMealPlan(isoWeek),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mealPlan(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.plannedWeeks() })
    },
  })
}
