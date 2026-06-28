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
        background: '#fff',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: '12px', color: '#9B9B9F', fontWeight: 400, letterSpacing: '0.2px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: 300,
          color: '#2A2A2C',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend && trend !== 'neutral' && (
            <span style={{ fontSize: '11px', color: trend === 'up' ? '#34C759' : '#FF3B30' }}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
          {sub && (
            <span style={{ fontSize: '12px', color: '#9B9B9F' }}>{sub}</span>
          )}
        </div>
      )}
    </div>
  )
}
