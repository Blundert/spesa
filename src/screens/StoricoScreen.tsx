import { Link } from '@tanstack/react-router'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate } from '../lib/date'
import { useAllSessions } from '../hooks/useShopping'
import { useSupermarkets } from '../hooks/useItems'
import { AppLayout } from '../components/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { db } from '../db/db'
import { currentISOWeek } from '../lib/date'
import { useWeekBudget, useSessionsByWeek } from '../hooks/useShopping'
import { computeBudgetSummary } from '../lib/budgetSelectors'

const isoWeek = currentISOWeek()

function usePurchasesForWeek() {
  return useQuery({
    queryKey: ['purchasesForWeek', isoWeek],
    queryFn: async () => {
      const sessions = await db.sessions.where('isoWeek').equals(isoWeek).toArray()
      if (!sessions.length) return []
      const all = await Promise.all(
        sessions.map((s) => db.purchases.where('sessionId').equals(s.id as number).toArray()),
      )
      return all.flat()
    },
  })
}

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
  const { data: budget } = useWeekBudget(isoWeek)
  const { data: weekSessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek()

  const summary = budget
    ? computeBudgetSummary(budget, weekSessions, purchases)
    : { totalCents: 0, spentCents: 0, remainingCents: 0, outOfPocketCents: 0, isOver: false }

  const supermarketMap = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))

  return (
    <AppLayout
      showBottomBar
      bottomBar={{
        remainingCents: Math.abs(summary.remainingCents),
        isOver: summary.isOver,
        spentCents: summary.spentCents,
        takenCount: 0,
        totalCount: 0,
        onOpenSheet: () => {},
      }}
    >
      <div className="h-[54px] flex-none" />
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
            budget={budget ? budget.buoniCount * budget.buoniValueCents : 0}
          />
        ))}
      </div>
    </AppLayout>
  )
}

function SessionCard({
  sessionId,
  storeName,
  date,
  budget,
}: {
  sessionId: number
  storeName: string
  date: number
  budget: number
}) {
  const { data: totalCents = 0 } = useSessionTotal(sessionId)
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', sessionId],
    queryFn: () => db.purchases.where('sessionId').equals(sessionId).toArray(),
  })

  const extraCents = totalCents > budget && budget > 0 ? totalCents - budget : 0

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
        {extraCents > 0 && (
          <div className="inline-block mt-[7px] text-[12px] font-normal text-white bg-[#2A2A2C] px-[9px] py-[3px] rounded-full">
            +€{formatCentsPlain(extraCents)} a parte
          </div>
        )}
      </div>
      <span className="text-[22px] font-normal text-[#2A2A2C] tabular-nums">
        €{formatCentsPlain(totalCents)}
      </span>
    </Link>
  )
}
