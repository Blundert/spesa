import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { autoSync, getAutoSync, getGitConfig, isGitConfigured } from '../lib/gitSync'
import { runSync } from '../lib/syncRunner'

const INTERVAL_MS = 3 * 60 * 1000 // rete di sicurezza: ogni 3 minuti

/**
 * Sync automatico (se attivo e configurato) su tre trigger:
 * - all'apertura dell'app: sync bidirezionale (recupera anche modifiche da altri dispositivi);
 * - quando l'app va in background/si chiude: push best-effort delle modifiche locali (mai pull);
 * - a intervallo di 3 min mentre l'app è aperta: rete di sicurezza.
 * I conflitti vengono gestiti da runSync (toast con scelta). Le condizioni si leggono dentro
 * il trigger, così attivare/disattivare l'auto-sync ha effetto subito senza rimontare.
 */
export function useAutoSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const enabled = () => getAutoSync() && isGitConfigured(getGitConfig())

    // Apertura + intervallo: sync completo bidirezionale.
    const fullSync = () => {
      if (enabled()) void runSync(qc)
    }
    // Background/chiusura: solo push delle modifiche locali, silenzioso, best-effort.
    const pushOnly = () => {
      if (enabled()) void autoSync({ allowPull: false }).catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pushOnly()
    }

    fullSync() // all'apertura
    const id = setInterval(fullSync, INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', pushOnly)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', pushOnly)
    }
  }, [qc])
}
