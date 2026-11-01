import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { useAllSessions } from '../../hooks/useShopping'
import { useSupermarkets } from '../../hooks/useItems'
import { useShoppingLists } from '../../hooks/useShoppingLists'
import { db } from '../../db/db'
import { outOfPocketCents } from '../../lib/budgetSelectors'
import { formatCents } from '../../lib/money'
import { formatDate } from '../../lib/date'
import { SortableTable, type Column } from '../components/SortableTable'
import type { Session } from '../../db/types'
import { useNavigate } from '@tanstack/react-router'

/** Totale calcolato dagli acquisti, per sessione (fallback quando manca l'importo confermato). */
function usePurchaseTotals() {
  return useQuery({
    queryKey: ['desktopPurchaseTotals'],
    queryFn: async () => {
      const totals = new Map<number, number>()
      for (const p of await db.purchases.toArray()) {
        totals.set(p.sessionId, (totals.get(p.sessionId) ?? 0) + p.priceCents * p.quantity)
      }
      return totals
    },
  })
}

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '10px',
  border: '1px solid #ECECEC',
  background: '#fff',
  fontSize: '13px',
  color: '#2A2A2C',
}

export function DesktopStoricoScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: sessions = [] } = useAllSessions()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: lists = [] } = useShoppingLists()
  const { data: totals } = usePurchaseTotals()
  const [supermarketId, setSupermarketId] = useState<number | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const smName = new Map(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const listName = new Map(lists.map((l) => [l.id ?? 0, l.name]))

  // Le date dei filtri sono giorni locali (yyyy-mm-dd): inizio giornata / fine giornata.
  const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null
  const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null

  const rows = sessions.filter(
    (s) =>
      (supermarketId === null || s.supermarketId === supermarketId) &&
      (fromTs === null || s.startedAt >= fromTs) &&
      (toTs === null || s.startedAt <= toTs),
  )
  const hasFilters = supermarketId !== null || from !== '' || to !== ''

  const totalOf = (s: Session) => s.confirmedTotalCents ?? totals?.get(s.id ?? 0) ?? 0
  const outOfPocketOf = (s: Session) =>
    s.finishedAt === null ? null : outOfPocketCents(totalOf(s), s.buoniSpent, s.buoniValueCents)

  const columns: Column<Session>[] = [
    { key: 'date', label: t('desktop.history.colDate'), render: (s) => <span style={{ color: '#6B6B70' }}>{formatDate(s.startedAt)}</span>, sortValue: (s) => s.startedAt },
    { key: 'supermarket', label: t('desktop.history.colSupermarket'), render: (s) => <span style={{ fontWeight: 500 }}>{smName.get(s.supermarketId) ?? '?'}</span>, sortValue: (s) => smName.get(s.supermarketId) ?? '' },
    { key: 'list', label: t('desktop.history.colList'), render: (s) => <span style={{ color: '#9B9B9F' }}>{s.listId !== undefined ? (listName.get(s.listId) ?? '') : ''}</span>, sortValue: (s) => (s.listId !== undefined ? listName.get(s.listId) : null) },
    { key: 'buoni', label: t('desktop.history.colBuoni'), render: (s) => s.buoniSpent, sortValue: (s) => s.buoniSpent },
    { key: 'pocket', label: t('desktop.history.colOutOfPocket'), render: (s) => { const v = outOfPocketOf(s); return v === null ? '—' : `€ ${formatCents(v)}` }, sortValue: outOfPocketOf },
    { key: 'total', label: t('desktop.history.colTotal'), align: 'right', render: (s) => (s.finishedAt === null ? t('desktop.history.inProgress') : `€ ${formatCents(totalOf(s))}`), sortValue: (s) => (s.finishedAt === null ? null : totalOf(s)) },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('storico.title')} subtitle={t('desktop.history.subtitle')} />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          aria-label={t('desktop.history.colSupermarket')}
          value={supermarketId ?? ''}
          onChange={(e) => setSupermarketId(e.target.value === '' ? null : Number(e.target.value))}
          style={inputStyle}
        >
          <option value="">{t('desktop.history.allSupermarkets')}</option>
          {supermarkets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <label style={{ fontSize: '13px', color: '#9B9B9F', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {t('desktop.history.from')}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ fontSize: '13px', color: '#9B9B9F', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {t('desktop.history.to')}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              setSupermarketId(null)
              setFrom('')
              setTo('')
            }}
            style={{ ...inputStyle, cursor: 'pointer', color: '#6B6B70' }}
          >
            {t('desktop.history.reset')}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <SortableTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.id ?? 0}
          defaultSort={{ key: 'date', dir: 'desc' }}
          onRowClick={(s) => void navigate({ to: '/storico/$sessionId', params: { sessionId: String(s.id) } })}
          emptyMessage={sessions.length === 0 ? t('storico.empty') : t('desktop.history.noResults')}
        />
      </div>
    </div>
  )
}
