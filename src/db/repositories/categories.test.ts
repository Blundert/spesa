import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  getCategories,
  getCategoryById,
  addCategory,
  renameCategory,
  deleteCategory,
} from './categories'

async function clearAll() {
  await db.categories.clear()
  await db.items.clear()
}

async function seed() {
  await db.categories.bulkAdd([
    { id: 1, name: 'Frigo', sortOrder: 0 },
    { id: 2, name: 'Dispensa', sortOrder: 1 },
  ])
}

beforeEach(async () => {
  await clearAll()
})

describe('getCategories', () => {
  it('restituisce array vuoto senza dati', async () => {
    expect(await getCategories()).toEqual([])
  })
  it('restituisce categorie ordinate per sortOrder', async () => {
    await db.categories.bulkAdd([
      { id: 10, name: 'Z', sortOrder: 2 },
      { id: 11, name: 'A', sortOrder: 0 },
      { id: 12, name: 'M', sortOrder: 1 },
    ])
    const cats = await getCategories()
    expect(cats.map((c) => c.name)).toEqual(['A', 'M', 'Z'])
  })
})

describe('getCategoryById', () => {
  it('ritorna la categoria se trovata', async () => {
    await seed()
    const cat = await getCategoryById(1)
    expect(cat?.name).toBe('Frigo')
  })
  it('ritorna undefined se non trovata', async () => {
    expect(await getCategoryById(999)).toBeUndefined()
  })
})

describe('addCategory', () => {
  it('crea una categoria con sortOrder = max + 1', async () => {
    await seed() // sortOrder max = 1
    const id = await addCategory('Bevande')
    const cat = await getCategoryById(id)
    expect(cat?.name).toBe('Bevande')
    expect(cat?.sortOrder).toBe(2)
  })
  it('su DB vuoto usa sortOrder 0', async () => {
    const id = await addCategory('Prima')
    const cat = await getCategoryById(id)
    expect(cat?.sortOrder).toBe(0)
  })
  it('fa trim del nome', async () => {
    const id = await addCategory('  Frutta  ')
    const cat = await getCategoryById(id)
    expect(cat?.name).toBe('Frutta')
  })
})

describe('renameCategory', () => {
  it('aggiorna il nome della categoria', async () => {
    await seed()
    await renameCategory(1, 'Frigorifero')
    const cat = await getCategoryById(1)
    expect(cat?.name).toBe('Frigorifero')
  })
  it('fa trim del nome', async () => {
    await seed()
    await renameCategory(1, '  Frigo  ')
    expect((await getCategoryById(1))?.name).toBe('Frigo')
  })
})

describe('deleteCategory', () => {
  it('elimina una categoria senza articoli', async () => {
    await seed()
    await deleteCategory(1)
    expect(await getCategoryById(1)).toBeUndefined()
  })
  it('lancia errore se la categoria ha articoli', async () => {
    await seed()
    await db.items.add({
      name: 'Latte',
      normalizedName: 'latte',
      categoryId: 1,
      lastPriceCents: null,
      suggestedPriceCents: null,
    })
    await expect(deleteCategory(1)).rejects.toThrow('category.hasItems')
  })
})
