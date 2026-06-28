import { db } from '../db'

// ---------------------------------------------------------------------------
// Helpers (duplicated from stats.ts to avoid i18n dependency in Node tests)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyBudgetRow {
  weekKey: string
  totalCents: number
  buoniCoveredCents: number
  outOfPocketCents: number
  coveragePercent: number
}

export interface SupermarketStat {
  id: number
  name: string
  sessionCount: number
  totalCents: number
  avgCents: number
  lastVisitTs: number
}

/** One bar in the day-of-week pattern chart (0=Mon … 6=Sun). */
export interface DayPattern {
  dayIndex: number
  sessionCount: number
}

/** One week slice for the stacked category evolution chart. */
export interface CategoryEvolutionRow {
  weekKey: string
  categories: Record<string, number> // categoryName → totalCents
}

export interface BudgetEfficiencyResult {
  weeks: WeeklyBudgetRow[]
}

// ---------------------------------------------------------------------------
// fromTs helper: converts a "range in weeks" to a start timestamp
// ---------------------------------------------------------------------------

export function rangeToFromTs(currentWeekKey: string, rangeWeeks: number | null): number | null {
  if (rangeWeeks === null) return null
  const [y, m, d] = currentWeekKey.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d))
  start.setUTCDate(start.getUTCDate() - (rangeWeeks - 1) * 7)
  return start.getTime()
}

// ---------------------------------------------------------------------------
// getSupermarketStats
// ---------------------------------------------------------------------------

export async function getSupermarketStats(
  weekStartDay: number,
  fromTs: number | null,
): Promise<SupermarketStat[]> {
  const [sessions, supermarkets] = await Promise.all([
    db.sessions.toArray(),
    db.supermarkets.toArray(),
  ])

  const finished = sessions.filter(
    (s) => s.finishedAt !== null && (fromTs === null || s.startedAt >= fromTs),
  )

  const [allPurchases] = await Promise.all([db.purchases.toArray()])
  const purchasesBySession = new Map<number, typeof allPurchases>()
  for (const p of allPurchases) {
    if (!purchasesBySession.has(p.sessionId)) purchasesBySession.set(p.sessionId, [])
    purchasesBySession.get(p.sessionId)!.push(p)
  }

  const smMap = new Map<
    number,
    { sessionCount: number; totalCents: number; lastVisitTs: number }
  >()

  for (const s of finished) {
    const totalCents =
      s.confirmedTotalCents !== null
        ? s.confirmedTotalCents
        : (purchasesBySession.get(s.id!) ?? []).reduce(
            (sum, p) => sum + p.priceCents * p.quantity,
            0,
          )
    const cur = smMap.get(s.supermarketId) ?? { sessionCount: 0, totalCents: 0, lastVisitTs: 0 }
    smMap.set(s.supermarketId, {
      sessionCount: cur.sessionCount + 1,
      totalCents: cur.totalCents + totalCents,
      lastVisitTs: Math.max(cur.lastVisitTs, s.startedAt),
    })
  }

  return supermarkets
    .filter((sm) => smMap.has(sm.id!))
    .map((sm) => {
      const agg = smMap.get(sm.id!)!
      return {
        id: sm.id!,
        name: sm.name,
        sessionCount: agg.sessionCount,
        totalCents: agg.totalCents,
        avgCents: Math.round(agg.totalCents / agg.sessionCount),
        lastVisitTs: agg.lastVisitTs,
      }
    })
    .sort((a, b) => b.totalCents - a.totalCents)
}

// ---------------------------------------------------------------------------
// getDayOfWeekPattern
// ---------------------------------------------------------------------------

export async function getDayOfWeekPattern(
  weekStartDay: number,
  fromTs: number | null,
): Promise<DayPattern[]> {
  const sessions = await db.sessions.toArray()
  const finished = sessions.filter(
    (s) => s.finishedAt !== null && (fromTs === null || s.startedAt >= fromTs),
  )

  const counts = new Array<number>(7).fill(0)
  for (const s of finished) {
    const d = new Date(s.startedAt)
    // dayIndex: 0=Mon … 6=Sun (our convention)
    const dayIndex = (d.getUTCDay() + 6) % 7
    counts[dayIndex]++
  }

  return counts.map((sessionCount, dayIndex) => ({ dayIndex, sessionCount }))
}

// ---------------------------------------------------------------------------
// getCategoryEvolution
// ---------------------------------------------------------------------------

