import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockI18n = vi.hoisted(() => ({ language: 'it' as string }))
vi.mock('../i18n', () => ({ default: mockI18n }))

import {
  getISOWeek,
  toISOWeekString,
  currentISOWeek,
  weekRange,
  shiftISOWeek,
  dayShort,
  dayFull,
  formatWeekLabel,
  formatShortDate,
  formatLongDate,
} from './date'

beforeEach(() => {
  mockI18n.language = 'it'
})

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

describe('currentISOWeek', () => {
  it('restituisce il formato YYYY-WNN per la data odierna', () => {
    expect(currentISOWeek()).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('weekRange', () => {
  it('2026-W24: lunedì 8 giugno, domenica 14 giugno', () => {
    const { monday, sunday } = weekRange('2026-W24')
    expect(monday.getUTCFullYear()).toBe(2026)
    expect(monday.getUTCMonth()).toBe(5) // giugno = mese 5
    expect(monday.getUTCDate()).toBe(8)
    expect(sunday.getUTCDate()).toBe(14)
  })
  it('la domenica è 6 giorni dopo il lunedì', () => {
    const { monday, sunday } = weekRange('2024-W10')
    const diff = (sunday.getTime() - monday.getTime()) / 86_400_000
    expect(diff).toBe(6)
  })
})

describe('shiftISOWeek', () => {
  it('avanza di 1 settimana', () => {
    expect(shiftISOWeek('2026-W24', 1)).toBe('2026-W25')
  })
  it('torna indietro di 1 settimana', () => {
    expect(shiftISOWeek('2026-W24', -1)).toBe('2026-W23')
  })
  it('attraversa il confine anno in avanti (W53 → W01)', () => {
    expect(shiftISOWeek('2015-W53', 1)).toBe('2016-W01')
  })
  it('attraversa il confine anno all\'indietro (W01 → anno precedente)', () => {
    expect(shiftISOWeek('2015-W01', -1)).toBe('2014-W52')
  })
  it('delta 0 restituisce la stessa settimana', () => {
    expect(shiftISOWeek('2026-W10', 0)).toBe('2026-W10')
  })
})

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

describe('formatWeekLabel', () => {
  it('italiano: "8 – 14 giu" per 2026-W24', () => {
    expect(formatWeekLabel('2026-W24')).toBe('8 – 14 giu')
  })
  it('inglese: "8 – 14 Jun" per 2026-W24', () => {
    mockI18n.language = 'en'
    expect(formatWeekLabel('2026-W24')).toBe('8 – 14 Jun')
  })
})

describe('formatShortDate', () => {
  // 2024-06-09 domenica — usiamo timestamp UTC a mezzogiorno per evitare derive TZ
  const ts = new Date('2024-06-09T12:00:00').getTime()

  it('italiano: "9 giu"', () => {
    expect(formatShortDate(ts)).toBe('9 giu')
  })
  it('inglese: "9 Jun"', () => {
    mockI18n.language = 'en'
    expect(formatShortDate(ts)).toBe('9 Jun')
  })
})

describe('formatLongDate', () => {
  // 2024-06-09 è domenica
  const tsSun = new Date('2024-06-09T12:00:00').getTime()
  // 2024-06-10 è lunedì
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
