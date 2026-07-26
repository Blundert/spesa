import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { getLastSeenAppVersion, setLastSeenAppVersion } from '../lib/appVersion'
import { router } from '../router'

// Nessun controllo periodico: forziamo un check solo al resume dell'app (visibilitychange),
// il momento in cui su iOS standalone la ripresa della WebView sospesa non genera di per sé
// una richiesta di rete che farebbe scattare il controllo di default del service worker.
export function UpdateNotifier() {
  const { t } = useTranslation()

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })

  useEffect(() => {
    if (needRefresh) void updateServiceWorker(true)
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    const lastSeen = getLastSeenAppVersion()
    if (lastSeen !== null && lastSeen !== __APP_VERSION__) {
      toast(
        <div onClick={() => void router.navigate({ to: '/changelog' })}>
          {`${t('settings.appUpdated')} ${__APP_VERSION__}`}
        </div>,
      )
    }
    setLastSeenAppVersion(__APP_VERSION__)
  }, [t])

  return null
}
