import { describe, it, expect } from 'vitest'
import { isPrimaryPath, rememberPrimary, getLastPrimaryHref } from './primarySection'

describe('primarySection', () => {
  it('riconosce le sezioni principali', () => {
    expect(isPrimaryPath('/')).toBe(true)
    expect(isPrimaryPath('/pasti')).toBe(true)
    expect(isPrimaryPath('/storico')).toBe(false)
  })

  it('parte dalla Lista e ricorda solo le sezioni principali', () => {
    expect(getLastPrimaryHref()).toBe('/')
    rememberPrimary('/pasti', '/pasti?week=2026-10-26')
    expect(getLastPrimaryHref()).toBe('/pasti?week=2026-10-26')
    rememberPrimary('/storico', '/storico')
    expect(getLastPrimaryHref()).toBe('/pasti?week=2026-10-26')
  })
})
