import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getStats } from '../db/repositories/stats'
import {
  getSupermarketStats,
  getDayOfWeekPattern,
  getCategoryEvolution,
  getBudgetEfficiency,
  rangeToFromTs,
} from '../db/repositories/statsExtended'
import { currentWeek } from '../lib/date'
import { getWeekStartDay } from '../lib/weekSettings'

/** Range in settimane: null = tutto lo storico */
export type DesktopRange = 4 | 12 | 26 | 52 | null

export function useDesktopStats(range: DesktopRange) {
  const weekStartDay = getWeekStartDay()
  const weekKey = currentWeek()
  const fromTs = rangeToFromTs(weekKey, range)

  const stats = useQuery({
    queryKey: [...qk.stats(), weekStartDay, fromTs, 'desktop'],
    queryFn: () => getStats(weekKey, weekStartDay, fromTs, null),
  })

  const supermarketStats = useQuery({
    queryKey: ['desktopSupermarketStats', fromTs],
    queryFn: () => getSupermarketStats(fromTs),
  })

  const dayPattern = useQuery({
    queryKey: ['desktopDayPattern', fromTs],
    queryFn: () => getDayOfWeekPattern(fromTs),
  })

  const categoryEvolution = useQuery({
    queryKey: ['desktopCategoryEvolution', weekStartDay, fromTs],
    queryFn: () => getCategoryEvolution(weekKey, weekStartDay, fromTs),
  })

  const budgetEfficiency = useQuery({
    queryKey: ['desktopBudgetEfficiency', weekStartDay, fromTs],
    queryFn: () => getBudgetEfficiency(weekKey, weekStartDay, fromTs),
  })

  return { stats, supermarketStats, dayPattern, categoryEvolution, budgetEfficiency }
}
