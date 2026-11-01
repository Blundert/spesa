import { describe, it, expect } from 'vitest'
import { compareSortValues, sortRows, toggleSort } from './sortRows'

describe('compareSortValues', () => {
  it('ordina i numeri per valore', () => {
    expect(compareSortValues(2, 10, 'asc')).toBeLessThan(0)
    expect(compareSortValues(2, 10, 'desc')).toBeGreaterThan(0)
  })

  it('ordina i testi alfabeticamente senza badare a maiuscole e accenti', () => {
    expect(compareSortValues('banane', 'Zucchine', 'asc')).toBeLessThan(0)
    expect(compareSortValues('è', 'e', 'asc')).toBe(0)
    expect(compareSortValues('banane', 'Zucchine', 'desc')).toBeGreaterThan(0)
  })

  it('mette i vuoti sempre in fondo, in qualunque direzione', () => {
    for (const dir of ['asc', 'desc'] as const) {
      expect(compareSortValues(null, 5, dir)).toBeGreaterThan(0)
      expect(compareSortValues(5, undefined, dir)).toBeLessThan(0)
      expect(compareSortValues('', 'a', dir)).toBeGreaterThan(0)
      expect(compareSortValues(null, undefined, dir)).toBe(0)
    }
  })

  it('confronta come testi un valore misto numero/testo', () => {
    expect(compareSortValues(10, 'a', 'asc')).toBeLessThan(0)
  })
})

describe('sortRows', () => {
  const rows = [{ n: 'c', v: 3 }, { n: 'a', v: null }, { n: 'b', v: 1 }]

  it('restituisce una copia ordinata senza toccare l\'originale', () => {
    const asc = sortRows(rows, (r) => r.v, 'asc')
    expect(asc.map((r) => r.n)).toEqual(['b', 'c', 'a'])
    expect(rows.map((r) => r.n)).toEqual(['c', 'a', 'b'])
  })

  it('ordina in modo decrescente tenendo i vuoti in fondo', () => {
    expect(sortRows(rows, (r) => r.v, 'desc').map((r) => r.n)).toEqual(['c', 'b', 'a'])
  })

  it('è stabile a parità di valore', () => {
    const same = [{ n: 'x', v: 1 }, { n: 'y', v: 1 }, { n: 'z', v: 1 }]
    expect(sortRows(same, (r) => r.v, 'asc').map((r) => r.n)).toEqual(['x', 'y', 'z'])
  })
})

describe('toggleSort', () => {
  it('una nuova colonna parte da asc', () => {
    expect(toggleSort({ key: 'a', dir: 'desc' }, 'b')).toEqual({ key: 'b', dir: 'asc' })
  })

  it('la stessa colonna inverte la direzione', () => {
    expect(toggleSort({ key: 'a', dir: 'asc' }, 'a')).toEqual({ key: 'a', dir: 'desc' })
    expect(toggleSort({ key: 'a', dir: 'desc' }, 'a')).toEqual({ key: 'a', dir: 'asc' })
  })
})
