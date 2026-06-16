import { db } from '../db'
import type { MealType } from '../types'

export interface MealPlanSlot {
  dayIndex: number
  mealType: MealType
  dish: string
  id: number | undefined
}

export interface MealPlanDay {
  dayIndex: number
  pranzo: string
  cena: string
  pranzoId: number | undefined
  cenaId: number | undefined
}

/**
 * Restituisce i 7 giorni con pranzo e cena (stringa vuota se non pianificato).
 */
export async function getMealPlan(isoWeek: string): Promise<MealPlanDay[]> {
  const rows = await db.mealPlans.where('isoWeek').equals(isoWeek).toArray()

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const pranzoRow = rows.find((r) => r.dayIndex === dayIndex && r.mealType === 0)
    const cenaRow = rows.find((r) => r.dayIndex === dayIndex && r.mealType === 1)
    return {
      dayIndex,
      pranzo: pranzoRow?.dish ?? '',
      cena: cenaRow?.dish ?? '',
      pranzoId: pranzoRow?.id,
      cenaId: cenaRow?.id,
    }
  })
}

export async function upsertMealPlan(
  isoWeek: string,
  dayIndex: number,
  mealType: MealType,
  dish: string,
): Promise<void> {
  const existing = await db.mealPlans
    .where('[isoWeek+dayIndex+mealType]')
    .equals([isoWeek, dayIndex, mealType])
    .first()

  if (existing?.id !== undefined) {
    if (dish.trim() === '') {
      await db.mealPlans.delete(existing.id)
    } else {
      await db.mealPlans.update(existing.id, { dish: dish.trim() })
    }
  } else if (dish.trim() !== '') {
    await db.mealPlans.add({ isoWeek, dayIndex, mealType, dish: dish.trim() })
  }
}

export async function clearMealPlan(isoWeek: string): Promise<void> {
  await db.mealPlans.where('isoWeek').equals(isoWeek).delete()
}

/** Restituisce tutti i piatti non vuoti (utili per generare la lista spesa). */
export async function getMealDishes(isoWeek: string): Promise<string[]> {
  const rows = await db.mealPlans.where('isoWeek').equals(isoWeek).toArray()
  return rows.map((r) => r.dish).filter(Boolean)
}
