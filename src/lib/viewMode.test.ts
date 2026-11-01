import { describe, it, expect } from 'vitest'
import {
  translatePath,
  resolveSidebarCompact,
  parseSidebarPref,
  SIDEBAR_COMPACT_BELOW,
} from './viewMode'

describe('translatePath', () => {
  it('mobile → desktop: la Lista e le statistiche cambiano path', () => {
    expect(translatePath('/', 'desktop')).toBe('/lista')
    expect(translatePath('/statistiche', 'desktop')).toBe('/stats')
  })

  it('desktop → mobile: lista e statistiche tornano ai path mobile', () => {
    expect(translatePath('/lista', 'mobile')).toBe('/')
    expect(translatePath('/stats', 'mobile')).toBe('/statistiche')
  })

  it('lascia invariati i path comuni alle due interfacce', () => {
    for (const p of ['/pasti', '/storico/12', '/item/3', '/catalogo', '/impostazioni', '/spesa']) {
      expect(translatePath(p, 'desktop')).toBe(p)
      expect(translatePath(p, 'mobile')).toBe(p)
    }
  })

  it('conserva query e hash', () => {
    expect(translatePath('/?x=1#a', 'desktop')).toBe('/lista?x=1#a')
    expect(translatePath('/stats?range=4', 'mobile')).toBe('/statistiche?range=4')
    expect(translatePath('/pasti?week=2026-06-22', 'desktop')).toBe('/pasti?week=2026-06-22')
    expect(translatePath('/lista#top', 'mobile')).toBe('/#top')
  })
})

describe("translatePath all'avvio (home: false)", () => {
  it("la home resta com'è in entrambe le interfacce", () => {
    expect(translatePath('/', 'desktop', { home: false })).toBe('/')
    expect(translatePath('/?x=1', 'desktop', { home: false })).toBe('/?x=1')
    expect(translatePath('/', 'mobile', { home: false })).toBe('/')
  })

  it("traduce comunque i path che non esistono nell'altra interfaccia", () => {
    expect(translatePath('/statistiche', 'desktop', { home: false })).toBe('/stats')
    expect(translatePath('/stats', 'mobile', { home: false })).toBe('/statistiche')
    expect(translatePath('/lista', 'mobile', { home: false })).toBe('/')
  })
})

describe('resolveSidebarCompact', () => {
  it('la scelta esplicita vince sulla larghezza', () => {
    expect(resolveSidebarCompact('compact', 1600)).toBe(true)
    expect(resolveSidebarCompact('expanded', 800)).toBe(false)
  })

  it('senza scelta decide la larghezza', () => {
    expect(resolveSidebarCompact(null, SIDEBAR_COMPACT_BELOW - 1)).toBe(true)
    expect(resolveSidebarCompact(null, SIDEBAR_COMPACT_BELOW)).toBe(false)
  })
})

describe('parseSidebarPref', () => {
  it('accetta solo i due valori noti', () => {
    expect(parseSidebarPref('compact')).toBe('compact')
    expect(parseSidebarPref('expanded')).toBe('expanded')
    expect(parseSidebarPref('boh')).toBeNull()
    expect(parseSidebarPref(null)).toBeNull()
  })
})
