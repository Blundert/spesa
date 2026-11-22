import { db } from '../db'
import type { Session } from '../types'
import { emitSharedChange } from '../../lib/sharedChange'

/**
 * Segna come eliminate le mie spese già pubblicate in una lista condivisa, perché il merge con il repo non le
 * faccia tornare. Le spese di altri non si eliminano mai (vedi sotto). Da chiamare nella stessa transazione che le
 * cancella (tabelle `sessions` e `shoppingLists`).
 */
async function tombstoneSessions(sessions: Session[], now: number = Date.now()): Promise<void> {
  const byList = new Map<number, string[]>()
  for (const s of sessions) {
    if (s.sharedUid && s.listId !== undefined && s.doneBy === undefined) {
      byList.set(s.listId, [...(byList.get(s.listId) ?? []), s.sharedUid])
    }
  }
  for (const [listId, uids] of byList) {
    const list = await db.shoppingLists.get(listId)
    if (!list?.shared) continue
    const tombstones = { ...list.shared.tombstones }
    for (const uid of uids) tombstones[uid] = now
    await db.shoppingLists.update(listId, { shared: { ...list.shared, tombstones } })
    emitSharedChange(listId)
  }
}

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
  listId: number,
): Promise<number> {
  const id = await db.sessions.add({
    isoWeek,
    supermarketId,
    listId,
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
  // Lista condivisa: la spesa conclusa va nel repo (5 secondi dopo, insieme a eventuali altre modifiche).
  const listId = (await db.sessions.get(id))?.listId
  if (listId !== undefined && (await db.shoppingLists.get(listId))?.shared) emitSharedChange(listId)
}

export async function deleteWeek(isoWeek: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases, db.items, db.weekBudgets, db.mealPlans, db.shoppingLists], async () => {
    // Le spese di altre persone (liste condivise) restano: non sono mie da eliminare e tornerebbero alla prossima sync.
    const sessions = (await db.sessions.where('isoWeek').equals(isoWeek).toArray()).filter((s) => s.doneBy === undefined)
    await tombstoneSessions(sessions)
    const sessionIds = sessions.map((s) => s.id!)
    const allPurchases = sessionIds.length > 0
      ? await db.purchases.where('sessionId').anyOf(sessionIds).toArray()
      : []
    const itemIds = [...new Set(allPurchases.map((p) => p.itemId))]
    if (sessionIds.length > 0) {
      await db.purchases.where('sessionId').anyOf(sessionIds).delete()
    }
    await db.sessions.bulkDelete(sessionIds)
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

export async function updateSession(
  id: number,
  patch: Partial<Pick<Session, 'supermarketId' | 'startedAt' | 'isoWeek' | 'confirmedTotalCents' | 'buoniSpent' | 'buoniValueCents'>>,
): Promise<void> {
  await db.sessions.update(id, patch)
}

export async function deleteSession(id: number): Promise<void> {
  await db.transaction('rw', [db.sessions, db.purchases, db.items, db.shoppingLists], async () => {
    const session = await db.sessions.get(id)
    // Le spese di altre persone (liste condivise) non si eliminano da qui.
    if (!session || session.doneBy !== undefined) return
    await tombstoneSessions([session])
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
