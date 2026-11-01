import { describe, expect, it } from 'vitest'
import { normalizeAmountInput } from './amountInput'
import { MAX_EXPR_LENGTH } from './calc'

describe('normalizeAmountInput', () => {
  it('maps keyboard operators to calculator symbols', () => {
    expect(normalizeAmountInput('2*3/4-1+5')).toBe('2×3÷4−1+5')
    expect(normalizeAmountInput('2x3X4')).toBe('2×3×4')
  })
  it('converts the decimal point and keeps commas, parens and percent', () => {
    expect(normalizeAmountInput('1.20')).toBe('1,20')
    expect(normalizeAmountInput('(4,5)%')).toBe('(4,5)%')
  })
  it('drops unsupported characters and whitespace', () => {
    expect(normalizeAmountInput(' a1 b2€ ')).toBe('12')
  })
  it('truncates to the max length', () => {
    expect(normalizeAmountInput('1'.repeat(MAX_EXPR_LENGTH + 10))).toHaveLength(MAX_EXPR_LENGTH)
  })
})
