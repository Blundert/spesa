import { db } from '../db'

function shiftWeekKey(weekKey: string, delta: number): string {
  const [y, m, d] = weekKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + delta * 7)
  const yr = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dy = String(date.getUTCDate()).padStart(2, '0')
  return `${yr}-${mo}-${dy}`
}

export interface WeeklyTotal {
  weekKey: string
  totalCents: number
}

export interface TopItem {
  name: string
  purchaseCount: number
}

export interface CategoryBreakdown {
  name: string
  totalCents: number
}

export interface StatsResult {
  totalCents: number
  sessionCount: number
  avgCents: number
  topSupermarketName: string | null
  weeklyTotals: WeeklyTotal[]
  topItems: TopItem[]
  categoryBreakdown: CategoryBreakdown[]
}

export async function getStats(currentWeekKey: string): Promise<StatsResult> {
  const [sessions, purchases, items, categories, supermarkets] = await Promise.all([
    db.sessions.toArray(),
    db.purchases.toArray(),
    db.items.toArray(),
    db.categories.toArray(),
    db.supermarkets.toArray(),
  ])

  const finishedSessions = sessions.filter((s) => s.finishedAt !== null)
  const sessionCount = finishedSessions.length

  // Totale per sessione: usa confirmedTotalCents se disponibile, altrimenti somma acquisti
  const purchasesBySession = new Map<number, typeof purchases>()
  for (const p of purchases) {
    if (!purchasesBySession.has(p.sessionId)) purchasesBySession.set(p.sessionId, [])
    purchasesBySession.get(p.sessionId)!.push(p)
  }

  const sessionTotals = finishedSessions.map((s) => {
    if (s.confirmedTotalCents !== null) return { session: s, totalCents: s.confirmedTotalCents }
    const ps = purchasesBySession.get(s.id!) ?? []
    return { session: s, totalCents: ps.reduce((sum, p) => sum + p.priceCents * p.quantity, 0) }
  })

  const totalCents = sessionTotals.reduce((sum, s) => sum + s.totalCents, 0)
  const avgCents = sessionCount > 0 ? Math.round(totalCents / sessionCount) : 0

  // Supermercato più frequentato
  const supermarketCounts = new Map<number, number>()
  for (const s of finishedSessions) {
    supermarketCounts.set(s.supermarketId, (supermarketCounts.get(s.supermarketId) ?? 0) + 1)
  }
  let topSupermarketId: number | null = null
  let topCount = 0
  for (const [id, count] of supermarketCounts) {
    if (count > topCount) {
      topCount = count
      topSupermarketId = id
    }
  }
  const topSupermarketName =
    topSupermarketId !== null ? (supermarkets.find((s) => s.id === topSupermarketId)?.name ?? null) : null

  // Totali settimanali: ultime 12 settimane
  const weeklyMap = new Map<string, number>()
  for (const { session, totalCents } of sessionTotals) {
    weeklyMap.set(session.isoWeek, (weeklyMap.get(session.isoWeek) ?? 0) + totalCents)
  }
  const weeklyTotals: WeeklyTotal[] = Array.from({ length: 12 }, (_, i) => {
    const weekKey = shiftWeekKey(currentWeekKey, -(11 - i))
    return { weekKey, totalCents: weeklyMap.get(weekKey) ?? 0 }
  })

  // Top 5 articoli per purchaseCount
  const topItems: TopItem[] = [...items]
    .filter((it) => (it.purchaseCount ?? 0) > 0)
    .sort((a, b) => b.purchaseCount! - a.purchaseCount!)
    .slice(0, 5)
    .map((it) => ({ name: it.name, purchaseCount: it.purchaseCount! }))

  // Ripartizione per categoria (da acquisti)
  const itemCategoryMap = new Map<number, number>()
  for (const it of items) {
    itemCategoryMap.set(it.id!, it.categoryId)
  }
  const categoryNameMap = new Map<number, string>()
  for (const c of categories) {
    categoryNameMap.set(c.id!, c.name)
  }
  const categoryTotals = new Map<number, number>()
  for (const p of purchases) {
    const catId = itemCategoryMap.get(p.itemId) ?? 0
    categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + p.priceCents * p.quantity)
  }
  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([catId, total]) => ({ name: categoryNameMap.get(catId) ?? 'Altro', totalCents: total }))
    .sort((a, b) => b.totalCents - a.totalCents)

  return { totalCents, sessionCount, avgCents, topSupermarketName, weeklyTotals, topItems, categoryBreakdown }
}
