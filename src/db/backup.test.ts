import { vi, describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { exportData, importData, isBackupData, BACKUP_VERSION, type BackupData } from './backup'

const mockGetWeekStartDay = vi.hoisted(() => vi.fn(() => 0))
const mockSetWeekStartDay = vi.hoisted(() => vi.fn())
vi.mock('../lib/weekSettings', () => ({
  getWeekStartDay: mockGetWeekStartDay,
  setWeekStartDay: mockSetWeekStartDay,
}))

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
  dishes: [],
  dishIngredients: [],
  shoppingLists: [],
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
    db.dishes.clear(),
    db.dishIngredients.clear(),
    db.shoppingLists.clear(),
  ])
}

async function seed() {
  await db.categories.bulkAdd([{ id: 1, name: 'Frigo', sortOrder: 0 }])
  await db.items.bulkAdd([
    { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: 120, suggestedPriceCents: 120 },
  ])
  await db.supermarkets.bulkAdd([{ id: 1, name: 'Coop', normalizedName: 'coop', loyaltyCard: 'data:image/jpeg;base64,abc' }])
  await db.weekBudgets.bulkAdd([{ id: 1, isoWeek: '2026-W24', buoniAvailable: 10 }])
  await db.shoppingLists.bulkAdd([{ id: 1, name: 'Casa', supermarketId: 1, sortOrder: 0, archivedAt: null }])
  await db.listItems.bulkAdd([{ id: 1, listId: 1, itemId: 1, quantity: 2, addedAt: 1000 }])
  await db.sessions.bulkAdd([
    {
      id: 1,
      isoWeek: '2026-W24',
      supermarketId: 1,
      listId: 1,
      startedAt: 2000,
      finishedAt: 3000,
      confirmedTotalCents: 500,
      buoniSpent: 2,
      buoniValueCents: 800,
    },
  ])
  await db.purchases.bulkAdd([{ id: 1, sessionId: 1, itemId: 1, priceCents: 120, quantity: 2 }])
  await db.mealPlans.bulkAdd([{ id: 1, isoWeek: '2026-W24', dayIndex: 0, mealType: 0, dish: 'Pasta' }])
  await db.dishes.bulkAdd([{ id: 1, name: 'Pasta al pomodoro', normalizedName: 'pasta al pomodoro' }])
  await db.dishIngredients.bulkAdd([{ id: 1, dishId: 1, itemId: 1 }])
}

beforeEach(async () => {
  await clearAll()
  mockGetWeekStartDay.mockReturnValue(0)
  mockSetWeekStartDay.mockClear()
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

  it('include settings.weekStartDay dal valore corrente', async () => {
    mockGetWeekStartDay.mockReturnValue(3)
    const data = await exportData()
    expect(data.settings?.weekStartDay).toBe(3)
  })

  it('include settings.weekStartDay = 0 quando non configurato', async () => {
    const data = await exportData()
    expect(data.settings?.weekStartDay).toBe(0)
  })
})

const SHARED = {
  uid: 'u-1',
  owner: 'anna',
  repo: 'spesa-casa',
  branch: 'main',
  path: 'lista.json',
  me: 'matteo',
  canWrite: true,
  members: { anna: { label: 'Anna', kind: 'partner' as const } },
  tombstones: { 'voce-1': 1234 },
}

