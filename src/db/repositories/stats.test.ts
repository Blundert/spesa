import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { getStats } from './stats'

const WEEK = '2026-06-22' // lunedì 22 giugno 2026 (confermato: giu 23 è martedì)
const WEEK_TS = Date.UTC(2026, 5, 22) // lunedì 22 giugno 2026 00:00 UTC

async function clearAll() {
  await db.sessions.clear()
  await db.purchases.clear()
  await db.items.clear()
  await db.categories.clear()
  await db.supermarkets.clear()
}

beforeEach(async () => {
  await clearAll()
})

describe('getStats — stato vuoto', () => {
  it('restituisce zero quando non ci sono sessioni', async () => {
    const result = await getStats(WEEK, 0, null)
    expect(result.totalCents).toBe(0)
    expect(result.sessionCount).toBe(0)
    expect(result.avgCents).toBe(0)
    expect(result.topSupermarketName).toBeNull()
    expect(result.topItems).toHaveLength(0)
    expect(result.categoryBreakdown).toHaveLength(0)
    expect(result.weeklyTotals).toHaveLength(1)
    expect(result.weeklyTotals.every((w) => w.totalCents === 0)).toBe(true)
  })
})

describe('getStats — sessioni finite', () => {
  it('ignora le sessioni non finite', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 1,
      startedAt: 1000,
      finishedAt: null, // non finita
      confirmedTotalCents: null,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    const result = await getStats(WEEK, 0, null)
    expect(result.sessionCount).toBe(0)
  })

  it('usa confirmedTotalCents se disponibile', async () => {
    await db.supermarkets.add({ id: 1, name: 'Lidl', normalizedName: 'lidl' })
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 1,
      startedAt: 1000,
      finishedAt: 2000,
      confirmedTotalCents: 5000,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    const result = await getStats(WEEK, 0, null)
    expect(result.totalCents).toBe(5000)
    expect(result.sessionCount).toBe(1)
    expect(result.avgCents).toBe(5000)
  })

  it('restituisce 0 per sessione senza acquisti e senza confirmedTotalCents', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 1,
      startedAt: 1000,
      finishedAt: 2000,
      confirmedTotalCents: null,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    // Nessun acquisto → purchasesBySession.get(1) è undefined → ?? [] → reduce → 0
    const result = await getStats(WEEK, 0, null)
    expect(result.totalCents).toBe(0)
    expect(result.sessionCount).toBe(1)
  })

  it('calcola il totale dagli acquisti se confirmedTotalCents è null', async () => {
    await db.supermarkets.add({ id: 1, name: 'Esselunga', normalizedName: 'esselunga' })
    await db.categories.add({ id: 1, name: 'Frigo', sortOrder: 1 })
    await db.items.add({ id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 1,
      startedAt: 1000,
      finishedAt: 2000,
      confirmedTotalCents: null,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    await db.purchases.add({ id: 1, sessionId: 1, itemId: 1, priceCents: 200, quantity: 3 })
    const result = await getStats(WEEK, 0, null)
    expect(result.totalCents).toBe(600)
    expect(result.avgCents).toBe(600)
  })

  it('individua il supermercato più frequentato', async () => {
    await db.supermarkets.bulkAdd([
      { id: 1, name: 'Coop', normalizedName: 'coop' },
      { id: 2, name: 'Lidl', normalizedName: 'lidl' },
    ])
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: WEEK, supermarketId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: 1000, buoniSpent: 0, buoniValueCents: 800 },
      { id: 2, isoWeek: WEEK, supermarketId: 1, startedAt: 3000, finishedAt: 4000, confirmedTotalCents: 1000, buoniSpent: 0, buoniValueCents: 800 },
      { id: 3, isoWeek: WEEK, supermarketId: 2, startedAt: 5000, finishedAt: 6000, confirmedTotalCents: 1000, buoniSpent: 0, buoniValueCents: 800 },
    ])
    const result = await getStats(WEEK, 0, null)
    expect(result.topSupermarketName).toBe('Coop')
  })

  it('supermercato top è null se non ci sono sessioni finite', async () => {
    const result = await getStats(WEEK, 0, null)
    expect(result.topSupermarketName).toBeNull()
  })

  it('supermercato top è null se id non trovato nei supermarkets', async () => {
    // Sessione finita con supermarketId che non esiste nei supermarkets
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 99,
      startedAt: 1000,
      finishedAt: 2000,
      confirmedTotalCents: 1000,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    const result = await getStats(WEEK, 0, null)
    expect(result.topSupermarketName).toBeNull()
  })

  it('esclude sessioni fuori dal range fromTs', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    const oldTs = Date.UTC(2026, 0, 1) // 1 gennaio 2026 (fuori range)
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: '2026-01-01', supermarketId: 1, startedAt: oldTs, finishedAt: oldTs + 1000, confirmedTotalCents: 9999, buoniSpent: 0, buoniValueCents: 800 },
      { id: 2, isoWeek: WEEK, supermarketId: 1, startedAt: WEEK_TS, finishedAt: WEEK_TS + 1000, confirmedTotalCents: 1000, buoniSpent: 0, buoniValueCents: 800 },
    ])
    // fromTs = WEEK_TS → esclude la sessione di gennaio
    const result = await getStats(WEEK, 0, WEEK_TS)
    expect(result.sessionCount).toBe(1)
    expect(result.totalCents).toBe(1000)
  })
})

