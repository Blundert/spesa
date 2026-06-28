import type { DesktopRange } from '../../hooks/useDesktopStats'

interface RangeSelectorProps {
  value: DesktopRange
  onChange: (range: DesktopRange) => void
}

const OPTIONS: { label: string; value: DesktopRange }[] = [
  { label: '4 sett.', value: 4 },
  { label: '12 sett.', value: 12 },
  { label: '6 mesi', value: 26 },
  { label: '1 anno', value: 52 },
  { label: 'Tutto', value: null },
]

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: '#ECECEC',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? '#2A2A2C' : '#9B9B9F',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
