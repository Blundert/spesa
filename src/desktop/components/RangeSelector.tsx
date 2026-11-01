import { useTranslation } from 'react-i18next'
import type { DesktopRange } from '../../hooks/useDesktopStats'

interface RangeSelectorProps {
  value: DesktopRange
  onChange: (range: DesktopRange) => void
}

const OPTIONS: { labelKey: string; value: DesktopRange }[] = [
  { labelKey: 'desktop.range.w4', value: 4 },
  { labelKey: 'desktop.range.w12', value: 12 },
  { labelKey: 'desktop.range.m6', value: 26 },
  { labelKey: 'desktop.range.y1', value: 52 },
  { labelKey: 'desktop.range.all', value: null },
]

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  const { t } = useTranslation()
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
            {t(opt.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
