import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getStatsRange,
  setStatsRange,
  getCustomDateRange,
  setCustomDateRange,
  currentMonthDateRange,
  todayDateString,
  rangeToTimestamps,
  DEFAULT_STATS_RANGE,
} from './statsRange'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('getStatsRange / setStatsRange', () => {
  it('senza scelta usa il valore predefinito', () => {
    expect(getStatsRange()).toBe(DEFAULT_STATS_RANGE)
  })

  it('restituisce la scelta salvata', () => {
    setStatsRange('3m')
    expect(getStatsRange()).toBe('3m')
  })

  it('ignora un valore salvato non valido', () => {
    store.set('statsRange', 'boh')
    expect(getStatsRange()).toBe(DEFAULT_STATS_RANGE)
  })
})

describe('intervallo personalizzato', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 17, 15, 30))
  })

  it('senza scelta parte e finisce oggi', () => {
    expect(todayDateString()).toBe('2026-06-17')
    expect(getCustomDateRange()).toEqual({ from: '2026-06-17', to: '2026-06-17' })
  })

  it('restituisce quello salvato', () => {
    setCustomDateRange({ from: '2026-05-01', to: '2026-05-31' })
    expect(getCustomDateRange()).toEqual({ from: '2026-05-01', to: '2026-05-31' })
  })

  it('"mese corrente" va dal primo del mese a oggi', () => {
    expect(currentMonthDateRange()).toEqual({ from: '2026-06-01', to: '2026-06-17' })
  })
})

describe('rangeToTimestamps', () => {
  const custom = { from: '2026-05-01', to: '2026-05-31' }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('"tutto" non ha limiti', () => {
    expect(rangeToTimestamps('all', custom)).toEqual({ fromTs: null, toTs: null })
  })

  it('personalizzato: dall\'inizio del primo giorno alla fine dell\'ultimo', () => {
    expect(rangeToTimestamps('custom', custom)).toEqual({
      fromTs: new Date(2026, 4, 1, 0, 0, 0, 0).getTime(),
      toTs: new Date(2026, 4, 31, 23, 59, 59, 999).getTime(),
    })
  })

  it('preimpostati: dalla mezzanotte locale di N giorni fa, senza limite finale', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 15, 30))
    expect(rangeToTimestamps('7d', custom)).toEqual({ fromTs: new Date(2026, 5, 10).getTime(), toTs: null })
    expect(rangeToTimestamps('30d', custom).fromTs).toBe(new Date(2026, 4, 18).getTime())
    expect(rangeToTimestamps('3m', custom).fromTs).toBe(new Date(2026, 2, 19).getTime())
    expect(rangeToTimestamps('6m', custom).fromTs).toBe(new Date(2025, 11, 19).getTime())
  })

  it('il valore è stabile durante la giornata: è nella chiave della query e non deve cambiare a ogni render', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 0, 0, 1))
    const early = rangeToTimestamps('30d', custom).fromTs
    vi.setSystemTime(new Date(2026, 5, 17, 23, 59, 59))
    expect(rangeToTimestamps('30d', custom).fromTs).toBe(early)
  })

  it('il giorno dopo la finestra scorre di un giorno', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 12))
    const today = rangeToTimestamps('7d', custom).fromTs
    vi.setSystemTime(new Date(2026, 5, 18, 12))
    expect(rangeToTimestamps('7d', custom).fromTs).toBe(new Date(2026, 5, 11).getTime())
    expect(today).toBe(new Date(2026, 5, 10).getTime())
  })
})
