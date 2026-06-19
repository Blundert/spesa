import { useEffect } from 'react'
import { getAutoSync, getGitConfig, isGitConfigured, syncPushIfChanged } from '../lib/gitSync'

const INTERVAL_MS = 3 * 60 * 1000 // ogni 3 minuti

/**
 * Push automatico a intervallo: a ogni tick controlla (da localStorage) se l'auto-sync
 * è attivo e configurato, e in tal caso carica il backup SOLO se i dati sono cambiati.
 * Leggere lo stato dentro il tick fa sì che attivare/disattivare l'auto-sync nelle
 * Impostazioni abbia effetto dal tick successivo senza dover rimontare il componente.
 */
export function useAutoSync() {
  useEffect(() => {
    const tick = () => {
      if (!getAutoSync()) return
      if (!isGitConfigured(getGitConfig())) return
      void syncPushIfChanged().catch(() => {
        /* silenzioso: l'auto-sync non deve disturbare l'uso */
      })
    }
    const id = setInterval(tick, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
}
