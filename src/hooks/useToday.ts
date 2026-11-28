import { useEffect, useState } from 'react'
import { isSameLocalDay, msUntilMidnight } from '../lib/date'

/** La data di oggi: si aggiorna da sola a mezzanotte e quando la scheda torna visibile, senza ricaricare. */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        setToday(new Date())
        schedule()
      }, msUntilMidnight(new Date()) + 1000)
    }
    schedule()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = new Date()
      setToday((prev) => (isSameLocalDay(prev, now) ? prev : now))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
