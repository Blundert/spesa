import { db } from '../db'
import type { WeekBudget } from '../types'

const DEFAULT_BUONI_COUNT = 5
const DEFAULT_BUONI_VALUE_CENTS = 800 // €8,00

/**
 * Legge il budget della settimana, creando un default se non esiste.
 */
export async function getWeekBudget(isoWeek: string): Promise<WeekBudget> {
  const existing = await db.weekBudgets.where('isoWeek').equals(isoWeek).first()
  if (existing) return existing

  const id = await db.weekBudgets.add({
    isoWeek,
    buoniCount: DEFAULT_BUONI_COUNT,
    buoniValueCents: DEFAULT_BUONI_VALUE_CENTS,
  })
  return { id: id as number, isoWeek, buoniCount: DEFAULT_BUONI_COUNT, buoniValueCents: DEFAULT_BUONI_VALUE_CENTS }
}

export async function updateWeekBudget(
  isoWeek: string,
  buoniCount: number,
  buoniValueCents: number,
): Promise<void> {
  const existing = await db.weekBudgets.where('isoWeek').equals(isoWeek).first()
  if (existing?.id !== undefined) {
    await db.weekBudgets.update(existing.id, { buoniCount, buoniValueCents })
  } else {
    await db.weekBudgets.add({ isoWeek, buoniCount, buoniValueCents })
  }
}
