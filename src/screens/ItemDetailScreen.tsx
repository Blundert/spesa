import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate } from '../lib/date'
import { useItemPriceHistory, useItemPriceByStore } from '../hooks/usePriceHistory'
import { useQuery } from '@tanstack/react-query'
import { db } from '../db/db'

export function ItemDetailScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { itemId: itemIdStr } = useParams({ from: '/item/$itemId' })
  const itemId = parseInt(itemIdStr, 10)

  const { data: item } = useQuery({
    queryKey: ['items', itemId],
    queryFn: () => db.items.get(itemId),
  })

  const { data: stats } = useItemPriceHistory(itemId)
  const { data: byStore = [] } = useItemPriceByStore(itemId)

  const maxPrice = byStore.length > 0 ? Math.max(...byStore.map((s) => s.bestPriceCents)) : 1

  // Spark line points
  const sparkPoints = (() => {
    if (!stats || stats.history.length === 0) return ''
    const W = 300
    const H = 86
    const pad = 10
    const prices = stats.history.map((h) => h.priceCents)
    const dmin = Math.min(...prices)
    const dmax = Math.max(...prices)
    const span = dmax - dmin || 1
    return stats.history
      .map((h, i) => {
        const x = stats.history.length > 1 ? (i / (stats.history.length - 1)) * W : W / 2
        const y = H - pad - ((h.priceCents - dmin) / span) * (H - 2 * pad)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  })()

  const lastPt = (() => {
    if (!stats || stats.history.length === 0) return { x: 150, y: 43 }
    const prices = stats.history.map((h) => h.priceCents)
    const dmin = Math.min(...prices)
    const dmax = Math.max(...prices)
    const span = dmax - dmin || 1
    const last = stats.history[stats.history.length - 1]
    const i = stats.history.length - 1
    const x = stats.history.length > 1 ? (i / (stats.history.length - 1)) * 300 : 150
    const y = 86 - 10 - ((last.priceCents - dmin) / span) * (86 - 20)
    return { x, y }
  })()

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="h-[54px] flex-none" />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1 pb-4">
          <button
            onClick={() => void navigate({ to: '/lista' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[24px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {item?.name ?? '…'}
          </span>
        </div>

        {/* Price stats card */}
        <div className="bg-white rounded-[22px] px-[22px] pt-[22px] pb-2 mb-[14px]">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] font-normal tracking-[1px] text-[#9B9B9F] uppercase">{t('item.avgPrice')}</div>
              <div className="flex items-baseline text-[#2A2A2C] mt-1.5">
                <span className="text-[26px] font-normal text-[#B5B5BA] mr-0.5">€</span>
                <span className="text-[52px] font-light tracking-[-1px] leading-[.95] tabular-nums">
                  {stats ? formatCentsPlain(stats.avgCents) : '—'}
                </span>
              </div>
            </div>
            <div className="text-right pb-1.5">
              <div className="text-[13px] text-[#9B9B9F]">{t('item.last')}</div>
              <div className="text-[18px] font-normal text-[#2A2A2C] tabular-nums">
                {stats ? `€${formatCentsPlain(stats.lastCents)}` : '—'}
              </div>
            </div>
          </div>

          {/* Sparkline */}
          {stats && stats.history.length > 1 && (
            <svg viewBox="0 0 300 86" preserveAspectRatio="none" className="w-full mt-[14px] mb-2 overflow-visible" style={{ height: 86 }}>
              <polyline points={sparkPoints} fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={lastPt.x} cy={lastPt.y} r="4" fill="#2A2A2C" />
              <circle cx={lastPt.x} cy={lastPt.y} r="8" fill="#2A2A2C" fillOpacity="0.12" />
            </svg>
          )}
        </div>

        {/* Min / Max / Acquisti */}
        <div className="flex gap-2.5 mb-[14px]">
          {[
            { label: t('item.min'), value: stats ? `€${formatCentsPlain(stats.minCents)}` : '—' },
            { label: t('item.max'), value: stats ? `€${formatCentsPlain(stats.maxCents)}` : '—' },
            { label: t('item.buys'), value: String(stats?.buyCount ?? 0) },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white rounded-2xl p-[14px] text-center">
              <div className="text-[11px] text-[#9B9B9F] tracking-[.4px]">{s.label}</div>
              <div className="text-[19px] font-normal text-[#2A2A2C] mt-0.5 tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Per store */}
        {byStore.length > 0 && (
          <>
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1 pt-2 pb-2">{t('item.byStore')}</div>
            <div className="bg-white rounded-[20px] overflow-hidden mb-[14px]">
              {byStore.map((s, i) => (
                <div
                  key={s.supermarketId}
                  className="px-[18px] py-4"
                  style={{ borderBottom: i < byStore.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] text-[#2A2A2C]">{s.supermarketName}</span>
                    <span className="text-[15px] font-normal text-[#2A2A2C] tabular-nums">
                      €{formatCentsPlain(s.bestPriceCents)}
                    </span>
                  </div>
                  <div className="h-[5px] bg-[#F0F0EE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2A2A2C] rounded-full"
                      style={{ width: `${Math.round((s.bestPriceCents / maxPrice) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Price history */}
        {stats && stats.history.length > 0 && (
          <>
            <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1 pt-2 pb-2">{t('item.priceHistory')}</div>
            <div className="bg-white rounded-[20px] overflow-hidden">
              {[...stats.history].reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-[18px] py-4"
                  style={{ borderBottom: i < stats.history.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  <div>
                    <span className="text-[15px] text-[#2A2A2C]">{h.supermarketName}</span>
                    <span className="text-[13px] text-[#9B9B9F] ml-2">{formatShortDate(h.date)}</span>
                  </div>
                  <span className="text-[15px] text-[#5A5A5E] tabular-nums">
                    €{formatCentsPlain(h.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {(!stats || stats.history.length === 0) && (
          <div className="text-center py-10 text-[#9B9B9F] text-sm">{t('item.noPurchases')}</div>
        )}
      </div>
    </div>
  )
}
