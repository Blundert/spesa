import { describe, it, expect } from 'vitest'
import type { BackupData } from '../db/backup'
import { TABLE_NAMES, countChanges, diffBackups, toRows } from './backupDiff'

function base(): BackupData {
  return {
    version: 8,
    exportedAt: 1,
    categories: [
      { id: 1, name: 'Frutta', sortOrder: 0 },
      { id: 2, name: 'Frigo', sortOrder: 1 },
    ],
    items: [
      { id: 1, name: 'Mele', normalizedName: 'mele', categoryId: 1, lastPriceCents: 100, suggestedPriceCents: 100, purchaseCount: 1 },
      { id: 2, name: 'Latte', normalizedName: 'latte', categoryId: 2, lastPriceCents: null, suggestedPriceCents: null },
    ],
    supermarkets: [
      { id: 1, name: 'Lidl', normalizedName: 'lidl', loyaltyCard: 'data:image/jpeg;base64,AAA' },
      { id: 2, name: 'Pam', normalizedName: 'pam' },
    ],
    weekBudgets: [{ id: 1, isoWeek: '2026-11-07', buoniAvailable: 3 }],
    shoppingLists: [
      { id: 1, name: 'Spesa', supermarketId: 1, sortOrder: 0, archivedAt: null, usualItemIds: [2, 1], quickItemIds: [1] },
      { id: 2, name: 'Casa', supermarketId: null, sortOrder: 1, archivedAt: null },
    ],
    listItems: [{ id: 1, listId: 1, itemId: 1, quantity: 2, addedAt: 50 }],
    sessions: [
      { id: 1, isoWeek: '2026-11-07', supermarketId: 1, listId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: 500, buoniSpent: 1, buoniValueCents: 800 },
      { id: 2, isoWeek: '2026-11-07', supermarketId: 2, startedAt: 3000, finishedAt: null, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 },
    ],
    purchases: [
      { id: 1, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 2, sessionId: 1, itemId: 2, priceCents: 90, quantity: 2 },
    ],
    mealPlans: [
      { id: 1, isoWeek: '2026-11-07', dayIndex: 0, mealType: 0, dish: 'Pasta', dishId: 1, selectedItemIds: [2, 1] },
      { id: 2, isoWeek: '2026-11-07', dayIndex: 1, mealType: 1, dish: 'Fuori' },
    ],
    dishes: [{ id: 1, name: 'Pasta', normalizedName: 'pasta' }],
    dishIngredients: [{ id: 1, dishId: 1, itemId: 2 }],
  }
}

const empty = () => ({ added: [], removed: [], modified: [] })

