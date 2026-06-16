import { db } from '../db'

export interface PricePoint {
  sessionId: number
  supermarketName: string
  priceCents: number
  date: number // timestamp ms
}

export interface ItemPriceStats {
  avgCents: number
  minCents: number
  maxCents: number
  buyCount: number
  lastCents: number
  history: PricePoint[]
}

/**
 * Storico completo dei prezzi di un item, ordinato per data crescente.
 */
export async function getItemPriceHistory(itemId: number): Promise<ItemPriceStats> {
  const purchases = await db.purchases.where('itemId').equals(itemId).toArray()

  const history: PricePoint[] = await Promise.all(
    purchases.map(async (p) => {
      const session = await db.sessions.get(p.sessionId)
      const supermarket = session ? await db.supermarkets.get(session.supermarketId) : undefined
      return {
        sessionId: p.sessionId,
        supermarketName: supermarket?.name ?? '?',
        priceCents: p.priceCents,
        date: session?.startedAt ?? 0,
      }
    }),
  )

  history.sort((a, b) => a.date - b.date)

  if (history.length === 0) {
    return { avgCents: 0, minCents: 0, maxCents: 0, buyCount: 0, lastCents: 0, history: [] }
  }

  const prices = history.map((h) => h.priceCents)
  const avgCents = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const minCents = Math.min(...prices)
  const maxCents = Math.max(...prices)
  const lastCents = prices[prices.length - 1]

  return { avgCents, minCents, maxCents, buyCount: history.length, lastCents, history }
}

export interface StoreItemPrice {
  supermarketId: number
  supermarketName: string
  bestPriceCents: number
  purchaseCount: number
}

/**
 * Per ogni supermercato, il prezzo migliore (minimo) pagato per quell'item.
 */
export async function getItemPriceByStore(itemId: number): Promise<StoreItemPrice[]> {
  const purchases = await db.purchases.where('itemId').equals(itemId).toArray()
  const byStore = new Map<number, { name: string; prices: number[]; count: number }>()

  for (const p of purchases) {
    const session = await db.sessions.get(p.sessionId)
    if (!session) continue
    const supermarket = await db.supermarkets.get(session.supermarketId)
    if (!supermarket?.id) continue

    const existing = byStore.get(supermarket.id)
    if (existing) {
      existing.prices.push(p.priceCents)
      existing.count++
    } else {
      byStore.set(supermarket.id, { name: supermarket.name, prices: [p.priceCents], count: 1 })
    }
  }

  return Array.from(byStore.entries()).map(([id, { name, prices, count }]) => ({
    supermarketId: id,
    supermarketName: name,
    bestPriceCents: Math.min(...prices),
    purchaseCount: count,
  }))
}
