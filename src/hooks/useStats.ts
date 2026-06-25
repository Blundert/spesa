import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getStats } from '../db/repositories/stats'
import { currentWeek } from '../lib/date'

export function useStats() {
  const weekKey = currentWeek()
  return useQuery({
    queryKey: qk.stats(),
    queryFn: () => getStats(weekKey),
  })
}
