import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import {
  rangeToFromTs,
  getSupermarketStats,
  getDayOfWeekPattern,
  getCategoryEvolution,
  getBudgetEfficiency,
} from './statsExtended'
import type { Session } from '../types'

const NOW_WEEK = '2026-06-22' // lunedì
const day = (d: number, h = 12) => Date.UTC(2026, 5, d, h) // giugno 2026

let nextId = 1
async function addSession(over: Partial<Session> & { startedAt: number }): Promise<number> {
  const id = nextId++
  await db.sessions.add({
    id,
    isoWeek: NOW_WEEK,
    supermarketId: 1,
    finishedAt: over.startedAt + 1000,
    confirmedTotalCents: null,
    buoniSpent: 0,
    buoniValueCents: 800,
    ...over,
  })
  return id
}

async function addPurchase(sessionId: number, itemId: number, priceCents: number, quantity = 1) {
  await db.purchases.add({ sessionId, itemId, priceCents, quantity } as never)
}

beforeEach(async () => {
  nextId = 1
  await Promise.all([
    db.sessions.clear(),
    db.purchases.clear(),
    db.items.clear(),
    db.categories.clear(),
    db.supermarkets.clear(),
  ])
  await db.supermarkets.bulkAdd([
    { id: 1, name: 'Coop', normalizedName: 'coop' },
    { id: 2, name: 'Lidl', normalizedName: 'lidl' },
    { id: 3, name: 'Mai visitato', normalizedName: 'mai visitato' },
  ])
})

describe('rangeToFromTs', () => {
  it('null = tutto lo storico', () => {
    expect(rangeToFromTs(NOW_WEEK, null)).toBeNull()
  })

  it('include la settimana corrente e le N-1 precedenti', () => {
    expect(rangeToFromTs(NOW_WEEK, 1)).toBe(Date.UTC(2026, 5, 22))
    expect(rangeToFromTs(NOW_WEEK, 4)).toBe(Date.UTC(2026, 5, 1))
  })
})

describe('getSupermarketStats', () => {
  it('vuoto senza sessioni', async () => {
    expect(await getSupermarketStats(null)).toEqual([])
  })

  it('aggrega per supermercato, ordina per totale e ignora quelli senza spese', async () => {
    // Coop: una spesa confermata (3000), una calcolata dagli acquisti (2×150 = 300), una senza acquisti
    await addSession({ startedAt: day(22), confirmedTotalCents: 3000 })
    const s2 = await addSession({ startedAt: day(16) })
    await addPurchase(s2, 1, 150, 2)
    await addSession({ startedAt: day(10) })
    // Lidl: una spesa da 5000
    await addSession({ startedAt: day(9), supermarketId: 2, confirmedTotalCents: 5000 })
    // Spesa non conclusa: non conta
    await addSession({ startedAt: day(8), finishedAt: null, confirmedTotalCents: 9999 })

    const stats = await getSupermarketStats(null)
    expect(stats.map((s) => s.name)).toEqual(['Lidl', 'Coop'])
    expect(stats[0]).toMatchObject({ sessionCount: 1, totalCents: 5000, avgCents: 5000, lastVisitTs: day(9) })
    expect(stats[1]).toMatchObject({ sessionCount: 3, totalCents: 3300, avgCents: 1100, lastVisitTs: day(22) })
  })

  it('rispetta il filtro fromTs', async () => {
    await addSession({ startedAt: day(2), confirmedTotalCents: 1000 })
    await addSession({ startedAt: day(20), confirmedTotalCents: 2000 })
    const stats = await getSupermarketStats(day(10))
    expect(stats).toHaveLength(1)
    expect(stats[0].totalCents).toBe(2000)
  })
})