describe('getStats — weeklyTotals', () => {
  it('include la settimana corrente con i suoi totali', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.sessions.add({
      id: 1,
      isoWeek: WEEK,
      supermarketId: 1,
      startedAt: WEEK_TS,
      finishedAt: WEEK_TS + 1000,
      confirmedTotalCents: 3500,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    const result = await getStats(WEEK, 0, null)
    const currentWeekEntry = result.weeklyTotals.find((w) => w.weekKey === WEEK)
    expect(currentWeekEntry?.totalCents).toBe(3500)
  })

  it('genera griglia dalla prima sessione alla corrente (fromTs=null), o da fromTs', async () => {
    // Nessuna sessione → 1 settimana (solo corrente)
    const r1 = await getStats(WEEK, 0, null)
    expect(r1.weeklyTotals).toHaveLength(1)
    expect(r1.weeklyTotals[0].weekKey).toBe(WEEK)

    // Con fromTs al 25 maggio 2026 (lunedì) → 5 settimane fino al 22 giugno
    const fromTs = Date.UTC(2026, 4, 25) // 2026-05-25
    const r2 = await getStats(WEEK, 0, fromTs)
    expect(r2.weeklyTotals).toHaveLength(5)
    expect(r2.weeklyTotals[0].weekKey).toBe('2026-05-25')
    expect(r2.weeklyTotals[4].weekKey).toBe(WEEK)
  })

  it('re-bucket sessione in base a startedAt e weekStartDay corrente', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    // Sessione salvata con isoWeek='2026-06-13' (sabato precedente) ma startedAt
    // cade il sabato 20 giugno → con weekStartDay=5 (sab) deve apparire in '2026-06-20',
    // non in '2026-06-13' (che era la chiave salvata con un vecchio weekStartDay)
    const satTs = Date.UTC(2026, 5, 20) // sabato 20 giugno 2026 (giu 22 è lun → giu 20 è sab)
    await db.sessions.add({
      id: 1,
      isoWeek: '2026-06-13', // chiave "vecchia" — sabato precedente, presente nella griglia
      supermarketId: 1,
      startedAt: satTs,
      finishedAt: satTs + 1000,
      confirmedTotalCents: 5000,
      buoniSpent: 0,
      buoniValueCents: 800,
    })
    const result = await getStats('2026-06-20', 5, null)
    // Deve apparire alla settimana corretta (sabato 20)
    const correctEntry = result.weeklyTotals.find((w) => w.weekKey === '2026-06-20')
    expect(correctEntry?.totalCents).toBe(5000)
    // La vecchia isoWeek (sabato 13) non è nella griglia (non c'è sessione così vecchia)
    const wrongEntry = result.weeklyTotals.find((w) => w.weekKey === '2026-06-13')
    expect(wrongEntry?.totalCents ?? 0).toBe(0)
  })
})

