import { describe, it, expect } from 'vitest'
import { buildShareText } from './shareText'

const items = [
  { name: 'Latte', quantity: 2, category: 'Frigo' },
  { name: 'Pane', quantity: 1, category: 'Panetteria' },
]

describe('buildShareText', () => {
  it('titolo, voci una per riga (x2 solo oltre 1) e link in coda', () => {
    expect(buildShareText('Casa', items, { label: 'Spunta online', url: 'https://x/#l=abc' })).toBe(
      'Casa\n\nLatte x2\nPane\n\nSpunta online: https://x/#l=abc',
    )
  })

  it('senza link finisce con le voci', () => {
    expect(buildShareText('Casa', items, null)).toBe('Casa\n\nLatte x2\nPane')
  })

  it('senza voci è solo il titolo (più il link)', () => {
    expect(buildShareText('Casa', [], null)).toBe('Casa')
    expect(buildShareText('Casa', [], { label: 'L', url: 'u' })).toBe('Casa\n\nL: u')
  })
})