describe('liste condivise nel backup', () => {
  async function shareList(lastSha?: string) {
    await db.shoppingLists.add({
      id: 5,
      name: 'Casa nostra',
      supermarketId: null,
      sortOrder: 1,
      archivedAt: null,
      shared: { ...SHARED, ...(lastSha ? { lastSha } : {}) },
    })
    await db.listItems.add({ id: 9, listId: 5, itemId: 1, quantity: 1, addedAt: 1, uid: 'v-1', updatedAt: 2, addedBy: 'anna', takenBy: null })
  }

  it('porta il collegamento ma non lo stato di sync (lastSha) né il token', async () => {
    await seed()
    await shareList('abc123')
    const exported = await exportData()
    const list = exported.shoppingLists?.find((l) => l.id === 5)
    expect(list?.shared).toEqual(SHARED)
    expect(list?.shared && 'lastSha' in list.shared).toBe(false)
    expect(JSON.stringify(exported)).not.toMatch(/token/i)
    expect(exported.listItems.find((li) => li.id === 9)).toBeUndefined() // le voci vengono dal repo
  })

  it('non modifica le liste del database mentre esporta', async () => {
    await shareList('abc123')
    await exportData()
    expect((await db.shoppingLists.get(5))?.shared?.lastSha).toBe('abc123')
  })

  it('non include ciò che arriva dal repo condiviso: voci delle liste condivise, spese e acquisti degli altri', async () => {
    await seed()
    await shareList()
    await db.sessions.bulkAdd([
      { id: 7, isoWeek: 'w', supermarketId: 1, listId: 5, startedAt: 1, finishedAt: 2, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800, doneBy: 'anna' },
      { id: 8, isoWeek: 'w', supermarketId: 1, listId: 5, startedAt: 3, finishedAt: 4, confirmedTotalCents: 1, buoniSpent: 0, buoniValueCents: 800 }, // mia
    ])
    await db.purchases.bulkAdd([
      { sessionId: 7, itemId: 1, priceCents: 10, quantity: 1 },
      { sessionId: 8, itemId: 1, priceCents: 20, quantity: 1 },
    ])
    const exported = await exportData()
    expect(exported.listItems.map((li) => li.id)).toEqual([1]) // resta solo la voce della lista normale
    expect(exported.sessions.map((s) => s.id).sort()).toEqual([1, 8]) // la mia spesa condivisa resta, quella di Anna no
    expect(exported.purchases.map((p) => p.sessionId).sort()).toEqual([1, 8])
    expect(exported.shoppingLists?.find((l) => l.id === 5)?.shared).toBeDefined() // il collegamento resta
  })

  it('un backup con lastSha lo perde all’import: la prima sync dovrà scaricare', async () => {
    await seed()
    await shareList()
    const exported = await exportData()
    const withSha = {
      ...exported,
      shoppingLists: exported.shoppingLists?.map((l) => (l.shared ? { ...l, shared: { ...l.shared, lastSha: 'vecchio' } } : l)),
    }
    await clearAll()
    await importData(withSha)
    const list = await db.shoppingLists.get(5)
    expect(list?.shared).toEqual(SHARED)
    expect(list?.shared?.lastSha).toBeUndefined()
    expect(await db.listItems.get(9)).toBeUndefined() // si ripopola dal repo alla prima sync
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
    expect(after.dishes).toEqual(exported.dishes)
    expect(after.dishIngredients).toEqual(exported.dishIngredients)
    expect(after.shoppingLists).toEqual(exported.shoppingLists)
    expect(after.listItems).toEqual(exported.listItems)
    // la relazione purchase→session resta valida
    expect(after.purchases[0].sessionId).toBe(after.sessions[0].id)
    // la relazione dishIngredient→dish resta valida
    expect(after.dishIngredients?.[0].dishId).toBe(after.dishes?.[0].id)
    expect(after.supermarkets[0].loyaltyCard).toBe('data:image/jpeg;base64,abc')
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

  it('importa backup versione 4 (senza loyaltyCard)', async () => {
    const v4: BackupData = { ...validBase, version: 4 }
    await expect(importData(v4)).resolves.toBeUndefined()
  })

  it('importa backup versione 6 (senza dishes/dishIngredients)', async () => {
    const v6: BackupData = { ...validBase, version: 6, dishes: undefined, dishIngredients: undefined }
    await importData(v6)
    const data = await exportData()
    expect(data.dishes).toEqual([])
    expect(data.dishIngredients).toEqual([])
  })

  it('importa backup versione 7 (senza liste): voci e spese vanno nella lista iniziale', async () => {
    await seed()
    const exported = await exportData()
    const v7 = {
      ...exported,
      version: 7,
      shoppingLists: undefined,
      listItems: exported.listItems.map((li) => ({ ...li, listId: undefined })),
      sessions: exported.sessions.map((s) => ({ ...s, listId: undefined })),
    } as unknown as BackupData
    await clearAll()

    await importData(v7)
    const lists = await db.shoppingLists.toArray()
    expect(lists).toHaveLength(1)
    expect(lists[0]).toMatchObject({ name: 'Spesa', supermarketId: null, archivedAt: null })
    expect((await db.listItems.toArray())[0].listId).toBe(lists[0].id)
    expect((await db.sessions.toArray())[0].listId).toBe(lists[0].id)
  })

  it('rifiuta una struttura non valida', async () => {
    await expect(importData({} as unknown as BackupData)).rejects.toThrow()
  })

  it('ripristina weekStartDay da settings nel backup', async () => {
    const backup: BackupData = { ...validBase, settings: { weekStartDay: 5 } }
    await importData(backup)
    expect(mockSetWeekStartDay).toHaveBeenCalledWith(5)
  })

  it('non chiama setWeekStartDay se il backup non ha settings (retrocompat)', async () => {
    const backup: BackupData = { ...validBase, settings: undefined }
    await importData(backup)
    expect(mockSetWeekStartDay).not.toHaveBeenCalled()
  })
})
