import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockI18n = vi.hoisted(() => ({ language: 'it' as string }))
vi.mock('../i18n', () => ({ default: mockI18n }))

// Mock weekSettings so tests are independent of localStorage
const mockGetWeekStartDay = vi.hoisted(() => vi.fn(() => 0))
vi.mock('./weekSettings', () => ({ getWeekStartDay: mockGetWeekStartDay }))

import {
  getISOWeek,
  toISOWeekString,
  toWeekKey,
  currentWeek,
  weekRange,
  shiftWeek,
  dayShort,
  dayFull,
  formatWeekLabel,
  formatShortDate,
  formatLongDate,
} from './date'

beforeEach(() => {
  mockI18n.language = 'it'
  mockGetWeekStartDay.mockReturnValue(0)
})

// ---------------------------------------------------------------------------
// Funzioni ISO (interne, usate solo nella migrazione)
// ---------------------------------------------------------------------------

describe('getISOWeek', () => {
  it('restituisce 1 per il primo gennaio 2024 (lunedì)', () => {
    expect(getISOWeek(new Date('2024-01-01'))).toBe(1)
  })
  it('gestisce la domenica (getUTCDay = 0)', () => {
    // 2023-12-31 è domenica → settimana 52 del 2023
    expect(getISOWeek(new Date('2023-12-31'))).toBe(52)
  })
  it('settimana 53 per anni con 53 settimane (2015)', () => {
    expect(getISOWeek(new Date('2015-12-28'))).toBe(53)
  })
})

describe('toISOWeekString', () => {
  it('formato YYYY-WNN', () => {
    expect(toISOWeekString(new Date('2024-01-01'))).toBe('2024-W01')
  })
  it('confine anno: 2016-01-03 è in 2015-W53', () => {
    expect(toISOWeekString(new Date('2016-01-03'))).toBe('2015-W53')
  })
  it('prima settimana 2016: 2016-01-04', () => {
    expect(toISOWeekString(new Date('2016-01-04'))).toBe('2016-W01')
  })
})

// ---------------------------------------------------------------------------
// toWeekKey
// ---------------------------------------------------------------------------

describe('toWeekKey', () => {
  it('lunedì come inizio: lunedì stesso → chiave quel lunedì', () => {
    // 2026-06-08 è lunedì
    expect(toWeekKey(new Date('2026-06-08'), 0)).toBe('2026-06-08')
  })
  it('lunedì come inizio: domenica → lunedì precedente', () => {
    // 2026-06-14 è domenica → settimana inizia 2026-06-08
    expect(toWeekKey(new Date('2026-06-14'), 0)).toBe('2026-06-08')
  })
  it('sabato come inizio: sabato stesso → chiave quel sabato', () => {
    // 2026-06-20 è sabato
    expect(toWeekKey(new Date('2026-06-20'), 5)).toBe('2026-06-20')
  })
  it('sabato come inizio: venerdì → sabato precedente', () => {
    // 2026-06-26 venerdì → settimana inizia 2026-06-20
    expect(toWeekKey(new Date('2026-06-26'), 5)).toBe('2026-06-20')
  })
  it('sabato come inizio: lunedì → sabato precedente', () => {
    // 2026-06-22 lunedì → settimana inizia 2026-06-20
    expect(toWeekKey(new Date('2026-06-22'), 5)).toBe('2026-06-20')
  })
  it('domenica come inizio: domenica → chiave quella domenica', () => {
    // 2026-06-14 è domenica
    expect(toWeekKey(new Date('2026-06-14'), 6)).toBe('2026-06-14')
  })
  it('domenica come inizio: sabato → domenica precedente', () => {
    // 2026-06-20 sabato → settimana inizia 2026-06-14
    expect(toWeekKey(new Date('2026-06-20'), 6)).toBe('2026-06-14')
  })
  it('attraversa confine anno', () => {
    // 2026-01-01 è giovedì; con inizio lunedì → 2025-12-29
    expect(toWeekKey(new Date('2026-01-01'), 0)).toBe('2025-12-29')
  })
})

// ---------------------------------------------------------------------------
// currentWeek
// ---------------------------------------------------------------------------

