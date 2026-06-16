import { Link } from '@tanstack/react-router'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate } from '../lib/date'
import { useAllSessions } from '../hooks/useShopping'
import { useSupermarkets } from '../hooks/useItems'
import { useQuery } from '@tanstack/react-query'
import { db } from '../db/db'

function useSessionTotal(sessionId: number) {
  return useQuery({
    queryKey: ['sessionTotal', sessionId],
    queryFn: async () => {
      const purchases = await db.purchases.where('sessionId').equals(sessionId).toArray()
      return purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
    },
    enabled: sessionId > 0,
  })
}

export function StoricoScreen() {
  const { data: sessions = [] } = useAllSessions()
  const { data: supermarkets = [] } = useSupermarkets()

  const supermarketMap = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      <div className="flex items-center justify-between px-1 pt-2 pb-[18px]">
        <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">Storico</span>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-[#9B9B9F] text-sm">Nessuna sessione salvata.</div>
      )}

      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          sessionId={s.id!}
          storeName={supermarketMap[s.supermarketId] ?? '?'}
          date={s.startedAt}
          confirmedTotalCents={s.confirmedTotalCents}
        />
      ))}
    </div>
  )
}

function SessionCard({
  sessionId,
  storeName,
  date,
  confirmedTotalCents,
}: {
  sessionId: number
  storeName: string
  date: number
  confirmedTotalCents: number | null
}) {
  const { data: computedCents = 0 } = useSessionTotal(sessionId)
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', sessionId],
    queryFn: () => db.purchases.where('sessionId').equals(sessionId).toArray(),
  })
  const totalCents = confirmedTotalCents ?? computedCents

  return (
    <Link
      to="/storico/$sessionId"
      params={{ sessionId: String(sessionId) }}
      className="flex items-center gap-[14px] bg-white rounded-[20px] px-5 py-[18px] mb-[10px] active:bg-[#F6F6F4] block"
    >
      <div className="flex-1">
        <div className="text-base font-normal text-[#2A2A2C]">{storeName}</div>
        <div className="text-[13px] text-[#9B9B9F] mt-0.5">
          {formatShortDate(date)} · {purchases.length} oggetti
        </div>
      </div>
      <span className="text-[22px] font-normal text-[#2A2A2C] tabular-nums">
        €{formatCentsPlain(totalCents)}
      </span>
    </Link>
  )
}