describe('diffBackups', () => {
  it('backup identici: nessuna differenza', () => {
    const d = diffBackups(base(), base())
    expect(countChanges(d)).toBe(0)
    for (const t of TABLE_NAMES) expect(d[t]).toEqual(empty())
  })

  it('gli id diversi non contano: si abbina per chiave naturale', () => {
    const b = base()
    b.items = b.items.map((i) => ({ ...i, id: (i.id as number) + 100 }))
    b.purchases = b.purchases.map((p) => ({ ...p, itemId: p.itemId + 100 }))
    b.listItems = b.listItems.map((l) => ({ ...l, itemId: l.itemId + 100 }))
    b.dishIngredients = b.dishIngredients!.map((d) => ({ ...d, itemId: d.itemId + 100 }))
    b.mealPlans[0].selectedItemIds = [102, 101]
    b.shoppingLists![0].usualItemIds = [102, 101]
    b.shoppingLists![0].quickItemIds = [101]
    expect(countChanges(diffBackups(base(), b))).toBe(0)
  })

  it('le statistiche degli articoli non sono differenze', () => {
    const b = base()
    b.items[0] = { ...b.items[0], lastPriceCents: 999, suggestedPriceCents: 1, purchaseCount: 50 }
    expect(countChanges(diffBackups(base(), b))).toBe(0)
  })

  it('una settimana persa: aggiunti/rimossi per tabella', () => {
    const a = base()
    const b = base()
    b.weekBudgets = []
    b.sessions = b.sessions.filter((s) => s.id !== 2)
    b.mealPlans = b.mealPlans.filter((m) => m.id !== 2)
    const d = diffBackups(a, b)
    expect(d.weekBudgets.removed.map((r) => r.key)).toEqual(['2026-11-07'])
    expect(d.sessions.removed.map((r) => [r.key, r.label])).toEqual([['3000', 'Pam']])
    expect(d.mealPlans.removed.map((r) => r.label)).toEqual(['Fuori'])
    expect(d.sessions.added).toEqual([])
    // al contrario sono "aggiunti"
    expect(diffBackups(b, a).sessions.added.map((r) => r.key)).toEqual(['3000'])
  })

  it('campi modificati, con valore prima e dopo', () => {
    const b = base()
    b.categories[0].sortOrder = 5
    b.items[0].categoryId = 2
    b.supermarkets[0].loyaltyCard = 'altra'
    b.weekBudgets[0].buoniAvailable = 4
    b.sessions[0].confirmedTotalCents = 600
    b.purchases[0].priceCents = 120
    b.mealPlans[0].dish = 'Pasta al pomodoro'
    b.listItems[0].quantity = 3
    b.shoppingLists![0].archivedAt = 9
    b.dishes![0].name = 'Pasta!'
    const d = diffBackups(base(), b)
    expect(d.categories.modified[0].changes).toEqual([{ field: 'sortOrder', from: 0, to: 5 }])
    expect(d.items.modified[0]).toMatchObject({ label: 'Mele', changes: [{ field: 'category', from: 'Frutta', to: 'Frigo' }] })
    expect(d.supermarkets.modified[0].changes[0]).toMatchObject({ field: 'loyaltyCard' })
    expect(d.weekBudgets.modified[0].changes).toEqual([{ field: 'buoniAvailable', from: 3, to: 4 }])
    expect(d.sessions.modified[0].changes).toEqual([{ field: 'confirmedTotalCents', from: 500, to: 600 }])
    expect(d.purchases.modified[0].changes).toEqual([{ field: 'priceCents', from: 100, to: 120 }])
    expect(d.mealPlans.modified[0].changes).toEqual([{ field: 'dish', from: 'Pasta', to: 'Pasta al pomodoro' }])
    expect(d.listItems.modified[0].changes).toEqual([{ field: 'quantity', from: 2, to: 3 }])
    expect(d.shoppingLists.modified[0].changes).toEqual([{ field: 'archivedAt', from: null, to: 9 }])
    expect(d.dishes.modified[0].changes).toEqual([{ field: 'name', from: 'Pasta', to: 'Pasta!' }])
    expect(countChanges(d)).toBe(10)
  })

  it('articoli scelti per un pasto: l’ordine non conta, il contenuto sì', () => {
    const b = base()
    b.mealPlans[0].selectedItemIds = [1]
    expect(diffBackups(base(), b).mealPlans.modified[0].changes[0].field).toBe('selectedItems')
  })

  it('chip e spesa solita: l’ordine conta', () => {
    const b = base()
    b.shoppingLists![0].usualItemIds = [1, 2]
    expect(diffBackups(base(), b).shoppingLists.modified[0].changes[0].field).toBe('usualItems')
  })

  it('record con la stessa chiave ripetuta restano distinti', () => {
    const a = base()
    const b = base()
    b.purchases.push({ id: 9, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 })
    const d = diffBackups(a, b)
    expect(d.purchases.added.map((r) => r.key)).toEqual(['1000|mele#2'])
  })

  it('backup vecchi senza piatti né liste', () => {
    const old = base()
    delete old.dishes
    delete old.dishIngredients
    delete old.shoppingLists
    old.sessions = old.sessions.map((s) => ({ ...s, listId: undefined }))
    old.listItems = []
    old.mealPlans = old.mealPlans.map((m) => ({ ...m, dishId: undefined, selectedItemIds: undefined }))
    const d = diffBackups(old, base())
    expect(d.dishes.added).toHaveLength(1)
    expect(d.dishIngredients.added).toHaveLength(1)
    expect(d.shoppingLists.added).toHaveLength(2)
  })
})

describe('toRows', () => {
  it('riferimenti spezzati diventano #id', () => {
    const b = base()
    b.purchases.push({ id: 5, sessionId: 77, itemId: 88, priceCents: 1, quantity: 1 })
    b.dishIngredients!.push({ id: 6, dishId: 66, itemId: 2 })
    const rows = toRows(b)
    const broken = rows.purchases.find((r) => r.fields.priceCents === 1)
    expect(broken).toMatchObject({ key: '#77|#88', label: '#88' })
    expect(rows.dishIngredients.at(-1)).toMatchObject({ key: '#66|latte', label: '#66 · Latte' })
  })

  it('etichette leggibili', () => {
    const rows = toRows(base())
    expect(rows.dishIngredients[0].label).toBe('Pasta · Latte')
    expect(rows.listItems[0]).toMatchObject({ key: 'Spesa|mele', label: 'Mele' })
    expect(rows.sessions[1].fields.list).toBeNull()
    expect(rows.shoppingLists[1].fields).toMatchObject({ supermarket: null, usualItems: null, quickItems: null })
    expect(rows.shoppingLists[0].fields).toMatchObject({ supermarket: 'Lidl', usualItems: 'latte|mele', quickItems: 'mele' })
    expect(rows.supermarkets[1].fields.loyaltyCard).toBeNull()
  })
})
