import { useTranslation } from 'react-i18next'

const SECTIONS = ['Config', 'SyncNow', 'Auto', 'Conflict', 'Pull', 'NewDevice', 'History'] as const

/** Guida ai pulsanti e ai flussi di sync: ogni voce è un accordion, chiuso all'inizio. */
export function SyncGuide() {
  const { t } = useTranslation()
  return (
    <div className="bg-t-surface rounded-[20px] overflow-hidden" data-testid="sync-guide">
      {SECTIONS.map((s, i) => (
        <details
          key={s}
          className="group"
          style={{ borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--t-line)' : 'none' }}
        >
          <summary className="flex items-center justify-between gap-3 px-5 py-[15px] cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[15px] text-t-fg">
            <span>{t(`syncPage.guide${s}Title`)}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--t-chev)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none transition-transform group-open:rotate-90"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </summary>
          <p className="px-5 pb-4 text-[13px] text-t-text2 leading-relaxed">{t(`syncPage.guide${s}Body`)}</p>
        </details>
      ))}
    </div>
  )
}
