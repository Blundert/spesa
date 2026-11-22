import { SharedSyncError, type SharedSyncCode, type SharedSyncResult } from './sharedSync'

/** Dopo l'ultima modifica si aspetta un po' prima di scrivere, così più modifiche vicine fanno un solo commit. */
export const PUSH_DELAY_MS = 5000
/** Ogni quanto si controlla il repo per le novità degli altri, con la lista aperta e l'app in primo piano. */
export const POLL_INTERVAL_MS = 15000

export type SyncOutcome =
  | { ok: true; result: SharedSyncResult; at: number }
  | { ok: false; code: SharedSyncCode | 'unknown'; at: number }

/** Errori che non si risolvono da soli: inutile riprovare ogni 15 secondi. */
const FATAL = new Set<SharedSyncCode | 'unknown'>(['auth', 'no-token', 'no-access', 'invalid-remote', 'newer-format'])

export interface SchedulerDeps {
  sync: (listId: number) => Promise<SharedSyncResult>
  /** La lista è (ancora) condivisa? Si controlla prima di ogni sync. */
  isShared: (listId: number) => Promise<boolean>
  onOutcome: (listId: number, outcome: SyncOutcome) => void
  now?: () => number
}

/**
 * Decide quando sincronizzare le liste condivise:
 * - `start(listId)`: sync subito e poi ogni 15 s, finché la lista è aperta e l'app è visibile;
 * - `notifyChange(listId)`: dopo una modifica locale, sync 5 s dopo l'ultima (anche a lista chiusa);
 * - `setVisible(false/true)`: in background niente polling, al ritorno sync subito;
 * - una sola sync alla volta per lista (se ne arriva un'altra mentre gira, ne parte una dopo);
 * - senza rete le modifiche restano nel database locale e partono alla prima sync riuscita;
 * - dopo un errore che non passa da solo (token scaduto, accesso perso…) il polling si ferma.
 */
export function createSharedSyncScheduler(deps: SchedulerDeps) {
  const now = deps.now ?? Date.now
  let current: number | null = null
  let visible = true
  let poll: ReturnType<typeof setInterval> | undefined
  const pending = new Map<number, ReturnType<typeof setTimeout>>()
  const running = new Set<number>()
  const again = new Set<number>()

  const stopPolling = () => {
    clearInterval(poll)
    poll = undefined
  }

  const startPolling = () => {
    stopPolling()
    if (current !== null && visible) poll = setInterval(() => void run(current as number), POLL_INTERVAL_MS)
  }

  async function run(listId: number): Promise<void> {
    if (running.has(listId)) {
      again.add(listId)
      return
    }
    running.add(listId)
    try {
      if (!(await deps.isShared(listId))) return
      try {
        deps.onOutcome(listId, { ok: true, result: await deps.sync(listId), at: now() })
      } catch (e) {
        const code = e instanceof SharedSyncError ? e.code : 'unknown'
        deps.onOutcome(listId, { ok: false, code, at: now() })
        if (FATAL.has(code) && current === listId) stopPolling()
      }
    } finally {
      running.delete(listId)
      if (again.delete(listId)) void run(listId)
    }
  }

  return {
    /** Lista aperta: sync subito e poi a intervalli. Sostituisce la lista seguita prima. */
    start(listId: number) {
      current = listId
      startPolling()
      if (visible) void run(listId)
    },
    /** Lista chiusa: niente più polling (le modifiche già annunciate partono comunque). */
    stop() {
      current = null
      stopPolling()
    },
    /** Una modifica locale: sync 5 secondi dopo l'ultima. */
    notifyChange(listId: number) {
      clearTimeout(pending.get(listId))
      pending.set(
        listId,
        setTimeout(() => {
          pending.delete(listId)
          void run(listId)
        }, PUSH_DELAY_MS),
      )
    },
    /** L'app va in background o torna in primo piano. */
    setVisible(isVisible: boolean) {
      visible = isVisible
      if (!isVisible) {
        stopPolling()
        return
      }
      if (current !== null) {
        startPolling()
        void run(current)
      }
    },
    /** Sync subito (pulsante, ritorno della rete). */
    syncNow(listId: number): Promise<void> {
      return run(listId)
    },
  }
}

export type SharedSyncScheduler = ReturnType<typeof createSharedSyncScheduler>
