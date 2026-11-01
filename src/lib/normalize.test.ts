import { describe, it, expect } from 'vitest'
import { compareNames, normalizeName } from './normalize'

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

describe('compareNames', () => {
  it('ordina in italiano ignorando maiuscole e accenti', () => {
    const names = ['zucchine', 'Caffè', 'banane', 'Acqua', 'caffe', 'Ánanas']
    expect([...names].sort(compareNames)).toEqual(['Acqua', 'Ánanas', 'banane', 'Caffè', 'caffe', 'zucchine'])
  })
  it('nomi uguali a parte maiuscole e accenti valgono uguale', () => {
    expect(compareNames('Caffè', 'caffe')).toBe(0)
  })
})
