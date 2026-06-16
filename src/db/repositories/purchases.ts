import { db } from '../db'
import type { Purchase } from '../types'

export async function getPurchasesBySession(sessionId: number): Promise<Purchase[]> {
  return db.purchases.where('sessionId').equals(sessionId).toArray()
}

export async function addPurchase(
  sessionId: number,
  itemId: number,
  priceCents: number,
  quantity: number,
): Promise<number> {
  const id = await db.purchases.add({ sessionId, itemId, priceCents, quantity })
  return id as number
}

export async function updatePurchasePrice(id: number, priceCents: number): Promise<void> {
  await db.purchases.update(id, { priceCents })
}

export async function updatePurchaseQuantity(id: number, quantity: number): Promise<void> {
  await db.purchases.update(id, { quantity })
}

export async function removePurchase(id: number): Promise<void> {
  await db.purchases.delete(id)
}

/** Totale speso (centesimi) in una sessione. */
export async function sessionTotalCents(sessionId: number): Promise<number> {
  const purchases = await db.purchases.where('sessionId').equals(sessionId).toArray()
  return purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
}
