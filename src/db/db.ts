import Dexie, { type EntityTable } from 'dexie'
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
import { DEFAULT_BUONO_VALUE_CENTS } from './types'

class SpesaDb extends Dexie {
  categories!: EntityTable<Category, 'id'>
  items!: EntityTable<Item, 'id'>
  supermarkets!: EntityTable<Supermarket, 'id'>
  weekBudgets!: EntityTable<WeekBudget, 'id'>
  listItems!: EntityTable<ListItem, 'id'>
  sessions!: EntityTable<Session, 'id'>
  purchases!: EntityTable<Purchase, 'id'>
  mealPlans!: EntityTable<MealPlan, 'id'>

  constructor() {
    super('spesa')

    this.version(1).stores({
      categories: '++id, sortOrder',
      items: '++id, normalizedName, categoryId',
      supermarkets: '++id, normalizedName',
      weekBudgets: '++id, &isoWeek',
      listItems: '++id, isoWeek, itemId, [isoWeek+itemId]',
      sessions: '++id, isoWeek, supermarketId, startedAt',
      purchases: '++id, sessionId, itemId, [sessionId+itemId]',
      mealPlans: '++id, isoWeek',
    })

    // v2: mealType field added — compound index updated to [isoWeek+dayIndex+mealType]
    this.version(2).stores({
      mealPlans: '++id, isoWeek, [isoWeek+dayIndex+mealType]',
    })

    // v3: la lista diventa globale (rimosso isoWeek da listItems); le sessioni
    // guadagnano confirmedTotalCents. weekBudgets/mealPlans restano invariati.
    this.version(3)
      .stores({
        listItems: '++id, itemId',
        sessions: '++id, isoWeek, supermarketId, startedAt',
      })
      .upgrade(async (tx) => {
        // Le voci di lista sono effimere (si svuotano a ogni spesa): si azzerano.
        await tx.table('listItems').clear()
        // Backfill esplicito così il tipo number|null resta veritiero.
        await tx
          .table('sessions')
          .toCollection()
          .modify((s: { confirmedTotalCents?: number | null }) => {
            s.confirmedTotalCents = null
          })
      })

    // v4: buoni pasto per-spesa. weekBudgets: buoniCount→buoniAvailable (drop valueCents);
    // sessions: buoniSpent + buoniValueCents. Indici invariati → solo upgrade dati.
    this.version(4).upgrade(async (tx) => {
      await tx
        .table('weekBudgets')
        .toCollection()
        .modify((b: { buoniCount?: number; buoniAvailable?: number; buoniValueCents?: number }) => {
          b.buoniAvailable = b.buoniCount ?? 0
          delete b.buoniCount
          delete b.buoniValueCents
        })
      await tx
        .table('sessions')
        .toCollection()
        .modify((s: { buoniSpent?: number; buoniValueCents?: number }) => {
          s.buoniSpent = 0
          s.buoniValueCents = DEFAULT_BUONO_VALUE_CENTS
        })
    })
  }
}

export const db = new SpesaDb()

// ---------------------------------------------------------------------------
// Seed categories on first open
// ---------------------------------------------------------------------------

const SEED_CATEGORIES: Array<Omit<Category, 'id'>> = [
  { name: 'Frutta e verdura', sortOrder: 0 },
  { name: 'Frigo', sortOrder: 1 },
  { name: 'Dispensa', sortOrder: 2 },
  { name: 'Panetteria', sortOrder: 3 },
  { name: 'Bevande', sortOrder: 4 },
  { name: 'Altro', sortOrder: 5 },
]

db.on('populate', async () => {
  await db.categories.bulkAdd(SEED_CATEGORIES)
})

/**
 * Azzera tutti i dati utente (lista, spese, acquisti, articoli, supermercati, budget, pasti)
 * e ricrea le categorie seed. Le categorie restano perché sono struttura, non dati utente.
 */
export async function wipeAllData(): Promise<void> {
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
        db.items.clear(),
        db.supermarkets.clear(),
        db.weekBudgets.clear(),
        db.listItems.clear(),
        db.sessions.clear(),
        db.purchases.clear(),
        db.mealPlans.clear(),
        db.categories.clear(),
      ])
      await db.categories.bulkAdd(SEED_CATEGORIES)
    },
  )
}
