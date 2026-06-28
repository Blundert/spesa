import { db } from '../db'

function sessionWeekKey(startedAt: number, startDay: number): string {
  const date = new Date(startedAt)
  const ourDay = (date.getUTCDay() + 6) % 7
  const offset = (ourDay - startDay + 7) % 7
  const ws = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  ws.setUTCDate(ws.getUTCDate() - offset)
  const y = ws.getUTCFullYear()
  const m = String(ws.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ws.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

export async function getStats(
  currentWeekKey: string,
  weekStartDay: number,
  fromTs: number | null,
): Promise<StatsResult> {
  const [sessions, purchases, items, categories, supermarkets] = await Promise.all([
    db.sessions.toArray(),
    db.purchases.toArray(),
    db.items.toArray(),
    db.categories.toArray(),
    db.supermarkets.toArray(),
  ])

  const finishedSessions = sessions.filter(
    (s) => s.finishedAt !== null && (fromTs === null || s.startedAt >= fromTs),
  )
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

  // Totali settimanali: griglia dalla settimana di fromTs (o dalla più vecchia con sessioni) a quella corrente
  const weeklyMap = new Map<string, number>()
  for (const { session, totalCents } of sessionTotals) {
    const key = sessionWeekKey(session.startedAt, weekStartDay)
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + totalCents)
  }

  let firstWeekKey: string
  if (fromTs !== null) {
    firstWeekKey = sessionWeekKey(fromTs, weekStartDay)
  } else if (finishedSessions.length === 0) {
    firstWeekKey = currentWeekKey
  } else {
    const earliestTs = finishedSessions.reduce((min, s) => Math.min(min, s.startedAt), Infinity)
    firstWeekKey = sessionWeekKey(earliestTs, weekStartDay)
  }

  const weeklyTotals: WeeklyTotal[] = []
  let wk = firstWeekKey
  while (wk <= currentWeekKey) {
    weeklyTotals.push({ weekKey: wk, totalCents: weeklyMap.get(wk) ?? 0 })
    wk = shiftWeekKey(wk, 1)
  }
  if (weeklyTotals.length === 0) weeklyTotals.push({ weekKey: currentWeekKey, totalCents: 0 })

  // Top 5 articoli per acquisti nelle sessioni filtrate
  const filteredSessionIds = new Set(finishedSessions.map((s) => s.id!))
  const itemOccurrences = new Map<number, number>()
  for (const p of purchases) {
    if (filteredSessionIds.has(p.sessionId)) {
      itemOccurrences.set(p.itemId, (itemOccurrences.get(p.itemId) ?? 0) + 1)
    }
  }
  const itemNameMap = new Map<number, string>()
  for (const it of items) itemNameMap.set(it.id!, it.name)
  const topItems: TopItem[] = Array.from(itemOccurrences.entries())
    .map(([itemId, count]) => ({ name: itemNameMap.get(itemId) ?? 'Sconosciuto', purchaseCount: count }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, 5)

  // Ripartizione per categoria (da acquisti nelle sessioni filtrate)
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
    if (!filteredSessionIds.has(p.sessionId)) continue
    const catId = itemCategoryMap.get(p.itemId) ?? 0
    categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + p.priceCents * p.quantity)
  }
  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([catId, total]) => ({ name: categoryNameMap.get(catId) ?? 'Altro', totalCents: total }))
    .sort((a, b) => b.totalCents - a.totalCents)

  return { totalCents, sessionCount, avgCents, topSupermarketName, weeklyTotals, topItems, categoryBreakdown }
}
