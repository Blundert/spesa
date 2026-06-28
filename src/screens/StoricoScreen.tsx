import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate, formatWeekLabel } from '../lib/date'
import { useAllSessions, useDeleteWeek } from '../hooks/useShopping'
import { useSupermarkets } from '../hooks/useItems'
import { useQuery } from '@tanstack/react-query'
import { db } from '../db/db'
import { BottomSheet } from '../components/BottomSheet'
import type { Session } from '../db/types'

function useSessionTotal(sessionId: number) {
  return useQuery({
    queryKey: ['sessionTotal', sessionId],
    queryFn: async () => {
      const purchases = await db.purchases.where('sessionId').equals(sessionId).toArray()
      return purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
    },
    enabled: sessionId > 0,
  })
}

function groupByWeek(sessions: Session[]): { isoWeek: string; sessions: Session[] }[] {
  const order: string[] = []
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    if (!map.has(s.isoWeek)) {
      order.push(s.isoWeek)
      map.set(s.isoWeek, [])
    }
    map.get(s.isoWeek)!.push(s)
  }
  return order.map((isoWeek) => ({ isoWeek, sessions: map.get(isoWeek)! }))
}

export function StoricoScreen() {
  const { t } = useTranslation()
  const { data: sessions = [] } = useAllSessions()
  const { data: supermarkets = [] } = useSupermarkets()
  const deleteWeekMutation = useDeleteWeek()
  const [deleteWeekState, setDeleteWeekState] = useState<string | null>(null)

  const supermarketMap = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const weekGroups = groupByWeek(sessions)

  const handleConfirmDelete = () => {
    if (!deleteWeekState) return
    deleteWeekMutation.mutate(deleteWeekState, {
      onSuccess: () => setDeleteWeekState(null),
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      <div className="flex items-center justify-between px-1 pt-2 pb-[18px]">
        <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('storico.title')}</span>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-[#9B9B9F] text-sm">{t('storico.empty')}</div>
      )}

      {weekGroups.map(({ isoWeek, sessions: weekSessions }) => (
        <div key={isoWeek} className="mb-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[13px] font-normal text-[#9B9B9F] tracking-tight">
              {formatWeekLabel(isoWeek)}
            </span>
            <button
              onClick={() => setDeleteWeekState(isoWeek)}
              className="w-7 h-7 flex items-center justify-center opacity-40 active:opacity-80"
              aria-label={t('storico.deleteWeekConfirm')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
          {weekSessions.map((s) => (
            <SessionCard
              key={s.id}
              sessionId={s.id!}
              storeName={supermarketMap[s.supermarketId] ?? '?'}
              date={s.startedAt}
              confirmedTotalCents={s.confirmedTotalCents}
              finishedAt={s.finishedAt}
            />
          ))}
        </div>
      ))}

      <BottomSheet open={deleteWeekState !== null} onClose={() => setDeleteWeekState(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('storico.deleteWeekTitle', { week: deleteWeekState ? formatWeekLabel(deleteWeekState) : '' })}
        </div>
        <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">
          {t('storico.deleteWeekBody')}
        </div>
        <button
          onClick={handleConfirmDelete}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('storico.deleteWeekConfirm')}
        </button>
        <button
          onClick={() => setDeleteWeekState(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </div>
  )
}

function SessionCard({
  sessionId,
  storeName,
  date,
  confirmedTotalCents,
  finishedAt,
}: {
  sessionId: number
  storeName: string
  date: number
  confirmedTotalCents: number | null
  finishedAt: number | null
}) {
  const { t } = useTranslation()
  const { data: computedCents = 0 } = useSessionTotal(sessionId)
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', sessionId],
    queryFn: () => db.purchases.where('sessionId').equals(sessionId).toArray(),
  })
  const totalCents = confirmedTotalCents ?? computedCents
  const isCompleted = finishedAt !== null

  return (
    <Link
      to="/storico/$sessionId"
      params={{ sessionId: String(sessionId) }}
      className="flex items-center gap-[14px] bg-white rounded-[20px] px-5 py-[18px] mb-[10px] active:bg-[#F6F6F4] block"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-normal text-[#2A2A2C]">{storeName}</span>
          {!isCompleted && (
            <span className="text-[11px] text-white bg-[#E07B39] rounded-full px-[7px] py-[2px] leading-none">{t('sessione.notCompleted')}</span>
          )}
        </div>
        <div className="text-[13px] text-[#9B9B9F] mt-0.5">
          {formatShortDate(date)} · {t('storico.itemsCount', { count: purchases.length })}
        </div>
      </div>
      <span className="text-[22px] font-normal text-[#2A2A2C] tabular-nums">
        €{formatCentsPlain(totalCents)}
      </span>
    </Link>
  )
}
