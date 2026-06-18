import { db } from '../db'
import type { WeekBudget } from '../types'

/**
 * Buoni disponibili nella settimana. Default 0 (non persistito finché non impostato).
 */
export async function getWeekBudget(isoWeek: string): Promise<WeekBudget> {
  const existing = await db.weekBudgets.where('isoWeek').equals(isoWeek).first()
  if (existing) return existing
  return { isoWeek, buoniAvailable: 0 }
}

/** Imposta i buoni disponibili per la settimana (upsert). */
export async function setBuoniAvailable(isoWeek: string, buoniAvailable: number): Promise<void> {
  const existing = await db.weekBudgets.where('isoWeek').equals(isoWeek).first()
  if (existing?.id !== undefined) {
    await db.weekBudgets.update(existing.id, { buoniAvailable })
  } else {
    await db.weekBudgets.add({ isoWeek, buoniAvailable })
  }
}
