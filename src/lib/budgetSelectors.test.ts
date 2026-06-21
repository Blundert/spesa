import { describe, it, expect } from 'vitest'
import { weekSpendSummary, liveSpendSummary } from './budgetSelectors'
import type { Session, Purchase } from '../db/types'

function makeSession(overrides: Partial<Session> & { id: number }): Session {
  return {
    isoWeek: '2026-W24',
    supermarketId: 1,
    startedAt: 1000,
    finishedAt: 2000,
    confirmedTotalCents: null,
    buoniSpent: 0,
    buoniValueCents: 800,
    ...overrides,
  }
}

function makePurchase(overrides: Partial<Purchase> & { sessionId: number }): Purchase {
  return {
    itemId: 1,
    priceCents: 100,
    quantity: 1,
    ...overrides,
  }
}

describe('weekSpendSummary', () => {
  it('nessuna sessione o acquisto → tutto zero', () => {
    const r = weekSpendSummary([], [], 5)
    expect(r).toEqual({
      totalSpentCents: 0,
      buoniSpentCount: 0,
      buoniCoveredCents: 0,
      outOfPocketCents: 0,
      buoniRemaining: 5,
    })
  })

  it('sessione non conclusa (finishedAt null) viene ignorata', () => {
    const session = makeSession({ id: 1, finishedAt: null, confirmedTotalCents: 500, buoniSpent: 1 })
    const r = weekSpendSummary([session], [], 5)
    expect(r.totalSpentCents).toBe(0)
    expect(r.buoniSpentCount).toBe(0)
  })

  it('sessione senza id viene ignorata', () => {
    const session: Session = {
      isoWeek: '2026-W24',
      supermarketId: 1,
      startedAt: 1000,
      finishedAt: 2000,
      confirmedTotalCents: 500,
      buoniSpent: 1,
      buoniValueCents: 800,
    }
    const r = weekSpendSummary([session], [], 5)
    expect(r.totalSpentCents).toBe(0)
  })

  it('usa confirmedTotalCents quando disponibile', () => {
    const session = makeSession({ id: 1, confirmedTotalCents: 1500, buoniSpent: 1, buoniValueCents: 800 })
    const r = weekSpendSummary([session], [], 5)
    expect(r.totalSpentCents).toBe(1500)
    expect(r.buoniSpentCount).toBe(1)
    expect(r.buoniCoveredCents).toBe(800)
    expect(r.outOfPocketCents).toBe(700)
    expect(r.buoniRemaining).toBe(4)
  })

  it('calcola totale dagli acquisti quando confirmedTotalCents è null', () => {
    const session = makeSession({ id: 1, confirmedTotalCents: null, buoniSpent: 0, buoniValueCents: 800 })
    const purchases = [
      makePurchase({ sessionId: 1, priceCents: 200, quantity: 2 }),
      makePurchase({ sessionId: 1, priceCents: 150, quantity: 1 }),
    ]
    const r = weekSpendSummary([session], purchases, 3)
    expect(r.totalSpentCents).toBe(550)
  })

  it('ignora acquisti di sessioni non presenti', () => {
    const session = makeSession({ id: 1, confirmedTotalCents: null, buoniSpent: 0 })
    const purchases = [makePurchase({ sessionId: 99, priceCents: 300, quantity: 1 })]
    const r = weekSpendSummary([session], purchases, 0)
    expect(r.totalSpentCents).toBe(0)
  })

  it('outOfPocketCents è 0 quando i buoni coprono tutto', () => {
    const session = makeSession({ id: 1, confirmedTotalCents: 500, buoniSpent: 1, buoniValueCents: 800 })
    const r = weekSpendSummary([session], [], 5)
    expect(r.outOfPocketCents).toBe(0)
  })

  it('buoniRemaining è 0 se tutti i buoni sono stati usati', () => {
    const session = makeSession({ id: 1, confirmedTotalCents: 800, buoniSpent: 5, buoniValueCents: 800 })
    const r = weekSpendSummary([session], [], 3)
    expect(r.buoniRemaining).toBe(0)
  })

  it('aggrega più sessioni', () => {
    const s1 = makeSession({ id: 1, confirmedTotalCents: 1000, buoniSpent: 1, buoniValueCents: 800 })
    const s2 = makeSession({ id: 2, confirmedTotalCents: 500, buoniSpent: 0, buoniValueCents: 800 })
    const r = weekSpendSummary([s1, s2], [], 10)
    expect(r.totalSpentCents).toBe(1500)
    expect(r.buoniSpentCount).toBe(1)
    expect(r.buoniCoveredCents).toBe(800)
    expect(r.outOfPocketCents).toBe(700)
    expect(r.buoniRemaining).toBe(9)
  })
})

describe('liveSpendSummary', () => {
  it('nessun acquisto → tutto zero', () => {
    const r = liveSpendSummary([], 0, 800)
    expect(r).toEqual({ spentCents: 0, outOfPocketCents: 0 })
  })

  it('calcola spentCents come somma priceCents × quantity', () => {
    const purchases = [
      makePurchase({ sessionId: 1, priceCents: 200, quantity: 3 }),
      makePurchase({ sessionId: 1, priceCents: 100, quantity: 2 }),
    ]
    const r = liveSpendSummary(purchases, 0, 800)
    expect(r.spentCents).toBe(800)
  })

  it('buoni coprono interamente → outOfPocketCents 0', () => {
    const purchases = [makePurchase({ sessionId: 1, priceCents: 500, quantity: 1 })]
    const r = liveSpendSummary(purchases, 1, 800)
    expect(r.outOfPocketCents).toBe(0)
  })

  it('copertura parziale dai buoni → outOfPocketCents > 0', () => {
    const purchases = [makePurchase({ sessionId: 1, priceCents: 1000, quantity: 1 })]
    const r = liveSpendSummary(purchases, 1, 800)
    expect(r.spentCents).toBe(1000)
    expect(r.outOfPocketCents).toBe(200)
  })
})
