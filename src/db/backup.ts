import { db } from './db'
import type {
  Category,
  Item,
  Supermarket,
  WeekBudget,
  ListItem,
  Session,
  Purchase,
  MealPlan,
} from './types'
import { getWeekStartDay, setWeekStartDay } from '../lib/weekSettings'

/** Versione del formato di backup (allineata allo schema Dexie). */
export const BACKUP_VERSION = 6

export interface BackupData {
  version: number
  exportedAt: number
  categories: Category[]
  items: Item[]
  supermarkets: Supermarket[]
  weekBudgets: WeekBudget[]
  listItems: ListItem[]
  sessions: Session[]
  purchases: Purchase[]
  mealPlans: MealPlan[]
  settings?: { weekStartDay: number }
}

/** Serializza tutte le tabelle in un oggetto di backup (id inclusi → relazioni preservate). */
export async function exportData(): Promise<BackupData> {
  const [categories, items, supermarkets, weekBudgets, listItems, sessions, purchases, mealPlans] =
    await Promise.all([
      db.categories.toArray(),
      db.items.toArray(),
      db.supermarkets.toArray(),
      db.weekBudgets.toArray(),
      db.listItems.toArray(),
      db.sessions.toArray(),
      db.purchases.toArray(),
      db.mealPlans.toArray(),
    ])
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    categories,
    items,
    supermarkets,
    weekBudgets,
    listItems,
    sessions,
    purchases,
    mealPlans,
    settings: { weekStartDay: getWeekStartDay() },
  }
}

/** Validazione leggera della struttura di un backup. */
export function isBackupData(x: unknown): x is BackupData {
  if (!x || typeof x !== 'object') return false
  const d = x as Record<string, unknown>
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.categories) &&
    Array.isArray(d.items) &&
    Array.isArray(d.supermarkets) &&
    Array.isArray(d.weekBudgets) &&
    Array.isArray(d.listItems) &&
    Array.isArray(d.sessions) &&
    Array.isArray(d.purchases) &&
    Array.isArray(d.mealPlans)
  )
}

/** Sostituisce tutti i dati con quelli del backup (transazione: svuota + ripopola). */
export async function importData(data: BackupData): Promise<void> {
  if (!isBackupData(data)) throw new Error('Formato backup non valido')
  if (data.version < 4 || data.version > BACKUP_VERSION) {
    throw new Error(`Versione backup non compatibile (${data.version})`)
  }
  await db.transaction(
    'rw',
    [
      db.categories,
      db.items,
      db.supermarkets,
      db.weekBudgets,
      db.listItems,
      db.sessions,
      db.purchases,
      db.mealPlans,
    ],
    async () => {
      await Promise.all([
        db.categories.clear(),
        db.items.clear(),
        db.supermarkets.clear(),
        db.weekBudgets.clear(),
        db.listItems.clear(),
        db.sessions.clear(),
        db.purchases.clear(),
        db.mealPlans.clear(),
      ])
      await Promise.all([
        db.categories.bulkAdd(data.categories),
        db.items.bulkAdd(data.items),
        db.supermarkets.bulkAdd(data.supermarkets),
        db.weekBudgets.bulkAdd(data.weekBudgets),
        db.listItems.bulkAdd(data.listItems),
        db.sessions.bulkAdd(data.sessions),
        db.purchases.bulkAdd(data.purchases),
        db.mealPlans.bulkAdd(data.mealPlans),
      ])
    },
  )
  if (data.settings?.weekStartDay !== undefined) {
    setWeekStartDay(data.settings.weekStartDay)
  }
}
