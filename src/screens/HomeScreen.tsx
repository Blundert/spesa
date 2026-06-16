import { Link } from '@tanstack/react-router'
import { currentISOWeek, formatWeekLabel, formatShortDate } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { computeBudgetSummary } from '../lib/budgetSelectors'
import { useWeekBudget, useSessionsByWeek } from '../hooks/useShopping'
import { useListItems } from '../hooks/useListItems'
import { useSupermarkets } from '../hooks/useItems'
import { useMealPlan } from '../hooks/useMealPlan'
import { qk } from '../db/queryKeys'
import { db } from '../db/db'
import { useQuery } from '@tanstack/react-query'

const isoWeek = currentISOWeek()

function usePurchasesForWeek(isoWeek: string) {
  return useQuery({
    queryKey: qk.purchasesForWeek(isoWeek),
    queryFn: async () => {
      const sessions = await db.sessions.where('isoWeek').equals(isoWeek).toArray()
      const sessionIds = sessions.map((s) => s.id as number)
      if (!sessionIds.length) return []
      const all = await Promise.all(
        sessionIds.map((id) => db.purchases.where('sessionId').equals(id).toArray()),
      )
      return all.flat()
    },
  })
}

export function HomeScreen() {
  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek(isoWeek)
  const { data: listItems = [] } = useListItems()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: mealDays = [] } = useMealPlan(isoWeek)
  const mealCount = mealDays.reduce((n, d) => n + (d.pranzo ? 1 : 0) + (d.cena ? 1 : 0), 0)

  const summary = budget
    ? computeBudgetSummary(budget, sessions, purchases)
    : { totalCents: 0, spentCents: 0, remainingCents: 0, outOfPocketCents: 0, isOver: false }

  // "Presi": solo gli acquisti della spesa in corso (sessione non ancora finita).
  const activeSession = sessions.find((s) => s.finishedAt === null)
  const activeItemIds = new Set(
    activeSession
      ? purchases.filter((p) => p.sessionId === activeSession.id).map((p) => p.itemId)
      : [],
  )
  const takenCount = listItems.filter((li) => activeItemIds.has(li.itemId)).length
  const totalCount = listItems.length

  // Recap delle spese finite della settimana (importo confermato, fallback calcolato).
  const computedBySession = new Map<number, number>()
  for (const p of purchases) {
    computedBySession.set(
      p.sessionId,
      (computedBySession.get(p.sessionId) ?? 0) + p.priceCents * p.quantity,
    )
  }
  const supermarketMap = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const weekSpese = sessions
    .filter((s) => s.finishedAt !== null && s.id !== undefined)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .map((s) => ({
      id: s.id as number,
      store: supermarketMap[s.supermarketId] ?? '?',
      date: s.startedAt,
      amountCents: s.confirmedTotalCents ?? computedBySession.get(s.id as number) ?? 0,
    }))

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="px-1 py-[10px] pb-7">
          <div className="text-[13px] text-[#9B9B9F] mb-1 tabular-nums">{formatWeekLabel(isoWeek)}</div>
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            La mia settimana
          </span>
        </div>

        {/* Hero */}
        {summary.isOver ? (
          <div className="bg-[#2A2A2C] rounded-[30px] px-[26px] py-[30px] mb-[14px]">
            <div className="text-[12px] font-normal tracking-[1.6px] text-white/55 uppercase mb-[14px]">
              Da pagare a parte
            </div>
            <div className="flex items-baseline text-white">
              <span className="text-[40px] font-normal opacity-55 mr-1.5">€</span>
              <span className="text-[84px] font-light leading-[.92] tabular-nums tracking-[-2px]">
                {formatCentsPlain(summary.outOfPocketCents)}
              </span>
            </div>
            <div className="text-sm text-white/50 mt-[14px]">
              oltre i {budget?.buoniCount ?? 0} buoni · di tasca tua
            </div>
          </div>
        ) : (
          <div className="px-1.5 pt-[18px] pb-9">
            <div className="text-[12px] font-normal tracking-[1.6px] text-[#9B9B9F] uppercase mb-5">
              Rimanente settimana
            </div>
            <div className="flex items-baseline text-[#2A2A2C]">
              <span className="text-[42px] font-normal text-[#B5B5BA] mr-1.5">€</span>
              <span className="text-[92px] font-light leading-[.92] tabular-nums tracking-[-2.5px]">
                {formatCentsPlain(summary.remainingCents)}
              </span>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="flex bg-white rounded-[22px] py-[22px] px-1 mb-7">
          <div className="flex-1 text-center border-r border-[#ECECEC]">
            <div className="text-xl font-normal text-[#2A2A2C] tabular-nums">
              €{formatCentsPlain(summary.spentCents)}
            </div>
            <div className="text-[11px] text-[#9B9B9F] mt-0.5 tracking-[.3px]">SPESO</div>
          </div>
          <div className="flex-1 text-center border-r border-[#ECECEC]">
            <div className="text-xl font-normal text-[#2A2A2C] tabular-nums">
              {takenCount}/{totalCount}
            </div>
            <div className="text-[11px] text-[#9B9B9F] mt-0.5 tracking-[.3px]">OGGETTI</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-normal text-[#2A2A2C] tabular-nums">
              €{formatCentsPlain(summary.totalCents)}
            </div>
            <div className="text-[11px] text-[#9B9B9F] mt-0.5 tracking-[.3px]">BUDGET</div>
          </div>
        </div>

        {/* Spese di questa settimana */}
        {weekSpese.length > 0 && (
          <div className="mb-7">
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
              Spese di questa settimana
            </div>
            <div className="bg-white rounded-[22px] overflow-hidden">
              {weekSpese.map((sp, i) => (
                <Link
                  key={sp.id}
                  to="/storico/$sessionId"
                  params={{ sessionId: String(sp.id) }}
                  className="flex items-center gap-[14px] px-5 py-[17px] active:bg-[#F6F6F4] transition-colors"
                  style={{ borderBottom: i < weekSpese.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  <div className="flex-1">
                    <div className="text-base font-normal text-[#2A2A2C]">{sp.store}</div>
                    <div className="text-[13px] text-[#9B9B9F] mt-0.5">{formatShortDate(sp.date)}</div>
                  </div>
                  <span className="text-[17px] font-normal text-[#2A2A2C] tabular-nums">
                    €{formatCentsPlain(sp.amountCents)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-[22px] overflow-hidden mb-[14px]">
          <Link
            to="/pasti"
            search={{ week: isoWeek }}
            className="flex items-center gap-[14px] px-5 py-[19px] border-b border-[#ECECEC] active:bg-[#F6F6F4] transition-colors"
          >
            <div className="w-[38px] h-[38px] rounded-[11px] bg-[#F2F2F0] flex items-center justify-center flex-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M9 3v4M15 3v4M8 14h3" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-normal text-[#2A2A2C]">Pianifica i pasti</div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5">{mealCount} pasti pianificati</div>
            </div>
            <ChevronRight />
          </Link>
          <Link
            to="/lista"
            className="flex items-center gap-[14px] px-5 py-[19px] active:bg-[#F6F6F4] transition-colors"
          >
            <div className="w-[38px] h-[38px] rounded-[11px] bg-[#F2F2F0] flex items-center justify-center flex-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1.2 1.2L7.5 5M4 17.5h.01" /><circle cx="4.5" cy="12" r="1.1" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-normal text-[#2A2A2C]">Lista della spesa</div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5">
                {takenCount} / {totalCount} presi
              </div>
            </div>
            <ChevronRight />
          </Link>
        </div>

        <Link
          to="/spesa"
          className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[18px] rounded-[22px] flex items-center justify-center gap-2.5 active:scale-[.98] transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
            <path d="M2 3h2.5l2.2 12.5a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
          </svg>
          Inizia la spesa
        </Link>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5C5C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
