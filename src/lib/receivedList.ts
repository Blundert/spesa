import { compareNames, normalizeName } from './normalize'
import type { ShareItem, SharePayload } from './shareLink'

/** Una lista ricevuta con un link resta sul dispositivo finché la si apre; dopo tanto dall'ultimo accesso sparisce. */
export const RECEIVED_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Lista ricevuta e spunte di chi l'ha aperta: vivono solo sul suo dispositivo. */
export interface ReceivedList {
  /** Id scelto da chi ha condiviso la lista. */
  id: string
  name: string
  items: ShareItem[]
  /** Nomi (normalizzati) delle voci già prese. */
  checked: string[]
  openedAt: number
}

/**
 * Apre (o riapre) una lista ricevuta. Se era già stata aperta, le spunte restano sulle voci con lo stesso nome;
 * le voci nuove sono da prendere e quelle tolte da chi ha condiviso spariscono.
 */
export function openReceivedList(payload: SharePayload, existing: ReceivedList | undefined, now: number): ReceivedList {
  const names = new Set(payload.items.map((i) => normalizeName(i.name)))
  return {
    id: payload.id,
    name: payload.name,
    items: payload.items,
    checked: (existing?.checked ?? []).filter((n) => names.has(n)),
    openedAt: now,
  }
}

export function isReceivedExpired(list: ReceivedList, now: number): boolean {
  return now - list.openedAt > RECEIVED_TTL_MS
}

/** Spunta o toglie la spunta alla voce con quel nome. */
export function toggleChecked(list: ReceivedList, itemName: string): ReceivedList {
  const key = normalizeName(itemName)
  const checked = list.checked.includes(key) ? list.checked.filter((n) => n !== key) : [...list.checked, key]
  return { ...list, checked }
}

export interface ReceivedGroups {
  /** Da prendere, per categoria: categorie e voci in ordine alfabetico, come nella spesa. */
  todo: Array<{ category: string; items: ShareItem[] }>
  /** Già nel carrello, in ordine alfabetico. */
  done: ShareItem[]
}

export function groupReceived(list: ReceivedList): ReceivedGroups {
  const checked = new Set(list.checked)
  const sorted = [...list.items].sort((a, b) => compareNames(a.name, b.name))
  const byCategory = new Map<string, ShareItem[]>()
  const done: ShareItem[] = []
  for (const item of sorted) {
    if (checked.has(normalizeName(item.name))) {
      done.push(item)
      continue
    }
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item])
  }
  const todo = [...byCategory.entries()]
    .sort(([a], [b]) => compareNames(a, b))
    .map(([category, items]) => ({ category, items }))
  return { todo, done }
}
