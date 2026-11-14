/** Percorso della schermata di unione: lo stesso su mobile e desktop. */
export const MERGE_PATH = '/sincronizzazione/unisci'

let navigator: (() => void) | null = null

/** La shell attiva (mobile o desktop) registra qui come aprire la schermata di unione. */
export function setMergeNavigator(fn: (() => void) | null): void {
  navigator = fn
}

/** Apre la schermata di unione (usato dal toast del conflitto, fuori da React). */
export function openMerge(): void {
  if (navigator) navigator()
  else window.location.assign(MERGE_PATH)
}
