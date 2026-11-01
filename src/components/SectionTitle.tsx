import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { currentWeek } from '../lib/date'

// Titolo delle due sezioni principali: quella attiva è scura, l'altra grigia e toccabile.
export function SectionTitle({ active }: { active: 'lista' | 'pasti' }) {
  const { t } = useTranslation()
  const base = 'text-[26px] font-normal tracking-[-0.5px]'
  const inactive = `${base} text-[#C5C5C9] active:opacity-50`
  return (
    <div data-tour="section-title" className="flex items-baseline gap-[18px]">
      {active === 'lista' ? (
        <span className={`${base} text-[#2A2A2C]`}>{t('lista.title')}</span>
      ) : (
        <Link to="/" className={inactive}>
          {t('lista.title')}
        </Link>
      )}
      {active === 'pasti' ? (
        <span className={`${base} text-[#2A2A2C]`}>{t('nav.meals')}</span>
      ) : (
        <Link to="/pasti" search={{ week: currentWeek() }} className={inactive}>
          {t('nav.meals')}
        </Link>
      )}
    </div>
  )
}
