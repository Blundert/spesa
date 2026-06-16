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
