import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { currentISOWeek } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { computeBudgetSummary } from '../lib/budgetSelectors'
import { useWeekBudget, useSessionsByWeek, useUpdateWeekBudget } from '../hooks/useShopping'
import { useListItems } from '../hooks/useListItems'
import { qk } from '../db/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { db } from '../db/db'
import { BottomSheet } from './BottomSheet'

const isoWeek = currentISOWeek()

function usePurchasesForWeek() {
  return useQuery({
    queryKey: qk.purchasesForWeek(isoWeek),
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

export function AppShell() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()
  const navigate = useNavigate()
  const pathname = router.state.location.pathname

  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek()
  const { data: listItems = [] } = useListItems()
  const { mutate: updateBudget } = useUpdateWeekBudget(isoWeek)

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

  return (
    <div className="relative w-full h-full bg-[#F2F2F0] overflow-hidden">
      {/* ── SCREEN ── */}
      <div className="absolute inset-0 bg-[#F2F2F0] flex flex-col overflow-hidden">
        {/* Status bar spacer */}
        <div className="h-[54px] flex-none" />

        {/* Screen content */}
        <Outlet />

        {/* Bottom bar + bottone menu */}
        <div className="absolute left-0 right-0 bottom-[26px] px-[18px] z-[18] flex items-stretch gap-2.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 bg-white rounded-3xl px-5 py-[13px] shadow-[0_12px_36px_rgba(0,0,0,.13)] flex items-center justify-between active:scale-[.985] transition-transform"
          >
            <div>
              <div className="flex items-baseline text-[#2A2A2C]">
                <span className="text-base text-[#B5B5BA] mr-0.5">€</span>
                <span className="text-2xl font-normal tabular-nums tracking-tight">
                  {formatCentsPlain(Math.abs(summary.remainingCents))}
                </span>
              </div>
              <div className="text-[11px] text-[#9B9B9F] mt-0.5">
                {summary.isOver ? t('budget.toPayExtra') : t('budget.remaining')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] text-[#6E6E72] tabular-nums">€{formatCentsPlain(summary.spentCents)} {t('common.spentWord')}</div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5 tabular-nums">{takenCount}/{totalCount} {t('common.takenWord')}</div>
            </div>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.openMenu')}
            className="flex-none w-[60px] rounded-3xl bg-[#2A2A2C] flex items-center justify-center shadow-[0_12px_36px_rgba(0,0,0,.18)] active:scale-[.95] transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Budget sheet */}
      {budget && (
        <BudgetSheetPanel
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          buoniCount={budget.buoniCount}
          buoniValueCents={budget.buoniValueCents}
          onUpdateBuoni={(n) => updateBudget({ buoniCount: n, buoniValueCents: budget.buoniValueCents })}
          onUpdateValue={(v) => updateBudget({ buoniCount: budget.buoniCount, buoniValueCents: v })}
          takenCount={takenCount}
          totalCount={totalCount}
          onStartShopping={() => {
            setSheetOpen(false)
            setTimeout(() => void navigate({ to: '/spesa' }), 300)
          }}
        />
      )}

      {/* Menu di navigazione (bottom sheet) */}
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </div>
  )
}

function MenuSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean
  onClose: () => void
  pathname: string
}) {
  const { t } = useTranslation()
  const items: { to: string; label: string }[] = [
    { to: '/', label: t('nav.week') },
    { to: '/lista', label: t('nav.list') },
    { to: '/storico', label: t('nav.history') },
    { to: '/supermercati', label: t('nav.supermarkets') },
    { to: '/impostazioni', label: t('nav.settings') },
  ]
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[14px]">
        {t('nav.menu')}
      </div>
      <div className="bg-[#F6F6F4] rounded-[18px] overflow-hidden">
        {items.map((item, i) => {
          const active = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center justify-between px-[18px] py-[15px] active:opacity-50"
              style={{ borderBottom: i < items.length - 1 ? '1px solid #E6E6E2' : 'none' }}
            >
              <span className={`text-[17px] text-[#2A2A2C] ${active ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
              {active ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              ) : (
                <ChevronRight />
              )}
            </Link>
          )
        })}
      </div>
    </BottomSheet>
  )
}

function BudgetSheetPanel({
  open,
  onClose,
  buoniCount,
  buoniValueCents,
  onUpdateBuoni,
  onUpdateValue,
  takenCount,
  totalCount,
  onStartShopping,
}: {
  open: boolean
  onClose: () => void
  buoniCount: number
  buoniValueCents: number
  onUpdateBuoni: (n: number) => void
  onUpdateValue: (v: number) => void
  takenCount: number
  totalCount: number
  onStartShopping: () => void
}) {
  const { t } = useTranslation()
  const totalCents = buoniCount * buoniValueCents

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[14px]">
        {t('budget.thisWeek')}
      </div>
      <div className="bg-[#F6F6F4] rounded-[18px] px-4 mb-[14px]">
        <div className="flex items-center justify-between py-[14px] border-b border-[#E6E6E2]">
          <span className="text-base text-[#2A2A2C]">{t('budget.buoniPasto')}</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => onUpdateBuoni(Math.max(0, buoniCount - 1))}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[20px] text-center tabular-nums">
              {buoniCount}
            </span>
            <StepperBtn onClick={() => onUpdateBuoni(Math.min(20, buoniCount + 1))}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <span className="text-base text-[#2A2A2C]">{t('budget.unitValue')}</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => onUpdateValue(Math.max(50, buoniValueCents - 50))}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[54px] text-center tabular-nums">
              €{formatCentsPlain(buoniValueCents)}
            </span>
            <StepperBtn onClick={() => onUpdateValue(buoniValueCents + 50)}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
      </div>
      <div className="flex items-baseline justify-between px-1.5 pb-[18px]">
        <span className="text-sm text-[#9B9B9F]">{t('budget.total')}</span>
        <span className="text-2xl font-normal text-[#2A2A2C] tracking-[-0.5px] tabular-nums">
          €{formatCentsPlain(totalCents)}
        </span>
      </div>
      <button
        onClick={onStartShopping}
        className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[17px] rounded-[18px] flex items-center justify-center gap-2 mb-[14px] active:scale-[.98] transition-transform"
      >
        {t('nav.startShopping')}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
      <div className="bg-[#F6F6F4] rounded-[18px] overflow-hidden">
        <Link
          to="/pasti"
          search={{ week: isoWeek }}
          onClick={onClose}
          className="flex items-center justify-between px-[18px] py-4 border-b border-[#E6E6E2] active:opacity-50"
        >
          <span className="text-base text-[#2A2A2C]">{t('home.planMeals')}</span>
          <ChevronRight />
        </Link>
        <Link
          to="/lista"
          onClick={onClose}
          className="flex items-center justify-between px-[18px] py-4 active:opacity-50"
        >
          <span className="text-base text-[#2A2A2C]">{t('home.shoppingList')}</span>
          <span className="flex items-center gap-2">
            <span className="text-sm text-[#9B9B9F] tabular-nums">{takenCount}/{totalCount}</span>
            <ChevronRight />
          </span>
        </Link>
      </div>
    </BottomSheet>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5C5C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
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
