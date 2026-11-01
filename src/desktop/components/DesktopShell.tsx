import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'

export function DesktopShell() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#F2F2F0',
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
