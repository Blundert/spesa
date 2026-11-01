import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2A2A2C', margin: 0, letterSpacing: '-0.3px' }}>
          {title}
        </h1>
        {subtitle && <div style={{ fontSize: '13px', color: '#9B9B9F', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '13px',
        fontWeight: 500,
        color: '#9B9B9F',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        margin: '0 0 16px',
      }}
    >
      {children}
    </h2>
  )
}
