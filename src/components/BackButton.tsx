import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getLastPrimaryHref } from '../lib/primarySection'

// Senza fallback (pagine del menu): torna alla sezione principale da cui eri partito.
// Con fallback (dettagli): torna alla pagina precedente, o al genitore se non c'è cronologia.
export function BackButton({ fallback }: { fallback?: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const goBack = () => {
    if (fallback === undefined) void router.navigate({ href: getLastPrimaryHref() })
    else if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ href: fallback })
  }
  return (
    <button
      onClick={goBack}
      aria-label={t('common.back')}
      className="flex-none w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
