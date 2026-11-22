/**
 * Canale che avvisa quando una lista condivisa è stata modificata su questo dispositivo, così chi sincronizza
 * (lo scheduler) può mandare le novità senza che ogni punto di scrittura lo conosca.
 */
type Listener = (listId: number) => void

const listeners = new Set<Listener>()

/** Si iscrive ai cambiamenti; ritorna la funzione per disiscriversi. */
export function onSharedChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitSharedChange(listId: number): void {
  for (const l of listeners) l(listId)
}
