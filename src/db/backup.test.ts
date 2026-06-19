import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { exportData, importData, isBackupData, BACKUP_VERSION, type BackupData } from './backup'

const validBase: BackupData = {
  version: BACKUP_VERSION,
  exportedAt: 0,
  categories: [],
  items: [],
  supermarkets: [],
  weekBudgets: [],
  listItems: [],
  sessions: [],
  purchases: [],
  mealPlans: [],
}

async function clearAll() {
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
}

async function seed() {
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }])
  await db.items.bulkAdd([
    { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: 120, suggestedPriceCents: 120 },
  ])
  await db.supermarkets.bulkAdd([{ id: 1, name: 'Coop', normalizedName: 'coop' }])
  await db.weekBudgets.bulkAdd([{ id: 1, isoWeek: '2026-W24', buoniAvailable: 10 }])
  await db.listItems.bulkAdd([{ id: 1, itemId: 1, quantity: 2, addedAt: 1000 }])
  await db.sessions.bulkAdd([
    {
      id: 1,
      isoWeek: '2026-W24',
      supermarketId: 1,
      startedAt: 2000,
      finishedAt: 3000,
      confirmedTotalCents: 500,
      buoniSpent: 2,
      buoniValueCents: 800,
    },
  ])
  await db.purchases.bulkAdd([{ id: 1, sessionId: 1, itemId: 1, priceCents: 120, quantity: 2 }])
  await db.mealPlans.bulkAdd([{ id: 1, isoWeek: '2026-W24', dayIndex: 0, mealType: 0, dish: 'Pasta' }])
}

beforeEach(async () => {
  await clearAll()
})

describe('isBackupData', () => {
  it('accetta una struttura valida', () => {
    expect(isBackupData(validBase)).toBe(true)
  })

  it('rifiuta non-oggetti e strutture incomplete', () => {
    expect(isBackupData(null)).toBe(false)
    expect(isBackupData('x')).toBe(false)
    expect(isBackupData(42)).toBe(false)
    expect(isBackupData({ version: 4 })).toBe(false)
    expect(isBackupData({ ...validBase, sessions: 'nope' })).toBe(false)
  })
})

describe('exportData', () => {
  it('serializza tutte le tabelle con versione e timestamp', async () => {
    await seed()
    const data = await exportData()
    expect(data.version).toBe(BACKUP_VERSION)
    expect(typeof data.exportedAt).toBe('number')
    expect(data.items).toHaveLength(1)
    expect(data.sessions[0].buoniSpent).toBe(2)
    expect(data.purchases[0].sessionId).toBe(1)
  })

  it('su db vuoto restituisce array vuoti', async () => {
    const data = await exportData()
    expect(data.items).toEqual([])
    expect(data.sessions).toEqual([])
  })
})

describe('importData', () => {
  it('round-trip: export → clear → import ripristina dati, id e relazioni', async () => {
    await seed()
    const exported = await exportData()

    await clearAll()
    expect((await exportData()).items).toHaveLength(0)

    await importData(exported)
    const after = await exportData()

    expect(after.items).toEqual(exported.items)
    expect(after.sessions).toEqual(exported.sessions)
    expect(after.purchases).toEqual(exported.purchases)
    expect(after.mealPlans).toEqual(exported.mealPlans)
    // la relazione purchase→session resta valida
    expect(after.purchases[0].sessionId).toBe(after.sessions[0].id)
  })

  it('sovrascrive i dati esistenti', async () => {
    await seed()
    const exported = await exportData()
    await db.items.add({
      name: 'Extra',
      normalizedName: 'extra',
      categoryId: 1,
      lastPriceCents: null,
      suggestedPriceCents: null,
    })
    expect(await db.items.count()).toBe(2)

    await importData(exported)
    expect(await db.items.count()).toBe(1)
  })

  it('rifiuta una versione incompatibile', async () => {
    const bad: BackupData = { ...validBase, version: 999 }
    await expect(importData(bad)).rejects.toThrow()
  })

  it('rifiuta una struttura non valida', async () => {
    await expect(importData({} as unknown as BackupData)).rejects.toThrow()
  })
})