describe('getDayOfWeekPattern', () => {
  it('restituisce sempre 7 giorni, lun=0 … dom=6, contando solo le spese concluse', async () => {
    await addSession({ startedAt: day(22) }) // lunedì
    await addSession({ startedAt: day(22, 15) }) // lunedì
    await addSession({ startedAt: day(28) }) // domenica
    await addSession({ startedAt: day(24), finishedAt: null }) // in corso: ignorata
    const p = await getDayOfWeekPattern(null)
    expect(p).toHaveLength(7)
    expect(p.map((d) => d.sessionCount)).toEqual([2, 0, 0, 0, 0, 0, 1])
    expect(p.map((d) => d.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('rispetta il filtro fromTs', async () => {
    await addSession({ startedAt: day(1) })
    await addSession({ startedAt: day(22) })
    const p = await getDayOfWeekPattern(day(15))
    expect(p.reduce((n, d) => n + d.sessionCount, 0)).toBe(1)
  })
})

describe('getCategoryEvolution', () => {
  it('vuoto senza acquisti', async () => {
    expect(await getCategoryEvolution(NOW_WEEK, 0, null)).toEqual([])
  })

  it('totali per categoria e settimana, riempie le settimane vuote fino a quella corrente', async () => {
    await db.categories.bulkAdd([
      { id: 1, name: 'Frigo' },
      { id: 2, name: 'Dispensa' },
    ] as never)
    await db.items.bulkAdd([
      { id: 1, name: 'Latte', normalizedName: 'latte', categoryId: 1 },
      { id: 2, name: 'Pasta', normalizedName: 'pasta', categoryId: 2 },
    ] as never)
    const a = await addSession({ startedAt: day(2) }) // settimana 2026-06-01
    await addPurchase(a, 1, 100, 2)
    await addPurchase(a, 2, 50)
    await addPurchase(a, 1, 30)
    const b = await addSession({ startedAt: day(23) }) // settimana corrente
    await addPurchase(b, 2, 70)
    // acquisto di una spesa non conclusa: ignorato
    const open = await addSession({ startedAt: day(3), finishedAt: null })
    await addPurchase(open, 1, 9999)
    // articolo sconosciuto → categoria di ripiego
    await addPurchase(b, 99, 10)

    const rows = await getCategoryEvolution(NOW_WEEK, 0, null)
    expect(rows.map((r) => r.weekKey)).toEqual([
      '2026-06-01',
      '2026-06-08',
      '2026-06-15',
      '2026-06-22',
    ])
    expect(rows[0].categories).toEqual({ Frigo: 230, Dispensa: 50 })
    expect(rows[1].categories).toEqual({})
    expect(rows[3].categories).toEqual({ Dispensa: 70, Altro: 10 })
  })
})

describe('getBudgetEfficiency', () => {
  it('vuoto senza spese concluse', async () => {
    expect(await getBudgetEfficiency(NOW_WEEK, 0, null)).toEqual([])
  })

  it('separa buoni e di tasca, limita i buoni al totale e riempie le settimane vuote', async () => {
    // 2 buoni × 800 su 2500 → 1600 coperti, 900 di tasca
    await addSession({ startedAt: day(2), confirmedTotalCents: 2500, buoniSpent: 2 })
    // buoni che superano il totale (3 × 800 su 1000) → coperti 1000, di tasca 0
    const s = await addSession({ startedAt: day(23), buoniSpent: 3 })
    await addPurchase(s, 1, 500, 2)

    const rows = await getBudgetEfficiency(NOW_WEEK, 0, null)
    expect(rows.map((r) => r.weekKey)).toEqual(['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22'])
    expect(rows[0]).toEqual({
      weekKey: '2026-06-01',
      totalCents: 2500,
      buoniCoveredCents: 1600,
      outOfPocketCents: 900,
      coveragePercent: 64,
    })
    expect(rows[1]).toEqual({
      weekKey: '2026-06-08',
      totalCents: 0,
      buoniCoveredCents: 0,
      outOfPocketCents: 0,
      coveragePercent: 0,
    })
    expect(rows[3]).toMatchObject({ totalCents: 1000, buoniCoveredCents: 1000, outOfPocketCents: 0, coveragePercent: 100 })
  })

  it('rispetta il filtro fromTs', async () => {
    await addSession({ startedAt: day(2), confirmedTotalCents: 1000 })
    await addSession({ startedAt: day(23), confirmedTotalCents: 2000 })
    const rows = await getBudgetEfficiency(NOW_WEEK, 0, day(15))
    expect(rows).toHaveLength(1)
    expect(rows[0].totalCents).toBe(2000)
  })
})
