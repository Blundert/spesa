import { describe, it, expect } from 'vitest'
import { navLevel, navTransition } from './navTransition'

describe('navLevel', () => {
  it('distingue sezioni principali, pagine del menu e dettagli', () => {
    expect(navLevel('/')).toBe(0)
    expect(navLevel('/pasti')).toBe(0)
    expect(navLevel('/storico')).toBe(1)
    expect(navLevel('/impostazioni')).toBe(1)
    expect(navLevel('/storico/6')).toBe(2)
    expect(navLevel('/changelog')).toBe(2)
  })
})

describe('navTransition', () => {
  it('dissolvenza tra pagine dello stesso livello', () => {
    expect(navTransition('/', '/pasti')).toBe('fade')
    expect(navTransition('/storico', '/statistiche')).toBe('fade')
  })

  it('push salendo di livello, pop scendendo', () => {
    expect(navTransition('/', '/storico')).toBe('push')
    expect(navTransition('/storico', '/storico/6')).toBe('push')
    expect(navTransition('/storico/6', '/storico')).toBe('pop')
    expect(navTransition('/statistiche', '/pasti')).toBe('pop')
  })
})
