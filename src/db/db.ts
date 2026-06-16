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
      mealPlans: '++id, isoWeek, [isoWeek+dayIndex]',
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
