import type { ReactNode } from 'react'
import { SectionTitle } from './PageHeader'

export function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: '16px', padding: '24px', minWidth: 0 }}>
      <SectionTitle>{title}</SectionTitle>
      {hint && <div style={{ fontSize: '13px', color: 'var(--t-muted)', margin: '-8px 0 16px' }}>{hint}</div>}
      {children}
    </div>
  )
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        position: 'relative',
        width: '46px',
        height: '28px',
        borderRadius: '999px',
        background: on ? 'var(--t-accent)' : 'var(--t-line2)',
        flex: 'none',
        transition: 'background .15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '21px' : '3px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'var(--t-surface)',
          transition: 'left .15s',
        }}
      />
    </button>
  )
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>{children}</div>
}
