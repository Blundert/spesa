import { useParams, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { db } from '../../db/db'
import { useItemPriceHistory, useItemPriceByStore } from '../../hooks/usePriceHistory'
import { formatCents } from '../../lib/money'
import { formatDate } from '../../lib/date'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { SortableTable, type Column } from '../components/SortableTable'

const card = { background: '#fff', borderRadius: '16px', padding: '24px' } as const

const W = 600
const H = 140
const PAD = 12

interface Purchase {
  date: number
  supermarketName: string
  priceCents: number
}

export function DesktopItemDetailScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { itemId: itemIdStr } = useParams({ strict: false }) as { itemId: string }
  const itemId = parseInt(itemIdStr, 10)

  const { data: item } = useQuery({ queryKey: ['items', itemId], queryFn: () => db.items.get(itemId) })
  const { data: stats } = useItemPriceHistory(itemId)
  const { data: byStore = [] } = useItemPriceByStore(itemId)

  const maxPrice = byStore.length > 0 ? Math.max(...byStore.map((s) => s.bestPriceCents)) : 1
  const history: Purchase[] = stats?.history ?? []

  // Andamento prezzi: polilinea su larghezza fissa, scalata dal contenitore.
  const prices = history.map((h) => h.priceCents)
  const dmin = Math.min(...prices)
  const span = Math.max(...prices) - dmin || 1
  const points = history.map((h, i) => ({
    x: history.length > 1 ? (i / (history.length - 1)) * W : W / 2,
    y: H - PAD - ((h.priceCents - dmin) / span) * (H - 2 * PAD),
  }))
  const last = points[points.length - 1]

  const columns: Column<Purchase>[] = [
    { key: 'date', label: t('desktop.item.colDate'), render: (h) => formatDate(h.date), sortValue: (h) => h.date },
    {
      key: 'store',
      label: t('desktop.item.colStore'),
      render: (h) => h.supermarketName,
      sortValue: (h) => h.supermarketName.toLowerCase(),
    },
    {
      key: 'price',
      label: t('desktop.item.colPrice'),
      align: 'right',
      render: (h) => `€ ${formatCents(h.priceCents)}`,
      sortValue: (h) => h.priceCents,
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <button
        onClick={() => router.history.back()}
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: '12px', color: '#9B9B9F', fontSize: '13px', cursor: 'pointer' }}
      >
        ← {t('common.back')}
      </button>
      <PageHeader title={item?.name ?? '…'} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label={t('item.avgPrice')} value={stats ? `€ ${formatCents(stats.avgCents)}` : '—'} />
        <StatCard label={t('item.last')} value={stats ? `€ ${formatCents(stats.lastCents)}` : '—'} />
        <StatCard label={t('item.min')} value={stats ? `€ ${formatCents(stats.minCents)}` : '—'} />
        <StatCard label={t('item.max')} value={stats ? `€ ${formatCents(stats.maxCents)}` : '—'} />
        <StatCard label={t('item.buys')} value={String(stats?.buyCount ?? 0)} />
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9B9B9F', fontSize: '14px' }}>{t('item.noPurchases')}</div>
      ) : (
        <>
          {history.length > 1 && (
            <div style={{ ...card, marginBottom: '24px' }}>
              <SectionTitle>{t('desktop.item.trend')}</SectionTitle>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: `${H}px`, overflow: 'visible' }}>
                <polyline
                  points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                  fill="none"
                  stroke="#2A2A2C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={last.x} cy={last.y} r="4" fill="#2A2A2C" />
              </svg>
            </div>
          )}

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ ...card, flex: '1 1 420px', minWidth: 0 }}>
              <SectionTitle>{t('item.priceHistory')}</SectionTitle>
              <SortableTable
                columns={columns}
                rows={history}
                rowKey={(h) => `${h.date}-${h.supermarketName}-${h.priceCents}`}
                defaultSort={{ key: 'date', dir: 'desc' }}
              />
            </div>
            {byStore.length > 0 && (
              <div style={{ ...card, flex: '0 0 340px' }}>
                <SectionTitle>{t('item.byStore')}</SectionTitle>
                {byStore.map((s) => (
                  <div key={s.supermarketId} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                      <span>{s.supermarketName}</span>
                      <span>€ {formatCents(s.bestPriceCents)}</span>
                    </div>
                    <div style={{ height: '5px', background: '#F0F0EE', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#2A2A2C', width: `${Math.round((s.bestPriceCents / maxPrice) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
