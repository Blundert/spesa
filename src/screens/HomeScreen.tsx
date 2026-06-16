import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { currentISOWeek, formatWeekLabel } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { computeBudgetSummary } from '../lib/budgetSelectors'
import { useWeekBudget, useSessionsByWeek, useUpdateWeekBudget } from '../hooks/useShopping'
import { useListItems } from '../hooks/useListItems'
import { BottomSheet } from '../components/BottomSheet'
import { AppLayout } from '../components/AppLayout'
import { db } from '../db/db'
import { useQuery } from '@tanstack/react-query'

const isoWeek = currentISOWeek()

function usePurchasesForWeek(isoWeek: string) {
  return useQuery({
    queryKey: ['purchasesForWeek', isoWeek],
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek(isoWeek)
  const { data: listItems = [] } = useListItems(isoWeek)
  const [mealCount] = useState(0) // placeholder, filled in Task 16

  const summary = budget
    ? computeBudgetSummary(budget, sessions, purchases)
    : { totalCents: 0, spentCents: 0, remainingCents: 0, outOfPocketCents: 0, isOver: false }

  const takenCount = listItems.filter((li) =>
    purchases.some((p) => p.itemId === li.itemId),
  ).length
  const totalCount = listItems.length

  return (
    <AppLayout
      showBottomBar
      bottomBar={{
        remainingCents: Math.abs(summary.remainingCents),
        isOver: summary.isOver,
        spentCents: summary.spentCents,
        takenCount,
        totalCount,
        onOpenSheet: () => setSheetOpen(true),
      }}
    >
      {/* Status bar area */}
      <div className="h-[54px] flex-none" />

      {/* Scroll content */}
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-baseline justify-between px-1 py-[10px] pb-7">
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

        {/* Actions */}
        <div className="bg-white rounded-[22px] overflow-hidden mb-[14px]">
          <Link
            to="/pasti"
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

      {/* Week label overlay in menu button area */}
      <div className="absolute top-[66px] left-5 z-[29] text-[14px] text-[#9B9B9F] tabular-nums">
        {formatWeekLabel(isoWeek)}
      </div>

      {/* Budget sheet */}
      <BudgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isoWeek={isoWeek}
        takenCount={takenCount}
        totalCount={totalCount}
      />
    </AppLayout>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5C5C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function BudgetSheet({
  open,
  onClose,
  isoWeek,
  takenCount,
  totalCount,
}: {
  open: boolean
  onClose: () => void
  isoWeek: string
  takenCount: number
  totalCount: number
}) {
  const { data: budget, isLoading } = useWeekBudget(isoWeek)
  const { mutate: updateBudget } = useUpdateWeekBudget(isoWeek)

  if (isLoading || !budget) return null

  const totalCents = budget.buoniCount * budget.buoniValueCents

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[14px]">
        Questa settimana
      </div>
      <div className="bg-[#F6F6F4] rounded-[18px] px-4 mb-[14px]">
        <div className="flex items-center justify-between py-[14px] border-b border-[#E6E6E2]">
          <span className="text-base text-[#2A2A2C]">Buoni pasto</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => updateBudget({ buoniCount: Math.max(1, budget.buoniCount - 1), buoniValueCents: budget.buoniValueCents })}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[20px] text-center tabular-nums">
              {budget.buoniCount}
            </span>
            <StepperBtn onClick={() => updateBudget({ buoniCount: Math.min(20, budget.buoniCount + 1), buoniValueCents: budget.buoniValueCents })}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <span className="text-base text-[#2A2A2C]">Valore unitario</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => updateBudget({ buoniCount: budget.buoniCount, buoniValueCents: Math.max(50, budget.buoniValueCents - 50) })}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[54px] text-center tabular-nums">
              €{formatCentsPlain(budget.buoniValueCents)}
            </span>
            <StepperBtn onClick={() => updateBudget({ buoniCount: budget.buoniCount, buoniValueCents: budget.buoniValueCents + 50 })}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
      </div>
      <div className="flex items-baseline justify-between px-1.5 pb-[18px]">
        <span className="text-sm text-[#9B9B9F]">Budget totale</span>
        <span className="text-2xl font-normal text-[#2A2A2C] tracking-[-0.5px] tabular-nums">
          €{formatCentsPlain(totalCents)}
        </span>
      </div>
      <Link
        to="/spesa"
        onClick={onClose}
        className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[17px] rounded-[18px] flex items-center justify-center gap-2 mb-[14px] active:scale-[.98] transition-transform"
      >
        Inizia la spesa
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <div className="bg-[#F6F6F4] rounded-[18px] overflow-hidden">
        <Link
          to="/pasti"
          onClick={onClose}
          className="flex items-center justify-between px-[18px] py-4 border-b border-[#E6E6E2] active:opacity-50"
        >
          <span className="text-base text-[#2A2A2C]">Pianifica i pasti</span>
          <ChevronRight />
        </Link>
        <Link
          to="/lista"
          onClick={onClose}
          className="flex items-center justify-between px-[18px] py-4 active:opacity-50"
        >
          <span className="text-base text-[#2A2A2C]">Lista della spesa</span>
          <span className="flex items-center gap-2">
            <span className="text-sm text-[#9B9B9F] tabular-nums">{takenCount}/{totalCount}</span>
            <ChevronRight />
          </span>
        </Link>
      </div>
    </BottomSheet>
  )
}


function StepperBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.08)] active:opacity-50"
    >
      {children}
    </button>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
