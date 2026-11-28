import { SharedSyncError, type SharedSyncCode, type SharedSyncResult } from './sharedSync'

/** Dopo l'ultima modifica si aspetta un po' prima di scrivere, così più modifiche vicine fanno un solo commit. */
export const PUSH_DELAY_MS = 5000
/** Ogni quanto si controlla il repo per le novità degli altri, con l'app in primo piano. */
export const POLL_INTERVAL_MS = 15000
/** Ogni quanto si controllano le liste condivise NON aperte (la lista aperta resta a 15 s, in spesa a 5 s). */
export const OTHER_LISTS_POLL_INTERVAL_MS = 30000
/** Come sopra durante una spesa condivisa aperta: chi è al supermercato vuole vedere subito cosa hanno preso gli altri. */
export const SPESA_POLL_INTERVAL_MS = 5000

export type SyncOutcome =
  | { ok: true; result: SharedSyncResult; at: number }
  | { ok: false; code: SharedSyncCode | 'unknown'; at: number }

/** Errori che non si risolvono da soli: inutile riprovare ogni 15 secondi. */
const FATAL = new Set<SharedSyncCode | 'unknown'>(['auth', 'no-token', 'no-access', 'invalid-remote', 'newer-format'])

export interface SchedulerDeps {
  sync: (listId: number) => Promise<SharedSyncResult>
  /** La lista è (ancora) condivisa? Si controlla prima di ogni sync. */
  isShared: (listId: number) => Promise<boolean>
  /** Tutte le liste condivise di questo dispositivo. */
  sharedListIds: () => Promise<number[]>
  onOutcome: (listId: number, outcome: SyncOutcome) => void
  now?: () => number
}

/**
 * Decide quando sincronizzare le liste condivise:
 * - `begin()`: all'avvio dell'app sincronizza tutte le liste condivise (spedisce quello che era rimasto in sospeso,
 *   riceve le novità) e poi le controlla finché l'app è in primo piano, qualunque schermata sia aperta: la lista
 *   aperta ogni 15 s, le altre ogni 30 s;
 * - `start(listId)`: la lista è aperta: sync subito; con `fast` (spesa) i controlli sono ogni 5 s;
 * - `notifyChange(listId)`: dopo una modifica locale, sync 5 s dopo l'ultima (anche a lista chiusa);
 * - `setVisible(false)`: in background niente controlli e le modifiche in attesa partono SUBITO (il telefono può
 *   fermare l'app da un momento all'altro); `setVisible(true)`: sync di tutte le liste e i controlli ripartono;
 * - una sola sync alla volta per lista (se ne arriva un'altra mentre gira, ne parte una dopo);
 * - senza rete le modifiche restano nel database locale e partono alla prima sync riuscita;
 * - dopo un errore che non passa da solo (token scaduto, accesso perso…) quella lista non si controlla più finché non
 *   si riapre, si torna in primo piano o si tocca "Aggiorna".
 */
export function createSharedSyncScheduler(deps: SchedulerDeps) {
  const now = deps.now ?? Date.now
  let current: number | null = null
  let fast = false
  let started = false
  let visible = true
  let poll: ReturnType<typeof setInterval> | undefined
  const pending = new Map<number, ReturnType<typeof setTimeout>>()
  const running = new Set<number>()
  const again = new Set<number>()
  const halted = new Set<number>()
  /** Quando è partita l'ultima sync di ogni lista (per i controlli più radi delle liste non aperte). */
  const lastRun = new Map<number, number>()

  const stopPolling = () => {
    clearInterval(poll)
    poll = undefined
  }

  /** Sync di tutte le liste condivise (e di quella aperta), tranne quelle ferme per un errore che non passa da solo. */
  async function syncAll(): Promise<void> {
    const ids = new Set(await deps.sharedListIds())
    if (current !== null) ids.add(current)
    await Promise.all([...ids].filter((id) => !halted.has(id)).map((id) => run(id)))
  }

  /** Un giro di controlli: la lista aperta sempre, le altre solo se l'ultima sync è di almeno 30 s fa. */
  async function pollTick(): Promise<void> {
    const ids = new Set(await deps.sharedListIds())
    if (current !== null) ids.add(current)
    const t = Date.now()
    const due = [...ids].filter((id) => !halted.has(id) && (id === current || t - (lastRun.get(id) ?? 0) >= OTHER_LISTS_POLL_INTERVAL_MS))
    await Promise.all(due.map((id) => run(id)))
  }

  const startPolling = () => {
    stopPolling()
    if (visible && (started || current !== null)) {
      poll = setInterval(() => void pollTick(), current !== null && fast ? SPESA_POLL_INTERVAL_MS : POLL_INTERVAL_MS)
    }
  }

  async function run(listId: number): Promise<void> {
    if (running.has(listId)) {
      again.add(listId)
      return
    }
    running.add(listId)
    lastRun.set(listId, Date.now())
    try {
      if (!(await deps.isShared(listId))) return
      try {
        deps.onOutcome(listId, { ok: true, result: await deps.sync(listId), at: now() })
        halted.delete(listId)
      } catch (e) {
        const code = e instanceof SharedSyncError ? e.code : 'unknown'
        deps.onOutcome(listId, { ok: false, code, at: now() })
        if (FATAL.has(code)) halted.add(listId)
      }
    } finally {
      running.delete(listId)
      if (again.delete(listId)) void run(listId)
    }
  }

  /** Le modifiche annunciate ma non ancora spedite partono adesso. */
  const flushPending = () => {
    for (const [listId, timer] of [...pending]) {
      clearTimeout(timer)
      pending.delete(listId)
      void run(listId)
    }
  }

  return {
    /** All'avvio dell'app: sync di tutte le liste condivise, poi controlli periodici finché si è in primo piano. */
    begin() {
      started = true
      startPolling()
      if (visible) void syncAll()
    },
    /** Lista aperta: sync subito e controlli a intervalli (ogni 5 s in una spesa). Sostituisce la lista seguita prima. */
    start(listId: number, opts?: { fast?: boolean }) {
      current = listId
      fast = opts?.fast === true
      halted.delete(listId)
      startPolling()
      if (visible) void run(listId)
    },
    /** Lista chiusa: non è più "quella aperta" (le liste condivise si controllano comunque, se l'app è partita). */
    stop() {
      current = null
      fast = false
      startPolling()
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
        flushPending()
        return
      }
      halted.clear()
      startPolling()
      void syncAll()
    },
    /** Sync subito (pulsante "Aggiorna"). */
    syncNow(listId: number): Promise<void> {
      halted.delete(listId)
      return run(listId)
    },
    /** Sync subito di tutte le liste condivise (ritorno della rete). */
    syncAll,
  }
}

export type SharedSyncScheduler = ReturnType<typeof createSharedSyncScheduler>
