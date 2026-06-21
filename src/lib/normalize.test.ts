import { describe, it, expect } from 'vitest'
import { normalizeName } from './normalize'

describe('normalizeName', () => {
  it('nome già normalizzato rimane invariato', () => {
    expect(normalizeName('latte')).toBe('latte')
  })
  it('converte in minuscolo e fa trim', () => {
    expect(normalizeName('LATTE')).toBe('latte')
    expect(normalizeName('  Latte  ')).toBe('latte')
    expect(normalizeName('Pasta Integrale')).toBe('pasta integrale')
  })
  it('collassa spazi interni multipli', () => {
    expect(normalizeName('riso   basmati')).toBe('riso basmati')
    expect(normalizeName('  latte  intero  ')).toBe('latte intero')
  })
})