describe('currentWeek', () => {
  it('restituisce il formato YYYY-MM-DD', () => {
    expect(currentWeek()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('usa il giorno di inizio dal mock', () => {
    // Con startDay=5 (sabato) la chiave deve essere un sabato
    mockGetWeekStartDay.mockReturnValue(5)
    const key = currentWeek()
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    // Sabato = JS day 6
    expect(date.getUTCDay()).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// weekRange
// ---------------------------------------------------------------------------

describe('weekRange', () => {
  it('start e end sono esattamente 6 giorni di distanza', () => {
    const { start, end } = weekRange('2026-06-08')
    const diff = (end.getTime() - start.getTime()) / 86_400_000
    expect(diff).toBe(6)
  })
  it('start corrisponde alla data nella chiave', () => {
    const { start } = weekRange('2026-06-20')
    expect(start.getUTCFullYear()).toBe(2026)
    expect(start.getUTCMonth()).toBe(5) // giugno
    expect(start.getUTCDate()).toBe(20)
  })
  it('end è il sesto giorno dopo start', () => {
    const { end } = weekRange('2026-06-20')
    expect(end.getUTCDate()).toBe(26)
  })
})

// ---------------------------------------------------------------------------
// shiftWeek
// ---------------------------------------------------------------------------

describe('shiftWeek', () => {
  it('avanza di 1 settimana', () => {
    expect(shiftWeek('2026-06-08', 1)).toBe('2026-06-15')
  })
  it('torna indietro di 1 settimana', () => {
    expect(shiftWeek('2026-06-08', -1)).toBe('2026-06-01')
  })
  it('attraversa il confine anno in avanti', () => {
    expect(shiftWeek('2025-12-29', 1)).toBe('2026-01-05')
  })
  it('attraversa il confine anno all\'indietro', () => {
    expect(shiftWeek('2026-01-05', -1)).toBe('2025-12-29')
  })
  it('delta 0 restituisce la stessa chiave', () => {
    expect(shiftWeek('2026-06-08', 0)).toBe('2026-06-08')
  })
})

// ---------------------------------------------------------------------------
// dayShort / dayFull
// ---------------------------------------------------------------------------

describe('dayShort', () => {
  it('italiano: lunedì=Lun, domenica=Dom', () => {
    expect(dayShort(0)).toBe('Lun')
    expect(dayShort(6)).toBe('Dom')
  })
  it('inglese: monday=Mon, sunday=Sun', () => {
    mockI18n.language = 'en'
    expect(dayShort(0)).toBe('Mon')
    expect(dayShort(6)).toBe('Sun')
  })
  it('indice fuori range restituisce stringa vuota', () => {
    expect(dayShort(7)).toBe('')
    expect(dayShort(-1)).toBe('')
  })
})

describe('dayFull', () => {
  it('italiano: lunedì=Lunedì, domenica=Domenica', () => {
    expect(dayFull(0)).toBe('Lunedì')
    expect(dayFull(6)).toBe('Domenica')
  })
  it('inglese: monday=Monday, sunday=Sunday', () => {
    mockI18n.language = 'en'
    expect(dayFull(0)).toBe('Monday')
    expect(dayFull(6)).toBe('Sunday')
  })
  it('indice fuori range restituisce stringa vuota', () => {
    expect(dayFull(7)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatWeekLabel
// ---------------------------------------------------------------------------

describe('formatWeekLabel', () => {
  it('italiano: "8 – 14 giu" per settimana 2026-06-08', () => {
    expect(formatWeekLabel('2026-06-08')).toBe('8 – 14 giu')
  })
  it('inglese: "8 – 14 Jun" per settimana 2026-06-08', () => {
    mockI18n.language = 'en'
    expect(formatWeekLabel('2026-06-08')).toBe('8 – 14 Jun')
  })
  it('cross-month italiano: "29 giu – 5 lug"', () => {
    expect(formatWeekLabel('2026-06-29')).toBe('29 giu – 5 lug')
  })
  it('cross-month inglese: "29 Jun – 5 Jul"', () => {
    mockI18n.language = 'en'
    expect(formatWeekLabel('2026-06-29')).toBe('29 Jun – 5 Jul')
  })
  it('settimana sabato-venerdì: "20 – 26 giu"', () => {
    expect(formatWeekLabel('2026-06-20')).toBe('20 – 26 giu')
  })
})

// ---------------------------------------------------------------------------
// formatShortDate
// ---------------------------------------------------------------------------

describe('formatShortDate', () => {
  const ts = new Date('2024-06-09T12:00:00').getTime()

  it('italiano: "9 giu"', () => {
    expect(formatShortDate(ts)).toBe('9 giu')
  })
  it('inglese: "9 Jun"', () => {
    mockI18n.language = 'en'
    expect(formatShortDate(ts)).toBe('9 Jun')
  })
})

// ---------------------------------------------------------------------------
// formatLongDate
// ---------------------------------------------------------------------------

describe('formatLongDate', () => {
  const tsSun = new Date('2024-06-09T12:00:00').getTime()
  const tsMon = new Date('2024-06-10T12:00:00').getTime()

  it('italiano domenica: "dom 9 giu 2024"', () => {
    expect(formatLongDate(tsSun)).toBe('dom 9 giu 2024')
  })
  it('italiano lunedì: "lun 10 giu 2024"', () => {
    expect(formatLongDate(tsMon)).toBe('lun 10 giu 2024')
  })
  it('inglese domenica: "sun 9 Jun 2024"', () => {
    mockI18n.language = 'en'
    expect(formatLongDate(tsSun)).toBe('sun 9 Jun 2024')
  })
})
