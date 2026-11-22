import { useTranslation } from 'react-i18next'

/** Piccola icona "persone": segna una lista condivisa nelle schede e negli elenchi. */
export function SharedIcon({ size = 13 }: { size?: number }) {
  const { t } = useTranslation()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={t('shared.badge')}
      className="inline-block align-[-1px]"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M17.5 14c2.2.2 3.8 1.7 3.8 4" />
    </svg>
  )
}
