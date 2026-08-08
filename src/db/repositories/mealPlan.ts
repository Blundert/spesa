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
  /** Piatto del catalogo collegato (assente per pianificazioni pre-esistenti in formato testo libero). */
  pranzoDishId: number | undefined
  cenaDishId: number | undefined
  /** Ingredienti selezionati per questa occorrenza (vuoto se pranzoDishId/cenaDishId assente). */
  pranzoSelectedItemIds: number[]
  cenaSelectedItemIds: number[]
}

/**
 * Restituisce i 7 giorni con pranzo e cena (stringa vuota se non pianificato).
 * L'array è ruotato in modo che il primo elemento corrisponda a `startDay` (0=Lun…6=Dom).
 */
export async function getMealPlan(isoWeek: string, startDay: number = 0): Promise<MealPlanDay[]> {
  const rows = await db.mealPlans.where('isoWeek').equals(isoWeek).toArray()

  const allDays = Array.from({ length: 7 }, (_, dayIndex) => {
    const pranzoRow = rows.find((r) => r.dayIndex === dayIndex && r.mealType === 0)
    const cenaRow = rows.find((r) => r.dayIndex === dayIndex && r.mealType === 1)
    return {
      dayIndex,
      pranzo: pranzoRow?.dish ?? '',
      cena: cenaRow?.dish ?? '',
      pranzoId: pranzoRow?.id,
      cenaId: cenaRow?.id,
      pranzoDishId: pranzoRow?.dishId,
      cenaDishId: cenaRow?.dishId,
      pranzoSelectedItemIds: pranzoRow?.selectedItemIds ?? [],
      cenaSelectedItemIds: cenaRow?.selectedItemIds ?? [],
    }
  })

  return [...allDays.slice(startDay), ...allDays.slice(0, startDay)]
}

/** Piatto del catalogo assegnato a uno slot pasto, con gli ingredienti scelti per quella occorrenza. */
export interface MealSlotDish {
  dishId: number
  name: string
  selectedItemIds: number[]
}

/**
 * Assegna (o rimuove, con `value = null`) il piatto di uno slot pasto.
 */
export async function setMealSlotDish(
  isoWeek: string,
  dayIndex: number,
  mealType: MealType,
  value: MealSlotDish | null,
): Promise<void> {
  const existing = await db.mealPlans
    .where('[isoWeek+dayIndex+mealType]')
    .equals([isoWeek, dayIndex, mealType])
    .first()

  if (value === null) {
    if (existing?.id !== undefined) await db.mealPlans.delete(existing.id)
    return
  }

  const patch = { dish: value.name, dishId: value.dishId, selectedItemIds: value.selectedItemIds }
  if (existing?.id !== undefined) {
    await db.mealPlans.update(existing.id, patch)
  } else {
    await db.mealPlans.add({ isoWeek, dayIndex, mealType, ...patch })
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

export interface PlannedWeek {
  isoWeek: string
  mealCount: number
}

/**
 * Elenco delle settimane che hanno almeno un pasto pianificato, con il numero di pasti,
 * ordinate dalla più recente. Volumi piccoli (app personale) → riduzione in JS.
 */
export async function getPlannedWeeks(): Promise<PlannedWeek[]> {
  const rows = await db.mealPlans.toArray()
  const counts = new Map<string, number>()
  for (const r of rows) {
    counts.set(r.isoWeek, (counts.get(r.isoWeek) ?? 0) + 1)
  }
  return Array.from(counts, ([isoWeek, mealCount]) => ({ isoWeek, mealCount })).sort((a, b) =>
    b.isoWeek.localeCompare(a.isoWeek),
  )
}