describe('getStats — topItems', () => {
  it('restituisce i 5 articoli più acquistati nel periodo', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.categories.add({ id: 1, name: 'Dispensa', sortOrder: 2 })
    await db.items.bulkAdd([
      { id: 1, name: 'A', normalizedName: 'a', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 2, name: 'B', normalizedName: 'b', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 3, name: 'C', normalizedName: 'c', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 4, name: 'D', normalizedName: 'd', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 5, name: 'E', normalizedName: 'e', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 6, name: 'F', normalizedName: 'f', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
    ])
    await db.sessions.add({
      id: 1, isoWeek: WEEK, supermarketId: 1, startedAt: WEEK_TS, finishedAt: WEEK_TS + 1000,
      confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800,
    })
    // A: 5 acquisti, C: 4, E: 3, B: 2, D: 1, F: 0
    await db.purchases.bulkAdd([
      { id: 1, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 2, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 3, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 4, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 5, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 },
      { id: 6, sessionId: 1, itemId: 3, priceCents: 100, quantity: 1 },
      { id: 7, sessionId: 1, itemId: 3, priceCents: 100, quantity: 1 },
      { id: 8, sessionId: 1, itemId: 3, priceCents: 100, quantity: 1 },
      { id: 9, sessionId: 1, itemId: 3, priceCents: 100, quantity: 1 },
      { id: 10, sessionId: 1, itemId: 5, priceCents: 100, quantity: 1 },
      { id: 11, sessionId: 1, itemId: 5, priceCents: 100, quantity: 1 },
      { id: 12, sessionId: 1, itemId: 5, priceCents: 100, quantity: 1 },
      { id: 13, sessionId: 1, itemId: 2, priceCents: 100, quantity: 1 },
      { id: 14, sessionId: 1, itemId: 2, priceCents: 100, quantity: 1 },
      { id: 15, sessionId: 1, itemId: 4, priceCents: 100, quantity: 1 },
    ])
    const result = await getStats(WEEK, 0, null)
    expect(result.topItems).toHaveLength(5)
    expect(result.topItems[0].name).toBe('A')
    expect(result.topItems[0].purchaseCount).toBe(5)
    expect(result.topItems[1].name).toBe('C')
    expect(result.topItems[1].purchaseCount).toBe(4)
  })

  it('esclude articoli senza acquisti nel periodo', async () => {
    await db.categories.add({ id: 1, name: 'Dispensa', sortOrder: 2 })
    // Articolo presente ma nessuna sessione/acquisto → non appare
    await db.items.add({ id: 1, name: 'Nuovo', normalizedName: 'nuovo', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    const result = await getStats(WEEK, 0, null)
    expect(result.topItems).toHaveLength(0)
  })

  it('esclude acquisti di sessioni fuori dal range fromTs', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.categories.add({ id: 1, name: 'Dispensa', sortOrder: 2 })
    await db.items.add({ id: 1, name: 'Pasta', normalizedName: 'pasta', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    const oldTs = Date.UTC(2026, 0, 1)
    await db.sessions.add({
      id: 1, isoWeek: '2026-01-01', supermarketId: 1, startedAt: oldTs, finishedAt: oldTs + 1000,
      confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800,
    })
    await db.purchases.add({ id: 1, sessionId: 1, itemId: 1, priceCents: 100, quantity: 1 })
    // fromTs esclude la sessione di gennaio → topItems vuoto
    const result = await getStats(WEEK, 0, WEEK_TS)
    expect(result.topItems).toHaveLength(0)
  })
})

describe('getStats — categoryBreakdown', () => {
  it('raggruppa gli acquisti per categoria', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.categories.bulkAdd([
      { id: 1, name: 'Frigo', sortOrder: 1 },
      { id: 2, name: 'Dispensa', sortOrder: 2 },
    ])
    await db.items.bulkAdd([
      { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null },
      { id: 2, name: 'Pasta', normalizedName: 'pasta', categoryId: 2, lastPriceCents: null, suggestedPriceCents: null },
    ])
    await db.sessions.add({ id: 1, isoWeek: WEEK, supermarketId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 })
    await db.purchases.bulkAdd([
      { id: 1, sessionId: 1, itemId: 1, priceCents: 150, quantity: 2 }, // Frigo: 300
      { id: 2, sessionId: 1, itemId: 2, priceCents: 100, quantity: 1 }, // Dispensa: 100
    ])
    const result = await getStats(WEEK, 0, null)
    expect(result.categoryBreakdown).toHaveLength(2)
    expect(result.categoryBreakdown[0].name).toBe('Frigo')
    expect(result.categoryBreakdown[0].totalCents).toBe(300)
    expect(result.categoryBreakdown[1].name).toBe('Dispensa')
    expect(result.categoryBreakdown[1].totalCents).toBe(100)
  })

  it('usa "Altro" per item con categoria sconosciuta', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.items.add({ id: 1, name: 'X', normalizedName: 'x', categoryId: 99, lastPriceCents: null, suggestedPriceCents: null })
    await db.sessions.add({ id: 1, isoWeek: WEEK, supermarketId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 })
    await db.purchases.add({ id: 1, sessionId: 1, itemId: 1, priceCents: 200, quantity: 1 })
    const result = await getStats(WEEK, 0, null)
    expect(result.categoryBreakdown[0].name).toBe('Altro')
  })

  it('usa catId 0 per acquisti con itemId non presente negli item', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.sessions.add({ id: 1, isoWeek: WEEK, supermarketId: 1, startedAt: 1000, finishedAt: 2000, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 })
    // itemId: 999 non esiste in items → itemCategoryMap.get(999) === undefined → ?? 0
    await db.purchases.add({ id: 1, sessionId: 1, itemId: 999, priceCents: 100, quantity: 1 })
    const result = await getStats(WEEK, 0, null)
    expect(result.categoryBreakdown).toHaveLength(1)
    expect(result.categoryBreakdown[0].totalCents).toBe(100)
  })

  it('esclude acquisti di sessioni fuori dal range fromTs', async () => {
    await db.supermarkets.add({ id: 1, name: 'Coop', normalizedName: 'coop' })
    await db.categories.add({ id: 1, name: 'Frigo', sortOrder: 1 })
    await db.items.add({ id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1, lastPriceCents: null, suggestedPriceCents: null })
    const oldTs = Date.UTC(2026, 0, 1)
    await db.sessions.bulkAdd([
      { id: 1, isoWeek: '2026-01-01', supermarketId: 1, startedAt: oldTs, finishedAt: oldTs + 1000, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 },
      { id: 2, isoWeek: WEEK, supermarketId: 1, startedAt: WEEK_TS, finishedAt: WEEK_TS + 1000, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 },
    ])
    await db.purchases.bulkAdd([
      { id: 1, sessionId: 1, itemId: 1, priceCents: 500, quantity: 1 }, // fuori range
      { id: 2, sessionId: 2, itemId: 1, priceCents: 200, quantity: 1 }, // in range
    ])
    const result = await getStats(WEEK, 0, WEEK_TS)
    expect(result.categoryBreakdown).toHaveLength(1)
    expect(result.categoryBreakdown[0].totalCents).toBe(200)
  })
})
