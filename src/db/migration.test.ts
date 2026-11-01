import { describe, it, expect } from 'vitest'
import Dexie from 'dexie'

// Database alla v8 (lista unica), poi apertura con lo schema attuale.
describe('migrazione v9: più liste', () => {
  it('la lista unica diventa "Spesa" con le sue voci e tutte le spese passate', async () => {
    const old = new Dexie('spesa')
    old.version(8).stores({
      categories: '++id, sortOrder',
      items: '++id, normalizedName, categoryId',
      supermarkets: '++id, normalizedName',
      weekBudgets: '++id, &isoWeek',
      listItems: '++id, itemId',
      sessions: '++id, isoWeek, supermarketId, startedAt',
      purchases: '++id, sessionId, itemId, [sessionId+itemId]',
      mealPlans: '++id, isoWeek, [isoWeek+dayIndex+mealType]',
      dishes: '++id, normalizedName',
      dishIngredients: '++id, dishId, itemId, [dishId+itemId]',
    })
    await old.open()
    await old.table('listItems').bulkAdd([
      { itemId: 1, quantity: 2, addedAt: 0 },
      { itemId: 2, quantity: 1, addedAt: 0 },
    ])
    await old.table('sessions').add({ isoWeek: '2026-10-26', supermarketId: 1, startedAt: 0, finishedAt: 1 })
    old.close()

    const { db } = await import('./db')
    const lists = await db.shoppingLists.toArray()
    expect(lists).toHaveLength(1)
    expect(lists[0]).toMatchObject({ name: 'Spesa', supermarketId: null, sortOrder: 0, archivedAt: null })
    const listId = lists[0].id
    expect((await db.listItems.toArray()).every((li) => li.listId === listId)).toBe(true)
    expect((await db.sessions.toArray())[0].listId).toBe(listId)
    expect(await db.listItems.where('[listId+itemId]').equals([listId as number, 1]).count()).toBe(1)
  })
})

describe('database nuovo e reset', () => {
  it('parte con la lista iniziale vuota e la ricrea dopo il reset', async () => {
    const { db, wipeAllData } = await import('./db')
    await db.shoppingLists.add({ name: 'Casa', supermarketId: null, sortOrder: 1, archivedAt: null })
    await wipeAllData()
    const lists = await db.shoppingLists.toArray()
    expect(lists.map((l) => l.name)).toEqual(['Spesa'])
  })
})
