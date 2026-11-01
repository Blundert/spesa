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
import { formatShortDate } from '../../lib/date'

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

const thStyle = {
  textAlign: 'left' as const,
  padding: '8px 12px 12px 0',
  fontSize: '11px',
  fontWeight: 500,
  color: '#9B9B9F',
  borderBottom: '1px solid #F2F2F0',
  letterSpacing: '0.3px',
}

const tdStyle = { padding: '12px 12px 12px 0', color: '#2A2A2C', fontSize: '14px' }

export function DesktopStoricoScreen() {
  const { t } = useTranslation()
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

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
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
        {rows.length === 0 ? (
          <div style={{ color: '#9B9B9F', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>
            {sessions.length === 0 ? t('storico.empty') : t('desktop.history.noResults')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t('desktop.history.colDate')}</th>
                <th style={thStyle}>{t('desktop.history.colSupermarket')}</th>
                <th style={thStyle}>{t('desktop.history.colList')}</th>
                <th style={thStyle}>{t('desktop.history.colBuoni')}</th>
                <th style={thStyle}>{t('desktop.history.colOutOfPocket')}</th>
                <th style={{ ...thStyle, textAlign: 'right', paddingRight: 0 }}>{t('desktop.history.colTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const total = s.confirmedTotalCents ?? totals?.get(s.id ?? 0) ?? 0
                const done = s.finishedAt !== null
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F2F2F0' }}>
                    <td style={{ ...tdStyle, color: '#6B6B70' }}>{formatShortDate(s.startedAt)}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{smName.get(s.supermarketId) ?? '?'}</td>
                    <td style={{ ...tdStyle, color: '#9B9B9F' }}>
                      {s.listId !== undefined ? (listName.get(s.listId) ?? '') : ''}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B6B70' }}>{s.buoniSpent}</td>
                    <td style={{ ...tdStyle, color: '#6B6B70' }}>
                      {done ? `€ ${formatCents(outOfPocketCents(total, s.buoniSpent, s.buoniValueCents))}` : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 0 }}>
                      {done ? `€ ${formatCents(total)}` : t('desktop.history.inProgress')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
