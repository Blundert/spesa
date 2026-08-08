import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { qk } from '../db/queryKeys'
import {
  getMealPlan,
  setMealSlotDish,
  clearMealPlan,
  getPlannedWeeks,
  getSelectedItemIdsForWeek,
  type MealSlotDish,
} from '../db/repositories/mealPlan'
import { addToList } from '../db/repositories/listItems'
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

export function useSetMealSlotDish(isoWeek: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      dayIndex,
      mealType,
      value,
    }: {
      dayIndex: number
      mealType: MealType
      value: MealSlotDish | null
    }) => setMealSlotDish(isoWeek, dayIndex, mealType, value),
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

/**
 * Importa nella lista della spesa gli ingredienti selezionati nei pasti pianificati
 * della settimana. I duplicati si sommano (vedi `addToList`).
 */
export function useImportMealPlanToList(isoWeek: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async () => {
      const itemIds = await getSelectedItemIdsForWeek(isoWeek)
      for (const itemId of itemIds) {
        await addToList(itemId)
      }
      return itemIds.length
    },
    onSuccess: (count) => {
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
      if (count > 0) toast(t('pasti.importedToList', { count }))
    },
  })
}

export function useDeletePlannedWeek() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (isoWeek: string) => clearMealPlan(isoWeek),
    onSuccess: (_data, isoWeek) => {
      void qc.invalidateQueries({ queryKey: qk.mealPlan(isoWeek) })
      void qc.invalidateQueries({ queryKey: qk.plannedWeeks() })
      toast(t('pianificazioni.deleted'))
    },
  })
}
