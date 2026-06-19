import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, Link, useRouter, useNavigate } from '@tanstack/react-router'
import { currentISOWeek } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { weekSpendSummary } from '../lib/budgetSelectors'
import { useWeekBudget, useSessionsByWeek } from '../hooks/useShopping'
import { useAutoSync } from '../hooks/useAutoSync'
import { getDebugViewport, onDebugViewportChange } from '../lib/debugFlag'
import { DEFAULT_BUONO_VALUE_CENTS } from '../db/types'
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
  const [newBuoni, setNewBuoni] = useState(0)
  const [newVal, setNewVal] = useState(DEFAULT_BUONO_VALUE_CENTS)
  const [showDebug, setShowDebug] = useState(getDebugViewport())
  const router = useRouter()
  const navigate = useNavigate()
  const pathname = router.state.location.pathname

  useAutoSync()
  useEffect(() => onDebugViewportChange(() => setShowDebug(getDebugViewport())), [])

  const { data: budget } = useWeekBudget(isoWeek)
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: purchases = [] } = usePurchasesForWeek()

  const summary = weekSpendSummary(sessions, purchases, budget?.buoniAvailable ?? 0)

  // Init della config nuova spesa nel click di apertura (no effetto → no lint).
  const openNewShopping = () => {
    setNewBuoni(summary.buoniRemaining)
    setNewVal(DEFAULT_BUONO_VALUE_CENTS)
    setSheetOpen(true)
  }
  const startShopping = () => {
    setSheetOpen(false)
    const buoni = newBuoni
    const val = newVal
    setTimeout(() => void navigate({ to: '/spesa', search: { buoni, val } }), 300)
  }

  return (
    <div className="relative w-full h-full bg-[#F2F2F0] overflow-hidden">
      {showDebug && <ViewportDebug />}
      {/* ── SCREEN ── */}
      <div className="absolute inset-0 bg-[#F2F2F0] flex flex-col overflow-hidden">
        {/* Spazio in alto: con status bar 'default' la web view parte già sotto la status bar,
            quindi serve solo un po' di respiro (e si adatta se mai si riattiva viewport-fit=cover). */}
        <div className="flex-none" style={{ height: 'max(16px, env(safe-area-inset-top))' }} />

        {/* Screen content — fade in basso stile Claude (mask sull'opacità del contenuto) */}
        <div className="flex-1 flex flex-col overflow-hidden scroll-fade-bottom">
          <Outlet />
        </div>

        {/* Barra fissa: pill riepilogo + cerchio menu, galleggianti.
            absolute dentro lo shell, che ora riempie esattamente il viewport (position: fixed
            in main.tsx): così resta sempre a 18px+safe-area dal fondo reale, senza saltare. */}
        <div
          className="absolute left-0 right-0 z-[20] px-[18px] flex items-stretch gap-2.5"
          style={{ bottom: 'calc(18px + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={openNewShopping}
            className="flex-1 bg-white rounded-3xl px-5 py-3 flex items-center justify-between active:scale-[.99] transition-transform text-left"
          >
            <div>
              <div className="flex items-baseline text-[#2A2A2C]">
                <span className="text-base text-[#B5B5BA] mr-0.5">€</span>
                <span className="text-2xl font-normal tabular-nums tracking-tight">
                  {formatCentsPlain(summary.outOfPocketCents)}
                </span>
              </div>
              <div className="text-[11px] text-[#9B9B9F] mt-0.5">{t('home.outOfPocket')}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] text-[#6E6E72] tabular-nums">€{formatCentsPlain(summary.totalSpentCents)} {t('common.spentWord')}</div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5 tabular-nums">{summary.buoniSpentCount} {t('common.buoni')}</div>
            </div>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.openMenu')}
            className="flex-none self-center w-14 h-14 rounded-full bg-[#2A2A2C] flex items-center justify-center active:scale-[.95] transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Box "Nuova spesa": buoni (pre-compilati coi rimanenti) + valore + Inizia */}
      <NewShoppingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        buoni={newBuoni}
        valueCents={newVal}
        onBuoni={setNewBuoni}
        onValue={setNewVal}
        onStart={startShopping}
      />

      {/* Menu di navigazione (bottom sheet) */}
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </div>
  )
}

function NewShoppingSheet({
  open,
  onClose,
  buoni,
  valueCents,
  onBuoni,
  onValue,
  onStart,
}: {
  open: boolean
  onClose: () => void
  buoni: number
  valueCents: number
  onBuoni: (n: number) => void
  onValue: (v: number) => void
  onStart: () => void
}) {
  const { t } = useTranslation()
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[14px]">
        {t('spesa.newTitle')}
      </div>
      <div className="bg-[#F6F6F4] rounded-[18px] px-4 mb-[14px]">
        <div className="flex items-center justify-between py-[14px] border-b border-[#E6E6E2]">
          <span className="text-base text-[#2A2A2C]">{t('spesa.buoni')}</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => onBuoni(Math.max(0, buoni - 1))}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[20px] text-center tabular-nums">
              {buoni}
            </span>
            <StepperBtn onClick={() => onBuoni(buoni + 1)}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
        <div className="flex items-center justify-between py-[14px]">
          <span className="text-base text-[#2A2A2C]">{t('spesa.buonoValue')}</span>
          <div className="flex items-center gap-4">
            <StepperBtn onClick={() => onValue(Math.max(50, valueCents - 50))}>
              <MinusIcon />
            </StepperBtn>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[54px] text-center tabular-nums">
              €{formatCentsPlain(valueCents)}
            </span>
            <StepperBtn onClick={() => onValue(valueCents + 50)}>
              <PlusIcon />
            </StepperBtn>
          </div>
        </div>
      </div>
      <button
        onClick={onStart}
        className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[17px] rounded-[18px] flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
      >
        {t('nav.startShopping')}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </BottomSheet>
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

// TEMPORANEO: riquadro diagnostico per capire perché lo shell non riempie lo schermo su iOS.
// Da rimuovere una volta individuata e risolta la causa.
function ViewportDebug() {
  const [txt, setTxt] = useState('…')
  useEffect(() => {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;inset:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)
    const read = () => {
      const cs = getComputedStyle(probe)
      const vv = window.visualViewport
      const shell = document.querySelector('[data-vaul-drawer-wrapper]')
      const r = shell?.getBoundingClientRect()
      const nav = window.navigator as Navigator & { standalone?: boolean }
      setTxt(
        [
          `inner ${window.innerHeight} · client ${document.documentElement.clientHeight}`,
          `vv ${vv ? Math.round(vv.height) : '-'} · screen ${window.screen.height} · dpr ${window.devicePixelRatio}`,
          `safe top ${cs.paddingTop} · bottom ${cs.paddingBottom}`,
          r ? `shell top ${Math.round(r.top)} · bottom ${Math.round(r.bottom)} · h ${Math.round(r.height)}` : 'no shell',
          `GAP bottom ${r ? Math.round(window.innerHeight - r.bottom) : '-'}`,
          `standalone ${String(nav.standalone)}`,
        ].join('\n'),
      )
    }
    const raf = requestAnimationFrame(read)
    const id = setInterval(read, 1000)
    window.addEventListener('resize', read)
    window.visualViewport?.addEventListener('resize', read)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
      window.removeEventListener('resize', read)
      window.visualViewport?.removeEventListener('resize', read)
      probe.remove()
    }
  }, [])
  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        left: 8,
        zIndex: 9999,
        background: 'rgba(200,0,0,.92)',
        color: '#fff',
        font: '10px/1.45 ui-monospace, monospace',
        padding: '6px 9px',
        borderRadius: 8,
        whiteSpace: 'pre',
        pointerEvents: 'none',
      }}
    >
      {txt}
    </div>
  )
}
