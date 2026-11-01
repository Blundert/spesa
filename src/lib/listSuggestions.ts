/** Quanti prodotti propone in automatico la "spesa solita" di una lista. */
export const AUTO_USUAL_LIMIT = 8

/**
 * Spesa solita da proporre. Con una scelta personalizzata (`custom`) valgono i prodotti scelti,
 * nell'ordine scelto; altrimenti i più comprati con la lista (`usual`, già in ordine decrescente).
 * In ogni caso restano fuori i prodotti già in lista e quelli non più in catalogo.
 */
export function pickUsualItemIds(opts: {
  custom: number[] | undefined
  usual: Array<{ itemId: number }>
  inListIds: Set<number>
  knownIds: Set<number>
}): number[] {
  const source = opts.custom ?? opts.usual.map((u) => u.itemId)
  const ids = source.filter((id) => !opts.inListIds.has(id) && opts.knownIds.has(id))
  return opts.custom ? ids : ids.slice(0, AUTO_USUAL_LIMIT)
}

/**
 * Chip rapidi sotto il campo di aggiunta. Con una scelta personalizzata (`custom`) valgono quelli
 * scelti, nell'ordine scelto; altrimenti i più comprati del `pool`, fino a `autoLimit`.
 * Restano fuori i prodotti già in lista.
 */
export function pickQuickChips<T extends { name: string; purchaseCount: number }>(opts: {
  pool: T[]
  custom: T[] | undefined
  isInList: (name: string) => boolean
  autoLimit: number
}): T[] {
  if (opts.custom) return opts.custom.filter((p) => !opts.isInList(p.name))
  return opts.pool
    .filter((p) => !opts.isInList(p.name))
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, opts.autoLimit)
}

/** Aggiunge o toglie un prodotto da una scelta personalizzata (i nuovi vanno in fondo). */
export function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}