export async function getCategoryEvolution(
  currentWeekKey: string,
  weekStartDay: number,
  fromTs: number | null,
): Promise<CategoryEvolutionRow[]> {
  const [sessions, purchases, items, categories] = await Promise.all([
    db.sessions.toArray(),
    db.purchases.toArray(),
    db.items.toArray(),
    db.categories.toArray(),
  ])

  const finished = sessions.filter(
    (s) => s.finishedAt !== null && (fromTs === null || s.startedAt >= fromTs),
  )
  const finishedIds = new Set(finished.map((s) => s.id!))

  const itemCatMap = new Map<number, number>()
  for (const it of items) itemCatMap.set(it.id!, it.categoryId)
  const catNameMap = new Map<number, string>()
  for (const c of categories) catNameMap.set(c.id!, c.name)

  // weekKey → categoryName → cents
  const weekCatMap = new Map<string, Map<string, number>>()

  for (const p of purchases) {
    if (!finishedIds.has(p.sessionId)) continue
    const session = finished.find((s) => s.id === p.sessionId)
    if (!session) continue
    const wk = sessionWeekKey(session.startedAt, weekStartDay)
    const catName = catNameMap.get(itemCatMap.get(p.itemId) ?? 0) ?? 'Altro'
    if (!weekCatMap.has(wk)) weekCatMap.set(wk, new Map())
    const cm = weekCatMap.get(wk)!
    cm.set(catName, (cm.get(catName) ?? 0) + p.priceCents * p.quantity)
  }

  if (weekCatMap.size === 0) return []

  const allWeeks = Array.from(weekCatMap.keys()).sort()
  const firstWeek = allWeeks[0]
  const rows: CategoryEvolutionRow[] = []
  let wk = firstWeek
  while (wk <= currentWeekKey) {
    const cm = weekCatMap.get(wk) ?? new Map()
    const categories: Record<string, number> = {}
    for (const [name, cents] of cm) categories[name] = cents
    rows.push({ weekKey: wk, categories })
    wk = shiftWeekKey(wk, 1)
  }

  return rows
}

// ---------------------------------------------------------------------------
// getBudgetEfficiency
// ---------------------------------------------------------------------------

export async function getBudgetEfficiency(
  currentWeekKey: string,
  weekStartDay: number,
  fromTs: number | null,
): Promise<WeeklyBudgetRow[]> {
  const sessions = await db.sessions.toArray()
  const finished = sessions.filter(
    (s) => s.finishedAt !== null && (fromTs === null || s.startedAt >= fromTs),
  )

  const [allPurchases] = await Promise.all([db.purchases.toArray()])
  const purchasesBySession = new Map<number, typeof allPurchases>()
  for (const p of allPurchases) {
    if (!purchasesBySession.has(p.sessionId)) purchasesBySession.set(p.sessionId, [])
    purchasesBySession.get(p.sessionId)!.push(p)
  }

  // weekKey → { totalCents, buoniCoveredCents }
  const weekMap = new Map<string, { totalCents: number; buoniCoveredCents: number }>()

  for (const s of finished) {
    const totalCents =
      s.confirmedTotalCents !== null
        ? s.confirmedTotalCents
        : (purchasesBySession.get(s.id!) ?? []).reduce(
            (sum, p) => sum + p.priceCents * p.quantity,
            0,
          )
    const buoniCoveredCents = s.buoniSpent * s.buoniValueCents
    const wk = sessionWeekKey(s.startedAt, weekStartDay)
    const cur = weekMap.get(wk) ?? { totalCents: 0, buoniCoveredCents: 0 }
    weekMap.set(wk, {
      totalCents: cur.totalCents + totalCents,
      buoniCoveredCents: cur.buoniCoveredCents + Math.min(buoniCoveredCents, totalCents),
    })
  }

  if (weekMap.size === 0) return []

  const allWeekKeys = Array.from(weekMap.keys()).sort()
  const firstWeek = allWeekKeys[0]
  const rows: WeeklyBudgetRow[] = []
  let wk = firstWeek
  while (wk <= currentWeekKey) {
    const agg = weekMap.get(wk) ?? { totalCents: 0, buoniCoveredCents: 0 }
    const outOfPocketCents = Math.max(0, agg.totalCents - agg.buoniCoveredCents)
    rows.push({
      weekKey: wk,
      totalCents: agg.totalCents,
      buoniCoveredCents: agg.buoniCoveredCents,
      outOfPocketCents,
      coveragePercent:
        agg.totalCents > 0 ? Math.round((agg.buoniCoveredCents / agg.totalCents) * 100) : 0,
    })
    wk = shiftWeekKey(wk, 1)
  }

  return rows
}
