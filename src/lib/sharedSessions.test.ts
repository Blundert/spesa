import { describe, expect, it } from 'vitest'
import type { SharedLink } from '../db/types'
import { countedSessions, countsForMe, isForeignSession, sessionWeek } from './sharedSessions'

const LINK: SharedLink = {
  uid: 'l', owner: 'anna', repo: 'r', branch: 'main', path: 'lista.json', me: 'matteo', canWrite: true,
  members: { anna: { label: 'Anna', kind: 'partner' }, luca: { label: '', kind: 'stranger' } },
  tombstones: {},
}

describe('countedSessions', () => {
  it('toglie le spese segnate come non conteggiate', () => {
    const list = [{ id: 1 }, { id: 2, uncounted: true }, { id: 3, uncounted: false }]
    expect(countedSessions(list).map((s) => s.id)).toEqual([1, 3])
    expect(countedSessions([])).toEqual([])
  })
})

describe('isForeignSession', () => {
  it('è vero solo se c\'è un autore diverso da me', () => {
    expect(isForeignSession({})).toBe(false)
    expect(isForeignSession({ doneBy: 'anna' })).toBe(true)
  })
})

describe('countsForMe', () => {
  it('conta la mia e quelle dei partner, non quelle di estranei o sconosciuti', () => {
    expect(countsForMe(LINK, 'matteo')).toBe(true)
    expect(countsForMe(LINK, 'anna')).toBe(true)
    expect(countsForMe(LINK, 'luca')).toBe(false)
    expect(countsForMe(LINK, 'sconosciuto')).toBe(false)
  })
})

describe('sessionWeek', () => {
  const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 12)

  it('dà il giorno in cui inizia la settimana che contiene la spesa', () => {
    // mer 18 nov 2026: con inizio lunedì la settimana parte lunedì 16
    expect(sessionWeek(at(2026, 11, 18), 0)).toBe('2026-11-16')
    expect(sessionWeek(at(2026, 11, 16), 0)).toBe('2026-11-16')
    expect(sessionWeek(at(2026, 11, 22), 0)).toBe('2026-11-16') // domenica
    expect(sessionWeek(at(2026, 11, 23), 0)).toBe('2026-11-23')
  })

  it('rispetta il giorno di inizio scelto (0 = lunedì … 6 = domenica)', () => {
    expect(sessionWeek(at(2026, 11, 18), 6)).toBe('2026-11-15') // inizio domenica
    expect(sessionWeek(at(2026, 11, 14), 5)).toBe('2026-11-14') // inizio sabato
    expect(sessionWeek(at(2026, 11, 13), 5)).toBe('2026-11-07')
  })

  it('attraversa il cambio di mese e di anno', () => {
    expect(sessionWeek(at(2027, 1, 2), 0)).toBe('2026-12-28')
  })
})
