import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  ACTIVE_LIST_KEY,
  MEALS_LIST_KEY,
  activeLists,
  getActiveListId,
  getMealsListId,
  onActiveListChange,
  pickList,
  setActiveListId,
  setMealsListId,
} from './activeList'
import type { ShoppingList } from '../db/types'

const store: Record<string, string> = {}
let broken = false

vi.stubGlobal('localStorage', {
  getItem: (key: string) => {
    if (broken) throw new Error('blocked')
    return store[key] ?? null
  },
  setItem: (key: string, val: string) => {
    if (broken) throw new Error('blocked')
    store[key] = val
  },
})

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  broken = false
})

const list = (id: number, archivedAt: number | null = null): ShoppingList => ({
  id,
  name: `L${id}`,
  supermarketId: null,
  sortOrder: id,
  archivedAt,
})

describe('preferenze lista', () => {
  it('salva e rilegge lista aperta e lista dei pasti', () => {
    expect(getActiveListId()).toBeNull()
    setActiveListId(3)
    setMealsListId(4)
    expect(store[ACTIVE_LIST_KEY]).toBe('3')
    expect(getActiveListId()).toBe(3)
    expect(store[MEALS_LIST_KEY]).toBe('4')
    expect(getMealsListId()).toBe(4)
  })

  it('valore non numerico o storage bloccato → nessuna preferenza', () => {
    store[ACTIVE_LIST_KEY] = 'x'
    expect(getActiveListId()).toBeNull()
    broken = true
    expect(getActiveListId()).toBeNull()
    expect(() => setActiveListId(1)).not.toThrow()
  })

  it('notifica i cambi di lista aperta finché iscritti', () => {
    const cb = vi.fn()
    const off = onActiveListChange(cb)
    setActiveListId(2)
    expect(cb).toHaveBeenCalledTimes(1)
    off()
    setActiveListId(3)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('pickList', () => {
  const lists = [list(1), list(2, 99), list(3)]

  it('esclude le archiviate', () => {
    expect(activeLists(lists).map((l) => l.id)).toEqual([1, 3])
  })

  it('preferita se attiva, altrimenti la prima attiva', () => {
    expect(pickList(lists, 3)?.id).toBe(3)
    expect(pickList(lists, 2)?.id).toBe(1)
    expect(pickList(lists, null)?.id).toBe(1)
    expect(pickList([], 1)).toBeUndefined()
  })
})
