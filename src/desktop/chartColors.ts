/**
 * Colori dei grafici desktop: leggono i token del tema (src/theme/themes.css), così cambiano col tema.
 * Nei grafici Recharts vanno passati come stringhe `var(--t-…)` a fill/stroke.
 */
export const CHART = {
  total: 'var(--t-c-total)', // spesa totale
  buoni: 'var(--t-c-buoni)', // coperto dai buoni
  outOfPocket: 'var(--t-c-pocket)', // di tasca propria
  sessions: 'var(--t-c-total)', // conteggi
} as const

/** Serie categoriche (categorie, supermercati): contrasto sufficiente anche in 8-9 elementi. */
export const SERIES = Array.from({ length: 10 }, (_, i) => `var(--t-s${i + 1})`)

export function seriesColor(i: number): string {
  return SERIES[i % SERIES.length]
}
