import { Outlet } from '@tanstack/react-router'
import { useAutoSync } from '../../hooks/useAutoSync'
import { useMergeNavigator } from '../../hooks/useMergeNavigator'
import { Sidebar } from './Sidebar'

export function DesktopShell() {
  // Stesso sync automatico del mobile (apertura, ogni 3 minuti, in background).
  useAutoSync()
  useMergeNavigator()
  return (
    <div
      className="desktop-root"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'var(--t-bg)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Hanken Grotesk', sans-serif",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          minWidth: 0,
          height: '100%',
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
