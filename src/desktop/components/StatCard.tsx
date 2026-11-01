type Trend = 'up' | 'down' | 'neutral'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: Trend
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--t-surface)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '12px', color: 'var(--t-muted)', fontWeight: 400, letterSpacing: '0.2px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: 300,
          color: 'var(--t-fg)',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend && trend !== 'neutral' && (
            <span style={{ fontSize: '11px', color: trend === 'up' ? 'var(--t-good)' : 'var(--t-bad)' }}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
          {sub && (
            <span style={{ fontSize: '12px', color: 'var(--t-muted)' }}>{sub}</span>
          )}
        </div>
      )}
    </div>
  )
}
