import { useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate } from '../lib/date'
import { useSupermarkets } from '../hooks/useItems'
import { db } from '../db/db'
import { qk } from '../db/queryKeys'
import { deleteSession } from '../db/repositories/sessions'
import { BottomSheet } from '../components/BottomSheet'

export function SessioneScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessionId: sessionIdStr } = useParams({ from: '/storico/$sessionId' })
  const sessionId = parseInt(sessionIdStr, 10)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const qc = useQueryClient()

  const { data: supermarkets = [] } = useSupermarkets()
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => db.sessions.get(sessionId),
  })
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', sessionId],
    queryFn: () => db.purchases.where('sessionId').equals(sessionId).toArray(),
  })
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => db.items.toArray(),
  })

  const storeName = supermarkets.find((s) => s.id === session?.supermarketId)?.name ?? '?'
  const computedCents = purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
  const totalCents = session?.confirmedTotalCents ?? computedCents
  const itemMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.name]))

  const handleDelete = async () => {
    await deleteSession(sessionId)
    void qc.invalidateQueries({ queryKey: qk.allSessions() })
    void qc.invalidateQueries({ queryKey: ['session', sessionId] })
    void navigate({ to: '/storico' })
  }

  return (
    <>
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="h-[54px] flex-none" />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="relative flex items-center pt-1 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/storico' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C] max-w-[60%] truncate">
            {storeName}
          </span>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t('sessione.deleteSession')}
            className="w-[34px] h-[34px] -mr-1.5 ml-auto flex items-center justify-center opacity-40 active:opacity-80"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-[22px] px-6 pt-6 pb-4 mb-[14px] text-center">
          <div className="text-[13px] text-[#9B9B9F] mb-2">
            {session ? formatShortDate(session.startedAt) : '—'}
          </div>
          <div className="flex items-baseline justify-center text-[#2A2A2C]">
            <span className="text-[30px] font-normal text-[#B5B5BA] mr-1">€</span>
            <span className="text-[64px] font-light tracking-[-1.5px] leading-[.95] tabular-nums">
              {formatCentsPlain(totalCents)}
            </span>
          </div>
          {session && session.buoniSpent > 0 && (
            <div className="text-[13px] text-[#9B9B9F] mt-2 tabular-nums">
              {session.buoniSpent} {t('common.buoni')} · €{formatCentsPlain(session.buoniSpent * session.buoniValueCents)}
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="bg-white rounded-[20px] overflow-hidden">
          {purchases.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < purchases.length - 1 ? '1px solid #ECECEC' : 'none' }}
            >
              <span className="text-[15px] text-[#2A2A2C]">
                {itemMap[p.itemId] ?? `#${p.itemId}`}
                {p.quantity > 1 && (
                  <span className="text-[#9B9B9F] ml-1">×{p.quantity}</span>
                )}
              </span>
              <span className="text-[15px] text-[#5A5A5E] tabular-nums">
                €{formatCentsPlain(p.priceCents * p.quantity)}
              </span>
            </div>
          ))}
          {purchases.length === 0 && (
            <div className="text-center py-8 text-[#9B9B9F] text-sm">{t('sessione.noPurchases')}</div>
          )}
        </div>
      </div>
    </div>

    <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
      <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">{t('sessione.deleteConfirmTitle')}</div>
      <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">{t('sessione.deleteConfirmBody')}</div>
      <button
        onClick={() => void handleDelete()}
        className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
      >
        {t('sessione.deleteConfirm')}
      </button>
      <button
        onClick={() => setShowDeleteConfirm(false)}
        className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
      >
        {t('common.cancel')}
      </button>
    </BottomSheet>
    </>
  )
}
