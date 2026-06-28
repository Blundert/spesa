import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getStats } from '../db/repositories/stats'
import { currentWeek } from '../lib/date'
import { getWeekStartDay } from '../lib/weekSettings'

export function useStats() {
  const weekStartDay = getWeekStartDay()
  const weekKey = currentWeek()
  return useQuery({
    queryKey: [...qk.stats(), weekStartDay],
    queryFn: () => getStats(weekKey, weekStartDay),
  })
}
