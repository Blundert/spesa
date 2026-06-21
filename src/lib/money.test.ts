import { describe, it, expect } from 'vitest'
import { toCents, fromCents, formatCents, formatCentsPlain, addCents, clampCents } from './money'

describe('toCents', () => {
  it('converte euro interi in centesimi', () => {
    expect(toCents(0)).toBe(0)
    expect(toCents(1)).toBe(100)
    expect(toCents(8)).toBe(800)
  })
  it('converte importi decimali arrotondando al centesimo più vicino', () => {
    expect(toCents(1.99)).toBe(199)
    expect(toCents(0.005)).toBe(1)
    expect(toCents(0.004)).toBe(0)
  })
})

describe('fromCents', () => {
  it('converte centesimi in euro', () => {
    expect(fromCents(0)).toBe(0)
    expect(fromCents(100)).toBe(1)
    expect(fromCents(199)).toBe(1.99)
    expect(fromCents(800)).toBe(8)
  })
})

describe('formatCents', () => {
  it('formatta con virgola come separatore decimale e due decimali', () => {
    expect(formatCents(0)).toBe('0,00')
    expect(formatCents(199)).toBe('1,99')
    expect(formatCents(1050)).toBe('10,50')
    expect(formatCents(800)).toBe('8,00')
  })
})

describe('formatCentsPlain', () => {
  it('formatta identico a formatCents', () => {
    expect(formatCentsPlain(0)).toBe('0,00')
    expect(formatCentsPlain(199)).toBe('1,99')
    expect(formatCentsPlain(800)).toBe('8,00')
  })
})

describe('addCents', () => {
  it('somma due importi in centesimi', () => {
    expect(addCents(0, 0)).toBe(0)
    expect(addCents(100, 200)).toBe(300)
    expect(addCents(-50, 100)).toBe(50)
  })
})

describe('clampCents', () => {
  it('restituisce il valore se non negativo', () => {
    expect(clampCents(0)).toBe(0)
    expect(clampCents(100)).toBe(100)
  })
  it('restituisce 0 per valori negativi', () => {
    expect(clampCents(-1)).toBe(0)
    expect(clampCents(-500)).toBe(0)
  })
})
