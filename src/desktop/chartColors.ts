/** Colori dei grafici desktop. Il resto dell'interfaccia resta nella palette neutra dell'app. */
export const CHART = {
  total: '#4C6EF5', // spesa totale
  buoni: '#12B886', // coperto dai buoni
  outOfPocket: '#F76707', // di tasca propria
  sessions: '#4C6EF5', // conteggi
} as const

/** Serie categoriche (categorie, supermercati): contrasto sufficiente anche in 8-9 elementi. */
export const SERIES = [
  '#4C6EF5',
  '#12B886',
  '#F59F00',
  '#E64980',
  '#15AABF',
  '#AE3EC9',
  '#82C91E',
  '#E8590C',
  '#7950F2',
  '#868E96',
] as const

export function seriesColor(i: number): string {
  return SERIES[i % SERIES.length]
}
