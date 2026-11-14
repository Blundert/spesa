import { describe, it, expect } from 'vitest'
import type { BackupData } from '../db/backup'
import { SEED_CATEGORIES } from '../db/db'
import { backupPath, isInitialData } from './syncBackup'

function initial(): BackupData {
  return {
    version: 8,
    exportedAt: 0,
    categories: SEED_CATEGORIES.map((c, i) => ({ ...c, id: i + 1 })),
    items: [],
    supermarkets: [],
    weekBudgets: [],
    listItems: [],
    sessions: [],
    purchases: [],
    mealPlans: [],
    dishes: [],
    dishIngredients: [],
    shoppingLists: [{ id: 1, name: 'Spesa', supermarketId: null, sortOrder: 0, archivedAt: null }],
  }
}

describe('backupPath', () => {
  it('toglie ":" e "." dal timestamp', () => {
    expect(backupPath('2026-11-14T18:52:11.440Z', 'remote')).toBe('backups/2026-11-14T18-52-11-440Z-remote.json')
    expect(backupPath('2026-11-14T18:52:11.440Z', 'local')).toBe('backups/2026-11-14T18-52-11-440Z-local.json')
  })
})

describe('isInitialData', () => {
  it('riconosce i dati iniziali', () => {
    expect(isInitialData(initial())).toBe(true)
  })

  it('accetta backup vecchi senza piatti né liste', () => {
    const d = initial()
    delete d.dishes
    delete d.dishIngredients
    delete d.shoppingLists
    expect(isInitialData(d)).toBe(true)
  })

  it.each(['items', 'supermarkets', 'weekBudgets', 'listItems', 'sessions', 'purchases', 'mealPlans'] as const)(
    'non è iniziale se %s ha righe',
    (table) => {
      const d = initial()
      ;(d[table] as unknown[]).push({ id: 1 })
      expect(isInitialData(d)).toBe(false)
    },
  )

  it('non è iniziale se ci sono piatti o ingredienti', () => {
    const a = initial()
    a.dishes = [{ id: 1, name: 'x', normalizedName: 'x' }]
    expect(isInitialData(a)).toBe(false)
    const b = initial()
    b.dishIngredients = [{ id: 1, dishId: 1, itemId: 1 }]
    expect(isInitialData(b)).toBe(false)
  })

  it('non è iniziale se le categorie sono state modificate', () => {
    const a = initial()
    a.categories = a.categories.slice(1)
    expect(isInitialData(a)).toBe(false)
    const b = initial()
    b.categories[0] = { ...b.categories[0], name: 'Altro nome' }
    expect(isInitialData(b)).toBe(false)
  })

  it('non è iniziale se le liste sono state toccate', () => {
    const a = initial()
    a.shoppingLists = [{ id: 1, name: 'Casa', supermarketId: null, sortOrder: 0, archivedAt: null }]
    expect(isInitialData(a)).toBe(false)
    const b = initial()
    b.shoppingLists![0].supermarketId = 2
    expect(isInitialData(b)).toBe(false)
    const c = initial()
    c.shoppingLists![0].archivedAt = 5
    expect(isInitialData(c)).toBe(false)
    const d = initial()
    d.shoppingLists!.push({ id: 2, name: 'Altra', supermarketId: null, sortOrder: 1, archivedAt: null })
    expect(isInitialData(d)).toBe(false)
  })
})
