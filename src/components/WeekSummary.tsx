import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatWeekLabel, formatShortDate } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import type { WeekSpendSummary } from '../lib/budgetSelectors'
import { useSupermarkets } from '../hooks/useItems'
import { useShoppingLists } from '../hooks/useShoppingLists'
import type { Purchase, Session } from '../db/types'

const MAX_WEEK_SPESE = 3

// Riepilogo della settimana in cima al pannello della pill: di tasca tua, speso,
// buoni e le ultime spese finite (le altre nello Storico).
export function WeekSummary({
  isoWeek,
  summary,
  sessions,
  purchases,
  onNavigate,
}: {
  isoWeek: string
  summary: WeekSpendSummary
  sessions: Session[]
  purchases: Purchase[]
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: lists = [] } = useShoppingLists()
  const listMap: Record<number, string> = Object.fromEntries(lists.map((l) => [l.id ?? 0, l.name]))

  // Importo confermato, con fallback sulla somma degli oggetti.
  const computedBySession = new Map<number, number>()
  for (const p of purchases) {
    computedBySession.set(p.sessionId, (computedBySession.get(p.sessionId) ?? 0) + p.priceCents * p.quantity)
  }
  const supermarketMap = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const weekSpese = sessions
    .filter((s) => s.finishedAt !== null && s.id !== undefined)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .map((s) => ({
      id: s.id as number,
      store: supermarketMap[s.supermarketId] ?? '?',
      list: s.listId !== undefined ? listMap[s.listId] : undefined,
      date: s.startedAt,
      amountCents: s.confirmedTotalCents ?? computedBySession.get(s.id as number) ?? 0,
    }))
  const shown = weekSpese.slice(0, MAX_WEEK_SPESE)

  return (
    <div className="mb-[22px]">
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[10px]">
        {t('budget.thisWeek')} · {formatWeekLabel(isoWeek)}
      </div>

      {/* Di tasca tua */}
      <div className="bg-[#2A2A2C] rounded-[22px] px-[22px] py-[18px] mb-[10px]">
        <div className="text-[11px] font-normal tracking-[1.4px] text-white/55 uppercase">{t('home.outOfPocket')}</div>
        <div className="flex items-baseline text-white mt-1">
          <span className="text-[26px] font-normal opacity-55 mr-1">€</span>
          <span className="text-[52px] font-light leading-none tabular-nums tracking-[-1px]">
            {formatCentsPlain(summary.outOfPocketCents)}
          </span>
        </div>
      </div>

      {/* Speso · buoni spesi · rimanenti */}
      <div className="flex bg-[#F6F6F4] rounded-[18px] py-3 mb-[10px] text-center">
        <SummaryCell value={`€${formatCentsPlain(summary.totalSpentCents)}`} label={t('home.spent')} />
        <SummaryCell value={String(summary.buoniSpentCount)} label={t('home.buoniSpent')} border />
        <SummaryCell value={String(summary.buoniRemaining)} label={t('home.buoniRemaining')} border />
      </div>

      {/* Ultime spese della settimana */}
      {shown.length > 0 && (
        <div className="bg-[#F6F6F4] rounded-[18px] overflow-hidden">
          {shown.map((sp, i) => (
            <Link
              key={sp.id}
              to="/storico/$sessionId"
              params={{ sessionId: String(sp.id) }}
              onClick={onNavigate}
              className="flex items-center justify-between px-[18px] py-[13px] active:bg-[#ECECEC]"
              style={{ borderBottom: i < shown.length - 1 ? '1px solid #E6E6E2' : 'none' }}
            >
              <div>
                <div className="text-[15px] text-[#2A2A2C]">{sp.store}</div>
                <div className="text-[12px] text-[#9B9B9F]">
                  {sp.list ? `${sp.list} · ` : ''}
                  {formatShortDate(sp.date)}
                </div>
              </div>
              <span className="text-[17px] text-[#2A2A2C] tabular-nums">€{formatCentsPlain(sp.amountCents)}</span>
            </Link>
          ))}
          {weekSpese.length > MAX_WEEK_SPESE && (
            <Link
              to="/storico"
              onClick={onNavigate}
              className="block px-[18px] py-[13px] text-[15px] text-[#9B9B9F] border-t border-[#E6E6E2] active:bg-[#ECECEC]"
            >
              {t('home.seeAll', { count: weekSpese.length })}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCell({ value, label, border = false }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={`flex-1 ${border ? 'border-l border-[#E6E6E2]' : ''}`}>
      <div className="text-[18px] text-[#2A2A2C] tabular-nums">{value}</div>
      <div className="text-[10px] tracking-[1px] text-[#9B9B9F] uppercase mt-0.5">{label}</div>
    </div>
  )
}
