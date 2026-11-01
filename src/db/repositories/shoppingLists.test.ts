import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  LAST_ACTIVE_LIST,
  archiveShoppingList,
  createShoppingList,
  deleteShoppingList,
  getListItemCounts,
  getShoppingLists,
  getUsualItems,
  reorderShoppingLists,
  restoreShoppingList,
  updateShoppingList,
} from './shoppingLists'

beforeEach(async () => {
  await Promise.all([db.shoppingLists.clear(), db.listItems.clear(), db.sessions.clear(), db.purchases.clear()])
})

describe('createShoppingList / getShoppingLists', () => {
  it('crea in fondo all’ordine, con nome ripulito', async () => {
    const a = await createShoppingList('  Spesa ', null)
    const b = await createShoppingList('Casa', 3)
    const lists = await getShoppingLists()
    expect(lists.map((l) => l.id)).toEqual([a, b])
    expect(lists[0]).toMatchObject({ name: 'Spesa', supermarketId: null, sortOrder: 0, archivedAt: null })
    expect(lists[1]).toMatchObject({ name: 'Casa', supermarketId: 3, sortOrder: 1 })
  })

  it('a parità di ordine usa l’id', async () => {
    await db.shoppingLists.bulkAdd([
      { id: 2, name: 'B', supermarketId: null, sortOrder: 0, archivedAt: null },
      { id: 1, name: 'A', supermarketId: null, sortOrder: 0, archivedAt: null },
    ])
    expect((await getShoppingLists()).map((l) => l.name)).toEqual(['A', 'B'])
  })
})

describe('updateShoppingList', () => {
  it('rinomina (ripulendo il nome) e cambia supermercato', async () => {
    const id = await createShoppingList('Casa', null)
    await updateShoppingList(id, { name: ' Detersivi ' })
    await updateShoppingList(id, { supermarketId: 7 })
    expect(await db.shoppingLists.get(id)).toMatchObject({ name: 'Detersivi', supermarketId: 7 })
  })

  it('salva la spesa solita e i chip scelti a mano, e li toglie tornando ad automatico', async () => {
    const id = await createShoppingList('Casa', null)
    await updateShoppingList(id, { usualItemIds: [3, 1], quickItemIds: [2] })
    expect(await db.shoppingLists.get(id)).toMatchObject({ usualItemIds: [3, 1], quickItemIds: [2] })

    await updateShoppingList(id, { usualItemIds: undefined, quickItemIds: undefined })
    const list = await db.shoppingLists.get(id)
    expect(list).toBeDefined()
    expect('usualItemIds' in (list ?? {})).toBe(false)
    expect('quickItemIds' in (list ?? {})).toBe(false)
  })

  it('un aggiornamento senza questi campi non li tocca', async () => {
    const id = await createShoppingList('Casa', null)
    await updateShoppingList(id, { usualItemIds: [4] })
    await updateShoppingList(id, { name: 'Casa nuova' })
    expect(await db.shoppingLists.get(id)).toMatchObject({ name: 'Casa nuova', usualItemIds: [4] })
  })
})

describe('archivio', () => {
  it('archivia e ripristina tenendo i prodotti', async () => {
    const a = await createShoppingList('Spesa', null)
    const b = await createShoppingList('Festa', null)
    await db.listItems.add({ listId: b, itemId: 1, quantity: 2, addedAt: 0 })

    await archiveShoppingList(b)
    expect((await db.shoppingLists.get(b))?.archivedAt).toEqual(expect.any(Number))
    expect(await db.listItems.where('listId').equals(b).count()).toBe(1)

    await restoreShoppingList(b)
    expect((await db.shoppingLists.get(b))?.archivedAt).toBeNull()
    expect((await db.shoppingLists.get(a))?.archivedAt).toBeNull()
  })

  it('non archivia l’ultima lista attiva', async () => {
    const a = await createShoppingList('Spesa', null)
    const b = await createShoppingList('Festa', null)
    await archiveShoppingList(b)
    await expect(archiveShoppingList(a)).rejects.toThrow(LAST_ACTIVE_LIST)
  })
})

describe('deleteShoppingList', () => {
  it('elimina la lista e le sue voci, le spese restano', async () => {
    const a = await createShoppingList('Spesa', null)
    const b = await createShoppingList('Festa', null)
    await db.listItems.bulkAdd([
      { listId: a, itemId: 1, quantity: 1, addedAt: 0 },
      { listId: b, itemId: 1, quantity: 1, addedAt: 0 },
    ])
    await db.sessions.add({
      isoWeek: '2026-10-26', supermarketId: 1, listId: b, startedAt: 0, finishedAt: 1,
      confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800,
    })

    await archiveShoppingList(b)
    await deleteShoppingList(b)

    expect(await db.shoppingLists.get(b)).toBeUndefined()
    expect(await db.listItems.where('listId').equals(b).count()).toBe(0)
    expect(await db.listItems.where('listId').equals(a).count()).toBe(1)
    expect(await db.sessions.count()).toBe(1)
  })

  it('non elimina l’ultima lista attiva', async () => {
    const a = await createShoppingList('Spesa', null)
    await expect(deleteShoppingList(a)).rejects.toThrow(LAST_ACTIVE_LIST)
  })
})

describe('reorderShoppingLists', () => {
  it('applica l’ordine degli id', async () => {
    const a = await createShoppingList('A', null)
    const b = await createShoppingList('B', null)
    const c = await createShoppingList('C', null)
    await reorderShoppingLists([c, a, b])
    expect((await getShoppingLists()).map((l) => l.name)).toEqual(['C', 'A', 'B'])
  })
})

describe('getUsualItems', () => {
  it('conta le quantità comprate solo nelle spese della lista', async () => {
    const base = { isoWeek: '2026-10-26', supermarketId: 1, startedAt: 0, finishedAt: 1, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 }
    const s1 = (await db.sessions.add({ ...base, listId: 1 })) as number
    const s2 = (await db.sessions.add({ ...base, listId: 1 })) as number
    const s3 = (await db.sessions.add({ ...base, listId: 2 })) as number
    await db.purchases.bulkAdd([
      { sessionId: s1, itemId: 10, priceCents: 100, quantity: 1 },
      { sessionId: s2, itemId: 10, priceCents: 100, quantity: 2 },
      { sessionId: s1, itemId: 20, priceCents: 100, quantity: 3 },
      { sessionId: s2, itemId: 5, priceCents: 100, quantity: 3 },
      { sessionId: s3, itemId: 30, priceCents: 100, quantity: 9 },
    ])
    expect(await getUsualItems(1)).toEqual([
      { itemId: 5, count: 3 },
      { itemId: 10, count: 3 },
      { itemId: 20, count: 3 },
    ])
  })

  it('senza spese restituisce vuoto', async () => {
    expect(await getUsualItems(1)).toEqual([])
  })
})

describe('getListItemCounts', () => {
  it('conta le voci di ogni lista', async () => {
    await db.listItems.bulkAdd([
      { listId: 1, itemId: 1, quantity: 3, addedAt: 0 },
      { listId: 1, itemId: 2, quantity: 1, addedAt: 0 },
      { listId: 2, itemId: 1, quantity: 1, addedAt: 0 },
    ])
    expect(await getListItemCounts()).toEqual({ 1: 2, 2: 1 })
  })
})
