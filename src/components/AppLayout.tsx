import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { formatCentsPlain } from '../lib/money'

interface AppLayoutProps {
  children: React.ReactNode
  /** Se true mostra la floating bottom bar (home, lista, storico, supermercati). */
  showBottomBar?: boolean
  /** Dati per la bottom bar. */
  bottomBar?: {
    remainingCents: number
    isOver: boolean
    spentCents: number
    takenCount: number
    totalCount: number
    onOpenSheet: () => void
  }
}

export function AppLayout({ children, showBottomBar, bottomBar }: AppLayoutProps) {
  const [navOpen, setNavOpen] = useState(false)
  const router = useRouter()
  const pathname = router.state.location.pathname

  return (
    <div className="relative w-full h-full bg-[#F2F2F0] overflow-hidden">
      {/* ── SIDE NAV ── */}
      <div className="absolute inset-0 bg-[#F6F6F4] z-[2] flex flex-col items-end px-[26px] pt-[72px] pb-[38px]">
        <nav className="w-[246px] flex flex-col">
          <NavItem label="Settimana" to="/" active={pathname === '/'} onNav={() => setNavOpen(false)} />
          <NavItem label="Lista" to="/lista" active={pathname === '/lista'} onNav={() => setNavOpen(false)} />
          <div className="h-px bg-[#E1E1DD] mx-[18px] my-[18px]" />
          <NavItem label="Storico" to="/storico" active={pathname === '/storico'} onNav={() => setNavOpen(false)} />
          <NavItem label="Supermercati" to="/supermercati" active={pathname === '/supermercati'} onNav={() => setNavOpen(false)} />
        </nav>
        <div className="mt-auto w-[246px]">
          <Link
            to="/spesa"
            onClick={() => setNavOpen(false)}
            className="w-full bg-[#2A2A2C] text-white text-base py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[.97] transition-transform"
          >
            Inizia la spesa
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── SCREEN INNER (push effect) ── */}
      <div
        className="absolute inset-0 bg-[#F2F2F0] flex flex-col overflow-hidden z-[10] transition-[transform,border-radius] duration-500"
        style={{
          transform: navOpen ? 'translateX(-74%) scale(0.88)' : 'scale(1)',
          borderRadius: navOpen ? '30px' : '0px',
          boxShadow: navOpen ? '-16px 0 50px rgba(0,0,0,.18)' : 'none',
          transformOrigin: 'top center',
        }}
      >
        {children}

        {/* ── BOTTOM BAR ── */}
        {showBottomBar && bottomBar && (
          <div className="absolute left-0 right-0 bottom-[26px] px-[18px] z-[18]">
            <button
              onClick={bottomBar.onOpenSheet}
              className="w-full bg-white rounded-3xl px-5 py-[13px] shadow-[0_12px_36px_rgba(0,0,0,.13)] flex items-center justify-between active:scale-[.985] transition-transform"
            >
              <div>
                <div className="flex items-baseline text-[#2A2A2C]">
                  <span className="text-base text-[#B5B5BA] mr-0.5">€</span>
                  <span className="text-2xl font-normal tabular-nums tracking-tight">
                    {formatCentsPlain(Math.abs(bottomBar.isOver ? -bottomBar.remainingCents : bottomBar.remainingCents))}
                  </span>
                </div>
                <div className="text-[11px] text-[#9B9B9F] mt-0.5">
                  {bottomBar.isOver ? 'da pagare a parte' : 'rimanente'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] text-[#6E6E72] tabular-nums">€{formatCentsPlain(bottomBar.spentCents)} spesi</div>
                <div className="text-[13px] text-[#9B9B9F] mt-0.5 tabular-nums">
                  {bottomBar.takenCount}/{bottomBar.totalCount} presi
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── MENU BUTTON ── */}
        <button
          onClick={() => setNavOpen(true)}
          className="absolute top-[64px] right-[20px] z-[30] w-10 h-10 flex items-center justify-center active:opacity-50 transition-opacity"
          aria-label="Apri menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round">
            <path d="M4 9h16M4 15h16" />
          </svg>
        </button>
      </div>

      {/* ── TAP OVERLAY (close nav) ── */}
      {navOpen && (
        <div
          className="absolute inset-0 z-[40] cursor-pointer"
          style={{ background: 'rgba(40,40,42,.06)' }}
          onClick={() => setNavOpen(false)}
        />
      )}
    </div>
  )
}

function NavItem({
  label,
  to,
  active,
  onNav,
}: {
  label: string
  to: string
  active: boolean
  onNav: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNav}
      className="px-[18px] py-[13px] rounded-[14px] text-[25px] font-normal text-[#2A2A2C] tracking-[-0.4px] active:opacity-55 transition-opacity"
      style={{ background: active ? '#ECECEA' : 'transparent' }}
    >
      {label}
    </Link>
  )
}
