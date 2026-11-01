import { useState, useSyncExternalStore } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { NewShoppingButton } from './NewShoppingModal'
import { parseSidebarPref, resolveSidebarCompact, type SidebarPref } from '../../lib/viewMode'

const SIDEBAR_KEY = 'desktop-sidebar'

function readPref(): SidebarPref {
  try {
    return parseSidebarPref(localStorage.getItem(SIDEBAR_KEY))
  } catch {
    return null
  }
}

function subscribeWidth(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

function useViewportWidth(): number {
  return useSyncExternalStore(subscribeWidth, () => window.innerWidth)
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

type NavItem = {
  path: string
  labelKey: string
  icon: React.ReactNode
}

type NavGroup = { titleKey?: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        path: '/',
        labelKey: 'desktop.nav.dashboard',
        icon: (
          <Icon>
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </Icon>
        ),
      },
      {
        path: '/lista',
        labelKey: 'desktop.nav.lista',
        icon: (
          <Icon>
            <path d="M9 6h12M9 12h12M9 18h12" /><path d="M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
          </Icon>
        ),
      },
      {
        path: '/pasti',
        labelKey: 'desktop.nav.meals',
        icon: (
          <Icon>
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </Icon>
        ),
      },
      {
        path: '/storico',
        labelKey: 'desktop.nav.history',
        icon: (
          <Icon>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </Icon>
        ),
      },
      {
        path: '/stats',
        labelKey: 'desktop.nav.stats',
        icon: (
          <Icon>
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </Icon>
        ),
      },
    ],
  },
  {
    titleKey: 'nav.groupManage',
    items: [
      {
        path: '/liste',
        labelKey: 'desktop.nav.lists',
        icon: (
          <Icon>
            <rect x="8" y="3" width="13" height="14" rx="2" /><path d="M5 7v12a2 2 0 002 2h10" />
          </Icon>
        ),
      },
      {
        path: '/catalogo',
        labelKey: 'desktop.nav.catalog',
        icon: (
          <Icon>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </Icon>
        ),
      },
      {
        path: '/piatti',
        labelKey: 'desktop.nav.dishes',
        icon: (
          <Icon>
            <path d="M4 3v7a3 3 0 003 3v8M7 3v7M10 3v7a3 3 0 01-3 3M18 3c-2 2-3 5-3 8h3v10" />
          </Icon>
        ),
      },
      {
        path: '/supermercati',
        labelKey: 'desktop.nav.supermarkets',
        icon: (
          <Icon>
            <path d="M3 9l2-5h14l2 5M3 9v11h18V9M3 9h18M9 20v-6h6v6" />
          </Icon>
        ),
      },
    ],
  },
  {
    items: [
      {
        path: '/impostazioni',
        labelKey: 'desktop.nav.settings',
        icon: (
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </Icon>
        ),
      },
    ],
  },
]

export function Sidebar() {
  const { t } = useTranslation()
  const router = useRouter()
  const location = useRouterState({ select: (s) => s.location })
  const currentPath = location.pathname
  const [pref, setPref] = useState<SidebarPref>(readPref)
  const width = useViewportWidth()
  const compact = resolveSidebarCompact(pref, width)

  const toggle = () => {
    const next: SidebarPref = compact ? 'expanded' : 'compact'
    setPref(next)
    try {
      localStorage.setItem(SIDEBAR_KEY, next)
    } catch {
      // storage non disponibile: la scelta vale solo per questa sessione
    }
  }

  return (
    <aside
      style={{
        width: compact ? '68px' : '220px',
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid #ECECEC',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo / app name */}
      <div style={{ padding: compact ? '28px 0 24px' : '28px 24px 24px', borderBottom: '1px solid #ECECEC', textAlign: compact ? 'center' : 'left' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#2A2A2C', letterSpacing: '-0.3px' }}>
          {compact ? t('desktop.appName').charAt(0) : t('desktop.appName')}
        </div>
        {!compact && (
          <div style={{ fontSize: '12px', color: '#9B9B9F', marginTop: '2px' }}>
            {t('desktop.nav.dashboard')}
          </div>
        )}
      </div>

      <NewShoppingButton compact={compact} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: compact ? '12px 10px' : '12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map((group, g) => (
          <div key={g} style={{ marginBottom: '12px' }}>
            {group.titleKey && compact && (
              <div style={{ height: '1px', background: '#ECECEC', margin: '8px 6px 12px' }} />
            )}
            {group.titleKey && !compact && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#9B9B9F',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  padding: '8px 12px 6px',
                }}
              >
                {t(group.titleKey)}
              </div>
            )}
            {group.items.map((item) => {
              const isActive =
                item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => router.navigate({ to: item.path as never })}
                  title={compact ? t(item.labelKey) : undefined}
                  aria-label={t(item.labelKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: compact ? 'center' : 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: compact ? '10px 0' : '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#F2F2F0' : 'transparent',
                    color: isActive ? '#2A2A2C' : '#9B9B9F',
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '2px',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {item.icon}
                  {!compact && t(item.labelKey)}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: compact ? '10px' : '10px 12px', borderTop: '1px solid #ECECEC' }}>
        <button
          onClick={toggle}
          title={compact ? t('desktop.sidebar.expand') : t('desktop.sidebar.collapse')}
          aria-label={compact ? t('desktop.sidebar.expand') : t('desktop.sidebar.collapse')}
          aria-expanded={!compact}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: compact ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: compact ? '10px 0' : '10px 12px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#9B9B9F',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <Icon>{compact ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}</Icon>
          {!compact && t('desktop.sidebar.collapse')}
        </button>
      </div>
    </aside>
  )
}
