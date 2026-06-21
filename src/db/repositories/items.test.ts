import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { renameItem, moveItemCategory } from './items'

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
