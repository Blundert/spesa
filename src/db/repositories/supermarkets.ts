import { db } from '../db'
import { normalizeName } from '../../lib/normalize'
import type { Supermarket } from '../types'

export async function getSupermarkets(): Promise<Supermarket[]> {
  return db.supermarkets.toArray()
}

export async function getSupermarketById(id: number): Promise<Supermarket | undefined> {
  return db.supermarkets.get(id)
}

/**
 * Crea un supermercato solo se non esiste già (dedup su normalizedName).
 * Ritorna l'id dell'esistente o del nuovo.
 */
export async function upsertSupermarket(name: string): Promise<number> {
  const normalized = normalizeName(name)
  const existing = await db.supermarkets.where('normalizedName').equals(normalized).first()
  if (existing?.id !== undefined) return existing.id

  const id = await db.supermarkets.add({
    name: name.trim(),
    normalizedName: normalized,
  })
  return id as number
}

export async function deleteSupermarket(id: number): Promise<void> {
  await db.supermarkets.delete(id)
}

export async function updateLoyaltyCard(id: number, imageDataUrl: string | null): Promise<void> {
  await db.supermarkets.update(id, { loyaltyCard: imageDataUrl })
}

/** Statistiche aggregate per un supermercato. */
export interface SupermarketStats {
  supermarket: Supermarket
  sessionCount: number
  totalSpentCents: number
}

export async function getSupermarketStats(): Promise<SupermarketStats[]> {
  const supermarkets = await db.supermarkets.toArray()
  const sessions = await db.sessions.toArray()

  return Promise.all(
    supermarkets.map(async (s) => {
      const storeSessions = sessions.filter((ses) => ses.supermarketId === s.id)
      let totalSpentCents = 0
      for (const ses of storeSessions) {
        if (ses.id === undefined) continue
        const purchases = await db.purchases.where('sessionId').equals(ses.id).toArray()
        totalSpentCents += purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
      }
      return { supermarket: s, sessionCount: storeSessions.length, totalSpentCents }
    }),
  )
}
