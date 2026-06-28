import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCentsPlain } from '../lib/money'
import { categoryLabel } from '../i18n'
import { useCategories } from '../hooks/useItems'
import { useStats } from '../hooks/useStats'
import {
  type StatsRange,
  getStatsRange,
  setStatsRange,
  getCustomDays,
  setCustomDays,
  rangeToFromTs,
} from '../lib/statsRange'
import { BottomSheet } from '../components/BottomSheet'

const PRESET_RANGES: StatsRange[] = ['7d', '30d', '3m', '6m', 'all']

export function StatisticheScreen() {
  const { t } = useTranslation()

  const [range, setRangeState] = useState<StatsRange>(() => getStatsRange())
  const [customDays, setCustomDaysState] = useState<number>(() => getCustomDays())
  const [customOpen, setCustomOpen] = useState(false)
  const [customInput, setCustomInput] = useState<string>('')

  const fromTs = rangeToFromTs(range, customDays)
  const { data: stats, isLoading } = useStats(fromTs)
  const { data: categories = [] } = useCategories()

  const catLabelMap = Object.fromEntries(
    categories.map((c) => [c.name, categoryLabel(t, c.sortOrder, c.name)]),
  )

  function handleRangeSelect(r: StatsRange) {
    if (r === 'custom') {
      setCustomInput(String(customDays))
      setCustomOpen(true)
    } else {
      setStatsRange(r)
      setRangeState(r)
    }
  }

  function handleCustomApply() {
    const n = parseInt(customInput, 10)
    if (!Number.isFinite(n) || n <= 0) return
    setCustomDays(n)
    setCustomDaysState(n)
    setStatsRange('custom')
    setRangeState('custom')
    setCustomOpen(false)
  }

  function rangeLabel(r: StatsRange): string {
    if (r === 'custom') return t('statistiche.range.customLabel', { n: customDays })
    return t(`statistiche.range.${r}`)
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-[120px] flex items-center justify-center">
        <div className="text-[#9B9B9F] text-sm">{t('common.confirm')}</div>
      </div>
    )
  }

  const isEmpty = !stats || stats.sessionCount === 0

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      {/* Header */}
      <div className="px-1 pt-2 pb-[14px]">
        <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('statistiche.title')}</span>
      </div>

      {/* Selettore range */}
      <div className="overflow-x-auto -mx-5 px-5 pb-[14px]">
        <div className="flex gap-2 w-max">
          {PRESET_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeSelect(r)}
              className="px-3 py-[6px] rounded-full text-[13px] font-normal whitespace-nowrap transition-colors"
              style={{
                background: range === r ? '#2A2A2C' : '#F2F2F0',
                color: range === r ? '#fff' : '#9B9B9F',
              }}
            >
              {rangeLabel(r)}
            </button>
          ))}
          <button
            onClick={() => handleRangeSelect('custom')}
            className="px-3 py-[6px] rounded-full text-[13px] font-normal whitespace-nowrap transition-colors"
            style={{
              background: range === 'custom' ? '#2A2A2C' : '#F2F2F0',
              color: range === 'custom' ? '#fff' : '#9B9B9F',
            }}
          >
            {range === 'custom'
              ? t('statistiche.range.customLabel', { n: customDays })
              : t('statistiche.range.customLabel', { n: '?' })}
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center pt-16 text-center">
          <div className="text-[48px] mb-4">📊</div>
          <div className="text-[18px] font-normal text-[#2A2A2C] mb-2">{t('statistiche.emptyTitle')}</div>
          <div className="text-[14px] text-[#9B9B9F]">{t('statistiche.emptyBody')}</div>
        </div>
      ) : (
        <>
          {/* Riepilogo globale */}
          <div className="bg-white rounded-[20px] p-[18px] mb-4">
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase mb-3">
              {t('statistiche.globalTitle')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCell label={t('statistiche.totalSpent')} value={`€${formatCentsPlain(stats.totalCents)}`} big />
              <StatCell label={t('statistiche.sessions')} value={String(stats.sessionCount)} />
              <StatCell label={t('statistiche.avgPerSession')} value={`€${formatCentsPlain(stats.avgCents)}`} />
              {stats.topSupermarketName && (
                <StatCell label={t('statistiche.favoriteSupermarket')} value={stats.topSupermarketName} />
              )}
            </div>
          </div>

          {/* Andamento settimanale */}
          <div className="bg-white rounded-[20px] p-[18px] mb-4">
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase mb-4">
              {t('statistiche.weeklyTitle')}
            </div>
            <WeeklyBarChart weeklyTotals={stats.weeklyTotals} />
          </div>

          {/* Top articoli */}
          {stats.topItems.length > 0 && (
            <div className="bg-white rounded-[20px] p-[18px] mb-4">
              <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase mb-3">
                {t('statistiche.topItemsTitle')}
              </div>
              <div className="flex flex-col gap-0">
                {stats.topItems.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-[11px]"
                    style={{ borderBottom: i < stats.topItems.length - 1 ? '1px solid #ECECEC' : 'none' }}
                  >
                    <span className="text-[15px] text-[#2A2A2C]">{item.name}</span>
                    <span className="text-[13px] text-[#9B9B9F] tabular-nums">
                      ×{item.purchaseCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ripartizione per categoria */}
          {stats.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-[20px] p-[18px] mb-4">
              <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase mb-3">
                {t('statistiche.categoryTitle')}
              </div>
              <CategoryBreakdownList
                breakdown={stats.categoryBreakdown}
                catLabelMap={catLabelMap}
              />
            </div>
          )}
        </>
      )}

      {/* Bottom sheet giorni personalizzati */}
      <BottomSheet open={customOpen} onClose={() => setCustomOpen(false)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[14px]">
          {t('statistiche.range.customTitle')}
        </div>
        <div className="bg-[#F6F6F4] rounded-[16px] px-4 py-[14px] mb-4">
          <input
            type="number"
            min={1}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            data-vaul-no-drag
            className="w-full bg-transparent text-[16px] text-[#2A2A2C] outline-none tabular-nums"
            placeholder="30"
          />
        </div>
        <button
          onClick={handleCustomApply}
          className="w-full py-[15px] rounded-[16px] text-[16px] font-normal text-white"
          style={{ background: '#2A2A2C' }}
        >
          {t('statistiche.range.customApply')}
        </button>
      </BottomSheet>
    </div>
  )
}

function StatCell({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="bg-[#F6F6F4] rounded-[14px] px-[14px] py-[12px]">
      <div className="text-[11px] text-[#9B9B9F] mb-[3px]">{label}</div>
      <div className={`text-[#2A2A2C] font-normal tabular-nums ${big ? 'text-[22px]' : 'text-[18px]'}`}>
        {value}
      </div>
    </div>
  )
}

function CategoryBreakdownList({
  breakdown,
  catLabelMap,
}: {
  breakdown: Array<{ name: string; totalCents: number }>
  catLabelMap: Record<string, string>
}) {
  const total = breakdown.reduce((s, c) => s + c.totalCents, 0)
  return (
    <div className="flex flex-col gap-3">
      {breakdown.map((cat) => {
        const pct = total > 0 ? (cat.totalCents / total) * 100 : 0
        return (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] text-[#2A2A2C]">
                {catLabelMap[cat.name] ?? cat.name}
              </span>
              <span className="text-[13px] text-[#9B9B9F] tabular-nums">
                €{formatCentsPlain(cat.totalCents)}
              </span>
            </div>
            <div className="h-[6px] bg-[#F2F2F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2A2A2C] rounded-full"
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeeklyBarChart({ weeklyTotals }: { weeklyTotals: Array<{ weekKey: string; totalCents: number }> }) {
  const firstNonEmpty = weeklyTotals.findIndex((w) => w.totalCents > 0)
  const visible = firstNonEmpty === -1 ? weeklyTotals.slice(-1) : weeklyTotals.slice(firstNonEmpty)
  const max = Math.max(...visible.map((w) => w.totalCents), 1)
  const BAR_HEIGHT = 80
  const AMOUNT_LABEL_HEIGHT = 14

  return (
    <div className="overflow-x-auto -mx-[18px] px-[18px]">
      <div className="flex items-end gap-[6px]" style={{ minWidth: visible.length * 40 }}>
        {visible.map((w) => {
          const h = Math.max(3, Math.round((w.totalCents / max) * BAR_HEIGHT))
          const [y, m, d] = w.weekKey.split('-').map(Number)
          const date = new Date(Date.UTC(y, m - 1, d))
          const dayLabel = `${date.getUTCDate()}/${date.getUTCMonth() + 1}`
          const hasData = w.totalCents > 0
          const euroLabel = hasData ? `€${Math.round(w.totalCents / 100)}` : ''
          return (
            <div key={w.weekKey} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="relative w-full" style={{ height: BAR_HEIGHT + AMOUNT_LABEL_HEIGHT }}>
                {hasData && (
                  <div
                    className="absolute left-0 right-0 text-center text-[9px] text-[#9B9B9F] tabular-nums leading-none"
                    style={{ bottom: h + 3 }}
                  >
                    {euroLabel}
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                  style={{ height: h, background: hasData ? '#2A2A2C' : '#ECECEC' }}
                />
              </div>
              <div className="text-[10px] text-[#9B9B9F] tabular-nums">{dayLabel}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
