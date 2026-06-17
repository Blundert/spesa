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
  const [navOpen, setNavOpen] = useState(false)
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

  const handleNavShopGo = () => {
    setNavOpen(false)
    setTimeout(() => void navigate({ to: '/spesa' }), 320)
  }

  return (
    <div className="relative w-full h-full bg-[#F2F2F0] overflow-hidden">
      {/* ── SIDE NAV ── */}
      <div className="absolute inset-0 bg-[#F6F6F4] z-[2] flex flex-col items-end px-[26px] pt-[72px] pb-[38px]">
        <nav className="w-[246px] flex flex-col">
          <NavItem label={t('nav.week')} to="/" active={pathname === '/'} onClick={() => setNavOpen(false)} />
          <NavItem label={t('nav.list')} to="/lista" active={pathname === '/lista'} onClick={() => setNavOpen(false)} className="mt-[2px]" />
          <div className="h-px bg-[#E1E1DD] mx-[18px] my-[18px]" />
          <NavItem label={t('nav.history')} to="/storico" active={pathname === '/storico'} onClick={() => setNavOpen(false)} />
          <NavItem label={t('nav.supermarkets')} to="/supermercati" active={pathname === '/supermercati'} onClick={() => setNavOpen(false)} className="mt-[2px]" />
          <NavItem label={t('nav.settings')} to="/impostazioni" active={pathname === '/impostazioni'} onClick={() => setNavOpen(false)} className="mt-[2px]" />
        </nav>
        <div className="mt-auto w-[246px]">
          <button
            onClick={handleNavShopGo}
            className="w-full bg-[#2A2A2C] text-white text-base py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[.97] transition-transform"
          >
            {t('nav.startShopping')}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── SCREEN INNER (push effect) ── */}
      <div
        className="absolute inset-0 bg-[#F2F2F0] flex flex-col overflow-hidden z-[10]"
        style={{
          transform: navOpen ? 'translateX(-74%) scale(0.88)' : 'scale(1)',
          borderRadius: navOpen ? '30px' : '0px',
          boxShadow: '-16px 0 50px rgba(0,0,0,.18)',
          transformOrigin: 'top center',
          transition: 'transform .5s cubic-bezier(.32,.72,0,1), border-radius .5s cubic-bezier(.32,.72,0,1)',
        }}
      >
        {/* Status bar spacer */}
        <div className="h-[54px] flex-none" />

        {/* Screen content */}
        <Outlet />

        {/* Bottom bar */}
        <div className="absolute left-0 right-0 bottom-[26px] px-[18px] z-[18]">
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full bg-white rounded-3xl px-5 py-[13px] shadow-[0_12px_36px_rgba(0,0,0,.13)] flex items-center justify-between active:scale-[.985] transition-transform"
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
        </div>

        {/* Menu button */}
        <button
          onClick={() => setNavOpen(true)}
          className="absolute top-[64px] right-[20px] z-[30] w-10 h-10 rounded-full bg-[#2A2A2C] flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,.22)] active:scale-[.94] transition-transform"
          aria-label={t('nav.openMenu')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M4 9h16M4 15h16" />
          </svg>
        </button>

        {/* Nav close overlay — inside inner div so it transforms with the push */}
        {navOpen && (
          <div
            className="absolute inset-0 z-[40] cursor-pointer"
            style={{ background: 'rgba(40,40,42,.06)' }}
            onClick={() => setNavOpen(false)}
          />
        )}
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
    </div>
  )
}

function NavItem({
  label,
  to,
  active,
  onClick,
  className = '',
}: {
  label: string
  to: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-[18px] py-[13px] rounded-[14px] text-[25px] font-normal text-[#2A2A2C] tracking-[-0.4px] active:opacity-55 transition-opacity ${className}`}
      style={{ background: active ? '#ECECEA' : 'transparent' }}
    >
      {label}
    </Link>
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
