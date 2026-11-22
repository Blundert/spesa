import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { renameItem, moveItemCategory, deleteItem } from './items'

async function clearAll() {
  await db.categories.clear()
  await db.items.clear()
}

async function seedItem() {
  await db.categories.bulkAdd([
    { id: 1, name: 'Frigo', sortOrder: 0 },
    { id: 2, name: 'Dispensa', sortOrder: 1 },
  ])
  await db.items.add({
    id: 1,
    name: 'Latte',
    normalizedName: 'latte',
    categoryId: 1,
    lastPriceCents: null,
    suggestedPriceCents: null,
  })
}

beforeEach(async () => {
  await clearAll()
})

describe('renameItem', () => {
  it('aggiorna name e normalizedName', async () => {
    await seedItem()
    await renameItem(1, '  Latte Intero  ')
    const item = await db.items.get(1)
    expect(item?.name).toBe('Latte Intero')
    expect(item?.normalizedName).toBe('latte intero')
  })
})

describe('moveItemCategory', () => {
  it('aggiorna il categoryId', async () => {
    await seedItem()
    await moveItemCategory(1, 2)
    const item = await db.items.get(1)
    expect(item?.categoryId).toBe(2)
  })
})

describe('deleteItem e liste condivise', () => {
  it('eliminare un articolo dal catalogo toglie le sue voci e lascia il tombstone nelle liste condivise', async () => {
    await clearAll()
    await Promise.all([db.listItems.clear(), db.shoppingLists.clear()])
    await seedItem()
    await db.shoppingLists.bulkAdd([
      {
        id: 1, name: 'Condivisa', supermarketId: null, sortOrder: 0, archivedAt: null,
        shared: { uid: 'l', owner: 'a', repo: 'r', branch: 'main', path: 'lista.json', me: 'm', canWrite: true, members: {}, tombstones: {} },
      },
      { id: 2, name: 'Mia', supermarketId: null, sortOrder: 1, archivedAt: null },
    ])
    await db.listItems.bulkAdd([
      { listId: 1, itemId: 1, quantity: 1, addedAt: 1, uid: 'v1' },
      { listId: 2, itemId: 1, quantity: 1, addedAt: 1 },
    ])
    await deleteItem(1)
    expect(await db.listItems.count()).toBe(0)
    expect(await db.items.count()).toBe(0)
    expect(Object.keys((await db.shoppingLists.get(1))?.shared?.tombstones ?? {})).toEqual(['v1'])
  })
})
