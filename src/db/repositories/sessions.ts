import { db } from '../db'
import type { Session } from '../types'

export async function getSessions(): Promise<Session[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray()
}

export async function getSessionsByWeek(isoWeek: string): Promise<Session[]> {
  return db.sessions.where('isoWeek').equals(isoWeek).toArray()
}

export async function getSessionById(id: number): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function createSession(
  isoWeek: string,
  supermarketId: number,
  buoniSpent: number,
  buoniValueCents: number,
): Promise<number> {
  const id = await db.sessions.add({
    isoWeek,
    supermarketId,
    startedAt: Date.now(),
    finishedAt: null,
    confirmedTotalCents: null,
    buoniSpent,
    buoniValueCents,
  })
  return id as number
}

export async function finishSession(id: number, confirmedTotalCents: number): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases, db.items], async () => {
    await db.sessions.update(id, { finishedAt: Date.now(), confirmedTotalCents })
    const purchases = await db.purchases.where('sessionId').equals(id).toArray()
    const itemIds = [...new Set(purchases.map((p) => p.itemId))]
    for (const itemId of itemIds) {
      const all = await db.purchases.where('itemId').equals(itemId).toArray()
      const total = all.reduce((s, p) => s + p.quantity, 0)
      await db.items.update(itemId, { purchaseCount: total })
    }
  })
}

export async function deleteWeek(isoWeek: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases, db.items, db.weekBudgets, db.mealPlans], async () => {
    const sessions = await db.sessions.where('isoWeek').equals(isoWeek).toArray()
    const sessionIds = sessions.map((s) => s.id!)
    const allPurchases = sessionIds.length > 0
      ? await db.purchases.where('sessionId').anyOf(sessionIds).toArray()
      : []
    const itemIds = [...new Set(allPurchases.map((p) => p.itemId))]
    if (sessionIds.length > 0) {
      await db.purchases.where('sessionId').anyOf(sessionIds).delete()
    }
    await db.sessions.where('isoWeek').equals(isoWeek).delete()
    await db.weekBudgets.where('isoWeek').equals(isoWeek).delete()
    await db.mealPlans.where('isoWeek').equals(isoWeek).delete()
    for (const itemId of itemIds) {
      const remaining = await db.purchases.where('itemId').equals(itemId).toArray()
      const qty = remaining.reduce((s, p) => s + p.quantity, 0)
      if (remaining.length === 0) {
        await db.items.update(itemId, { lastPriceCents: null, suggestedPriceCents: null, purchaseCount: 0 })
      } else {
        const avg = Math.round(remaining.reduce((a, p) => a + p.priceCents, 0) / remaining.length)
        const last = remaining[remaining.length - 1].priceCents
        await db.items.update(itemId, { lastPriceCents: last, suggestedPriceCents: avg, purchaseCount: qty })
      }
    }
  })
}

export async function deleteSession(id: number): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases, db.items], async () => {
    const purchases = await db.purchases.where('sessionId').equals(id).toArray()
    const itemIds = [...new Set(purchases.map((p) => p.itemId))]
    await db.purchases.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
    for (const itemId of itemIds) {
      const remaining = await db.purchases.where('itemId').equals(itemId).toArray()
      const qty = remaining.reduce((s, p) => s + p.quantity, 0)
      if (remaining.length === 0) {
        await db.items.update(itemId, { lastPriceCents: null, suggestedPriceCents: null, purchaseCount: 0 })
      } else {
        const avg = Math.round(remaining.reduce((a, p) => a + p.priceCents, 0) / remaining.length)
        const last = remaining[remaining.length - 1].priceCents
        await db.items.update(itemId, { lastPriceCents: last, suggestedPriceCents: avg, purchaseCount: qty })
      }
    }
  })
}
