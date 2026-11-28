import { describe, it, expect } from 'vitest'
import {
  RECEIVED_TTL_MS,
  groupReceived,
  isReceivedExpired,
  openReceivedList,
  toggleChecked,
  type ReceivedList,
} from './receivedList'

const payload = {
  id: 'abc',
  name: 'Casa',
  items: [
    { name: 'Mele', quantity: 2, category: 'Frutta' },
    { name: 'Latte', quantity: 1, category: 'Frigo' },
    { name: 'Arance', quantity: 1, category: 'Frutta' },
  ],
}

describe('openReceivedList', () => {
  it('la prima volta niente è spuntato', () => {
    expect(openReceivedList(payload, undefined, 5)).toEqual({ ...payload, checked: [], openedAt: 5 })
  })

  it('riaprendo la lista aggiornata tiene le spunte sulle voci con lo stesso nome e butta le altre', () => {
    const before: ReceivedList = { ...payload, checked: ['mele', 'tolta'], openedAt: 1 }
    const updated = { ...payload, name: 'Casa 2', items: [...payload.items, { name: 'Uova', quantity: 6, category: 'Frigo' }] }
    const out = openReceivedList(updated, before, 9)
    expect(out.checked).toEqual(['mele'])
    expect(out.name).toBe('Casa 2')
    expect(out.items).toHaveLength(4)
    expect(out.openedAt).toBe(9)
  })
})

describe('isReceivedExpired', () => {
  const list = openReceivedList(payload, undefined, 1000)
  it('scade dopo 30 giorni dall\'ultimo accesso', () => {
    expect(isReceivedExpired(list, 1000 + RECEIVED_TTL_MS)).toBe(false)
    expect(isReceivedExpired(list, 1000 + RECEIVED_TTL_MS + 1)).toBe(true)
  })
})

describe('toggleChecked', () => {
  it('spunta e toglie la spunta, senza badare a maiuscole', () => {
    const list = openReceivedList(payload, undefined, 1)
    const on = toggleChecked(list, 'MELE ')
    expect(on.checked).toEqual(['mele'])
    expect(toggleChecked(on, 'Mele').checked).toEqual([])
    expect(list.checked).toEqual([])
  })
})

describe('groupReceived', () => {
  it('da prendere per categoria in ordine alfabetico, spuntate a parte', () => {
    const list = toggleChecked(openReceivedList(payload, undefined, 1), 'Latte')
    const { todo, done } = groupReceived(list)
    expect(todo.map((g) => g.category)).toEqual(['Frutta'])
    expect(todo[0].items.map((i) => i.name)).toEqual(['Arance', 'Mele'])
    expect(done.map((i) => i.name)).toEqual(['Latte'])
  })

  it('più categorie ordinate; lista vuota senza gruppi', () => {
    const { todo } = groupReceived(openReceivedList(payload, undefined, 1))
    expect(todo.map((g) => g.category)).toEqual(['Frigo', 'Frutta'])
    expect(groupReceived({ ...openReceivedList(payload, undefined, 1), items: [] })).toEqual({ todo: [], done: [] })
  })
})
