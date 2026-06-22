import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { currentISOWeek, formatWeekLabel } from '../lib/date'
import { usePlannedWeeks } from '../hooks/useMealPlan'

export function PianificazioniScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: weeks = [] } = usePlannedWeeks()

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="flex-none" style={{ height: 'max(16px, env(safe-area-inset-top))' }} />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/pasti', search: { week: currentISOWeek() } })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {t('pianificazioni.title')}
          </span>
        </div>

        {weeks.length === 0 && (
          <div className="text-center py-16 text-[#9B9B9F] text-sm">
            {t('pianificazioni.empty')}
          </div>
        )}

        {weeks.map((w) => (
          <Link
            key={w.isoWeek}
            to="/pasti"
            search={{ week: w.isoWeek }}
            className="flex items-center gap-[14px] bg-white rounded-[20px] px-5 py-[18px] mb-[10px] active:bg-[#F6F6F4] block"
          >
            <div className="flex-1">
              <div className="text-base font-normal text-[#2A2A2C] tabular-nums">
                {formatWeekLabel(w.isoWeek)}
              </div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5">
                {t('home.mealsPlanned', { count: w.mealCount })}
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5C5C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
