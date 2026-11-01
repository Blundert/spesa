/** Convert a decimal euro amount to integer cents (rounds to nearest). */
export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

/** Convert integer cents to decimal euros. */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Format cents as "€ X,XX" display string.
 * Uses comma as decimal separator (Italian locale).
 */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/** Format cents as "X,XX" (no € symbol). */
export function formatCentsPlain(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/** Add two cent amounts safely. */
export function addCents(a: number, b: number): number {
  return a + b
}

/** Clamp cents to a minimum of 0. */
export function clampCents(cents: number): number {
  return Math.max(0, cents)
}

/**
 * Format a percentage with explicit sign: "+4,4%", "−3,3%" (U+2212), "0%".
 * One decimal at most, trailing ",0" dropped; comma as decimal separator like the amounts.
 */
export function formatSignedPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10
  if (rounded === 0) return '0%'
  const abs = Math.abs(rounded)
  const body = (Number.isInteger(abs) ? String(abs) : abs.toFixed(1)).replace('.', ',')
  return `${rounded > 0 ? '+' : '−'}${body}%`
}
