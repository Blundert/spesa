import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { currentWeek, formatWeekLabel } from '../lib/date'
import { usePlannedWeeks, useDeletePlannedWeek } from '../hooks/useMealPlan'
import { BottomSheet } from '../components/BottomSheet'

export function PianificazioniScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: weeks = [] } = usePlannedWeeks()
  const deleteWeekMutation = useDeletePlannedWeek()
  const [deleteState, setDeleteState] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (!deleteState) return
    deleteWeekMutation.mutate(deleteState, {
      onSuccess: () => setDeleteState(null),
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="flex-none" style={{ height: 'max(16px, env(safe-area-inset-top))' }} />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/pasti', search: { week: currentWeek() } })}
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
          <div key={w.isoWeek} className="flex items-center bg-white rounded-[20px] mb-[10px]">
            <Link
              to="/pasti"
              search={{ week: w.isoWeek }}
              className="flex-1 flex items-center gap-[14px] px-5 py-[18px] active:bg-[#F6F6F4] rounded-l-[20px]"
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
            <button
              onClick={() => setDeleteState(w.isoWeek)}
              className="px-4 py-[18px] opacity-40 active:opacity-80 rounded-r-[20px]"
              aria-label={t('pianificazioni.deleteConfirm')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <BottomSheet open={deleteState !== null} onClose={() => setDeleteState(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('pianificazioni.deleteTitle', { week: deleteState ? formatWeekLabel(deleteState) : '' })}
        </div>
        <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">
          {t('pianificazioni.deleteBody')}
        </div>
        <button
          onClick={handleConfirmDelete}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('pianificazioni.deleteConfirm')}
        </button>
        <button
          onClick={() => setDeleteState(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </div>
  )
}
