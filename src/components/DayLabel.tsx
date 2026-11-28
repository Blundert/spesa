import { dayOfMonth, dayShort, todayDayIndex } from '../lib/date'

/**
 * Giorno dei Pasti: sigla e numero (`LUN 29`). Oggi, se la settimana mostrata è quella corrente,
 * è in una pillola piena (token `--t-accent` / `--t-on`, quindi giusta in ogni tema).
 * La grandezza e il colore del testo li decide chi la usa tramite `className`.
 */
export function DayLabel({ week, dayIndex, today, className }: { week: string; dayIndex: number; today: Date; className: string }) {
  const isToday = todayDayIndex(week, today) === dayIndex
  const pill = isToday ? ' bg-t-accent !text-t-on rounded-full px-2 py-[2px]' : ''
  return (
    <span className={`inline-block whitespace-nowrap tabular-nums ${className}${pill}`} aria-current={isToday ? 'date' : undefined}>
      {dayShort(dayIndex).toUpperCase()} {dayOfMonth(week, dayIndex)}
    </span>
  )
}
